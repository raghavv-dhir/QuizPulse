package com.example.quiz.dto.question;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOptionRequest {

    @NotBlank(message = "Option text is required")
    private String optionText;

    private Boolean isCorrect;

    private Integer displayOrder;
}
