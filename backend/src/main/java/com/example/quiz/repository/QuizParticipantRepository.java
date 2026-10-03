package com.example.quiz.repository;

import com.example.quiz.entity.QuizParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizParticipantRepository extends JpaRepository<QuizParticipant, Long> {
    List<QuizParticipant> findByQuizIdOrderByJoinedAtAsc(Long quizId);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM QuizParticipant p LEFT JOIN FETCH p.user WHERE p.quiz.id = :quizId ORDER BY p.joinedAt ASC")
    List<QuizParticipant> findByQuizIdWithUserOrderByJoinedAtAsc(@org.springframework.data.repository.query.Param("quizId") Long quizId);
    Optional<QuizParticipant> findByQuizIdAndUserId(Long quizId, Long userId);
    boolean existsByQuizIdAndUserId(Long quizId, Long userId);
    long countByQuizId(Long quizId);
    List<QuizParticipant> findByTeamId(Long teamId);
    void deleteByQuizIdAndUserId(Long quizId, Long userId);
}
