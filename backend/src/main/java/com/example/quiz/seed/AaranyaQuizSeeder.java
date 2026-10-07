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
@Order(10)
@RequiredArgsConstructor
@Slf4j
public class AaranyaQuizSeeder implements CommandLineRunner {

    public static final String QUIZ_TITLE = "AARANYA – Sustainability & Social Responsibility Quiz";

    private final UserRepository userRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository optionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        List<Quiz> oldAaranyaQuizzes = quizRepository.findAll().stream()
                .filter(q -> q.getTitle() != null && q.getTitle().toUpperCase().contains("AARANYA"))
                .toList();

        // Check if official 22-question version is already seeded
        Optional<Quiz> existing22Quiz = oldAaranyaQuizzes.stream()
                .filter(q -> q.getQuestions() != null && q.getQuestions().size() == 22)
                .findFirst();

        if (existing22Quiz.isPresent()) {
            Quiz eq = existing22Quiz.get();
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
            log.info("Official 22-question Aaranya Sustainability Quiz already present in database (updated durations to 30s). Skipping creation.");
            return;
        }

        // Remove old/outdated Aaranya quizzes
        for (Quiz oldQuiz : oldAaranyaQuizzes) {
            log.info("Removing old Aaranya quiz (ID: {}, questions: {})",
                    oldQuiz.getId(), oldQuiz.getQuestions() != null ? oldQuiz.getQuestions().size() : 0);
            try {
                quizRepository.delete(oldQuiz);
            } catch (Exception e) {
                log.warn("Could not delete old quiz ID {}: {}", oldQuiz.getId(), e.getMessage());
            }
        }

        log.info("Seeding official AARANYA – Sustainability & Social Responsibility Quiz (22 MCQs) into database...");

        // Ensure host/admin user exists
        User admin = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ROLE_ADMIN)
                .findFirst()
                .orElseGet(() -> {
                    User newAdmin = User.builder()
                            .username("admin")
                            .email("admin@quiz.com")
                            .passwordHash(passwordEncoder.encode("Admin123!"))
                            .fullName("Aaranya Host")
                            .role(Role.ROLE_ADMIN)
                            .build();
                    return userRepository.save(newAdmin);
                });

        Quiz quiz = Quiz.builder()
                .title(QUIZ_TITLE)
                .description("AARANYA – SOCIAL RESPONSIBILITY & SUSTAINABILITY CLUB | ROLL FOR A SUSTAINABLE FUTURE – SUSTAINABILITY ESCAPE ROOM | First Round: Sustainability & Social Responsibility Quiz (22 MCQs | Suggested Duration: 15–20 Minutes | Team Size: 3–5).")
                .mode(QuizMode.TEAM)
                .status(QuizStatus.LOBBY) // Ready in lobby for teams to join and host to launch
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
                        "Which statement most accurately captures the core idea of sustainability?",
                        "Maximising present welfare despite future resource limits",
                        "Meeting present needs while protecting future generations",
                        "Preserving resources by limiting economic development",
                        "Prioritising growth before environmental concerns",
                        "2" // B
                },
                {
                        "The SDGs are best understood as:",
                        "Uniformly binding environmental standards for all countries",
                        "Global goals addressing social, economic and environmental challenges",
                        "Corporate framework for evaluating ESG performance",
                        "Replacement for national development policies",
                        "2" // B
                },
                {
                        "Which intervention follows the strongest waste-reduction principle?",
                        "Increasing recycling while maintaining high single-use consumption",
                        "Reusing products before recycling or disposal",
                        "Recycling all materials regardless of energy use",
                        "Replacing one disposable material with another recyclable one",
                        "2" // B
                },
                {
                        "Responsible consumption is best reflected by which decision?",
                        "Choosing the lowest-priced product",
                        "Choosing mainly by environmental certification",
                        "Considering need, durability, lifecycle and social impacts",
                        "Avoiding products with any environmental impact",
                        "3" // C
                },
                {
                        "Which situation most clearly demonstrates social responsibility?",
                        "Donating without assessing community needs",
                        "Creating measurable benefits for affected communities",
                        "Prioritising reputation in community initiatives",
                        "Focusing on environment while excluding affected groups",
                        "2" // B
                },
                {
                        "CSR most accurately refers to:",
                        "Corporate Sustainability Reporting",
                        "Corporate Social Responsibility",
                        "Community Sustainability Regulation",
                        "Corporate Stakeholder Resilience",
                        "2" // B
                },
                {
                        "ESG is primarily a framework for considering:",
                        "Environmental, Social and Governance factors in decisions",
                        "Economic, Sustainability and Growth factors in national development",
                        "Environmental, Safety and Growth factors in industry",
                        "Energy, Social and Green factors in consumer behaviour",
                        "1" // A
                },
                {
                        "A campus wants to reduce water consumption without reducing hygiene. Which is the strongest first intervention?",
                        "Restricting water availability across facilities",
                        "Repairing leaks and monitoring high-use points",
                        "Replacing freshwater with untreated alternative water",
                        "Reducing use without measuring water losses",
                        "2" // B
                },
                {
                        "Which option represents the most sustainable energy decision in a suitable context?",
                        "Increasing renewables while allowing avoidable energy waste",
                        "Using solar while ignoring system efficiency",
                        "Combining energy efficiency with appropriately selected renewable energy sources",
                        "Replacing every conventional energy source immediately regardless of feasibility",
                        "3" // C
                },
                {
                        "Which statement about recycling is most accurate?",
                        "Recycling eliminates environmental impact",
                        "Recycling recovers materials but does not replace waste prevention",
                        "Recycling is always better than reuse",
                        "Recycling makes product design and consumption irrelevant",
                        "2" // B
                },
                {
                        "A company incorporates environmental risks, employee welfare and governance practices into major decisions. This most directly demonstrates:",
                        "Compliance-oriented waste management",
                        "Responsible business decision-making",
                        "Promotional sustainability",
                        "Short-term operational efficiency",
                        "2" // B
                },
                {
                        "Which purchasing decision demonstrates the strongest responsible-consumption approach?",
                        "Choosing durability over a cheaper upfront option",
                        "Choosing the strongest sustainability marketing claims",
                        "Choosing highest recycled content regardless of durability",
                        "Choosing the cheapest product because it uses fewer resources",
                        "1" // A
                },
                {
                        "Why can urban tree planting contribute to sustainability?",
                        "Automatically offsetting all urban emissions",
                        "Supporting biodiversity, shade, air quality and resilience when planned well",
                        "Increasing city aesthetics as the main sustainability benefit",
                        "Guaranteeing lower water and energy use regardless of species/location",
                        "2" // B
                },
                {
                        "Which action best represents an ethical environmental choice?",
                        "Following disposal rules only when enforced",
                        "Reducing unnecessary use and managing unavoidable waste responsibly",
                        "Choosing recyclable products despite over-consumption",
                        "Moving waste where its impact is less visible",
                        "2" // B
                },
                {
                        "When two sustainable options involve different environmental and social trade-offs, which skill is most important?",
                        "Choosing the lowest immediate cost",
                        "Evaluating short- and long-term impacts across stakeholders",
                        "Choosing the strongest sustainability label",
                        "Choosing the option requiring least coordination",
                        "2" // B
                },
                {
                        "Which strategy is most consistent with reducing plastic waste at source?",
                        "Improving collection while keeping consumption unchanged",
                        "Replacing every plastic item with a disposable alternative",
                        "Reducing single-use items and using durable reusables",
                        "Increasing recycling awareness without changing purchases",
                        "3" // C
                },
                {
                        "Biodiversity refers most precisely to:",
                        "Number of species in an ecosystem only",
                        "Variety of life within species, between species and across ecosystems",
                        "Total animal and plant population in an area",
                        "Vegetation abundance relative to built infrastructure",
                        "2" // B
                },
                {
                        "Which team behaviour would most improve performance in a sustainability challenge?",
                        "Dividing tasks with minimal information sharing",
                        "Letting the most knowledgeable member decide everything",
                        "Combining expertise through communication and joint decisions",
                        "Avoiding discussion to prioritise speed",
                        "3" // C
                },
                {
                        "Why is long-term thinking essential to sustainability?",
                        "Prioritising future benefits over present needs",
                        "Because environmental and social effects may emerge or persist beyond the time of the original decision",
                        "Because short-term decisions are generally incompatible with economic growth",
                        "Because long-term outcomes can always be predicted more accurately than short-term outcomes",
                        "2" // B
                },
                {
                        "Which statement best reflects “Roll the dice. Make the choice. Save the future.”?",
                        "Sustainability mainly depends on individual choices",
                        "Choices should be assessed for wider and future impacts",
                        "Sustainability mainly depends on green technology",
                        "Individual actions matter only with government regulation",
                        "2" // B
                },
                {
                        "A programme provides scholarships to girls, improves access to quality education and reduces gender-based barriers to schooling. Which SDG combination is most directly represented?",
                        "SDG 4 · Quality Education + SDG 5 · Gender Equality",
                        "SDG 1 · No Poverty + SDG 10 · Reduced Inequalities",
                        "SDG 3 · Good Health + SDG 8 · Decent Work",
                        "SDG 5 · Gender Equality + SDG 12 · Responsible Consumption",
                        "1" // A
                },
                {
                        "Which statement best distinguishes CSR from ESG?",
                        "CSR covers social responsibility; ESG assesses environmental, social and governance factors",
                        "CSR measures environmental performance; ESG covers charity",
                        "CSR applies only to nonprofits; ESG only to listed companies",
                        "CSR and ESG are identical terms",
                        "1" // A
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

        log.info("AARANYA Quiz initialized successfully with 22 questions (Quiz ID: {}).", quiz.getId());
    }
}
