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
        boolean alreadyExists = quizRepository.findAll().stream()
                .anyMatch(q -> q.getTitle() != null && q.getTitle().contains("AARANYA"));

        if (alreadyExists) {
            log.info("Aaranya Sustainability Quiz already present in database. Skipping creation.");
            return;
        }

        log.info("Seeding AARANYA – Sustainability & Social Responsibility Quiz into database...");

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
                .description("Roll for a Sustainable Future – Sustainability Escape Room. First Round: Sustainability & Social Responsibility Quiz (20 MCQs | Team Size: 1-4).")
                .mode(QuizMode.TEAM)
                .status(QuizStatus.LOBBY) // Ready in lobby for teams to join and host to launch
                .defaultQuestionDurationSeconds(45)
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
                        "Which of the following best describes sustainability?",
                        "Using resources without considering the future",
                        "Meeting present needs while protecting resources for future generations",
                        "Focusing only on economic growth",
                        "Avoiding all forms of development",
                        "2" // B
                },
                {
                        "What is the main purpose of the Sustainable Development Goals (SDGs)?",
                        "To guide global efforts toward social, economic and environmental development",
                        "To promote only industrial development",
                        "To increase consumption of natural resources",
                        "To replace national governments",
                        "1" // A
                },
                {
                        "Which practice directly helps reduce waste?",
                        "Single-use consumption",
                        "Throwing recyclable materials with general waste",
                        "Reusing products whenever possible",
                        "Buying more packaging",
                        "3" // C
                },
                {
                        "What does responsible consumption mean?",
                        "Buying as much as possible",
                        "Making choices that consider environmental and social impacts",
                        "Choosing products only by appearance",
                        "Avoiding all consumer products",
                        "2" // B
                },
                {
                        "Which of these is an example of social responsibility?",
                        "Ignoring community needs",
                        "Supporting actions that benefit society",
                        "Increasing unnecessary waste",
                        "Using resources without limits",
                        "2" // B
                },
                {
                        "CSR stands for:",
                        "Corporate Social Responsibility",
                        "Corporate Sustainability Regulation",
                        "Community Service Resource",
                        "Corporate Safety Requirement",
                        "1" // A
                },
                {
                        "ESG commonly refers to:",
                        "Economy, Society and Growth",
                        "Environment, Social and Governance",
                        "Energy, Sustainability and Greenery",
                        "Environment, Safety and Growth",
                        "2" // B
                },
                {
                        "Which action is most likely to conserve water?",
                        "Leaving taps running unnecessarily",
                        "Fixing leaking taps and pipes",
                        "Washing vehicles daily with excess water",
                        "Using fresh water for every cleaning task",
                        "2" // B
                },
                {
                        "Which energy choice generally has a lower environmental impact?",
                        "Solar energy",
                        "Uncontrolled fossil-fuel use",
                        "Wasting electricity",
                        "Leaving lights on continuously",
                        "1" // A
                },
                {
                        "What is the main benefit of recycling?",
                        "It increases landfill waste",
                        "It helps recover materials and reduce waste",
                        "It always eliminates pollution completely",
                        "It encourages single-use products",
                        "2" // B
                },
                {
                        "A company that considers environmental and social impacts while making business decisions is demonstrating:",
                        "Responsible business practices",
                        "Resource wastage",
                        "Unplanned consumption",
                        "Environmental neglect",
                        "1" // A
                },
                {
                        "Which is the most responsible choice when buying a product?",
                        "Choose only the most heavily packaged option",
                        "Consider durability, need and environmental impact",
                        "Buy multiple products even when unnecessary",
                        "Ignore how the product was produced",
                        "2" // B
                },
                {
                        "What is the purpose of planting and maintaining trees in urban areas?",
                        "To increase waste generation",
                        "To support green spaces and environmental quality",
                        "To reduce biodiversity",
                        "To increase resource consumption",
                        "2" // B
                },
                {
                        "Which option represents an ethical environmental choice?",
                        "Dumping waste in an open area",
                        "Disposing waste responsibly and reducing unnecessary consumption",
                        "Wasting water because it is available",
                        "Ignoring pollution from daily activities",
                        "2" // B
                },
                {
                        "Which skill is most important when making a sustainable decision?",
                        "Ignoring long-term consequences",
                        "Critical thinking about environmental and social impacts",
                        "Choosing the fastest option every time",
                        "Avoiding teamwork",
                        "2" // B
                },
                {
                        "Which of the following can help reduce plastic waste?",
                        "Carrying a reusable bottle or bag",
                        "Increasing use of disposable items",
                        "Using more plastic packaging",
                        "Throwing plastic into open spaces",
                        "1" // A
                },
                {
                        "What does biodiversity refer to?",
                        "Variety of living organisms in an area",
                        "Amount of waste in a city",
                        "Number of buildings in a region",
                        "Total energy consumed by businesses",
                        "1" // A
                },
                {
                        "Which action best demonstrates teamwork in a sustainability challenge?",
                        "One member makes every decision",
                        "Team members communicate and contribute to solving the problem",
                        "Members work against each other",
                        "Members avoid sharing information",
                        "2" // B
                },
                {
                        "Why is long-term thinking important for sustainability?",
                        "Environmental and social effects can continue beyond the immediate decision",
                        "It makes every decision slower",
                        "It removes the need for responsible choices",
                        "It focuses only on short-term profit",
                        "1" // A
                },
                {
                        "Which statement best reflects the theme 'Roll the dice. Make the choice. Save the future.'?",
                        "Every decision can have consequences for the future",
                        "Sustainability depends only on luck",
                        "Individual choices have no environmental impact",
                        "Sustainable decisions are unnecessary",
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
                    .durationSeconds(45)
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

        log.info("AARANYA Quiz initialized successfully with 20 questions (Quiz ID: {}).", quiz.getId());
    }
}
