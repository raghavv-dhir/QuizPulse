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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

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

        log.info("Started question {}/{} for quiz id: {}", nextIndex, questions.size(), quizId);
        webSocketService.broadcastQuizEvent(quizId, "QUESTION_STARTED", payload);
    }

    @Transactional
    public void endCurrentQuestion(Long quizId, Long adminId) {
        Quiz quiz = getQuiz(quizId);

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

                    quiz.setStatus(QuizStatus.QUESTION_ENDED);
                    quizRepository.save(quiz);

                    log.info("Ended question id: {} for quiz id: {}", question.getId(), quizId);
                    webSocketService.broadcastQuizEvent(quizId, "QUESTION_ENDED", payload);
                });
    }

    @Transactional
    public void pauseQuiz(Long quizId, Long adminId) {
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
    }

    @Transactional
    public void finishQuiz(Long quizId, Long adminId) {
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
    }

    @Transactional
    public AnswerResultDto submitAnswer(Long quizId, Long questionId, Long userId, Long selectedOptionId) {
        long serverSubmissionTimeMs = System.currentTimeMillis();

        Quiz quiz = getQuiz(quizId);
        if (quiz.getStatus() != QuizStatus.RUNNING && quiz.getStatus() != QuizStatus.QUESTION_ACTIVE) {
            throw new BadRequestException("Quiz is not currently accepting answers (status: " + quiz.getStatus() + ")");
        }

        QuestionSession session = sessionRepository
                .findFirstByQuizIdAndSessionStatusOrderByCreatedAtDesc(quizId, SessionStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException("No active question session for this quiz"));

        if (!session.getQuestion().getId().equals(questionId)) {
            throw new BadRequestException("Active question mismatch. Current active question is id: " + session.getQuestion().getId());
        }

        // Authoritative server-side timing check
        long serverStartTimeMs = session.getServerStartTimeMs();
        long responseTimeMs = serverSubmissionTimeMs - serverStartTimeMs;
        long maxAllowedDurationMs = session.getDurationMs() + gracePeriodMs;

        if (responseTimeMs > maxAllowedDurationMs) {
            log.warn("Answer rejected due to timeout. responseTimeMs: {} > maxAllowedDurationMs: {}", responseTimeMs, maxAllowedDurationMs);
            throw new QuestionExpiredException("The time limit for this question has expired (" + responseTimeMs + "ms > " + session.getDurationMs() + "ms)");
        }

        QuestionOption option = optionRepository.findById(selectedOptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Selected option not found: " + selectedOptionId));

        if (!option.getQuestion().getId().equals(questionId)) {
            throw new BadRequestException("Selected option does not belong to this question");
        }

        QuizParticipant participant = participantRepository.findByQuizIdAndUserId(quizId, userId)
                .orElseThrow(() -> new BadRequestException("User is not registered for this quiz"));

        boolean isCorrect = Boolean.TRUE.equals(option.getIsCorrect());

        if (quiz.getMode() == QuizMode.TEAM) {
            Team team = participant.getTeam();
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

                // Broadcast updated live leaderboard
                List<LeaderboardEntryDto> leaderboard = leaderboardService.calculateLeaderboard(quizId);
                webSocketService.broadcastQuizEvent(quizId, "LEADERBOARD_UPDATED", leaderboard);

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

                // Broadcast updated live leaderboard
                List<LeaderboardEntryDto> leaderboard = leaderboardService.calculateLeaderboard(quizId);
                webSocketService.broadcastQuizEvent(quizId, "LEADERBOARD_UPDATED", leaderboard);

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

    @Transactional(readOnly = true)
    public QuizStateDto getQuizState(Long quizId, Long userId) {
        Quiz quiz = getQuiz(quizId);
        List<Question> questions = questionRepository.findByQuizIdOrderByDisplayOrderAsc(quizId);
        int totalQuestions = questions.size();

        Optional<QuizParticipant> participantOpt = participantRepository.findByQuizIdAndUserId(quizId, userId);
        Team team = participantOpt.flatMap(p -> Optional.ofNullable(p.getTeam())).orElse(null);

        Optional<QuestionSession> activeSessionOpt = sessionRepository
                .findFirstByQuizIdAndSessionStatusOrderByCreatedAtDesc(quizId, SessionStatus.ACTIVE);

        PublicQuestionDto currentPublicQuestion = null;
        Long serverQuestionStartTimeMs = null;
        Long questionDurationMs = null;
        Long remainingTimeMs = null;
        boolean alreadyAnswered = false;
        AnswerResultDto myAnswerResult = null;

        long serverCurrentTimeMs = System.currentTimeMillis();

        if (activeSessionOpt.isPresent()) {
            QuestionSession session = activeSessionOpt.get();
            Question currentQuestion = session.getQuestion();
            serverQuestionStartTimeMs = session.getServerStartTimeMs();
            questionDurationMs = session.getDurationMs();

            long elapsed = serverCurrentTimeMs - serverQuestionStartTimeMs;
            remainingTimeMs = Math.max(0, questionDurationMs - elapsed);

            currentPublicQuestion = questionService.mapToPublicDto(
                    currentQuestion,
                    totalQuestions,
                    Boolean.TRUE.equals(quiz.getRandomizeOptions())
            );

            // Check if already answered
            if (quiz.getMode() == QuizMode.TEAM && team != null) {
                Optional<Answer> officialTeamAns = answerRepository
                        .findFirstByQuestionSessionIdAndTeamIdAndIsOfficialTeamAnswerTrue(session.getId(), team.getId());
                if (officialTeamAns.isPresent()) {
                    alreadyAnswered = true;
                    Answer ans = officialTeamAns.get();
                    myAnswerResult = AnswerResultDto.builder()
                            .questionId(currentQuestion.getId())
                            .selectedOptionId(ans.getSelectedOption() != null ? ans.getSelectedOption().getId() : null)
                            .responseTimeMs(ans.getResponseTimeMs())
                            .scoreAwarded(ans.getScoreAwarded())
                            .isCorrect(Boolean.TRUE.equals(quiz.getImmediateFeedback()) ? ans.getIsCorrect() : null)
                            .status(ans.getSubmissionStatus())
                            .isOfficialTeamAnswer(true)
                            .submitterName(ans.getUser().getFullName())
                            .message("Team answer submitted by " + ans.getUser().getFullName())
                            .build();
                }
            } else {
                Optional<Answer> userAns = answerRepository.findByQuestionSessionIdAndUserId(session.getId(), userId);
                if (userAns.isPresent()) {
                    alreadyAnswered = true;
                    Answer ans = userAns.get();
                    myAnswerResult = AnswerResultDto.builder()
                            .questionId(currentQuestion.getId())
                            .selectedOptionId(ans.getSelectedOption() != null ? ans.getSelectedOption().getId() : null)
                            .responseTimeMs(ans.getResponseTimeMs())
                            .scoreAwarded(ans.getScoreAwarded())
                            .isCorrect(Boolean.TRUE.equals(quiz.getImmediateFeedback()) ? ans.getIsCorrect() : null)
                            .status(ans.getSubmissionStatus())
                            .isOfficialTeamAnswer(false)
                            .submitterName(ans.getUser().getFullName())
                            .message("Answer recorded")
                            .build();
                }
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
                .status(quiz.getStatus())
                .mode(quiz.getMode())
                .currentQuestionIndex(quiz.getCurrentQuestionIndex())
                .totalQuestions(totalQuestions)
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
