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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CheatingAuditService {

    private final CheatingLogRepository cheatingLogRepository;
    private final QuizRepository quizRepository;
    private final UserRepository userRepository;
    private final QuizParticipantRepository participantRepository;

    @Transactional
    public void recordCheatingEvent(Long quizId, Long userId, CheatingEventType eventType, String details) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // Only registered participants or admins may trigger audit logs for a quiz
        if (!participantRepository.existsByQuizIdAndUserId(quizId, userId)
                && user.getRole() != Role.ROLE_ADMIN) {
            log.warn("Ignored cheating audit attempt for non-participant user: {} in quiz: {}", userId, quizId);
            return;
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
        log.warn("Cheating event recorded: user={}, quiz={}, event={}, details={}",
                user.getUsername(), quiz.getTitle(), eventType, sanitizedDetails);
    }

    @Transactional(readOnly = true)
    public List<CheatingLog> getLogsForQuiz(Long quizId) {
        return cheatingLogRepository.findByQuizIdOrderByOccurredAtDesc(quizId);
    }
}
