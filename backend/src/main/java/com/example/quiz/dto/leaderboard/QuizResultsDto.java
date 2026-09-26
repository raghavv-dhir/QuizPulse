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
public class QuizResultsDto {
    private Long quizId;
    private String quizTitle;
    private List<LeaderboardEntryDto> leaderboard;
    private List<QuestionResultDto> myQuestionResults;
    private Integer myRank;
    private Integer myTotalScore;
}
