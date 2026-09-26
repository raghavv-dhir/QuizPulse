package com.example.quiz.dto.quiz;

import com.example.quiz.entity.enums.QuizMode;
import com.example.quiz.entity.enums.ScoringStrategyType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateQuizRequest {
    private String title;
    private String description;
    private QuizMode mode;
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
}
