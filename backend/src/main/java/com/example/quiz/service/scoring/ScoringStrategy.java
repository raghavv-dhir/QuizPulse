package com.example.quiz.service.scoring;

import com.example.quiz.entity.Question;

public interface ScoringStrategy {

    int calculateScore(
            Question question,
            long responseTimeMillis,
            boolean correct
    );
}
