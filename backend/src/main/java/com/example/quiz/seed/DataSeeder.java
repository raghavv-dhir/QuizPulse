package com.example.quiz.seed;

import com.example.quiz.entity.*;
import com.example.quiz.entity.enums.QuizMode;
import com.example.quiz.entity.enums.QuizStatus;
import com.example.quiz.entity.enums.Role;
import com.example.quiz.entity.enums.ScoringStrategyType;
import com.example.quiz.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@ConditionalOnProperty(name = "quiz.seed.enabled", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository optionRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final QuizParticipantRepository participantRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded. Skipping DataSeeder.");
            return;
        }

        log.info("Starting DataSeeder initialization...");

        // 1. Seed Admin
        User admin = User.builder()
                .username("admin")
                .email("admin@quiz.com")
                .passwordHash(passwordEncoder.encode("Admin123!"))
                .fullName("Chief Quizmaster")
                .role(Role.ROLE_ADMIN)
                .build();
        admin = userRepository.save(admin);

        // 2. Seed 10 Participants
        List<User> participants = new ArrayList<>();
        String[] participantNames = {
                "Alice Johnson", "Bob Smith", "Charlie Brown", "Diana Prince", "Evan Wright",
                "Fiona Gallagher", "George Clark", "Hannah Abbott", "Ian Malcolm", "Julia Roberts"
        };

        for (int i = 1; i <= 10; i++) {
            User p = User.builder()
                    .username("user" + i)
                    .email("user" + i + "@quiz.com")
                    .passwordHash(passwordEncoder.encode("User123!"))
                    .fullName(participantNames[i - 1])
                    .role(Role.ROLE_PARTICIPANT)
                    .build();
            participants.add(userRepository.save(p));
        }

        // 3. Seed Sample Quiz (Team Mode, Speed-based Linear scoring)
        Quiz sampleQuiz = Quiz.builder()
                .title("Grand Technology & Science Championship 2026")
                .description("Compete in teams of 1-4 members. Answer fast to claim maximum points! Every millisecond counts.")
                .mode(QuizMode.TEAM)
                .status(QuizStatus.LOBBY) // Ready in lobby for instant testing!
                .defaultQuestionDurationSeconds(15)
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
        sampleQuiz = quizRepository.save(sampleQuiz);

        // 4. Seed 3 Teams
        Team teamAlpha = Team.builder().quiz(sampleQuiz).name("Team Alpha").code("ALPHA1").build();
        Team teamBeta = Team.builder().quiz(sampleQuiz).name("Team Beta").code("BETA02").build();
        Team teamGamma = Team.builder().quiz(sampleQuiz).name("Team Gamma").code("GAMMA3").build();

        teamAlpha = teamRepository.save(teamAlpha);
        teamBeta = teamRepository.save(teamBeta);
        teamGamma = teamRepository.save(teamGamma);

        // Assign Participants to Teams (3 in Alpha, 3 in Beta, 3 in Gamma, 1 independent)
        assignMember(teamAlpha, participants.get(0), sampleQuiz);
        assignMember(teamAlpha, participants.get(1), sampleQuiz);
        assignMember(teamAlpha, participants.get(2), sampleQuiz);

        assignMember(teamBeta, participants.get(3), sampleQuiz);
        assignMember(teamBeta, participants.get(4), sampleQuiz);
        assignMember(teamBeta, participants.get(5), sampleQuiz);

        assignMember(teamGamma, participants.get(6), sampleQuiz);
        assignMember(teamGamma, participants.get(7), sampleQuiz);
        assignMember(teamGamma, participants.get(8), sampleQuiz);

        // Participant 10 registers without team
        participantRepository.save(QuizParticipant.builder()
                .quiz(sampleQuiz)
                .user(participants.get(9))
                .build());

        // 5. Seed 10 Questions with 4 options each
        String[][] questionsData = {
                {
                        "What is the capital of France?",
                        "Berlin", "Madrid", "Paris", "Rome", "3"
                },
                {
                        "Which data structure operates on a First-In, First-Out (FIFO) basis?",
                        "Stack", "Queue", "Binary Tree", "Hash Table", "2"
                },
                {
                        "In modern computing, what does HTTP status code 404 signify?",
                        "Unauthorized", "Internal Server Error", "Forbidden", "Not Found", "4"
                },
                {
                        "What is the time complexity of searching in a balanced Binary Search Tree?",
                        "O(1)", "O(n)", "O(log n)", "O(n log n)", "3"
                },
                {
                        "Which planet in our solar system is known as the Red Planet?",
                        "Venus", "Mars", "Jupiter", "Saturn", "2"
                },
                {
                        "In Java, which keyword is used to prevent method overriding?",
                        "static", "abstract", "final", "synchronized", "3"
                },
                {
                        "Which protocol is used for bidirectional real-time communication between browser and server?",
                        "HTTP/1.0", "FTP", "WebSocket", "SMTP", "3"
                },
                {
                        "What is the speed of light in vacuum approximately?",
                        "300,000 km/s", "150,000 km/s", "1,000,000 km/s", "30,000 km/s", "1"
                },
                {
                        "In relational database management, what does ACID stand for?",
                        "Atomicity, Consistency, Isolation, Durability",
                        "Accuracy, Concurrency, Integrity, Data",
                        "Array, Cursor, Index, Definition",
                        "Access, Control, Information, Domain", "1"
                },
                {
                        "Which element is designated by the chemical symbol 'Au'?",
                        "Silver", "Iron", "Gold", "Copper", "3"
                }
        };

        for (int i = 0; i < questionsData.length; i++) {
            String[] q = questionsData[i];
            Question question = Question.builder()
                    .quiz(sampleQuiz)
                    .questionText(q[0])
                    .durationSeconds(15)
                    .maxScore(1000)
                    .displayOrder(i + 1)
                    .build();
            Question savedQuestion = questionRepository.save(question);

            int correctIdx = Integer.parseInt(q[5]);
            for (int opt = 1; opt <= 4; opt++) {
                QuestionOption option = QuestionOption.builder()
                        .question(savedQuestion)
                        .optionText(q[opt])
                        .isCorrect(opt == correctIdx)
                        .displayOrder(opt)
                        .build();
                optionRepository.save(option);
            }
        }

        log.info("DataSeeder completed successfully: 1 Admin, 10 Participants, 3 Teams, 1 Quiz, 10 Questions created.");
    }

    private void assignMember(Team team, User user, Quiz quiz) {
        teamMemberRepository.save(TeamMember.builder().team(team).user(user).build());
        participantRepository.save(QuizParticipant.builder().quiz(quiz).user(user).team(team).build());
    }
}
