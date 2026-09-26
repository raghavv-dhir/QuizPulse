package com.example.quiz.dto.quiz;

import com.example.quiz.entity.enums.QuizMode;
import com.example.quiz.entity.enums.ScoringStrategyType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateQuizRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Mode is required (TEAM or INDIVIDUAL)")
    private QuizMode mode;

    @Min(value = 5, message = "Default duration must be at least 5 seconds")
    private Integer defaultQuestionDurationSeconds;

    @Min(value = 10, message = "Max score must be at least 10")
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
