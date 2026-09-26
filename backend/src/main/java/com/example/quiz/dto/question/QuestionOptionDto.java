package com.example.quiz.dto.question;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionOptionDto {
    private Long id;
    private String optionText;
    private Boolean isCorrect;
    private Integer displayOrder;
}
