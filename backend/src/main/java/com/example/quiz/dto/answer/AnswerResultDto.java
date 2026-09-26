package com.example.quiz.dto.answer;

import com.example.quiz.entity.enums.SubmissionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerResultDto {
    private Long questionId;
    private Long selectedOptionId;
    private Long responseTimeMs;
    private Integer scoreAwarded;
    private Boolean isCorrect; // revealed only if immediate feedback is true or quiz ended
    private SubmissionStatus status;
    private Boolean isOfficialTeamAnswer;
    private String submitterName;
    private String message;
}
