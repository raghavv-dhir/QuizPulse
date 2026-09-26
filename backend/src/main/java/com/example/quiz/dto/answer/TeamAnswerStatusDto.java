package com.example.quiz.dto.answer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamAnswerStatusDto {
    private Long teamId;
    private String teamName;
    private Long questionId;
    private boolean locked;
    private Long submittedByUserId;
    private String submittedByUserName;
    private Long responseTimeMs;
}
