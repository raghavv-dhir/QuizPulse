package com.example.quiz.service;

import com.example.quiz.dto.leaderboard.LeaderboardEntryDto;
import com.example.quiz.entity.Quiz;
import com.example.quiz.exception.ResourceNotFoundException;
import com.example.quiz.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final QuizRepository quizRepository;
    private final LeaderboardService leaderboardService;

    @Transactional(readOnly = true)
    public byte[] exportResultsAsCsv(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));

        List<LeaderboardEntryDto> leaderboard = leaderboardService.calculateLeaderboard(quizId);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(out, true, StandardCharsets.UTF_8)) {
            // Write UTF-8 BOM for Excel compatibility
            out.write(0xEF);
            out.write(0xBB);
            out.write(0xBF);

            writer.println("Quiz: " + escapeCsv(quiz.getTitle()) + " (Mode: " + quiz.getMode() + ")");
            writer.println("Rank,Participant/Team,Members,Total Score,Correct,Incorrect,Unanswered,Avg Response Time (ms),Total Response Time (ms)");

            for (LeaderboardEntryDto entry : leaderboard) {
                String members = entry.getMemberNames() != null ? String.join("; ", entry.getMemberNames()) : "";
                writer.printf("%d,%s,%s,%d,%d,%d,%d,%.2f,%d%n",
                        entry.getRank(),
                        escapeCsv(entry.getName()),
                        escapeCsv(members),
                        entry.getTotalScore(),
                        entry.getCorrectAnswers(),
                        entry.getIncorrectAnswers(),
                        entry.getUnansweredCount(),
                        entry.getAverageResponseTimeMs(),
                        entry.getTotalResponseTimeMs()
                );
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate CSV export", e);
        }

        return out.toByteArray();
    }

    private String escapeCsv(String value) {
        if (value == null) return "\"\"";
        String sanitized = value;
        if (!sanitized.isEmpty() && (sanitized.startsWith("=") || sanitized.startsWith("+") || sanitized.startsWith("-") || sanitized.startsWith("@") || sanitized.startsWith("\t") || sanitized.startsWith("\r"))) {
            sanitized = "'" + sanitized;
        }
        return "\"" + sanitized.replace("\"", "\"\"") + "\"";
    }
}
