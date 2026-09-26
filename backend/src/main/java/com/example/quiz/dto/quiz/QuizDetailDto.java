package com.example.quiz.dto.quiz;

import com.example.quiz.dto.question.QuestionDto;
import com.example.quiz.dto.team.TeamDto;
import com.example.quiz.entity.enums.QuizMode;
import com.example.quiz.entity.enums.QuizStatus;
import com.example.quiz.entity.enums.ScoringStrategyType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizDetailDto {
    private Long id;
    private String title;
    private String description;
    private QuizMode mode;
    private QuizStatus status;
    private Integer defaultQuestionDurationSeconds;
    private Integer maxScorePerQuestion;
    private ScoringStrategyType scoringStrategy;
    private Boolean negativeMarking;
    private Integer negativePoints;
    private Boolean randomizeQuestions;
    private Boolean randomizeOptions;
    private Boolean immediateFeedback;
    private Boolean fullscreenRequired;
    private Boolean allowReconnection;
    private Integer currentQuestionIndex;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private List<QuestionDto> questions;
    private List<TeamDto> teams;
    private int participantCount;
}
