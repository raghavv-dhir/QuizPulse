package com.example.quiz.repository;

import com.example.quiz.entity.Quiz;
import com.example.quiz.entity.enums.QuizStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByCreatedByIdOrderByCreatedAtDesc(Long createdById);
    List<Quiz> findByStatusInOrderByCreatedAtDesc(List<QuizStatus> statuses);
    List<Quiz> findAllByOrderByCreatedAtDesc();
}
