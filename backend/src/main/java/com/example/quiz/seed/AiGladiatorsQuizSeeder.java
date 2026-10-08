package com.example.quiz.seed;

import com.example.quiz.entity.Question;
import com.example.quiz.entity.QuestionOption;
import com.example.quiz.entity.Quiz;
import com.example.quiz.entity.Team;
import com.example.quiz.entity.User;
import com.example.quiz.entity.enums.QuizMode;
import com.example.quiz.entity.enums.QuizStatus;
import com.example.quiz.entity.enums.Role;
import com.example.quiz.entity.enums.ScoringStrategyType;
import com.example.quiz.repository.AnswerRepository;
import com.example.quiz.repository.CheatingLogRepository;
import com.example.quiz.repository.QuestionOptionRepository;
import com.example.quiz.repository.QuestionRepository;
import com.example.quiz.repository.QuestionSessionRepository;
import com.example.quiz.repository.QuizParticipantRepository;
import com.example.quiz.repository.QuizRepository;
import com.example.quiz.repository.TeamMemberRepository;
import com.example.quiz.repository.TeamRepository;
import com.example.quiz.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@Order(11)
@RequiredArgsConstructor
@Slf4j
public class AiGladiatorsQuizSeeder implements CommandLineRunner {

    public static final String QUIZ_TITLE = "AI Gladiators - Kaladhaara 2026 LMTSM";
    public static final String QUIZ_DESCRIPTION = "AI, ML & Data Science Championship | 15 Questions | 20 Seconds Per Question | Kaladhaara 2026 LMTSM";

    private final UserRepository userRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository optionRepository;
    private final PasswordEncoder passwordEncoder;
    private final AnswerRepository answerRepository;
    private final QuestionSessionRepository questionSessionRepository;
    private final QuizParticipantRepository participantRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final CheatingLogRepository cheatingLogRepository;

    @Override
    @Transactional
    public void run(String... args) {
        List<Quiz> existingQuizzes = quizRepository.findAll().stream()
                .filter(q -> q.getTitle() != null && q.getTitle().toLowerCase().contains("gladiator"))
                .toList();

        Optional<Quiz> existing15Quiz = existingQuizzes.stream()
                .filter(q -> q.getQuestions() != null && q.getQuestions().size() == 15)
                .findFirst();

        if (existing15Quiz.isPresent()) {
            Quiz eq = existing15Quiz.get();
            boolean updated = false;
            if (eq.getDefaultQuestionDurationSeconds() == null || eq.getDefaultQuestionDurationSeconds() != 20) {
                eq.setDefaultQuestionDurationSeconds(20);
                updated = true;
            }
            if (eq.getQuestions() != null) {
                for (Question q : eq.getQuestions()) {
                    if (q.getDurationSeconds() == null || q.getDurationSeconds() != 20) {
                        q.setDurationSeconds(20);
                        questionRepository.save(q);
                    }
                }
            }
            if (updated) {
                quizRepository.save(eq);
            }
            // Clean up any remaining outdated non-15 question versions
            for (Quiz oldQuiz : existingQuizzes) {
                if (!oldQuiz.getId().equals(eq.getId())) {
                    deleteQuizData(oldQuiz);
                }
            }
            log.info("Official 15-question '{}' already present in database (duration 20s). Skipping creation.", QUIZ_TITLE);
            return;
        }

        // Clean up all existing versions (e.g. outdated 20-question versions)
        for (Quiz oldQuiz : existingQuizzes) {
            log.info("Deleting outdated version of '{}' (ID: {})", oldQuiz.getTitle(), oldQuiz.getId());
            deleteQuizData(oldQuiz);
        }

        log.info("Seeding new official '{}' (15 MCQs, 20s per question) into database...", QUIZ_TITLE);

        User admin = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ROLE_ADMIN)
                .findFirst()
                .orElseGet(() -> {
                    User newAdmin = User.builder()
                            .username("admin")
                            .email("admin@quiz.com")
                            .passwordHash(passwordEncoder.encode("Admin123!"))
                            .fullName("Kaladhaara Host")
                            .role(Role.ROLE_ADMIN)
                            .build();
                    return userRepository.save(newAdmin);
                });

        Quiz quiz = Quiz.builder()
                .title(QUIZ_TITLE)
                .description(QUIZ_DESCRIPTION)
                .mode(QuizMode.TEAM)
                .status(QuizStatus.LOBBY)
                .defaultQuestionDurationSeconds(20)
                .maxScorePerQuestion(1000)
                .scoringStrategy(ScoringStrategyType.LINEAR)
                .negativeMarking(false)
                .negativePoints(0)
                .randomizeQuestions(false)
                .randomizeOptions(false)
                .immediateFeedback(true)
                .fullscreenRequired(false)
                .allowReconnection(true)
                .currentQuestionIndex(0)
                .createdBy(admin)
                .createdAt(LocalDateTime.now())
                .build();

        quiz = quizRepository.save(quiz);

        String[][] mcqs = {
                {
                        "What does the letter \"T\" stand for in \"GPT\", the revolutionary architecture powering models like ChatGPT?",
                        "Tensor",
                        "Transformer",
                        "Transfer",
                        "Tokenizer",
                        "2" // B
                },
                {
                        "What does RAG stand for in modern generative AI systems, used to ground LLM answers in external private documents?",
                        "Recursive Automated Generation",
                        "Real-time Augmented Gradient",
                        "Retrieval-Augmented Generation",
                        "Relational Analytical Graph",
                        "3" // C
                },
                {
                        "In the context of Large Language Models, what is an AI \"hallucination\"?",
                        "The AI produces fluent, confident statements that are factually false or completely fabricated",
                        "The AI server runs out of GPU memory and abruptly restarts",
                        "The AI translates text into an ancient forgotten language",
                        "The AI deliberately pauses to simulate human thinking",
                        "1" // A
                },
                {
                        "A machine learning model achieves 99.8% accuracy on training data but performs terribly on unseen test data. What problem has occurred?",
                        "Underfitting",
                        "Overfitting",
                        "Gradient Explosion",
                        "Data Imbalance",
                        "2" // B
                },
                {
                        "Recent frontier reasoning models (such as OpenAI o1/o3 and DeepSeek R1) excel at complex logic, math, and code primarily through which technique?",
                        "Hardcoding thousands of Python if-else rules",
                        "Using \"Test-Time Compute\" and internal Chain-of-Thought reasoning before responding",
                        "Scraping search engine results in real-time",
                        "Generating completely random responses until one passes a test",
                        "2" // B
                },
                {
                        "Why do modern AI search systems and vector databases (like Pinecone, Milvus, and Chroma) convert text and media into Vector Embeddings?",
                        "To compress media files into smaller ZIP archives",
                        "To convert data into high-dimensional numerical coordinates for semantic similarity search",
                        "To scramble passwords for biometric encryption",
                        "To automatically fix syntax errors in SQL queries",
                        "2" // B
                },
                {
                        "Which machine learning paradigm learns through trial and error by taking actions in an environment to maximize cumulative rewards?",
                        "Supervised Learning",
                        "Unsupervised Clustering",
                        "Reinforcement Learning",
                        "Principal Component Analysis",
                        "3" // C
                },
                {
                        "What does RLHF stand for, the critical alignment technique used to make raw pre-trained LLMs safe, helpful, and conversational?",
                        "Reinforcement Learning from Human Feedback",
                        "Recursive Language Hyperparameter Fitting",
                        "Real-time Learning with Hardware Frameworks",
                        "Random Linear Heuristic Filtering",
                        "1" // A
                },
                {
                        "What does it mean when a modern AI model is described as \"Multimodal\"?",
                        "It runs simultaneously on Windows, macOS, and Linux",
                        "It can process and understand multiple types of input data (text, images, audio, video) within the same model",
                        "It requires multiple GPUs to boot up",
                        "It supports multi-user logins with separate accounts",
                        "2" // B
                },
                {
                        "In Large Language Models, what is the \"Context Window\"?",
                        "The physical display dimensions of the user's laptop screen",
                        "The total token capacity (prompt + output) that an attention mechanism can hold in memory at one time",
                        "The daily time period during which cloud AI APIs are free to use",
                        "The graphical pop-up window used to enter credit card details",
                        "2" // B
                },
                {
                        "In data science preprocessing, what does \"Data Imputation\" refer to?",
                        "Deleting the entire table whenever an anomaly is detected",
                        "Filling in missing or null values with estimates such as the mean, median, mode, or KNN predictions",
                        "Encrypting sensitive customer columns before sending them to the cloud",
                        "Converting numerical data into raw audio waves",
                        "2" // B
                },
                {
                        "In modern AI Agent frameworks (like CrewAI, AutoGen, and LangChain), what does \"Tool Calling\" allow an LLM to do?",
                        "Order computer hardware parts from online stores",
                        "Connect with external APIs, calculators, code interpreters, and databases to take real-world actions",
                        "Modify the host operating system BIOS automatically",
                        "Overclock the user's CPU during intensive tasks",
                        "2" // B
                },
                {
                        "Which modern generative architecture powers high-quality image generators like Midjourney, Stable Diffusion, and Flux?",
                        "Diffusion Models",
                        "K-Nearest Neighbors (KNN)",
                        "Decision Trees",
                        "Support Vector Machines (SVM)",
                        "1" // A
                },
                {
                        "When evaluating a machine learning model on highly imbalanced data (e.g., detecting rare credit card fraud where 99.9% of transactions are legitimate), which metric is LEAST reliable by itself?",
                        "Precision",
                        "Recall",
                        "F1-Score",
                        "Raw Accuracy",
                        "4" // D
                },
                {
                        "What prompt engineering technique involves providing 2 to 3 example question-answer pairs directly in the prompt before asking the model to solve a new problem?",
                        "Zero-Shot Prompting",
                        "Few-Shot Prompting",
                        "Model Quantization",
                        "Gradient Descent",
                        "2" // B
                }
        };

        for (int i = 0; i < mcqs.length; i++) {
            String[] data = mcqs[i];
            int correctIndex = Integer.parseInt(data[5]);

            Question question = Question.builder()
                    .quiz(quiz)
                    .questionText(data[0])
                    .questionType(com.example.quiz.entity.enums.QuestionType.MULTIPLE_CHOICE)
                    .durationSeconds(20)
                    .maxScore(1000)
                    .displayOrder(i + 1)
                    .build();
            question = questionRepository.save(question);

            for (int opt = 1; opt <= 4; opt++) {
                QuestionOption option = QuestionOption.builder()
                        .question(question)
                        .optionText(data[opt])
                        .isCorrect(opt == correctIndex)
                        .displayOrder(opt)
                        .build();
                optionRepository.save(option);
            }
        }

        log.info("'{}' initialized successfully with 15 questions (20s duration, Quiz ID: {}).", QUIZ_TITLE, quiz.getId());
    }

    private void deleteQuizData(Quiz quiz) {
        try {
            Long quizId = quiz.getId();
            cheatingLogRepository.deleteAll(cheatingLogRepository.findByQuizIdOrderByOccurredAtDesc(quizId));
            answerRepository.deleteAll(answerRepository.findByQuizId(quizId));
            questionSessionRepository.deleteAll(questionSessionRepository.findByQuizIdOrderByCreatedAtAsc(quizId));
            participantRepository.deleteAll(participantRepository.findByQuizIdOrderByJoinedAtAsc(quizId));
            List<Team> teams = teamRepository.findByQuizIdOrderByNameAsc(quizId);
            for (Team t : teams) {
                if (t.getMembers() != null && !t.getMembers().isEmpty()) {
                    teamMemberRepository.deleteAll(t.getMembers());
                }
            }
            teamRepository.deleteAll(teams);
            quizRepository.delete(quiz);
        } catch (Exception e) {
            log.warn("Could not delete old quiz ID {}: {}", quiz.getId(), e.getMessage());
        }
    }
}
