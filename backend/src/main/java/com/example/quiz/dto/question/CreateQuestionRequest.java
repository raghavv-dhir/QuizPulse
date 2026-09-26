package com.example.quiz.dto.question;

import com.example.quiz.entity.enums.QuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateQuestionRequest {

    @NotBlank(message = "Question text is required")
    private String questionText;

    private QuestionType questionType;

    @Min(value = 3, message = "Duration must be at least 3 seconds")
    private Integer durationSeconds;

    @Min(value = 10, message = "Max score must be at least 10")
    private Integer maxScore;

    private Integer displayOrder;

    @NotEmpty(message = "At least two options are required")
    @Valid
    private List<CreateOptionRequest> options;
}
