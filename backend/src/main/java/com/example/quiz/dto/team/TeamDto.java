package com.example.quiz.dto.team;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamDto {
    private Long id;
    private Long quizId;
    private String name;
    private String code;
    private LocalDateTime createdAt;
    private List<TeamMemberDto> members;
    private int memberCount;
}
