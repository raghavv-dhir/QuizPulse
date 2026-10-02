package com.example.quiz.dto.quiz;

import com.example.quiz.dto.answer.AnswerResultDto;
import com.example.quiz.dto.leaderboard.LeaderboardEntryDto;
import com.example.quiz.dto.question.PublicQuestionDto;
import com.example.quiz.dto.team.TeamDto;
import com.example.quiz.entity.enums.QuizMode;
import com.example.quiz.entity.enums.QuizStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizStateDto {
    private Long quizId;
    private String title;
    private QuizStatus status;
    private QuizMode mode;
    private Integer currentQuestionIndex;
    private Integer totalQuestions;
    private Boolean fullscreenRequired;

    private PublicQuestionDto currentQuestion;
    private Long serverQuestionStartTimeMs;
    private Long questionDurationMs;
    private Long serverCurrentTimeMs;
    private Long remainingTimeMs;

    private boolean alreadyAnswered;
    private AnswerResultDto myAnswer;

    private Integer myScore;
    private Integer myRank;

    private TeamDto myTeam;
    private List<LeaderboardEntryDto> leaderboard;
}
