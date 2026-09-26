package com.example.quiz.dto.leaderboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionResultDto {
    private Long questionId;
    private String questionText;
    private Integer displayOrder;
    private String selectedOptionText;
    private String correctOptionText;
    private boolean correct;
    private long responseTimeMs;
    private int scoreAwarded;
    private String submittedByName;
}
