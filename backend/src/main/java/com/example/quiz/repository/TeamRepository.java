package com.example.quiz.repository;

import com.example.quiz.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByQuizIdOrderByNameAsc(Long quizId);
    Optional<Team> findByQuizIdAndCode(Long quizId, String code);
    Optional<Team> findByQuizIdAndName(Long quizId, String name);
    boolean existsByQuizIdAndName(Long quizId, String name);
    boolean existsByQuizIdAndCode(Long quizId, String code);
    long countByQuizId(Long quizId);
}
