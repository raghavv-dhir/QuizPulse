package com.example.quiz.entity;

import com.example.quiz.entity.enums.QuizMode;
import com.example.quiz.entity.enums.QuizStatus;
import com.example.quiz.entity.enums.ScoringStrategyType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quizzes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QuizMode mode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private QuizStatus status;

    @Column(name = "default_question_duration_seconds", nullable = false)
    @Builder.Default
    private Integer defaultQuestionDurationSeconds = 15;

    @Column(name = "max_score_per_question", nullable = false)
    @Builder.Default
    private Integer maxScorePerQuestion = 1000;

    @Enumerated(EnumType.STRING)
    @Column(name = "scoring_strategy", nullable = false, length = 30)
    @Builder.Default
    private ScoringStrategyType scoringStrategy = ScoringStrategyType.LINEAR;

    @Column(name = "negative_marking", nullable = false)
    @Builder.Default
    private Boolean negativeMarking = false;

    @Column(name = "negative_points", nullable = false)
    @Builder.Default
    private Integer negativePoints = 0;

    @Column(name = "randomize_questions", nullable = false)
    @Builder.Default
    private Boolean randomizeQuestions = false;

    @Column(name = "randomize_options", nullable = false)
    @Builder.Default
    private Boolean randomizeOptions = false;

    @Column(name = "immediate_feedback", nullable = false)
    @Builder.Default
    private Boolean immediateFeedback = true;

    @Column(name = "fullscreen_required", nullable = false)
    @Builder.Default
    private Boolean fullscreenRequired = false;

    @Column(name = "allow_reconnection", nullable = false)
    @Builder.Default
    private Boolean allowReconnection = true;

    @Column(name = "current_question_index", nullable = false)
    @Builder.Default
    private Integer currentQuestionIndex = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<Question> questions = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = QuizStatus.DRAFT;
        }
        if (mode == null) {
            mode = QuizMode.INDIVIDUAL;
        }
        if (currentQuestionIndex == null) {
            currentQuestionIndex = 0;
        }
    }
}
