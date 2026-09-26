package com.example.quiz.service;

import com.example.quiz.dto.question.*;
import com.example.quiz.entity.Question;
import com.example.quiz.entity.QuestionOption;
import com.example.quiz.entity.Quiz;
import com.example.quiz.entity.enums.QuestionType;
import com.example.quiz.exception.BadRequestException;
import com.example.quiz.exception.ResourceNotFoundException;
import com.example.quiz.repository.QuestionOptionRepository;
import com.example.quiz.repository.QuestionRepository;
import com.example.quiz.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository optionRepository;
    private final QuizRepository quizRepository;

    @Transactional
    public QuestionDto addQuestion(Long quizId, CreateQuestionRequest request) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));

        if (request.getOptions() == null || request.getOptions().size() < 2) {
            throw new BadRequestException("At least 2 options are required for a question");
        }

        boolean hasCorrect = request.getOptions().stream().anyMatch(o -> Boolean.TRUE.equals(o.getIsCorrect()));
        if (!hasCorrect) {
            throw new BadRequestException("At least one option must be marked as correct");
        }

        int displayOrder = request.getDisplayOrder() != null
                ? request.getDisplayOrder()
                : (int) questionRepository.countByQuizId(quizId) + 1;

        int duration = request.getDurationSeconds() != null
                ? request.getDurationSeconds()
                : quiz.getDefaultQuestionDurationSeconds();

        int maxScore = request.getMaxScore() != null
                ? request.getMaxScore()
                : quiz.getMaxScorePerQuestion();

        Question question = Question.builder()
                .quiz(quiz)
                .questionText(request.getQuestionText().trim())
                .questionType(request.getQuestionType() != null ? request.getQuestionType() : QuestionType.MULTIPLE_CHOICE)
                .durationSeconds(duration)
                .maxScore(maxScore)
                .displayOrder(displayOrder)
                .build();

        Question savedQuestion = questionRepository.save(question);

        List<QuestionOption> options = new ArrayList<>();
        int optionOrder = 1;
        for (CreateOptionRequest optReq : request.getOptions()) {
            QuestionOption option = QuestionOption.builder()
                    .question(savedQuestion)
                    .optionText(optReq.getOptionText().trim())
                    .isCorrect(Boolean.TRUE.equals(optReq.getIsCorrect()))
                    .displayOrder(optReq.getDisplayOrder() != null ? optReq.getDisplayOrder() : optionOrder++)
                    .build();
            options.add(option);
        }
        optionRepository.saveAll(options);
        savedQuestion.setOptions(options);

        log.info("Added question id: {} to quiz id: {}", savedQuestion.getId(), quizId);
        return mapToDto(savedQuestion);
    }

    @Transactional
    public QuestionDto updateQuestion(Long questionId, CreateQuestionRequest request) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + questionId));

        if (request.getOptions() != null) {
            boolean hasCorrect = request.getOptions().stream().anyMatch(o -> Boolean.TRUE.equals(o.getIsCorrect()));
            if (!hasCorrect) {
                throw new BadRequestException("At least one option must be marked as correct");
            }
        }

        question.setQuestionText(request.getQuestionText().trim());
        if (request.getDurationSeconds() != null) question.setDurationSeconds(request.getDurationSeconds());
        if (request.getMaxScore() != null) question.setMaxScore(request.getMaxScore());
        if (request.getDisplayOrder() != null) question.setDisplayOrder(request.getDisplayOrder());

        if (request.getOptions() != null) {
            optionRepository.deleteAll(question.getOptions());
            question.getOptions().clear();

            int optOrder = 1;
            for (CreateOptionRequest optReq : request.getOptions()) {
                QuestionOption opt = QuestionOption.builder()
                        .question(question)
                        .optionText(optReq.getOptionText().trim())
                        .isCorrect(Boolean.TRUE.equals(optReq.getIsCorrect()))
                        .displayOrder(optReq.getDisplayOrder() != null ? optReq.getDisplayOrder() : optOrder++)
                        .build();
                question.getOptions().add(opt);
            }
        }

        Question saved = questionRepository.save(question);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteQuestion(Long questionId) {
        if (!questionRepository.existsById(questionId)) {
            throw new ResourceNotFoundException("Question not found: " + questionId);
        }
        questionRepository.deleteById(questionId);
    }

    @Transactional(readOnly = true)
    public List<QuestionDto> getQuestionsForQuiz(Long quizId) {
        return questionRepository.findByQuizIdOrderByDisplayOrderAsc(quizId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public QuestionDto mapToDto(Question question) {
        List<QuestionOptionDto> options = question.getOptions().stream()
                .map(o -> QuestionOptionDto.builder()
                        .id(o.getId())
                        .optionText(o.getOptionText())
                        .isCorrect(o.getIsCorrect())
                        .displayOrder(o.getDisplayOrder())
                        .build())
                .collect(Collectors.toList());

        return QuestionDto.builder()
                .id(question.getId())
                .quizId(question.getQuiz().getId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .durationSeconds(question.getDurationSeconds())
                .maxScore(question.getMaxScore())
                .displayOrder(question.getDisplayOrder())
                .options(options)
                .build();
    }

    public PublicQuestionDto mapToPublicDto(Question question, int totalQuestions, boolean randomizeOptions) {
        List<PublicOptionDto> options = question.getOptions().stream()
                .map(o -> PublicOptionDto.builder()
                        .id(o.getId())
                        .optionText(o.getOptionText())
                        .displayOrder(o.getDisplayOrder())
                        .build())
                .collect(Collectors.toList());

        if (randomizeOptions) {
            Collections.shuffle(options);
        }

        return PublicQuestionDto.builder()
                .id(question.getId())
                .quizId(question.getQuiz().getId())
                .questionText(question.getQuestionText())
                .durationSeconds(question.getDurationSeconds())
                .maxScore(question.getMaxScore())
                .displayOrder(question.getDisplayOrder())
                .totalQuestions(totalQuestions)
                .options(options)
                .build();
    }
}
