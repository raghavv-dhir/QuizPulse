package com.example.quiz.repository;

import com.example.quiz.entity.QuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionOptionRepository extends JpaRepository<QuestionOption, Long> {
    List<QuestionOption> findByQuestionIdOrderByDisplayOrderAsc(Long questionId);
    Optional<QuestionOption> findByQuestionIdAndIsCorrectTrue(Long questionId);
}
