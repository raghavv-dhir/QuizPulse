package com.example.quiz.dto.question;

import com.example.quiz.entity.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionDto {
    private Long id;
    private Long quizId;
    private String questionText;
    private QuestionType questionType;
    private Integer durationSeconds;
    private Integer maxScore;
    private Integer displayOrder;
    private List<QuestionOptionDto> options;
}
