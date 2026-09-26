package com.example.quiz.dto.leaderboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntryDto implements Comparable<LeaderboardEntryDto> {
    private int rank;
    private Long id; // Team ID or User ID
    private String name; // Team Name or Participant Full Name
    private boolean isTeam;
    private int totalScore;
    private int correctAnswers;
    private int incorrectAnswers;
    private int unansweredCount;
    private long totalResponseTimeMs;
    private double averageResponseTimeMs;
    private Long lastSubmissionTimeMs;
    private List<String> memberNames;

    @Override
    public int compareTo(LeaderboardEntryDto other) {
        // Primary: Total Score DESC
        int scoreCompare = Integer.compare(other.totalScore, this.totalScore);
        if (scoreCompare != 0) return scoreCompare;

        // Secondary: Total Correct Answers DESC
        int correctCompare = Integer.compare(other.correctAnswers, this.correctAnswers);
        if (correctCompare != 0) return correctCompare;

        // Tertiary: Total Response Time ASC
        int timeCompare = Long.compare(this.totalResponseTimeMs, other.totalResponseTimeMs);
        if (timeCompare != 0) return timeCompare;

        // Fallback: Earlier last submission timestamp ASC
        long t1 = this.lastSubmissionTimeMs != null ? this.lastSubmissionTimeMs : Long.MAX_VALUE;
        long t2 = other.lastSubmissionTimeMs != null ? other.lastSubmissionTimeMs : Long.MAX_VALUE;
        return Long.compare(t1, t2);
    }
}
