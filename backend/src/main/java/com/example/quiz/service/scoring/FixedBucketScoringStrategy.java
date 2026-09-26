package com.example.quiz.service.scoring;

import com.example.quiz.entity.Question;
import org.springframework.stereotype.Component;

@Component("fixedBucketScoringStrategy")
public class FixedBucketScoringStrategy implements ScoringStrategy {

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

        long maxScore = question.getMaxScore() != null ? question.getMaxScore() : 1000;

        // Partition into 10 equal buckets:
        // 0 to 1/10 duration -> 100%
        // 1/10 to 2/10 -> 90%
        // ...
        // 9/10 to 10/10 -> 10%
        long bucketIndex = (responseTimeMillis * 10) / totalDurationMillis;
        if (bucketIndex >= 10) {
            bucketIndex = 9;
        }

        double multiplier = (10 - bucketIndex) / 10.0;
        long calculated = (long) Math.floor(maxScore * multiplier);

        return (int) Math.max(0, Math.min(maxScore, calculated));
    }
}
