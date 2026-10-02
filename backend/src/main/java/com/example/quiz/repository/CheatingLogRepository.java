package com.example.quiz.repository;

import com.example.quiz.entity.CheatingLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CheatingLogRepository extends JpaRepository<CheatingLog, Long> {
    List<CheatingLog> findByQuizIdOrderByOccurredAtDesc(Long quizId);
    List<CheatingLog> findByQuizIdAndUserId(Long quizId, Long userId);
    long countByQuizId(Long quizId);
    long countByQuizIdAndUserId(Long quizId, Long userId);
}
