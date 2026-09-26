package com.example.quiz.dto.quiz;

import com.example.quiz.entity.enums.QuizMode;
import com.example.quiz.entity.enums.QuizStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizSummaryDto {
    private Long id;
    private String title;
    private String description;
    private QuizMode mode;
    private QuizStatus status;
    private int questionCount;
    private int participantCount;
    private int teamCount;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
}
