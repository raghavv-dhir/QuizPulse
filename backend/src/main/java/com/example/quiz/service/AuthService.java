package com.example.quiz.service;

import com.example.quiz.dto.auth.AuthResponse;
import com.example.quiz.dto.auth.LoginRequest;
import com.example.quiz.dto.auth.RegisterRequest;
import com.example.quiz.dto.auth.UserDto;
import com.example.quiz.entity.User;
import com.example.quiz.entity.enums.Role;
import com.example.quiz.exception.BadRequestException;
import com.example.quiz.repository.UserRepository;
import com.example.quiz.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already in use");
        }

        Role role = request.getRole() != null ? request.getRole() : Role.ROLE_PARTICIPANT;
        if (userRepository.count() == 0) {
            role = Role.ROLE_ADMIN;
            log.info("First registered user detected: granting ROLE_ADMIN to {}", request.getUsername());
        }

        User user = User.builder()
                .username(request.getUsername().trim().toLowerCase())
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .role(role)
                .build();

        User saved = userRepository.save(user);
        log.info("Registered new user: {} with role: {}", saved.getUsername(), saved.getRole());

        String token = tokenProvider.generateTokenFromUser(saved.getId(), saved.getUsername(), saved.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(saved.getId())
                .username(saved.getUsername())
                .email(saved.getEmail())
                .fullName(saved.getFullName())
                .role(saved.getRole())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsernameOrEmail().trim().toLowerCase(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByUsernameOrEmail(
                request.getUsernameOrEmail().trim().toLowerCase(),
                request.getUsernameOrEmail().trim().toLowerCase()
        ).orElseThrow(() -> new BadRequestException("User not found"));

        String token = tokenProvider.generateToken(authentication);

        log.info("User {} logged in successfully", user.getUsername());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }

    @Transactional(readOnly = true)
    public UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
