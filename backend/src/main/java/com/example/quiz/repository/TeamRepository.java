package com.example.quiz.repository;

import com.example.quiz.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByQuizIdOrderByNameAsc(Long quizId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT t FROM Team t LEFT JOIN FETCH t.members m LEFT JOIN FETCH m.user WHERE t.quiz.id = :quizId ORDER BY t.name ASC")
    List<Team> findByQuizIdWithMembersAndUsersOrderByNameAsc(@org.springframework.data.repository.query.Param("quizId") Long quizId);
    Optional<Team> findByQuizIdAndCode(Long quizId, String code);
    Optional<Team> findByQuizIdAndName(Long quizId, String name);
    boolean existsByQuizIdAndName(Long quizId, String name);
    boolean existsByQuizIdAndCode(Long quizId, String code);
    long countByQuizId(Long quizId);
}
