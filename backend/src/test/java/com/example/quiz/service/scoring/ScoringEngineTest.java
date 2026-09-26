package com.example.quiz.service.scoring;

import com.example.quiz.entity.Question;
import com.example.quiz.entity.Quiz;
import com.example.quiz.entity.enums.ScoringStrategyType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ScoringEngineTest {

    private ScoringEngine scoringEngine;
    private Question question;
    private Quiz quiz;

    @BeforeEach
    void setUp() {
        LinearScoringStrategy linear = new LinearScoringStrategy();
        FixedBucketScoringStrategy fixed = new FixedBucketScoringStrategy();
        scoringEngine = new ScoringEngine(linear, fixed);

        quiz = Quiz.builder()
                .scoringStrategy(ScoringStrategyType.LINEAR)
                .negativeMarking(false)
                .build();

        question = Question.builder()
                .quiz(quiz)
                .maxScore(1000)
                .durationSeconds(10)
                .build();
    }

    @Test
    @DisplayName("Linear Scoring: Response times exactly match prompt specification")
    void testLinearScoringPromptExamples() {
        // 0 sec -> 1000
        assertEquals(1000, scoringEngine.calculateScore(question, 0L, true));

        // 1 sec -> 900
        assertEquals(900, scoringEngine.calculateScore(question, 1000L, true));

        // 2 sec -> 800
        assertEquals(800, scoringEngine.calculateScore(question, 2000L, true));

        // 5 sec -> 500
        assertEquals(500, scoringEngine.calculateScore(question, 5000L, true));

        // 7 sec -> 300
        assertEquals(300, scoringEngine.calculateScore(question, 7000L, true));

        // 9 sec -> 100
        assertEquals(100, scoringEngine.calculateScore(question, 9000L, true));

        // 10 sec -> 0
        assertEquals(0, scoringEngine.calculateScore(question, 10000L, true));

        // > 10 sec -> 0
        assertEquals(0, scoringEngine.calculateScore(question, 10500L, true));
    }

    @Test
    @DisplayName("Millisecond precision: 3724ms on 10000ms duration with 1000 max points yields 627")
    void testMillisecondPrecision() {
        // From prompt section 30:
        // questionDuration = 10000 ms, answerTime = 3724 ms, remainingTime = 6276 ms
        // score = 1000 * 6276 / 10000 = 627.6 -> rounds to 627
        assertEquals(627, scoringEngine.calculateScore(question, 3724L, true));
    }

    @Test
    @DisplayName("Incorrect answer always awards 0 points (or negative if configured)")
    void testIncorrectAnswer() {
        assertEquals(0, scoringEngine.calculateScore(question, 1000L, false));

        // With negative marking
        quiz.setNegativeMarking(true);
        quiz.setNegativePoints(250);
        assertEquals(-250, scoringEngine.calculateScore(question, 1000L, false));
    }

    @Test
    @DisplayName("Fixed Bucket Scoring partitions time into buckets")
    void testFixedBucketScoring() {
        quiz.setScoringStrategy(ScoringStrategyType.FIXED_BUCKET);

        // 0-1 sec (0-10%) -> 1000
        assertEquals(1000, scoringEngine.calculateScore(question, 500L, true));

        // 1-2 sec (10-20%) -> 900
        assertEquals(900, scoringEngine.calculateScore(question, 1500L, true));

        // 7-8 sec (70-80%) -> 300
        assertEquals(300, scoringEngine.calculateScore(question, 7500L, true));
    }
}
