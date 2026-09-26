package com.example.quiz.service;

import com.example.quiz.dto.quiz.CreateQuizRequest;
import com.example.quiz.dto.quiz.QuizDetailDto;
import com.example.quiz.dto.quiz.QuizSummaryDto;
import com.example.quiz.dto.quiz.UpdateQuizRequest;
import com.example.quiz.entity.Quiz;
import com.example.quiz.entity.QuizParticipant;
import com.example.quiz.entity.Team;
import com.example.quiz.entity.User;
import com.example.quiz.entity.enums.QuizMode;
import com.example.quiz.entity.enums.QuizStatus;
import com.example.quiz.entity.enums.ScoringStrategyType;
import com.example.quiz.exception.BadRequestException;
import com.example.quiz.exception.ResourceNotFoundException;
import com.example.quiz.repository.QuestionRepository;
import com.example.quiz.repository.QuizParticipantRepository;
import com.example.quiz.repository.QuizRepository;
import com.example.quiz.repository.TeamMemberRepository;
import com.example.quiz.repository.TeamRepository;
import com.example.quiz.repository.UserRepository;
import com.example.quiz.websocket.QuizWebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizService {

    private final QuizRepository quizRepository;
    private final UserRepository userRepository;
    private final QuizParticipantRepository participantRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final QuestionRepository questionRepository;
    private final QuestionService questionService;
    private final TeamService teamService;
    private final QuizWebSocketService webSocketService;

    @Transactional
    public QuizDetailDto createQuiz(CreateQuizRequest request, Long userId) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Quiz quiz = Quiz.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .mode(request.getMode() != null ? request.getMode() : QuizMode.INDIVIDUAL)
                .status(QuizStatus.DRAFT)
                .defaultQuestionDurationSeconds(request.getDefaultQuestionDurationSeconds() != null ? request.getDefaultQuestionDurationSeconds() : 15)
                .maxScorePerQuestion(request.getMaxScorePerQuestion() != null ? request.getMaxScorePerQuestion() : 1000)
                .scoringStrategy(request.getScoringStrategy() != null ? request.getScoringStrategy() : ScoringStrategyType.LINEAR)
                .negativeMarking(Boolean.TRUE.equals(request.getNegativeMarking()))
                .negativePoints(request.getNegativePoints() != null ? request.getNegativePoints() : 0)
                .randomizeQuestions(Boolean.TRUE.equals(request.getRandomizeQuestions()))
                .randomizeOptions(Boolean.TRUE.equals(request.getRandomizeOptions()))
                .immediateFeedback(request.getImmediateFeedback() != null ? request.getImmediateFeedback() : true)
                .fullscreenRequired(Boolean.TRUE.equals(request.getFullscreenRequired()))
                .allowReconnection(request.getAllowReconnection() != null ? request.getAllowReconnection() : true)
                .currentQuestionIndex(0)
                .createdBy(creator)
                .build();

        Quiz saved = quizRepository.save(quiz);
        log.info("Created new quiz: {} (id: {}) by user: {}", saved.getTitle(), saved.getId(), creator.getUsername());
        return mapToDetailDto(saved);
    }

    @Transactional
    public QuizDetailDto updateQuiz(Long quizId, UpdateQuizRequest request) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));

        if (quiz.getStatus() != QuizStatus.DRAFT && quiz.getStatus() != QuizStatus.REGISTRATION_OPEN) {
            throw new BadRequestException("Cannot edit quiz once it has started or completed");
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) quiz.setTitle(request.getTitle().trim());
        if (request.getDescription() != null) quiz.setDescription(request.getDescription());
        if (request.getMode() != null) quiz.setMode(request.getMode());
        if (request.getDefaultQuestionDurationSeconds() != null) quiz.setDefaultQuestionDurationSeconds(request.getDefaultQuestionDurationSeconds());
        if (request.getMaxScorePerQuestion() != null) quiz.setMaxScorePerQuestion(request.getMaxScorePerQuestion());
        if (request.getScoringStrategy() != null) quiz.setScoringStrategy(request.getScoringStrategy());
        if (request.getNegativeMarking() != null) quiz.setNegativeMarking(request.getNegativeMarking());
        if (request.getNegativePoints() != null) quiz.setNegativePoints(request.getNegativePoints());
        if (request.getRandomizeQuestions() != null) quiz.setRandomizeQuestions(request.getRandomizeQuestions());
        if (request.getRandomizeOptions() != null) quiz.setRandomizeOptions(request.getRandomizeOptions());
        if (request.getImmediateFeedback() != null) quiz.setImmediateFeedback(request.getImmediateFeedback());
        if (request.getFullscreenRequired() != null) quiz.setFullscreenRequired(request.getFullscreenRequired());
        if (request.getAllowReconnection() != null) quiz.setAllowReconnection(request.getAllowReconnection());

        Quiz saved = quizRepository.save(quiz);
        return mapToDetailDto(saved);
    }

    @Transactional
    public void deleteQuiz(Long quizId) {
        if (!quizRepository.existsById(quizId)) {
            throw new ResourceNotFoundException("Quiz not found: " + quizId);
        }
        quizRepository.deleteById(quizId);
        log.info("Deleted quiz id: {}", quizId);
    }

    @Transactional(readOnly = true)
    public List<QuizSummaryDto> getAllQuizzes() {
        return quizRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToSummaryDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public QuizDetailDto getQuizById(Long id) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + id));
        return mapToDetailDto(quiz);
    }

    @Transactional
    public void registerParticipant(Long quizId, Long userId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (!participantRepository.existsByQuizIdAndUserId(quizId, userId)) {
            QuizParticipant participant = QuizParticipant.builder()
                    .quiz(quiz)
                    .user(user)
                    .build();
            participantRepository.save(participant);
            log.info("Registered user {} to quiz {}", user.getUsername(), quiz.getTitle());
        }

        int count = (int) participantRepository.countByQuizId(quizId);
        webSocketService.broadcastQuizEvent(quizId, "PARTICIPANT_JOINED", Map.of(
                "participantCount", count,
                "userId", userId,
                "username", user.getUsername(),
                "fullName", user.getFullName()
        ));
    }

    @Transactional
    public void leaveQuiz(Long quizId, Long userId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // Remove from team if member
        List<Team> quizTeams = teamRepository.findByQuizIdOrderByNameAsc(quizId);
        for (Team t : quizTeams) {
            if (teamMemberRepository.existsByTeamIdAndUserId(t.getId(), userId)) {
                teamMemberRepository.deleteByTeamIdAndUserId(t.getId(), userId);
            }
        }

        // Remove from participants
        participantRepository.deleteByQuizIdAndUserId(quizId, userId);
        log.info("User {} left quiz {}", user.getUsername(), quiz.getTitle());

        int count = (int) participantRepository.countByQuizId(quizId);
        webSocketService.broadcastQuizEvent(quizId, "PARTICIPANT_LEFT", Map.of(
                "participantCount", count,
                "userId", userId,
                "username", user.getUsername()
        ));
    }

    public QuizSummaryDto mapToSummaryDto(Quiz quiz) {
        int questionCount = (int) questionRepository.countByQuizId(quiz.getId());
        int participantCount = (int) participantRepository.countByQuizId(quiz.getId());
        int teamCount = (int) teamRepository.countByQuizId(quiz.getId());

        return QuizSummaryDto.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .mode(quiz.getMode())
                .status(quiz.getStatus())
                .questionCount(questionCount)
                .participantCount(participantCount)
                .teamCount(teamCount)
                .createdById(quiz.getCreatedBy() != null ? quiz.getCreatedBy().getId() : null)
                .createdByName(quiz.getCreatedBy() != null ? quiz.getCreatedBy().getFullName() : null)
                .createdAt(quiz.getCreatedAt())
                .startedAt(quiz.getStartedAt())
                .endedAt(quiz.getEndedAt())
                .build();
    }

    public QuizDetailDto mapToDetailDto(Quiz quiz) {
        var questions = questionService.getQuestionsForQuiz(quiz.getId());
        var teams = teamService.getTeamsForQuiz(quiz.getId());
        int participantCount = (int) participantRepository.countByQuizId(quiz.getId());

        return QuizDetailDto.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .mode(quiz.getMode())
                .status(quiz.getStatus())
                .defaultQuestionDurationSeconds(quiz.getDefaultQuestionDurationSeconds())
                .maxScorePerQuestion(quiz.getMaxScorePerQuestion())
                .scoringStrategy(quiz.getScoringStrategy())
                .negativeMarking(quiz.getNegativeMarking())
                .negativePoints(quiz.getNegativePoints())
                .randomizeQuestions(quiz.getRandomizeQuestions())
                .randomizeOptions(quiz.getRandomizeOptions())
                .immediateFeedback(quiz.getImmediateFeedback())
                .fullscreenRequired(quiz.getFullscreenRequired())
                .allowReconnection(quiz.getAllowReconnection())
                .currentQuestionIndex(quiz.getCurrentQuestionIndex())
                .createdById(quiz.getCreatedBy() != null ? quiz.getCreatedBy().getId() : null)
                .createdByName(quiz.getCreatedBy() != null ? quiz.getCreatedBy().getFullName() : null)
                .createdAt(quiz.getCreatedAt())
                .startedAt(quiz.getStartedAt())
                .endedAt(quiz.getEndedAt())
                .questions(questions)
                .teams(teams)
                .participantCount(participantCount)
                .build();
    }
}
