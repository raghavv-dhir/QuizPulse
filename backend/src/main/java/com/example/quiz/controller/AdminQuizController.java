package com.example.quiz.controller;

import com.example.quiz.dto.common.ApiResponse;
import com.example.quiz.dto.quiz.CreateQuizRequest;
import com.example.quiz.dto.quiz.QuizDetailDto;
import com.example.quiz.dto.quiz.UpdateQuizRequest;
import com.example.quiz.entity.CheatingLog;
import com.example.quiz.security.UserPrincipal;
import com.example.quiz.service.CheatingAuditService;
import com.example.quiz.service.ExportService;
import com.example.quiz.service.QuizEngineService;
import com.example.quiz.service.QuizService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/quizzes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Quiz Management", description = "Endpoints for Quiz Master to create, manage, control, and export quizzes")
public class AdminQuizController {

    private final QuizService quizService;
    private final QuizEngineService quizEngineService;
    private final ExportService exportService;
    private final CheatingAuditService cheatingAuditService;

    @PostMapping
    @Operation(summary = "Create a new quiz (Team or Individual)")
    public ResponseEntity<ApiResponse<QuizDetailDto>> createQuiz(
            @Valid @RequestBody CreateQuizRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        QuizDetailDto quiz = quizService.createQuiz(request, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Quiz created successfully", quiz));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing quiz")
    public ResponseEntity<ApiResponse<QuizDetailDto>> updateQuiz(
            @PathVariable Long id,
            @Valid @RequestBody UpdateQuizRequest request) {
        QuizDetailDto quiz = quizService.updateQuiz(id, request);
        return ResponseEntity.ok(ApiResponse.success("Quiz updated successfully", quiz));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a quiz")
    public ResponseEntity<ApiResponse<String>> deleteQuiz(@PathVariable Long id) {
        quizService.deleteQuiz(id);
        return ResponseEntity.ok(ApiResponse.success("Quiz deleted successfully", null));
    }

    @PostMapping("/{id}/open-registration")
    @Operation(summary = "Open participant and team registration for the quiz")
    public ResponseEntity<ApiResponse<String>> openRegistration(@PathVariable Long id) {
        quizEngineService.openRegistration(id);
        return ResponseEntity.ok(ApiResponse.success("Registration opened", null));
    }

    @PostMapping("/{id}/open-lobby")
    @Operation(summary = "Open the lobby for registered participants")
    public ResponseEntity<ApiResponse<String>> openLobby(@PathVariable Long id) {
        quizEngineService.openLobby(id);
        return ResponseEntity.ok(ApiResponse.success("Lobby opened", null));
    }

    @PostMapping("/{id}/start")
    @Operation(summary = "Start the quiz and broadcast first question")
    public ResponseEntity<ApiResponse<String>> startQuiz(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        quizEngineService.startQuiz(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Quiz started", null));
    }

    @PostMapping("/{id}/next-question")
    @Operation(summary = "Advance to the next question")
    public ResponseEntity<ApiResponse<String>> nextQuestion(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        quizEngineService.startNextQuestion(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Advanced to next question", null));
    }

    @PostMapping("/{id}/end-question")
    @Operation(summary = "End the currently active question and reveal correct answer and stats")
    public ResponseEntity<ApiResponse<String>> endQuestion(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        quizEngineService.endCurrentQuestion(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Question ended", null));
    }

    @PostMapping("/{id}/pause")
    @Operation(summary = "Pause the running quiz")
    public ResponseEntity<ApiResponse<String>> pauseQuiz(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        quizEngineService.pauseQuiz(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Quiz paused", null));
    }

    @PostMapping("/{id}/resume")
    @Operation(summary = "Resume a paused quiz")
    public ResponseEntity<ApiResponse<String>> resumeQuiz(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        quizEngineService.resumeQuiz(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Quiz resumed", null));
    }

    @PostMapping("/{id}/finish")
    @Operation(summary = "End the quiz and compute final results")
    public ResponseEntity<ApiResponse<String>> finishQuiz(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        quizEngineService.finishQuiz(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Quiz finished", null));
    }

    @GetMapping(value = "/{id}/export", produces = "text/csv")
    @Operation(summary = "Export authoritative quiz rankings as CSV")
    public ResponseEntity<byte[]> exportResults(@PathVariable Long id) {
        byte[] csvData = exportService.exportResultsAsCsv(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"quiz_" + id + "_results.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }

    @GetMapping("/{id}/audit/logs")
    @Operation(summary = "View security audit and anti-cheating logs for this quiz")
    public ResponseEntity<ApiResponse<List<CheatingLog>>> getCheatingLogs(@PathVariable Long id) {
        List<CheatingLog> logs = cheatingAuditService.getLogsForQuiz(id);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }
}
