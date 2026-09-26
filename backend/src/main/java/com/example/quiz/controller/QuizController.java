package com.example.quiz.controller;

import com.example.quiz.dto.answer.AnswerResultDto;
import com.example.quiz.dto.answer.SubmitAnswerRequest;
import com.example.quiz.dto.common.ApiResponse;
import com.example.quiz.dto.leaderboard.LeaderboardEntryDto;
import com.example.quiz.dto.leaderboard.QuizResultsDto;
import com.example.quiz.dto.quiz.QuizDetailDto;
import com.example.quiz.dto.quiz.QuizStateDto;
import com.example.quiz.dto.quiz.QuizSummaryDto;
import com.example.quiz.entity.enums.CheatingEventType;
import com.example.quiz.security.UserPrincipal;
import com.example.quiz.service.CheatingAuditService;
import com.example.quiz.service.LeaderboardService;
import com.example.quiz.service.QuizEngineService;
import com.example.quiz.service.QuizService;
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
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
@Tag(name = "Quizzes", description = "Participant quiz participation, answer submission, and live sync")
public class QuizController {

    private final QuizService quizService;
    private final QuizEngineService quizEngineService;
    private final LeaderboardService leaderboardService;
    private final CheatingAuditService cheatingAuditService;

    @GetMapping
    @Operation(summary = "List all available quizzes")
    public ResponseEntity<ApiResponse<List<QuizSummaryDto>>> getAllQuizzes() {
        List<QuizSummaryDto> quizzes = quizService.getAllQuizzes();
        return ResponseEntity.ok(ApiResponse.success(quizzes));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get detailed information about a specific quiz")
    public ResponseEntity<ApiResponse<QuizDetailDto>> getQuizById(@PathVariable Long id) {
        QuizDetailDto quiz = quizService.getQuizById(id);
        return ResponseEntity.ok(ApiResponse.success(quiz));
    }

    @PostMapping("/{id}/join")
    @Operation(summary = "Register the authenticated user as a participant for the quiz")
    public ResponseEntity<ApiResponse<String>> joinQuiz(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        quizService.registerParticipant(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Successfully registered for the quiz", null));
    }

    @PostMapping("/{id}/leave")
    @Operation(summary = "Leave the quiz waiting room / lobby")
    public ResponseEntity<ApiResponse<String>> leaveQuiz(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        quizService.leaveQuiz(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Successfully left the quiz", null));
    }

    @GetMapping("/{id}/state")
    @Operation(summary = "Get the authoritative state for reconnection (question, elapsed/remaining time, answer status)")
    public ResponseEntity<ApiResponse<QuizStateDto>> getQuizState(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        QuizStateDto state = quizEngineService.getQuizState(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(state));
    }

    @PostMapping("/{id}/questions/{questionId}/answer")
    @Operation(summary = "Submit speed-based answer. Timing and score calculated server-side.")
    public ResponseEntity<ApiResponse<AnswerResultDto>> submitAnswer(
            @PathVariable Long id,
            @PathVariable Long questionId,
            @Valid @RequestBody SubmitAnswerRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        AnswerResultDto result = quizEngineService.submitAnswer(id, questionId, principal.getId(), request.getSelectedOptionId());
        return ResponseEntity.ok(ApiResponse.success(result.getMessage(), result));
    }

    @GetMapping("/{id}/leaderboard")
    @Operation(summary = "Get the authoritative live leaderboard with deterministic tie-breaking")
    public ResponseEntity<ApiResponse<List<LeaderboardEntryDto>>> getLeaderboard(@PathVariable Long id) {
        List<LeaderboardEntryDto> leaderboard = leaderboardService.calculateLeaderboard(id);
        return ResponseEntity.ok(ApiResponse.success(leaderboard));
    }

    @GetMapping("/{id}/results")
    @Operation(summary = "Get complete end-of-quiz results and personal question breakdown")
    public ResponseEntity<ApiResponse<QuizResultsDto>> getDetailedResults(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        QuizResultsDto results = leaderboardService.getDetailedResults(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @PostMapping("/{id}/audit/cheating")
    @Operation(summary = "Audit anti-cheating violations (tab switch, window blur, fullscreen exit)")
    public ResponseEntity<ApiResponse<String>> recordCheating(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        String event = body.getOrDefault("eventType", "TAB_SWITCH");
        String details = body.getOrDefault("details", "");
        CheatingEventType eventType;
        try {
            eventType = CheatingEventType.valueOf(event.toUpperCase());
        } catch (IllegalArgumentException e) {
            eventType = CheatingEventType.TAB_SWITCH;
        }

        cheatingAuditService.recordCheatingEvent(id, principal.getId(), eventType, details);
        return ResponseEntity.ok(ApiResponse.success("Cheating event logged", null));
    }
}
