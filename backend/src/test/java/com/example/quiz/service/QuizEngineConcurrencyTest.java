package com.example.quiz.service;

import com.example.quiz.dto.answer.AnswerResultDto;
import com.example.quiz.dto.leaderboard.LeaderboardEntryDto;
import com.example.quiz.entity.*;
import com.example.quiz.entity.enums.*;
import com.example.quiz.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class QuizEngineConcurrencyTest {

    @Autowired
    private QuizEngineService quizEngineService;

    @Autowired
    private LeaderboardService leaderboardService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QuestionOptionRepository optionRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TeamMemberRepository teamMemberRepository;

    @Autowired
    private QuizParticipantRepository participantRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private QuestionSessionRepository sessionRepository;

    private Quiz quiz;
    private Question question;
    private QuestionOption correctOption;
    private QuestionOption wrongOption;
    private Team teamA;
    private User member1;
    private User member2;
    private User member3;

    @BeforeEach
    void setupTestData() {
        // Clean up
        answerRepository.deleteAll();
        sessionRepository.deleteAll();
        participantRepository.deleteAll();
        teamMemberRepository.deleteAll();
        teamRepository.deleteAll();
        optionRepository.deleteAll();
        questionRepository.deleteAll();
        quizRepository.deleteAll();
        userRepository.deleteAll();

        // Create Admin
        User admin = userRepository.save(User.builder()
                .username("testadmin")
                .email("admin@test.com")
                .passwordHash("hash")
                .fullName("Admin")
                .role(Role.ROLE_ADMIN)
                .build());

        // Create Quiz
        quiz = quizRepository.save(Quiz.builder()
                .title("Concurrency & Acceptance Test Quiz")
                .mode(QuizMode.TEAM)
                .status(QuizStatus.DRAFT)
                .defaultQuestionDurationSeconds(10)
                .maxScorePerQuestion(1000)
                .scoringStrategy(ScoringStrategyType.LINEAR)
                .createdBy(admin)
                .build());

        // Create Question: "What is the capital of France?"
        question = questionRepository.save(Question.builder()
                .quiz(quiz)
                .questionText("What is the capital of France?")
                .durationSeconds(10)
                .maxScore(1000)
                .displayOrder(1)
                .build());

        // Options: A. Berlin, B. Madrid, C. Paris (correct), D. Rome
        optionRepository.save(QuestionOption.builder().question(question).optionText("Berlin").isCorrect(false).displayOrder(1).build());
        wrongOption = optionRepository.save(QuestionOption.builder().question(question).optionText("Madrid").isCorrect(false).displayOrder(2).build());
        correctOption = optionRepository.save(QuestionOption.builder().question(question).optionText("Paris").isCorrect(true).displayOrder(3).build());
        optionRepository.save(QuestionOption.builder().question(question).optionText("Rome").isCorrect(false).displayOrder(4).build());

        // Create Team A
        teamA = teamRepository.save(Team.builder().quiz(quiz).name("Team A").code("TEAMA1").build());

        // Create Members
        member1 = userRepository.save(User.builder().username("m1").email("m1@t.com").passwordHash("h").fullName("Member 1").role(Role.ROLE_PARTICIPANT).build());
        member2 = userRepository.save(User.builder().username("m2").email("m2@t.com").passwordHash("h").fullName("Member 2").role(Role.ROLE_PARTICIPANT).build());
        member3 = userRepository.save(User.builder().username("m3").email("m3@t.com").passwordHash("h").fullName("Member 3").role(Role.ROLE_PARTICIPANT).build());

        teamMemberRepository.save(TeamMember.builder().team(teamA).user(member1).build());
        teamMemberRepository.save(TeamMember.builder().team(teamA).user(member2).build());
        teamMemberRepository.save(TeamMember.builder().team(teamA).user(member3).build());

        participantRepository.save(QuizParticipant.builder().quiz(quiz).user(member1).team(teamA).build());
        participantRepository.save(QuizParticipant.builder().quiz(quiz).user(member2).team(teamA).build());
        participantRepository.save(QuizParticipant.builder().quiz(quiz).user(member3).team(teamA).build());

        // Start Quiz
        quizEngineService.startQuiz(quiz.getId(), admin.getId());
    }

    @Test
    @DisplayName("Section 42 Acceptance Test: Member 1 answers first, subsequent teammate submissions are IGNORED_DUPLICATE")
    void testTeamSubmissionAcceptanceCriteria() {
        // Member 1 answers first
        AnswerResultDto result1 = quizEngineService.submitAnswer(quiz.getId(), question.getId(), member1.getId(), correctOption.getId());
        assertEquals(SubmissionStatus.ACCEPTED, result1.getStatus());
        assertTrue(result1.getIsOfficialTeamAnswer());
        assertTrue(result1.getScoreAwarded() > 0);

        // Member 2 answers later -> must be IGNORED_DUPLICATE with 0 points
        AnswerResultDto result2 = quizEngineService.submitAnswer(quiz.getId(), question.getId(), member2.getId(), correctOption.getId());
        assertEquals(SubmissionStatus.IGNORED_DUPLICATE, result2.getStatus());
        assertFalse(result2.getIsOfficialTeamAnswer());
        assertEquals(0, result2.getScoreAwarded());

        // Member 3 answers even later -> must also be IGNORED_DUPLICATE with 0 points
        AnswerResultDto result3 = quizEngineService.submitAnswer(quiz.getId(), question.getId(), member3.getId(), wrongOption.getId());
        assertEquals(SubmissionStatus.IGNORED_DUPLICATE, result3.getStatus());
        assertFalse(result3.getIsOfficialTeamAnswer());
        assertEquals(0, result3.getScoreAwarded());

        // Verify team only got points from the first submission
        List<Answer> answers = answerRepository.findOfficialTeamAnswersByQuizId(quiz.getId());
        assertEquals(1, answers.size(), "Only 1 official answer must exist for the team");
        assertEquals(member1.getId(), answers.get(0).getUser().getId());

        List<LeaderboardEntryDto> leaderboard = leaderboardService.calculateLeaderboard(quiz.getId());
        assertEquals(1, leaderboard.size());
        assertEquals(result1.getScoreAwarded(), leaderboard.get(0).getTotalScore());
        assertEquals(1, leaderboard.get(0).getCorrectAnswers());
    }

    @Test
    @DisplayName("High Concurrency: Simultaneous submissions by 30 threads across team members result in exactly 1 official answer")
    void testConcurrentSubmissions() throws InterruptedException {
        int threadCount = 30;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger acceptedCount = new AtomicInteger(0);
        AtomicInteger duplicateCount = new AtomicInteger(0);

        List<User> members = List.of(member1, member2, member3);

        for (int i = 0; i < threadCount; i++) {
            final User user = members.get(i % members.size());
            executor.submit(() -> {
                try {
                    startLatch.await(); // release all threads at the exact same instant
                    AnswerResultDto res = quizEngineService.submitAnswer(
                            quiz.getId(), question.getId(), user.getId(), correctOption.getId()
                    );
                    if (res.getStatus() == SubmissionStatus.ACCEPTED) {
                        acceptedCount.incrementAndGet();
                    } else if (res.getStatus() == SubmissionStatus.IGNORED_DUPLICATE) {
                        duplicateCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    // Ignored or logged
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        // Fire all threads simultaneously
        startLatch.countDown();
        assertTrue(doneLatch.await(10, TimeUnit.SECONDS));
        executor.shutdown();

        // Exactly 1 thread must be ACCEPTED, and (threadCount - 1) must be IGNORED_DUPLICATE
        assertEquals(1, acceptedCount.get(), "Exactly one submission must be ACCEPTED");
        assertEquals(threadCount - 1, duplicateCount.get(), "All other concurrent submissions must be IGNORED_DUPLICATE");

        List<Answer> officialAnswers = answerRepository.findOfficialTeamAnswersByQuizId(quiz.getId());
        assertEquals(1, officialAnswers.size(), "Database must strictly contain exactly 1 official team answer");
    }
}
