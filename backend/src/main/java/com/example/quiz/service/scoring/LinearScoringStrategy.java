package com.example.quiz.service.scoring;

import com.example.quiz.entity.Question;
import org.springframework.stereotype.Component;

@Component("linearScoringStrategy")
public class LinearScoringStrategy implements ScoringStrategy {

    @Override
    public int calculateScore(Question question, long responseTimeMillis, boolean correct) {
        if (!correct) {
            if (question.getQuiz() != null && Boolean.TRUE.equals(question.getQuiz().getNegativeMarking())) {
                return -Math.abs(question.getQuiz().getNegativePoints() != null ? question.getQuiz().getNegativePoints() : 0);
            }
            return 0;
        }

        long totalDurationMillis = question.getDurationSeconds() * 1000L;
        if (totalDurationMillis <= 0) {
            return question.getMaxScore();
        }

        if (responseTimeMillis > totalDurationMillis) {
            return 0;
        }

        long remainingTimeMillis = Math.max(0, totalDurationMillis - Math.max(0, responseTimeMillis));
        long maxScore = question.getMaxScore() != null ? question.getMaxScore() : 1000;

        // Authoritative integer calculation: (maxScore * remainingTime) / duration
        long calculated = (maxScore * remainingTimeMillis) / totalDurationMillis;

        return (int) Math.max(0, Math.min(maxScore, calculated));
    }
}
