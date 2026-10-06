package com.example.quiz.service;

import com.example.quiz.entity.CheatingLog;
import com.example.quiz.entity.Quiz;
import com.example.quiz.entity.User;
import com.example.quiz.entity.enums.CheatingEventType;
import com.example.quiz.entity.enums.Role;
import com.example.quiz.exception.ResourceNotFoundException;
import com.example.quiz.repository.CheatingLogRepository;
import com.example.quiz.repository.QuizParticipantRepository;
import com.example.quiz.repository.QuizRepository;
import com.example.quiz.repository.UserRepository;
import com.example.quiz.websocket.QuizWebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CheatingAuditService {

    private final CheatingLogRepository cheatingLogRepository;
    private final QuizRepository quizRepository;
    private final UserRepository userRepository;
    private final QuizParticipantRepository participantRepository;
    private final QuizWebSocketService webSocketService;

    @Transactional
    public Map<String, Object> recordCheatingEvent(Long quizId, Long userId, CheatingEventType eventType, String details) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // Only registered participants or admins may trigger audit logs for a quiz
        if (!participantRepository.existsByQuizIdAndUserId(quizId, userId)
                && user.getRole() != Role.ROLE_ADMIN) {
            log.warn("Ignored cheating audit attempt for non-participant user: {} in quiz: {}", userId, quizId);
            return Map.of("warningCount", 0L, "disqualified", false, "message", "Ignored: non-participant");
        }

        // Sanitize and limit details to prevent log injection (CRLF) and DB exhaustion
        String sanitizedDetails = details != null ? details.replace("\r", "").replace("\n", " ").trim() : "";
        if (sanitizedDetails.length() > 500) {
            sanitizedDetails = sanitizedDetails.substring(0, 500);
        }

        CheatingLog logEntry = CheatingLog.builder()
                .quiz(quiz)
                .user(user)
                .eventType(eventType)
                .details(sanitizedDetails)
                .build();

        cheatingLogRepository.save(logEntry);
        long warningCount = cheatingLogRepository.countByQuizIdAndUserId(quizId, userId);
        boolean disqualified = false; // Warnings only, termination removed

        log.warn("Cheating event recorded: user={}, quiz={}, event={}, warnings={}, details={}",
                user.getUsername(), quiz.getTitle(), eventType, warningCount, sanitizedDetails);

        // Broadcast to quiz session so Quiz Master / Host / Room receives live telemetry
        Map<String, Object> payload = new HashMap<>();
        payload.put("quizId", quizId);
        payload.put("userId", userId);
        payload.put("username", user.getUsername());
        payload.put("fullName", user.getFullName());
        payload.put("eventType", eventType.name());
        payload.put("details", sanitizedDetails);
        payload.put("warningCount", warningCount);
        payload.put("disqualified", false);
        payload.put("timestamp", System.currentTimeMillis());

        webSocketService.broadcastQuizEvent(quizId, "PARTICIPANT_CHEATING_ALERT", payload);

        Map<String, Object> response = new HashMap<>();
        response.put("warningCount", warningCount);
        response.put("disqualified", false);
        response.put("eventType", eventType.name());
        response.put("message", "Integrity warning recorded (" + warningCount + ").");
        return response;
    }

    @Transactional(readOnly = true)
    public List<CheatingLog> getLogsForQuiz(Long quizId) {
        return cheatingLogRepository.findByQuizIdOrderByOccurredAtDesc(quizId);
    }
}
