package com.example.quiz.service;

import com.example.quiz.dto.leaderboard.LeaderboardEntryDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LeaderboardTieBreakingTest {

    @Test
    @DisplayName("Tie-breaking order: Score DESC -> Correct DESC -> Response Time ASC -> Submission Timestamp ASC")
    void testDeterministicTieBreaking() {
        LeaderboardEntryDto teamA = LeaderboardEntryDto.builder()
                .name("Team A")
                .totalScore(800)
                .correctAnswers(8)
                .totalResponseTimeMs(12000L)
                .lastSubmissionTimeMs(100000L)
                .build();

        LeaderboardEntryDto teamB = LeaderboardEntryDto.builder()
                .name("Team B")
                .totalScore(900) // Higher score
                .correctAnswers(7)
                .totalResponseTimeMs(15000L)
                .lastSubmissionTimeMs(100000L)
                .build();

        LeaderboardEntryDto teamC = LeaderboardEntryDto.builder()
                .name("Team C")
                .totalScore(800) // Same score as A
                .correctAnswers(9) // Higher correct count than A
                .totalResponseTimeMs(14000L)
                .lastSubmissionTimeMs(100000L)
                .build();

        LeaderboardEntryDto teamD = LeaderboardEntryDto.builder()
                .name("Team D")
                .totalScore(800) // Same score as A
                .correctAnswers(8) // Same correct as A
                .totalResponseTimeMs(10000L) // Faster than A (10s < 12s)
                .lastSubmissionTimeMs(100000L)
                .build();

        LeaderboardEntryDto teamE = LeaderboardEntryDto.builder()
                .name("Team E")
                .totalScore(800)
                .correctAnswers(8)
                .totalResponseTimeMs(12000L)
                .lastSubmissionTimeMs(95000L) // Earlier submission than A
                .build();

        List<LeaderboardEntryDto> list = new ArrayList<>(List.of(teamA, teamB, teamC, teamD, teamE));
        Collections.sort(list);

        // Expected Ranking:
        // 1. Team B (900 pts)
        // 2. Team C (800 pts, 9 correct)
        // 3. Team D (800 pts, 8 correct, 10000ms response time)
        // 4. Team E (800 pts, 8 correct, 12000ms, submitted at 95000ms)
        // 5. Team A (800 pts, 8 correct, 12000ms, submitted at 100000ms)

        assertEquals("Team B", list.get(0).getName());
        assertEquals("Team C", list.get(1).getName());
        assertEquals("Team D", list.get(2).getName());
        assertEquals("Team E", list.get(3).getName());
        assertEquals("Team A", list.get(4).getName());
    }
}
