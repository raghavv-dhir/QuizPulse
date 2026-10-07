package com.example.quiz.seed;

import com.example.quiz.entity.Question;
import com.example.quiz.entity.QuestionOption;
import com.example.quiz.entity.Quiz;
import com.example.quiz.entity.User;
import com.example.quiz.entity.enums.QuizMode;
import com.example.quiz.entity.enums.QuizStatus;
import com.example.quiz.entity.enums.Role;
import com.example.quiz.entity.enums.ScoringStrategyType;
import com.example.quiz.repository.QuestionOptionRepository;
import com.example.quiz.repository.QuestionRepository;
import com.example.quiz.repository.QuizRepository;
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
    public static final String QUIZ_DESCRIPTION = "AI & Digital Technologies Quiz | MBA Program | 20 Questions | 1 Mark Each | Suggested Time: 25 Minutes | Kaladhaara 2026 LMTSM";

    private final UserRepository userRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository optionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        List<Quiz> existingQuizzes = quizRepository.findAll().stream()
                .filter(q -> q.getTitle() != null && q.getTitle().equalsIgnoreCase(QUIZ_TITLE))
                .toList();

        Optional<Quiz> existing20Quiz = existingQuizzes.stream()
                .filter(q -> q.getQuestions() != null && q.getQuestions().size() == 20)
                .findFirst();

        if (existing20Quiz.isPresent()) {
            Quiz eq = existing20Quiz.get();
            if (eq.getDefaultQuestionDurationSeconds() == null || eq.getDefaultQuestionDurationSeconds() != 30) {
                eq.setDefaultQuestionDurationSeconds(30);
                quizRepository.save(eq);
            }
            if (eq.getQuestions() != null) {
                for (Question q : eq.getQuestions()) {
                    if (q.getDurationSeconds() == null || q.getDurationSeconds() != 30) {
                        q.setDurationSeconds(30);
                        questionRepository.save(q);
                    }
                }
            }
            log.info("Official 20-question '{}' already present in database (updated question durations to 30s). Skipping creation.", QUIZ_TITLE);
            return;
        }

        // Clean up partial versions if any
        for (Quiz oldQuiz : existingQuizzes) {
            log.info("Removing outdated version of '{}' (ID: {})", QUIZ_TITLE, oldQuiz.getId());
            try {
                quizRepository.delete(oldQuiz);
            } catch (Exception e) {
                log.warn("Could not delete old quiz ID {}: {}", oldQuiz.getId(), e.getMessage());
            }
        }

        log.info("Seeding official '{}' (20 MCQs) into database...", QUIZ_TITLE);

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
                .defaultQuestionDurationSeconds(30)
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
                        "Which statement best captures how a machine learning system differs from traditional rule-based software?",
                        "It can only run on cloud servers",
                        "It learns patterns from data instead of relying only on explicitly programmed rules",
                        "It never requires human oversight",
                        "It always produces 100% accurate outputs",
                        "2" // B
                },
                {
                        "In the context of LLMs, what is a \"token\"?",
                        "A security credential used to log in to an AI tool",
                        "A single row in a training dataset",
                        "A unit of currency for purchasing AI services",
                        "A chunk of text (a word or part of a word) that the model processes, often the basis for usage pricing",
                        "4" // D
                },
                {
                        "What is an LLM \"hallucination\"?",
                        "The model produces fluent, confident output that is factually incorrect or fabricated",
                        "The model refuses to answer a question",
                        "The model slows down because of heavy server traffic",
                        "The model translates text into a different language",
                        "1" // A
                },
                {
                        "A manager pastes a 300-page report into an LLM and notices the model overlooks details from the early pages. Which concept most likely explains this?",
                        "Overfitting",
                        "Data lineage",
                        "The context window limit",
                        "Reinforcement learning",
                        "3" // C
                },
                {
                        "A retailer wants to automatically classify thousands of customer reviews as positive, neutral or negative. Which NLP task is this?",
                        "Machine translation",
                        "Sentiment analysis",
                        "Speech synthesis",
                        "Image segmentation",
                        "2" // B
                },
                {
                        "Which of the following best describes generative AI?",
                        "Systems that only classify existing data into fixed categories",
                        "Systems that only forecast numeric values from historical data",
                        "Systems that only automate repetitive clicks in software",
                        "Systems that create new content, such as text, images or code, based on patterns learned from training data",
                        "4" // D
                },
                {
                        "An employee pastes confidential client financials into a public consumer GenAI chatbot. What is the primary risk?",
                        "The chatbot will refuse to process the data",
                        "The company's cloud bill will automatically double",
                        "Potential exposure of confidential data and breach of privacy or contractual obligations",
                        "The model will become less accurate for all other users",
                        "3" // C
                },
                {
                        "Which best describes \"vibe coding\"?",
                        "Building software by describing the desired behavior in natural language to an AI assistant and iterating on the generated code, with minimal manual coding",
                        "Writing code while listening to music to boost productivity",
                        "A formal methodology for auditing source code",
                        "Manually converting legacy code into a newer language",
                        "1" // A
                },
                {
                        "A non-technical founder ships a vibe-coded customer app straight to production without any review. What is the biggest risk?",
                        "AI-generated apps cannot be hosted on the cloud",
                        "Undetected bugs, security vulnerabilities and maintainability problems, because no one fully understands or has tested the code",
                        "AI-generated code can never be used commercially",
                        "Vibe coding cannot produce user interfaces",
                        "2" // B
                },
                {
                        "What is the main purpose of RAG (Retrieval-Augmented Generation)?",
                        "Retrain an LLM from scratch on company data every night",
                        "Compress an LLM so it can run on a mobile phone",
                        "Retrieve relevant documents at query time and give them to the LLM so answers are grounded in current, specific information",
                        "Remove the need for any data storage",
                        "3" // C
                },
                {
                        "In a typical RAG pipeline, what role does a vector database play?",
                        "It stores numerical embeddings of document chunks so semantically similar content can be retrieved quickly",
                        "It stores the LLM's trained weights",
                        "It encrypts user passwords",
                        "It writes the final answer shown to the user",
                        "1" // A
                },
                {
                        "Why is cloud computing particularly attractive for firms starting AI initiatives?",
                        "It removes the need for any data governance",
                        "It guarantees that AI models are unbiased",
                        "It requires a large upfront investment in hardware",
                        "It offers elastic, pay-as-you-go access to computing power (such as GPUs) and managed AI services",
                        "4" // D
                },
                {
                        "Which prompt is most likely to produce a useful, business-ready output?",
                        "\"Write something about our sales.\"",
                        "\"Act as a senior sales analyst. Using the Q3 figures below, summarize the three key trends for the executive team in under 150 words as bullet points.\"",
                        "\"Sales analysis please, make it good.\"",
                        "\"Tell me everything about sales.\"",
                        "2" // B
                },
                {
                        "What is \"few-shot prompting\"?",
                        "Including a small number of worked examples in the prompt to show the model the desired format or style",
                        "Limiting the model to a few seconds of response time",
                        "Fine-tuning the model on a few thousand records",
                        "Asking the same question a few times and choosing the shortest answer",
                        "1" // A
                },
                {
                        "A customer-churn model scores 99% accuracy on its training data but performs poorly on new customers. What is the most likely problem?",
                        "Underfitting",
                        "Data encryption",
                        "Overfitting",
                        "Cloud latency",
                        "3" // C
                },
                {
                        "Which of the following is an example of first-party data for a retailer?",
                        "A purchased list of consumer emails from a data broker",
                        "Purchase history and browsing behavior collected through the retailer's own app and loyalty program",
                        "Demographic data from a government census",
                        "Competitor pricing data from an external research firm",
                        "2" // B
                },
                {
                        "What is Robotic Process Automation (RPA) primarily used for?",
                        "Software bots that mimic human actions in rule-based, repetitive digital tasks such as data entry or invoice processing",
                        "Building physical robots for factory floors",
                        "Training large language models",
                        "Designing company organization charts",
                        "1" // A
                },
                {
                        "How do collaborative robots (\"cobots\") differ from traditional industrial robots?",
                        "They are purely software with no physical form",
                        "They always operate inside fully fenced-off cages",
                        "They are designed to work safely alongside human workers in shared spaces",
                        "They can only be used in the automotive industry",
                        "3" // C
                },
                {
                        "In an automated workflow tool (e.g., Zapier or Microsoft Power Automate), what is a \"trigger\"?",
                        "The final report generated at the end of the workflow",
                        "The event that starts the workflow, such as a new email or form submission",
                        "A penalty applied when a workflow fails",
                        "The manager who approves the automation budget",
                        "2" // B
                },
                {
                        "A company lets an AI agent automatically approve vendor payments. Which design choice best manages risk?",
                        "Disable activity logs to improve speed",
                        "Allow the agent to approve any amount without limits",
                        "Give the agent administrator access to all finance systems for flexibility",
                        "Add human-in-the-loop approval for high-value or unusual transactions, with audit logs and monitoring",
                        "4" // D
                }
        };

        for (int i = 0; i < mcqs.length; i++) {
            String[] data = mcqs[i];
            int correctIndex = Integer.parseInt(data[5]);

            Question question = Question.builder()
                    .quiz(quiz)
                    .questionText(data[0])
                    .questionType(com.example.quiz.entity.enums.QuestionType.MULTIPLE_CHOICE)
                    .durationSeconds(30)
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

        log.info("'{}' initialized successfully with 20 questions (Quiz ID: {}).", QUIZ_TITLE, quiz.getId());
    }
}
