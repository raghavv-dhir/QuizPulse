package com.example.quiz.service;

import com.example.quiz.dto.user.CreateUserAdminRequest;
import com.example.quiz.dto.user.UpdateUserAdminRequest;
import com.example.quiz.dto.user.UserAdminDto;
import com.example.quiz.dto.user.UserStatsDto;
import com.example.quiz.entity.User;
import com.example.quiz.entity.enums.Role;
import com.example.quiz.exception.BadRequestException;
import com.example.quiz.exception.ResourceNotFoundException;
import com.example.quiz.repository.QuizRepository;
import com.example.quiz.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminUserService {

    private final UserRepository userRepository;
    private final QuizRepository quizRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserAdminDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserStatsDto getUserStats() {
        List<User> users = userRepository.findAll();
        long admins = users.stream().filter(u -> u.getRole() == Role.ROLE_ADMIN).count();
        long participants = users.stream().filter(u -> u.getRole() == Role.ROLE_PARTICIPANT).count();
        long totalQuizzes = quizRepository.count();

        return UserStatsDto.builder()
                .totalUsers(users.size())
                .totalAdmins(admins)
                .totalParticipants(participants)
                .totalQuizzes(totalQuizzes)
                .build();
    }

    @Transactional
    public UserAdminDto createUser(CreateUserAdminRequest request) {
        String cleanUsername = request.getUsername().trim().toLowerCase();
        String cleanEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsername(cleanUsername)) {
            throw new BadRequestException("Username already taken: " + request.getUsername());
        }
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new BadRequestException("Email already taken: " + request.getEmail());
        }

        Role role = request.getRole() != null ? request.getRole() : Role.ROLE_PARTICIPANT;

        User user = User.builder()
                .username(cleanUsername)
                .email(cleanEmail)
                .fullName(request.getFullName().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .createdAt(LocalDateTime.now())
                .build();

        User saved = userRepository.save(user);
        log.info("Admin created new user: {}", saved.getUsername());
        return mapToDto(saved);
    }

    @Transactional
    public UserAdminDto updateUser(Long userId, UpdateUserAdminRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        String newEmail = request.getEmail().trim().toLowerCase();
        if (!user.getEmail().equalsIgnoreCase(newEmail) && userRepository.existsByEmail(newEmail)) {
            throw new BadRequestException("Email already taken by another account: " + newEmail);
        }

        user.setEmail(newEmail);
        user.setFullName(request.getFullName().trim());
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            if (request.getNewPassword().trim().length() < 6) {
                throw new BadRequestException("New password must be at least 6 characters long");
            }
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword().trim()));
            log.info("Admin reset password for user: {}", user.getUsername());
        }

        User updated = userRepository.save(user);
        return mapToDto(updated);
    }

    @Transactional
    public void deleteUser(Long userId, Long currentAdminId) {
        if (userId.equals(currentAdminId)) {
            throw new BadRequestException("You cannot delete your own admin account while logged in");
        }
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found: " + userId);
        }
        userRepository.deleteById(userId);
        log.info("Admin {} deleted user {}", currentAdminId, userId);
    }

    private UserAdminDto mapToDto(User user) {
        return UserAdminDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
