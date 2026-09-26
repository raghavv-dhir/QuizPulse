package com.example.quiz.controller;

import com.example.quiz.dto.common.ApiResponse;
import com.example.quiz.dto.question.CreateQuestionRequest;
import com.example.quiz.dto.question.QuestionDto;
import com.example.quiz.service.QuestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Questions", description = "Question management for quizzes")
public class QuestionController {

    private final QuestionService questionService;

    @GetMapping("/api/quizzes/{quizId}/questions")
    @Operation(summary = "Get list of questions for a quiz")
    public ResponseEntity<ApiResponse<List<QuestionDto>>> getQuestions(@PathVariable Long quizId) {
        List<QuestionDto> questions = questionService.getQuestionsForQuiz(quizId);
        return ResponseEntity.ok(ApiResponse.success(questions));
    }

    @PostMapping("/api/admin/quizzes/{quizId}/questions")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add a question with multiple-choice options to a quiz")
    public ResponseEntity<ApiResponse<QuestionDto>> addQuestion(
            @PathVariable Long quizId,
            @Valid @RequestBody CreateQuestionRequest request) {
        QuestionDto question = questionService.addQuestion(quizId, request);
        return ResponseEntity.ok(ApiResponse.success("Question added successfully", question));
    }

    @PutMapping("/api/admin/questions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update an existing question and its options")
    public ResponseEntity<ApiResponse<QuestionDto>> updateQuestion(
            @PathVariable Long id,
            @Valid @RequestBody CreateQuestionRequest request) {
        QuestionDto question = questionService.updateQuestion(id, request);
        return ResponseEntity.ok(ApiResponse.success("Question updated successfully", question));
    }

    @DeleteMapping("/api/admin/questions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a question")
    public ResponseEntity<ApiResponse<String>> deleteQuestion(@PathVariable Long id) {
        questionService.deleteQuestion(id);
        return ResponseEntity.ok(ApiResponse.success("Question deleted successfully", null));
    }
}
