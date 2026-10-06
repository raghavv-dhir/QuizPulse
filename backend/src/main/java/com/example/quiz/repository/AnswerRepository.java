package com.example.quiz.repository;

import com.example.quiz.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {

    Optional<Answer> findByQuestionSessionIdAndUserId(Long questionSessionId, Long userId);

    boolean existsByQuestionSessionIdAndUserId(Long questionSessionId, Long userId);

    Optional<Answer> findFirstByQuestionSessionIdAndTeamIdAndIsOfficialTeamAnswerTrue(Long questionSessionId, Long teamId);

    Optional<Answer> findFirstByQuizIdAndQuestionIdAndTeamIdAndIsOfficialTeamAnswerTrue(Long quizId, Long questionId, Long teamId);

    boolean existsByQuestionSessionIdAndTeamIdAndIsOfficialTeamAnswerTrue(Long questionSessionId, Long teamId);

    boolean existsByQuizIdAndQuestionIdAndTeamIdAndIsOfficialTeamAnswerTrue(Long quizId, Long questionId, Long teamId);

    List<Answer> findByQuestionSessionId(Long questionSessionId);

    List<Answer> findByQuizId(Long quizId);

    List<Answer> findByQuizIdAndQuestionId(Long quizId, Long questionId);

    List<Answer> findByQuizIdAndUserId(Long quizId, Long userId);

    List<Answer> findByQuizIdAndTeamId(Long quizId, Long teamId);

    long countByQuestionSessionId(Long questionSessionId);

    long countByQuestionSessionIdAndIsCorrectTrue(Long questionSessionId);

    long countByQuestionSessionIdAndIsCorrectFalse(Long questionSessionId);

    @Query("SELECT a FROM Answer a LEFT JOIN FETCH a.team WHERE a.quiz.id = :quizId AND a.isOfficialTeamAnswer = true")
    List<Answer> findOfficialTeamAnswersByQuizId(@Param("quizId") Long quizId);

    @Query("SELECT a FROM Answer a LEFT JOIN FETCH a.user WHERE a.quiz.id = :quizId AND a.team IS NULL AND a.submissionStatus = 'ACCEPTED'")
    List<Answer> findIndividualAcceptedAnswersByQuizId(@Param("quizId") Long quizId);
}
