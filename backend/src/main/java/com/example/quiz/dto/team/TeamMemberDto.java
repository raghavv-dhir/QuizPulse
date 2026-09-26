package com.example.quiz.dto.team;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberDto {
    private Long id;
    private Long userId;
    private String username;
    private String fullName;
    private LocalDateTime joinedAt;
}
