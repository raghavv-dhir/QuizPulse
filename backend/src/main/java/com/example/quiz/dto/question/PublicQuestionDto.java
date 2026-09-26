package com.example.quiz.dto.question;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicQuestionDto {
    private Long id;
    private Long quizId;
    private String questionText;
    private Integer durationSeconds;
    private Integer maxScore;
    private Integer displayOrder;
    private Integer totalQuestions;
    private List<PublicOptionDto> options;
}
