package com.example.quiz.repository;

import com.example.quiz.entity.QuestionSession;
import com.example.quiz.entity.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionSessionRepository extends JpaRepository<QuestionSession, Long> {
    Optional<QuestionSession> findFirstByQuizIdAndSessionStatusOrderByCreatedAtDesc(Long quizId, SessionStatus status);
    Optional<QuestionSession> findByQuizIdAndQuestionIdAndSessionStatus(Long quizId, Long questionId, SessionStatus status);
    List<QuestionSession> findByQuizIdOrderByCreatedAtAsc(Long quizId);
}
