package com.example.quiz.controller;

import com.example.quiz.dto.common.ApiResponse;
import com.example.quiz.dto.user.CreateUserAdminRequest;
import com.example.quiz.dto.user.UpdateUserAdminRequest;
import com.example.quiz.dto.user.UserAdminDto;
import com.example.quiz.dto.user.UserStatsDto;
import com.example.quiz.security.UserPrincipal;
import com.example.quiz.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin User Management", description = "CRUD operations on users and user platform statistics")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    @Operation(summary = "Get all registered users")
    public ResponseEntity<ApiResponse<List<UserAdminDto>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(adminUserService.getAllUsers()));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get platform-wide user statistics")
    public ResponseEntity<ApiResponse<UserStatsDto>> getUserStats() {
        return ResponseEntity.ok(ApiResponse.success(adminUserService.getUserStats()));
    }

    @PostMapping
    @Operation(summary = "Create a new user")
    public ResponseEntity<ApiResponse<UserAdminDto>> createUser(@Valid @RequestBody CreateUserAdminRequest request) {
        UserAdminDto created = adminUserService.createUser(request);
        return ResponseEntity.ok(ApiResponse.success("User created successfully", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user details or password")
    public ResponseEntity<ApiResponse<UserAdminDto>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserAdminRequest request) {
        UserAdminDto updated = adminUserService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a user")
    public ResponseEntity<ApiResponse<String>> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        adminUserService.deleteUser(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }
}
