package com.example.quiz.dto.auth;

import com.example.quiz.entity.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String tokenType;
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private Role role;
}
