package com.example.quiz.service;

import com.example.quiz.dto.answer.AnswerResultDto;
import com.example.quiz.dto.answer.TeamAnswerStatusDto;
import com.example.quiz.dto.leaderboard.LeaderboardEntryDto;
import com.example.quiz.dto.question.PublicQuestionDto;
import com.example.quiz.dto.quiz.QuizStateDto;
import com.example.quiz.entity.*;
import com.example.quiz.entity.enums.QuizMode;
import com.example.quiz.entity.enums.QuizStatus;
import com.example.quiz.entity.enums.SessionStatus;
import com.example.quiz.entity.enums.SubmissionStatus;
import com.example.quiz.exception.BadRequestException;
import com.example.quiz.exception.DuplicateSubmissionException;
import com.example.quiz.exception.QuestionExpiredException;
import com.example.quiz.exception.ResourceNotFoundException;
import com.example.quiz.repository.*;
import com.example.quiz.service.scoring.ScoringEngine;
import com.example.quiz.websocket.QuizWebSocketService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizEngineService {

    @Value("${quiz.scoring.grace-period-ms:300}")
    private long gracePeriodMs;

    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository optionRepository;
    private final QuestionSessionRepository sessionRepository;
    private final AnswerRepository answerRepository;
    private final QuizParticipantRepository participantRepository;
    private final TeamRepository teamRepository;
    private final ScoringEngine scoringEngine;
    private final LeaderboardService leaderboardService;
    private final QuizWebSocketService webSocketService;
    private final QuestionService questionService;
    private final TeamService teamService;
    private final PlatformTransactionManager transactionManager;

    private TransactionTemplate transactionTemplate;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(8);
    private final Map<Long, ScheduledFuture<?>> scheduledQuestionFutures = new ConcurrentHashMap<>();
    private final Map<Long, ScheduledFuture<?>> scheduledIntermissionFutures = new ConcurrentHashMap<>();
    private final Map<Long, ScheduledFuture<?>> pendingLeaderboardBroadcasts = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @Transactional
    public void openRegistration(Long quizId) {
        Quiz quiz = getQuiz(quizId);
        if (quiz.getStatus() != QuizStatus.DRAFT) {
            throw new BadRequestException("Registration can only be opened from DRAFT status");
        }
        quiz.setStatus(QuizStatus.REGISTRATION_OPEN);
        quizRepository.save(quiz);
        webSocketService.broadcastQuizEvent(quizId, "REGISTRATION_OPENED", Map.of("status", quiz.getStatus()));
    }

    @Transactional
    public void openLobby(Long quizId) {
        Quiz quiz = getQuiz(quizId);
        quiz.setStatus(QuizStatus.LOBBY);
        quizRepository.save(quiz);
        webSocketService.broadcastQuizEvent(quizId, "LOBBY_OPENED", Map.of("status", quiz.getStatus()));
    }

    @Transactional
    public void startQuiz(Long quizId, Long adminId) {
        Quiz quiz = getQuiz(quizId);
        List<Question> questions = questionRepository.findByQuizIdOrderByDisplayOrderAsc(quizId);
        if (questions.isEmpty()) {
            throw new BadRequestException("Cannot start quiz with zero questions");
        }

        quiz.setStatus(QuizStatus.RUNNING);
        quiz.setStartedAt(LocalDateTime.now());
        quiz.setCurrentQuestionIndex(0);
        quizRepository.save(quiz);

        log.info("Quiz id: {} started by admin: {}", quizId, adminId);
        webSocketService.broadcastQuizEvent(quizId, "QUIZ_STARTED", Map.of(
                "quizId", quizId,
                "title", quiz.getTitle(),
                "totalQuestions", questions.size(),
                "startedAt", quiz.getStartedAt()
        ));

        // Start Question 1 automatically
        startNextQuestion(quizId, adminId);
    }

    @Transactional
    public void startNextQuestion(Long quizId, Long adminId) {
        cancelTimers(quizId);

        Quiz quiz = getQuiz(quizId);

        // 1. End any active session
        sessionRepository.findFirstByQuizIdAndSessionStatusOrderByCreatedAtDesc(quizId, SessionStatus.ACTIVE)
                .ifPresent(activeSession -> {
                    activeSession.setSessionStatus(SessionStatus.ENDED);
                    activeSession.setServerEndTimeMs(System.currentTimeMillis());
                    sessionRepository.save(activeSession);
                });

        List<Question> questions = questionRepository.findByQuizIdOrderByDisplayOrderAsc(quizId);
        int nextIndex = quiz.getCurrentQuestionIndex() + 1;

        if (nextIndex > questions.size()) {
            log.info("No more questions. Finishing quiz id: {}", quizId);
            finishQuiz(quizId, adminId);
            return;
        }

        quiz.setCurrentQuestionIndex(nextIndex);
        quiz.setStatus(QuizStatus.QUESTION_ACTIVE);
        quizRepository.save(quiz);

        Question currentQuestion = questions.get(nextIndex - 1);
        long now = System.currentTimeMillis();
        long durationMs = currentQuestion.getDurationSeconds() * 1000L;

        QuestionSession session = QuestionSession.builder()
                .quiz(quiz)
                .question(currentQuestion)
                .sessionStatus(SessionStatus.ACTIVE)
                .serverStartTimeMs(now)
                .durationMs(durationMs)
                .build();
        QuestionSession savedSession = sessionRepository.save(session);

        PublicQuestionDto publicQuestion = questionService.mapToPublicDto(
                currentQuestion,
                questions.size(),
                Boolean.TRUE.equals(quiz.getRandomizeOptions())
        );

        Map<String, Object> payload = new HashMap<>();
        payload.put("sessionId", savedSession.getId());
        payload.put("question", publicQuestion);
        payload.put("questionIndex", nextIndex);
        payload.put("totalQuestions", questions.size());
        payload.put("serverStartTimeMs", now);
        payload.put("durationMs", durationMs);

        log.info("Started question {}/{} for quiz id: {}. Duration: {}s. Auto-advance scheduled.",
                nextIndex, questions.size(), quizId, currentQuestion.getDurationSeconds());
        webSocketService.broadcastQuizEvent(quizId, "QUESTION_STARTED", payload);

        // Auto-end question when timer expires
        scheduleQuestionAutoEnd(quizId, savedSession.getId(), nextIndex, questions.size(), durationMs);
    }

    @Transactional
    public void endCurrentQuestion(Long quizId, Long adminId) {
        cancelQuestionTimer(quizId);

        Quiz quiz = getQuiz(quizId);
        List<Question> questions = questionRepository.findByQuizIdOrderByDisplayOrderAsc(quizId);
        int totalQuestions = questions.size();

        sessionRepository.findFirstByQuizIdAndSessionStatusOrderByCreatedAtDesc(quizId, SessionStatus.ACTIVE)
                .ifPresent(activeSession -> {
                    activeSession.setSessionStatus(SessionStatus.ENDED);
                    activeSession.setServerEndTimeMs(System.currentTimeMillis());
                    sessionRepository.save(activeSession);

                    Question question = activeSession.getQuestion();
                    QuestionOption correctOption = question.getOptions().stream()
                            .filter(QuestionOption::getIsCorrect)
                            .findFirst()
                            .orElse(null);

                    long totalAnswers = answerRepository.countByQuestionSessionId(activeSession.getId());
                    long correctCount = answerRepository.countByQuestionSessionIdAndIsCorrectTrue(activeSession.getId());
                    long incorrectCount = answerRepository.countByQuestionSessionIdAndIsCorrectFalse(activeSession.getId());

                    List<LeaderboardEntryDto> leaderboard = leaderboardService.calculateLeaderboard(quizId);

                    Map<String, Object> payload = new HashMap<>();
                    payload.put("questionId", question.getId());
                    payload.put("correctOptionId", correctOption != null ? correctOption.getId() : null);
                    payload.put("correctOptionText", correctOption != null ? correctOption.getOptionText() : null);
                    payload.put("totalAnswers", totalAnswers);
                    payload.put("correctCount", correctCount);
                    payload.put("incorrectCount", incorrectCount);
                    payload.put("leaderboard", leaderboard);
                    payload.put("questionIndex", quiz.getCurrentQuestionIndex());
                    payload.put("totalQuestions", totalQuestions);
                    payload.put("nextQuestionInSeconds", 4);
                    payload.put("isLastQuestion", quiz.getCurrentQuestionIndex() >= totalQuestions);

                    quiz.setStatus(QuizStatus.QUESTION_ENDED);
                    quizRepository.save(quiz);

                    log.info("Ended question id: {} for quiz id: {}. Auto-advancing in 4 seconds.", question.getId(), quizId);
                    webSocketService.broadcastQuizEvent(quizId, "QUESTION_ENDED", payload);

                    // Auto-advance to next question or completion after 4 seconds
                    scheduleNextStep(quizId, quiz.getCurrentQuestionIndex(), totalQuestions);
                });
    }

    @Transactional
    public void pauseQuiz(Long quizId, Long adminId) {
        cancelTimers(quizId);
        Quiz quiz = getQuiz(quizId);
        quiz.setStatus(QuizStatus.PAUSED);
        quizRepository.save(quiz);
        webSocketService.broadcastQuizEvent(quizId, "QUIZ_PAUSED", Map.of("quizId", quizId));
    }

    @Transactional
    public void resumeQuiz(Long quizId, Long adminId) {
        Quiz quiz = getQuiz(quizId);
        quiz.setStatus(QuizStatus.QUESTION_ACTIVE);
        quizRepository.save(quiz);
        webSocketService.broadcastQuizEvent(quizId, "QUIZ_RESUMED", Map.of("quizId", quizId));

        sessionRepository.findFirstByQuizIdAndSessionStatusOrderByCreatedAtDesc(quizId, SessionStatus.ACTIVE)
                .ifPresent(session -> {
                    long elapsed = System.currentTimeMillis() - session.getServerStartTimeMs();
                    long remainingMs = Math.max(1000L, session.getDurationMs() - elapsed);
                    List<Question> questions = questionRepository.findByQuizIdOrderByDisplayOrderAsc(quizId);
                    scheduleQuestionAutoEnd(quizId, session.getId(), quiz.getCurrentQuestionIndex(), questions.size(), remainingMs);
                });
    }

    @Transactional
    public void finishQuiz(Long quizId, Long adminId) {
        cancelTimers(quizId);

        Quiz quiz = getQuiz(quizId);

        sessionRepository.findFirstByQuizIdAndSessionStatusOrderByCreatedAtDesc(quizId, SessionStatus.ACTIVE)
                .ifPresent(session -> {
                    session.setSessionStatus(SessionStatus.ENDED);
                    session.setServerEndTimeMs(System.currentTimeMillis());
                    sessionRepository.save(session);
                });

        quiz.setStatus(QuizStatus.COMPLETED);
        quiz.setEndedAt(LocalDateTime.now());
        quizRepository.save(quiz);

        List<LeaderboardEntryDto> finalLeaderboard = leaderboardService.calculateLeaderboard(quizId);

        Map<String, Object> payload = new HashMap<>();
        payload.put("quizId", quizId);
        payload.put("title", quiz.getTitle());
        payload.put("endedAt", quiz.getEndedAt());
        payload.put("leaderboard", finalLeaderboard);

        log.info("Quiz id: {} COMPLETED. Final standings calculated.", quizId);
        webSocketService.broadcastQuizEvent(quizId, "QUIZ_FINISHED", payload);
        webSocketService.broadcastQuizEvent(quizId, "QUIZ_COMPLETED", payload);
    }

    private void scheduleQuestionAutoEnd(Long quizId, Long sessionId, int questionIndex, int totalQuestions, long durationMs) {
        cancelQuestionTimer(quizId);

        ScheduledFuture<?> future = scheduler.schedule(() -> {
            try {
                if (transactionTemplate == null) return;
                transactionTemplate.execute(status -> {
                    sessionRepository.findFirstByQuizIdAndSessionStatusOrderByCreatedAtDesc(quizId, SessionStatus.ACTIVE)
                            .ifPresent(activeSession -> {
                                if (activeSession.getId().equals(sessionId)) {
                                    log.info("Timer expired for quiz {} question {}/{}. Triggering auto-end.", quizId, questionIndex, totalQuestions);
                                    endCurrentQuestion(quizId, null);
                                }
                            });
                    return null;
                });
            } catch (Exception e) {
                log.error("Failed to execute auto-end timer for quiz {}", quizId, e);
            }
        }, durationMs, TimeUnit.MILLISECONDS);

        scheduledQuestionFutures.put(quizId, future);
    }

    private void scheduleNextStep(Long quizId, int currentIndex, int totalQuestions) {
        cancelIntermissionTimer(quizId);

        ScheduledFuture<?> future = scheduler.schedule(() -> {
            try {
                if (transactionTemplate == null) return;
                transactionTemplate.execute(status -> {
                    Quiz q = quizRepository.findById(quizId).orElse(null);
                    if (q == null || q.getStatus() == QuizStatus.COMPLETED || q.getStatus() == QuizStatus.PAUSED) {
                        return null;
                    }

                    if (currentIndex < totalQuestions) {
                        log.info("Auto-advancing quiz {} to question {}/{}", quizId, currentIndex + 1, totalQuestions);
                        startNextQuestion(quizId, null);
                    } else {
                        log.info("Auto-finishing quiz {} after last question", quizId);
                        finishQuiz(quizId, null);
                    }
                    return null;
                });
            } catch (Exception e) {
                log.error("Failed to execute auto-next timer for quiz {}", quizId, e);
            }
        }, 4000, TimeUnit.MILLISECONDS);

        scheduledIntermissionFutures.put(quizId, future);
    }

    public void cancelTimers(Long quizId) {
        cancelQuestionTimer(quizId);
        cancelIntermissionTimer(quizId);
        ScheduledFuture<?> lbFuture = pendingLeaderboardBroadcasts.remove(quizId);
        if (lbFuture != null) {
            lbFuture.cancel(false);
        }
    }

    private void cancelQuestionTimer(Long quizId) {
        ScheduledFuture<?> future = scheduledQuestionFutures.remove(quizId);
        if (future != null) {
            future.cancel(false);
        }
    }

    private void cancelIntermissionTimer(Long quizId) {
        ScheduledFuture<?> future = scheduledIntermissionFutures.remove(quizId);
        if (future != null) {
            future.cancel(false);
        }
    }

    private void triggerDebouncedLeaderboardBroadcast(Long quizId) {
        pendingLeaderboardBroadcasts.compute(quizId, (key, existingFuture) -> {
            if (existingFuture != null && !existingFuture.isDone()) {
                return existingFuture;
            }
            return scheduler.schedule(() -> {
                try {
                    if (!quizRepository.existsById(quizId)) {
                        return;
                    }
                    List<LeaderboardEntryDto> leaderboard = leaderboardService.calculateLeaderboard(quizId);
                    webSocketService.broadcastQuizEvent(quizId, "LEADERBOARD_UPDATED", leaderboard);
                } catch (ResourceNotFoundException e) {
                    log.debug("Quiz {} was deleted or completed before leaderboard broadcast", quizId);
                } catch (Exception e) {
                    log.error("Failed to broadcast debounced leaderboard for quiz {}", quizId, e);
                } finally {
                    pendingLeaderboardBroadcasts.remove(quizId);
                }
            }, 500, TimeUnit.MILLISECONDS);
        });
    }

    @Transactional
    public AnswerResultDto submitAnswer(Long quizId, Long questionId, Long userId, Long selectedOptionId) {
        long serverSubmissionTimeMs = System.currentTimeMillis();

        Quiz quiz = getQuiz(quizId);
        if (quiz.getStatus() == QuizStatus.PAUSED) {
            throw new BadRequestException("Quiz is currently paused");
        }
        if (quiz.getStatus() == QuizStatus.DRAFT) {
            throw new BadRequestException("Quiz has not been published yet");
        }

        QuizParticipant participant = participantRepository.findByQuizIdAndUserId(quizId, userId)
                .orElseThrow(() -> new BadRequestException("User is not registered for this quiz"));

        QuestionOption option = optionRepository.findById(selectedOptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Selected option not found: " + selectedOptionId));

        if (!option.getQuestion().getId().equals(questionId)) {
            throw new BadRequestException("Selected option does not belong to this question");
        }

        Question question = option.getQuestion();
        Team team = participant.getTeam();

        QuestionSession session = null;
        if (quiz.getMode() == QuizMode.TEAM && team != null) {
            session = sessionRepository.findFirstByQuizIdAndTeamIdAndQuestionIdAndSessionStatusOrderByCreatedAtDesc(
                    quizId, team.getId(), questionId, SessionStatus.ACTIVE)
                    .or(() -> sessionRepository.findByQuizIdAndQuestionIdAndSessionStatus(quizId, questionId, SessionStatus.ACTIVE))
                    .or(() -> sessionRepository.findFirstByQuizIdAndSessionStatusOrderByCreatedAtDesc(quizId, SessionStatus.ACTIVE))
                    .orElse(null);
        } else {
            session = sessionRepository.findFirstByQuizIdAndUserIdAndQuestionIdAndSessionStatusOrderByCreatedAtDesc(
                    quizId, userId, questionId, SessionStatus.ACTIVE)
                    .or(() -> sessionRepository.findByQuizIdAndQuestionIdAndSessionStatus(quizId, questionId, SessionStatus.ACTIVE))
                    .or(() -> sessionRepository.findFirstByQuizIdAndSessionStatusOrderByCreatedAtDesc(quizId, SessionStatus.ACTIVE))
                    .orElse(null);
        }

        if (session == null) {
            long durationMs = question.getDurationSeconds() * 1000L;
            session = QuestionSession.builder()
                    .quiz(quiz)
                    .question(question)
                    .user(participant.getUser())
                    .team(team)
                    .sessionStatus(SessionStatus.ACTIVE)
                    .serverStartTimeMs(serverSubmissionTimeMs - 800)
                    .durationMs(durationMs)
                    .build();
            session = sessionRepository.save(session);
        }

        // Authoritative server-side timing check
        long serverStartTimeMs = session.getServerStartTimeMs();
        long responseTimeMs = Math.max(10, serverSubmissionTimeMs - serverStartTimeMs);
        long maxAllowedDurationMs = session.getDurationMs() + gracePeriodMs;

        if (responseTimeMs > maxAllowedDurationMs) {
            log.warn("Answer rejected due to timeout. responseTimeMs: {} > maxAllowedDurationMs: {}", responseTimeMs, maxAllowedDurationMs);
            throw new QuestionExpiredException("The time limit for this question has expired (" + responseTimeMs + "ms > " + session.getDurationMs() + "ms)");
        }

        boolean isCorrect = Boolean.TRUE.equals(option.getIsCorrect());

        if (quiz.getMode() == QuizMode.TEAM) {
            if (team == null) {
                throw new BadRequestException("You must be part of a team to answer in TEAM mode");
            }

            // Concurrency lock per team per question session
            String teamLock = ("team-quiz-lock-" + team.getId() + "-sess-" + session.getId()).intern();
            synchronized (teamLock) {
                Optional<Answer> existingOfficial = answerRepository
                        .findFirstByQuestionSessionIdAndTeamIdAndIsOfficialTeamAnswerTrue(session.getId(), team.getId());

                if (existingOfficial.isPresent()) {
                    // Ignored duplicate submission from teammate
                    Answer ignoredAnswer = Answer.builder()
                            .quiz(quiz)
                            .question(session.getQuestion())
                            .questionSession(session)
                            .user(participant.getUser())
                            .team(team)
                            .selectedOption(option)
                            .isCorrect(isCorrect)
                            .serverSubmissionTimeMs(serverSubmissionTimeMs)
                            .responseTimeMs(responseTimeMs)
                            .scoreAwarded(0)
                            .submissionStatus(SubmissionStatus.IGNORED_DUPLICATE)
                            .isOfficialTeamAnswer(false)
                            .build();
                    answerRepository.save(ignoredAnswer);

                    log.info("Teammate {} submitted duplicate answer for team {} - marked IGNORED_DUPLICATE",
                            participant.getUser().getUsername(), team.getName());

                    return AnswerResultDto.builder()
                            .questionId(questionId)
                            .selectedOptionId(selectedOptionId)
                            .responseTimeMs(responseTimeMs)
                            .scoreAwarded(0)
                            .isCorrect(false)
                            .status(SubmissionStatus.IGNORED_DUPLICATE)
                            .isOfficialTeamAnswer(false)
                            .submitterName(existingOfficial.get().getUser().getFullName())
                            .message("Your teammate (" + existingOfficial.get().getUser().getFullName() + ") already submitted the official answer for Team " + team.getName())
                            .build();
                }

                // Official team answer!
                int score = scoringEngine.calculateScore(session.getQuestion(), responseTimeMs, isCorrect);

                Answer officialAnswer = Answer.builder()
                        .quiz(quiz)
                        .question(session.getQuestion())
                        .questionSession(session)
                        .user(participant.getUser())
                        .team(team)
                        .selectedOption(option)
                        .isCorrect(isCorrect)
                        .serverSubmissionTimeMs(serverSubmissionTimeMs)
                        .responseTimeMs(responseTimeMs)
                        .scoreAwarded(score)
                        .submissionStatus(SubmissionStatus.ACCEPTED)
                        .isOfficialTeamAnswer(true)
                        .build();
                Answer saved = answerRepository.save(officialAnswer);

                log.info("Official team answer by user {} for team {} on question {}. Correct: {}, ResponseTime: {}ms, Score: {}",
                        participant.getUser().getUsername(), team.getName(), questionId, isCorrect, responseTimeMs, score);

                // Notify teammates that answer has been locked
                TeamAnswerStatusDto teamStatus = TeamAnswerStatusDto.builder()
                        .teamId(team.getId())
                        .teamName(team.getName())
                        .questionId(questionId)
                        .locked(true)
                        .submittedByUserId(participant.getUser().getId())
                        .submittedByUserName(participant.getUser().getFullName())
                        .responseTimeMs(responseTimeMs)
                        .build();
                webSocketService.sendTeamEvent(quizId, team.getId(), "TEAM_ANSWER_LOCKED", teamStatus);

                // Broadcast updated live leaderboard (debounced asynchronously for high concurrency)
                triggerDebouncedLeaderboardBroadcast(quizId);

                return AnswerResultDto.builder()
                        .questionId(questionId)
                        .selectedOptionId(selectedOptionId)
                        .responseTimeMs(responseTimeMs)
                        .scoreAwarded(score)
                        .isCorrect(Boolean.TRUE.equals(quiz.getImmediateFeedback()) ? isCorrect : null)
                        .status(SubmissionStatus.ACCEPTED)
                        .isOfficialTeamAnswer(true)
                        .submitterName(participant.getUser().getFullName())
                        .message("Official team answer recorded successfully!")
                        .build();
            }
        } else {
            // INDIVIDUAL MODE
            String userLock = ("user-quiz-lock-" + userId + "-sess-" + session.getId()).intern();
            synchronized (userLock) {
                if (answerRepository.existsByQuestionSessionIdAndUserId(session.getId(), userId)) {
                    throw new DuplicateSubmissionException("You have already submitted an answer for this question");
                }

                int score = scoringEngine.calculateScore(session.getQuestion(), responseTimeMs, isCorrect);

                Answer answer = Answer.builder()
                        .quiz(quiz)
                        .question(session.getQuestion())
                        .questionSession(session)
                        .user(participant.getUser())
                        .team(null)
                        .selectedOption(option)
                        .isCorrect(isCorrect)
                        .serverSubmissionTimeMs(serverSubmissionTimeMs)
                        .responseTimeMs(responseTimeMs)
                        .scoreAwarded(score)
                        .submissionStatus(SubmissionStatus.ACCEPTED)
                        .isOfficialTeamAnswer(false)
                        .build();
                answerRepository.save(answer);

                log.info("Individual answer by user {} on question {}. Correct: {}, ResponseTime: {}ms, Score: {}",
                        participant.getUser().getUsername(), questionId, isCorrect, responseTimeMs, score);

                // Broadcast updated live leaderboard (debounced asynchronously for high concurrency)
                triggerDebouncedLeaderboardBroadcast(quizId);

                return AnswerResultDto.builder()
                        .questionId(questionId)
                        .selectedOptionId(selectedOptionId)
                        .responseTimeMs(responseTimeMs)
                        .scoreAwarded(score)
                        .isCorrect(Boolean.TRUE.equals(quiz.getImmediateFeedback()) ? isCorrect : null)
                        .status(SubmissionStatus.ACCEPTED)
                        .isOfficialTeamAnswer(false)
                        .submitterName(participant.getUser().getFullName())
                        .message("Answer recorded successfully!")
                        .build();
            }
        }
    }

    @Transactional
    public QuizStateDto startQuizForParticipant(Long quizId, Long userId) {
        Quiz quiz = getQuiz(quizId);
        List<Question> questions = questionRepository.findByQuizIdOrderByDisplayOrderAsc(quizId);
        if (questions.isEmpty()) {
            throw new BadRequestException("Cannot start quiz with zero questions");
        }

        // Ensure user is registered participant
        if (!participantRepository.existsByQuizIdAndUserId(quizId, userId)) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
            QuizParticipant participant = QuizParticipant.builder()
                    .quiz(quiz)
                    .user(user)
                    .build();
            participantRepository.save(participant);
        }

        // Mark quiz RUNNING if it was in lobby/registration/draft
        if (quiz.getStatus() == QuizStatus.DRAFT || quiz.getStatus() == QuizStatus.LOBBY || quiz.getStatus() == QuizStatus.REGISTRATION_OPEN) {
            quiz.setStatus(QuizStatus.RUNNING);
            if (quiz.getStartedAt() == null) {
                quiz.setStartedAt(LocalDateTime.now());
            }
            quizRepository.save(quiz);

            webSocketService.broadcastQuizEvent(quizId, "QUIZ_STARTED", Map.of(
                    "quizId", quizId,
                    "title", quiz.getTitle(),
                    "totalQuestions", questions.size(),
                    "startedAt", quiz.getStartedAt()
            ));
        }

        return getQuizState(quizId, userId);
    }

    @Transactional
    public AnswerResultDto timeoutQuestion(Long quizId, Long questionId, Long userId) {
        long serverSubmissionTimeMs = System.currentTimeMillis();
        Quiz quiz = getQuiz(quizId);
        QuizParticipant participant = participantRepository.findByQuizIdAndUserId(quizId, userId)
                .orElseThrow(() -> new BadRequestException("User is not registered for this quiz"));
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + questionId));
        Team team = participant.getTeam();

        QuestionSession session = null;
        if (quiz.getMode() == QuizMode.TEAM && team != null) {
            session = sessionRepository.findFirstByQuizIdAndTeamIdAndQuestionIdAndSessionStatusOrderByCreatedAtDesc(
                    quizId, team.getId(), questionId, SessionStatus.ACTIVE).orElse(null);
        } else {
            session = sessionRepository.findFirstByQuizIdAndUserIdAndQuestionIdAndSessionStatusOrderByCreatedAtDesc(
                    quizId, userId, questionId, SessionStatus.ACTIVE).orElse(null);
        }

        if (session != null) {
            session.setSessionStatus(SessionStatus.ENDED);
            session.setServerEndTimeMs(serverSubmissionTimeMs);
            sessionRepository.save(session);
        }

        long responseTimeMs = session != null ? Math.max(10, serverSubmissionTimeMs - session.getServerStartTimeMs()) : question.getDurationSeconds() * 1000L;

        // Check if already answered
        if (quiz.getMode() == QuizMode.TEAM && team != null) {
            if (session != null && answerRepository.existsByQuestionSessionIdAndTeamIdAndIsOfficialTeamAnswerTrue(session.getId(), team.getId())) {
                return AnswerResultDto.builder()
                        .questionId(questionId)
                        .scoreAwarded(0)
                        .isCorrect(false)
                        .status(SubmissionStatus.IGNORED_DUPLICATE)
                        .build();
            }
        } else {
            if (session != null && answerRepository.existsByQuestionSessionIdAndUserId(session.getId(), userId)) {
                return AnswerResultDto.builder()
                        .questionId(questionId)
                        .scoreAwarded(0)
                        .isCorrect(false)
                        .status(SubmissionStatus.ACCEPTED)
                        .build();
            }
        }

        Answer timeoutAnswer = Answer.builder()
                .quiz(quiz)
                .question(question)
                .questionSession(session)
                .user(participant.getUser())
                .team(team)
                .selectedOption(null)
                .isCorrect(false)
                .serverSubmissionTimeMs(serverSubmissionTimeMs)
                .responseTimeMs(responseTimeMs)
                .scoreAwarded(0)
                .submissionStatus(SubmissionStatus.REJECTED_TIMEOUT)
                .isOfficialTeamAnswer(quiz.getMode() == QuizMode.TEAM)
                .build();
        answerRepository.save(timeoutAnswer);

        triggerDebouncedLeaderboardBroadcast(quizId);

        return AnswerResultDto.builder()
                .questionId(questionId)
                .responseTimeMs(responseTimeMs)
                .scoreAwarded(0)
                .isCorrect(false)
                .status(SubmissionStatus.REJECTED_TIMEOUT)
                .message("Time expired for this question")
                .build();
    }

    @Transactional
    public QuizStateDto getQuizState(Long quizId, Long userId) {
        Quiz quiz = getQuiz(quizId);
        List<Question> questions = questionRepository.findByQuizIdOrderByDisplayOrderAsc(quizId);
        int totalQuestions = questions.size();

        Optional<QuizParticipant> participantOpt = participantRepository.findByQuizIdAndUserId(quizId, userId);
        Team team = participantOpt.flatMap(p -> Optional.ofNullable(p.getTeam())).orElse(null);

        // Find all answers already submitted by this user (or team)
        List<Answer> answers;
        if (quiz.getMode() == QuizMode.TEAM && team != null) {
            answers = answerRepository.findByQuizIdAndTeamId(quizId, team.getId()).stream()
                    .filter(a -> Boolean.TRUE.equals(a.getIsOfficialTeamAnswer()))
                    .collect(Collectors.toList());
        } else {
            answers = answerRepository.findByQuizIdAndUserId(quizId, userId);
        }

        Set<Long> answeredQuestionIds = answers.stream()
                .map(a -> a.getQuestion().getId())
                .collect(Collectors.toSet());

        PublicQuestionDto currentPublicQuestion = null;
        Long serverQuestionStartTimeMs = null;
        Long questionDurationMs = null;
        Long remainingTimeMs = null;
        boolean alreadyAnswered = false;
        AnswerResultDto myAnswerResult = null;
        int currentQuestionIndex = 1;
        QuizStatus status = quiz.getStatus();

        long serverCurrentTimeMs = System.currentTimeMillis();

        if (!questions.isEmpty() && answeredQuestionIds.size() >= totalQuestions) {
            // Participant has answered all questions!
            status = QuizStatus.COMPLETED;
            currentQuestionIndex = totalQuestions;
            alreadyAnswered = true;
        } else if (!questions.isEmpty()) {
            // Find first unanswered question
            Question nextQuestion = null;
            for (int i = 0; i < questions.size(); i++) {
                if (!answeredQuestionIds.contains(questions.get(i).getId())) {
                    nextQuestion = questions.get(i);
                    currentQuestionIndex = i + 1;
                    break;
                }
            }

            if (nextQuestion != null) {
                // Find or create active session for this question and participant/team
                QuestionSession session = null;
                if (quiz.getMode() == QuizMode.TEAM && team != null) {
                    session = sessionRepository.findFirstByQuizIdAndTeamIdAndQuestionIdAndSessionStatusOrderByCreatedAtDesc(
                            quizId, team.getId(), nextQuestion.getId(), SessionStatus.ACTIVE).orElse(null);
                } else {
                    session = sessionRepository.findFirstByQuizIdAndUserIdAndQuestionIdAndSessionStatusOrderByCreatedAtDesc(
                            quizId, userId, nextQuestion.getId(), SessionStatus.ACTIVE).orElse(null);
                }

                // Fallback to global active session
                if (session == null) {
                    session = sessionRepository.findByQuizIdAndQuestionIdAndSessionStatus(
                            quizId, nextQuestion.getId(), SessionStatus.ACTIVE).orElse(null);
                }

                if (session == null) {
                    // Start individual participant session for this question
                    long durationMs = nextQuestion.getDurationSeconds() * 1000L;
                    session = QuestionSession.builder()
                            .quiz(quiz)
                            .question(nextQuestion)
                            .user(participantOpt.map(QuizParticipant::getUser).orElse(null))
                            .team(team)
                            .sessionStatus(SessionStatus.ACTIVE)
                            .serverStartTimeMs(serverCurrentTimeMs)
                            .durationMs(durationMs)
                            .build();
                    session = sessionRepository.save(session);
                }

                serverQuestionStartTimeMs = session.getServerStartTimeMs();
                questionDurationMs = session.getDurationMs();
                long elapsed = serverCurrentTimeMs - serverQuestionStartTimeMs;
                remainingTimeMs = Math.max(0, questionDurationMs - elapsed);

                currentPublicQuestion = questionService.mapToPublicDto(
                        nextQuestion,
                        totalQuestions,
                        Boolean.TRUE.equals(quiz.getRandomizeOptions())
                );
                status = QuizStatus.QUESTION_ACTIVE;
                alreadyAnswered = false;
            }
        }

        List<LeaderboardEntryDto> leaderboard = leaderboardService.calculateLeaderboard(quizId);
        Integer myScore = 0;
        Integer myRank = null;
        Long targetId = (quiz.getMode() == QuizMode.TEAM && team != null) ? team.getId() : userId;

        for (LeaderboardEntryDto entry : leaderboard) {
            if (entry.getId().equals(targetId)) {
                myScore = entry.getTotalScore();
                myRank = entry.getRank();
                break;
            }
        }

        return QuizStateDto.builder()
                .quizId(quiz.getId())
                .title(quiz.getTitle())
                .status(status)
                .mode(quiz.getMode())
                .currentQuestionIndex(currentQuestionIndex)
                .totalQuestions(totalQuestions)
                .fullscreenRequired(Boolean.TRUE.equals(quiz.getFullscreenRequired()))
                .currentQuestion(currentPublicQuestion)
                .serverQuestionStartTimeMs(serverQuestionStartTimeMs)
                .questionDurationMs(questionDurationMs)
                .serverCurrentTimeMs(serverCurrentTimeMs)
                .remainingTimeMs(remainingTimeMs)
                .alreadyAnswered(alreadyAnswered)
                .myAnswer(myAnswerResult)
                .myScore(myScore)
                .myRank(myRank)
                .myTeam(team != null ? teamService.mapToDto(team) : null)
                .leaderboard(leaderboard)
                .build();
    }

    private Quiz getQuiz(Long quizId) {
        return quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));
    }
}
