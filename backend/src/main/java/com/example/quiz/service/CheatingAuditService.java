package com.example.quiz.service;

import com.example.quiz.entity.CheatingLog;
import com.example.quiz.entity.Quiz;
import com.example.quiz.entity.User;
import com.example.quiz.entity.enums.CheatingEventType;
import com.example.quiz.exception.ResourceNotFoundException;
import com.example.quiz.repository.CheatingLogRepository;
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

    @Transactional
    public void recordCheatingEvent(Long quizId, Long userId, CheatingEventType eventType, String details) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        CheatingLog logEntry = CheatingLog.builder()
                .quiz(quiz)
                .user(user)
                .eventType(eventType)
                .details(details)
                .build();

        cheatingLogRepository.save(logEntry);
        log.warn("Cheating event recorded: user={}, quiz={}, event={}, details={}",
                user.getUsername(), quiz.getTitle(), eventType, details);
    }

    @Transactional(readOnly = true)
    public List<CheatingLog> getLogsForQuiz(Long quizId) {
        return cheatingLogRepository.findByQuizIdOrderByOccurredAtDesc(quizId);
    }
}
