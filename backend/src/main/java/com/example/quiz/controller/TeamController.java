package com.example.quiz.controller;

import com.example.quiz.dto.common.ApiResponse;
import com.example.quiz.dto.team.AddMemberRequest;
import com.example.quiz.dto.team.CreateTeamRequest;
import com.example.quiz.dto.team.TeamDto;
import com.example.quiz.security.UserPrincipal;
import com.example.quiz.service.TeamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Teams", description = "Team management, registration, and membership")
public class TeamController {

    private final TeamService teamService;

    @GetMapping("/api/quizzes/{quizId}/teams")
    @Operation(summary = "Get all teams participating in a quiz")
    public ResponseEntity<ApiResponse<List<TeamDto>>> getTeamsForQuiz(@PathVariable Long quizId) {
        List<TeamDto> teams = teamService.getTeamsForQuiz(quizId);
        return ResponseEntity.ok(ApiResponse.success(teams));
    }

    @PostMapping("/api/quizzes/{quizId}/teams")
    @Operation(summary = "Create a new team for a quiz (creator is auto-joined)")
    public ResponseEntity<ApiResponse<TeamDto>> createTeam(
            @PathVariable Long quizId,
            @Valid @RequestBody CreateTeamRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        TeamDto team = teamService.createTeam(quizId, request, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Team created successfully", team));
    }

    @PostMapping("/api/quizzes/{quizId}/teams/join")
    @Operation(summary = "Join a team using a 6-character team join code")
    public ResponseEntity<ApiResponse<TeamDto>> joinTeamByCode(
            @PathVariable Long quizId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        String code = body.get("code");
        TeamDto team = teamService.joinTeamByCode(quizId, code, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Successfully joined team: " + team.getName(), team));
    }

    @PostMapping("/api/teams/{teamId}/members")
    @Operation(summary = "Add a specific user to a team (Admin/Captain)")
    public ResponseEntity<ApiResponse<TeamDto>> addMember(
            @PathVariable Long teamId,
            @Valid @RequestBody AddMemberRequest request) {
        TeamDto team = teamService.addMemberToTeam(teamId, request.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Member added to team", team));
    }

    @DeleteMapping("/api/teams/{teamId}/members/{userId}")
    @Operation(summary = "Remove a user from a team")
    public ResponseEntity<ApiResponse<String>> removeMember(
            @PathVariable Long teamId,
            @PathVariable Long userId) {
        teamService.removeMemberFromTeam(teamId, userId);
        return ResponseEntity.ok(ApiResponse.success("Member removed from team", null));
    }
}
