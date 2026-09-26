package com.example.quiz.repository;

import com.example.quiz.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByQuizIdOrderByDisplayOrderAsc(Long quizId);
    Optional<Question> findByQuizIdAndDisplayOrder(Long quizId, Integer displayOrder);
    long countByQuizId(Long quizId);
}
