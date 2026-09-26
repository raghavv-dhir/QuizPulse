package com.example.quiz.service.scoring;

import com.example.quiz.entity.Question;
import com.example.quiz.entity.enums.ScoringStrategyType;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class ScoringEngine {

    private final ScoringStrategy linearStrategy;
    private final ScoringStrategy fixedBucketStrategy;

    public ScoringEngine(
            @Qualifier("linearScoringStrategy") ScoringStrategy linearStrategy,
            @Qualifier("fixedBucketScoringStrategy") ScoringStrategy fixedBucketStrategy) {
        this.linearStrategy = linearStrategy;
        this.fixedBucketStrategy = fixedBucketStrategy;
    }

    public int calculateScore(Question question, long responseTimeMillis, boolean correct) {
        ScoringStrategyType type = (question.getQuiz() != null && question.getQuiz().getScoringStrategy() != null)
                ? question.getQuiz().getScoringStrategy()
                : ScoringStrategyType.LINEAR;

        ScoringStrategy strategy = switch (type) {
            case FIXED_BUCKET -> fixedBucketStrategy;
            case LINEAR -> linearStrategy;
        };

        return strategy.calculateScore(question, responseTimeMillis, correct);
    }
}
