package com.example.quiz.service;

import com.example.quiz.dto.leaderboard.LeaderboardEntryDto;
import com.example.quiz.entity.Answer;
import com.example.quiz.entity.Question;
import com.example.quiz.entity.Quiz;
import com.example.quiz.entity.enums.QuizMode;
import com.example.quiz.exception.ResourceNotFoundException;
import com.example.quiz.repository.AnswerRepository;
import com.example.quiz.repository.QuestionRepository;
import com.example.quiz.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExportService {

    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final LeaderboardService leaderboardService;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm:ss");

    @Transactional(readOnly = true)
    public byte[] exportResultsAsExcel(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));

        List<LeaderboardEntryDto> leaderboard = leaderboardService.calculateLeaderboard(quizId);
        List<Question> questions = questionRepository.findByQuizIdOrderByDisplayOrderAsc(quizId);
        List<Answer> allAnswers = answerRepository.findAllWithDetailsByQuizId(quizId);

        try (Workbook workbook = new XSSFWorkbook()) {
            CreationHelper createHelper = workbook.getCreationHelper();

            // ------------------ FONTS ------------------
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleFont.setColor(IndexedColors.ROYAL_BLUE.getIndex());

            Font subTitleFont = workbook.createFont();
            subTitleFont.setItalic(true);
            subTitleFont.setFontHeightInPoints((short) 10);
            subTitleFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());

            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setFontHeightInPoints((short) 11);

            Font boldFont = workbook.createFont();
            boldFont.setBold(true);
            boldFont.setFontHeightInPoints((short) 10);

            Font regularFont = workbook.createFont();
            regularFont.setFontHeightInPoints((short) 10);

            Font goldFont = workbook.createFont();
            goldFont.setBold(true);
            goldFont.setColor(IndexedColors.DARK_YELLOW.getIndex());

            // ------------------ CELL STYLES ------------------
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setBorders(headerStyle);

            CellStyle subHeaderStyle = workbook.createCellStyle();
            subHeaderStyle.setFont(headerFont);
            subHeaderStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            subHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            subHeaderStyle.setAlignment(HorizontalAlignment.CENTER);
            subHeaderStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setBorders(subHeaderStyle);

            // Top 3 Podium styles
            CellStyle goldRowStyle = workbook.createCellStyle();
            goldRowStyle.setFont(goldFont);
            goldRowStyle.setFillForegroundColor(IndexedColors.LEMON_CHIFFON.getIndex());
            goldRowStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            goldRowStyle.setAlignment(HorizontalAlignment.CENTER);
            setBorders(goldRowStyle);

            CellStyle goldRowLeft = workbook.createCellStyle();
            goldRowLeft.setFont(goldFont);
            goldRowLeft.setFillForegroundColor(IndexedColors.LEMON_CHIFFON.getIndex());
            goldRowLeft.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            goldRowLeft.setAlignment(HorizontalAlignment.LEFT);
            setBorders(goldRowLeft);

            CellStyle silverRowStyle = workbook.createCellStyle();
            silverRowStyle.setFont(boldFont);
            silverRowStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            silverRowStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            silverRowStyle.setAlignment(HorizontalAlignment.CENTER);
            setBorders(silverRowStyle);

            CellStyle silverRowLeft = workbook.createCellStyle();
            silverRowLeft.setFont(boldFont);
            silverRowLeft.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            silverRowLeft.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            silverRowLeft.setAlignment(HorizontalAlignment.LEFT);
            setBorders(silverRowLeft);

            CellStyle bronzeRowStyle = workbook.createCellStyle();
            bronzeRowStyle.setFont(boldFont);
            bronzeRowStyle.setFillForegroundColor(IndexedColors.TAN.getIndex());
            bronzeRowStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            bronzeRowStyle.setAlignment(HorizontalAlignment.CENTER);
            setBorders(bronzeRowStyle);

            CellStyle bronzeRowLeft = workbook.createCellStyle();
            bronzeRowLeft.setFont(boldFont);
            bronzeRowLeft.setFillForegroundColor(IndexedColors.TAN.getIndex());
            bronzeRowLeft.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            bronzeRowLeft.setAlignment(HorizontalAlignment.LEFT);
            setBorders(bronzeRowLeft);

            CellStyle centerStyle = workbook.createCellStyle();
            centerStyle.setFont(regularFont);
            centerStyle.setAlignment(HorizontalAlignment.CENTER);
            setBorders(centerStyle);

            CellStyle boldCenterStyle = workbook.createCellStyle();
            boldCenterStyle.setFont(boldFont);
            boldCenterStyle.setAlignment(HorizontalAlignment.CENTER);
            setBorders(boldCenterStyle);

            CellStyle leftStyle = workbook.createCellStyle();
            leftStyle.setFont(regularFont);
            leftStyle.setAlignment(HorizontalAlignment.LEFT);
            setBorders(leftStyle);

            CellStyle boldLeftStyle = workbook.createCellStyle();
            boldLeftStyle.setFont(boldFont);
            boldLeftStyle.setAlignment(HorizontalAlignment.LEFT);
            setBorders(boldLeftStyle);

            CellStyle rightStyle = workbook.createCellStyle();
            rightStyle.setFont(regularFont);
            rightStyle.setAlignment(HorizontalAlignment.RIGHT);
            setBorders(rightStyle);

            CellStyle boldRightStyle = workbook.createCellStyle();
            boldRightStyle.setFont(boldFont);
            boldRightStyle.setAlignment(HorizontalAlignment.RIGHT);
            setBorders(boldRightStyle);

            CellStyle greenStyle = workbook.createCellStyle();
            greenStyle.setFont(regularFont);
            greenStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
            greenStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            greenStyle.setAlignment(HorizontalAlignment.CENTER);
            setBorders(greenStyle);

            CellStyle redStyle = workbook.createCellStyle();
            redStyle.setFont(regularFont);
            redStyle.setFillForegroundColor(IndexedColors.ROSE.getIndex());
            redStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            redStyle.setAlignment(HorizontalAlignment.CENTER);
            setBorders(redStyle);

            CellStyle greyStyle = workbook.createCellStyle();
            greyStyle.setFont(regularFont);
            greyStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            greyStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            greyStyle.setAlignment(HorizontalAlignment.CENTER);
            setBorders(greyStyle);

            // =========================================================================
            // SHEET 1: 🏆 FINAL LEADERBOARD & PODIUM
            // =========================================================================
            Sheet sheet1 = workbook.createSheet("🏆 Podium & Standings");
            sheet1.setDisplayGridlines(true);

            // Title Row
            Row titleRow = sheet1.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue(quiz.getTitle());
            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);
            sheet1.addMergedRegion(new CellRangeAddress(0, 0, 0, 10));

            // Subtitle Row
            Row subTitleRow = sheet1.createRow(1);
            Cell subTitleCell = subTitleRow.createCell(0);
            String subtitle = String.format("Report Generated: %s | Mode: %s | Questions: %d | Total Teams/Participants: %d",
                    LocalDateTime.now().format(DATE_TIME_FORMATTER),
                    quiz.getMode(),
                    questions.size(),
                    leaderboard.size());
            subTitleCell.setCellValue(subtitle);
            CellStyle subStyle = workbook.createCellStyle();
            subStyle.setFont(subTitleFont);
            subTitleCell.setCellStyle(subStyle);
            sheet1.addMergedRegion(new CellRangeAddress(1, 1, 0, 10));

            // Blank Row 2

            // Table Headers (Row 3)
            String[] headers = {
                    "Rank",
                    "Award / Podium",
                    "Participant / Team Name",
                    "Team Members",
                    "Total Score",
                    "Correct",
                    "Incorrect",
                    "Unanswered",
                    "Accuracy (%)",
                    "Avg Response Time (s)",
                    "Total Response Time (s)"
            };

            Row headerRow = sheet1.createRow(3);
            headerRow.setHeightInPoints(26);
            for (int i = 0; i < headers.length; i++) {
                Cell c = headerRow.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(headerStyle);
            }

            int rowIdx = 4;
            int totalQCount = Math.max(1, questions.size());

            for (LeaderboardEntryDto entry : leaderboard) {
                Row row = sheet1.createRow(rowIdx);
                row.setHeightInPoints(20);

                int rank = entry.getRank();
                String awardBadge;
                CellStyle baseCenter = centerStyle;
                CellStyle baseLeft = leftStyle;
                CellStyle baseRight = rightStyle;

                if (rank == 1) {
                    awardBadge = "🥇 1st Place (Champion)";
                    baseCenter = goldRowStyle;
                    baseLeft = goldRowLeft;
                    baseRight = goldRowStyle;
                } else if (rank == 2) {
                    awardBadge = "🥈 2nd Place (Runner-up)";
                    baseCenter = silverRowStyle;
                    baseLeft = silverRowLeft;
                    baseRight = silverRowStyle;
                } else if (rank == 3) {
                    awardBadge = "🥉 3rd Place (2nd Runner-up)";
                    baseCenter = bronzeRowStyle;
                    baseLeft = bronzeRowLeft;
                    baseRight = bronzeRowStyle;
                } else {
                    awardBadge = "Rank #" + rank;
                }

                // Col 0: Rank
                Cell c0 = row.createCell(0);
                c0.setCellValue(rank);
                c0.setCellStyle(baseCenter);

                // Col 1: Award / Podium
                Cell c1 = row.createCell(1);
                c1.setCellValue(awardBadge);
                c1.setCellStyle(baseCenter);

                // Col 2: Name
                Cell c2 = row.createCell(2);
                c2.setCellValue(entry.getName() != null ? entry.getName() : "");
                c2.setCellStyle(baseLeft);

                // Col 3: Members
                Cell c3 = row.createCell(3);
                String members = (entry.getMemberNames() != null && !entry.getMemberNames().isEmpty())
                        ? String.join(", ", entry.getMemberNames())
                        : "-";
                c3.setCellValue(members);
                c3.setCellStyle(baseLeft);

                // Col 4: Total Score
                Cell c4 = row.createCell(4);
                c4.setCellValue(entry.getTotalScore());
                c4.setCellStyle(baseRight);

                // Col 5: Correct
                Cell c5 = row.createCell(5);
                c5.setCellValue(entry.getCorrectAnswers());
                c5.setCellStyle(baseCenter);

                // Col 6: Incorrect
                Cell c6 = row.createCell(6);
                c6.setCellValue(entry.getIncorrectAnswers());
                c6.setCellStyle(baseCenter);

                // Col 7: Unanswered
                Cell c7 = row.createCell(7);
                c7.setCellValue(entry.getUnansweredCount());
                c7.setCellStyle(baseCenter);

                // Col 8: Accuracy
                double accuracy = Math.round(((double) entry.getCorrectAnswers() / totalQCount) * 1000.0) / 10.0;
                Cell c8 = row.createCell(8);
                c8.setCellValue(accuracy + "%");
                c8.setCellStyle(baseCenter);

                // Col 9: Avg Response Time
                Cell c9 = row.createCell(9);
                double avgSec = Math.round((entry.getAverageResponseTimeMs() / 1000.0) * 100.0) / 100.0;
                c9.setCellValue(avgSec + "s");
                c9.setCellStyle(baseCenter);

                // Col 10: Total Response Time
                Cell c10 = row.createCell(10);
                double totalSec = Math.round((entry.getTotalResponseTimeMs() / 1000.0) * 10.0) / 10.0;
                c10.setCellValue(totalSec + "s");
                c10.setCellStyle(baseCenter);

                rowIdx++;
            }

            // Freeze header pane
            sheet1.createFreezePane(0, 4);

            // Auto-filter on data
            if (!leaderboard.isEmpty()) {
                sheet1.setAutoFilter(new CellRangeAddress(3, rowIdx - 1, 0, headers.length - 1));
            }

            // Auto-fit columns with safety bounds
            for (int col = 0; col < headers.length; col++) {
                sheet1.autoSizeColumn(col);
                int currentWidth = sheet1.getColumnWidth(col);
                sheet1.setColumnWidth(col, Math.min(255 * 256, Math.max(3000, currentWidth + 1400)));
            }

            // =========================================================================
            // SHEET 2: 📊 QUESTION-BY-QUESTION MATRIX
            // =========================================================================
            Sheet sheet2 = workbook.createSheet("📊 Question Matrix");
            sheet2.setDisplayGridlines(true);

            Row qHeaderRow = sheet2.createRow(0);
            qHeaderRow.setHeightInPoints(24);

            Cell qh0 = qHeaderRow.createCell(0);
            qh0.setCellValue("Rank");
            qh0.setCellStyle(subHeaderStyle);

            Cell qh1 = qHeaderRow.createCell(1);
            qh1.setCellValue("Participant / Team");
            qh1.setCellStyle(subHeaderStyle);

            for (int i = 0; i < questions.size(); i++) {
                Cell qCell = qHeaderRow.createCell(i + 2);
                qCell.setCellValue("Q" + (i + 1));
                qCell.setCellStyle(subHeaderStyle);
            }

            Cell qhTotal = qHeaderRow.createCell(questions.size() + 2);
            qhTotal.setCellValue("Total Score");
            qhTotal.setCellStyle(subHeaderStyle);

            // Index answers by (TeamId or UserId, QuestionId)
            Map<String, Answer> answerMap = new HashMap<>();
            boolean isTeamMode = quiz.getMode() == QuizMode.TEAM;
            for (Answer a : allAnswers) {
                if (a.getQuestion() == null) continue;
                String key;
                if (isTeamMode && a.getTeam() != null) {
                    if (Boolean.TRUE.equals(a.getIsOfficialTeamAnswer())) {
                        key = "team_" + a.getTeam().getId() + "_q_" + a.getQuestion().getId();
                        answerMap.put(key, a);
                    }
                } else if (!isTeamMode && a.getUser() != null) {
                    key = "user_" + a.getUser().getId() + "_q_" + a.getQuestion().getId();
                    answerMap.put(key, a);
                }
            }

            int matrixRowIdx = 1;
            for (LeaderboardEntryDto entry : leaderboard) {
                Row row = sheet2.createRow(matrixRowIdx);
                row.setHeightInPoints(19);

                Cell r0 = row.createCell(0);
                r0.setCellValue(entry.getRank());
                r0.setCellStyle(boldCenterStyle);

                Cell r1 = row.createCell(1);
                r1.setCellValue(entry.getName() != null ? entry.getName() : "");
                r1.setCellStyle(boldLeftStyle);

                for (int qi = 0; qi < questions.size(); qi++) {
                    Question question = questions.get(qi);
                    String lookupKey = (isTeamMode ? "team_" : "user_") + entry.getId() + "_q_" + question.getId();
                    Answer ans = answerMap.get(lookupKey);

                    Cell cell = row.createCell(qi + 2);
                    if (ans != null) {
                        double timeSec = Math.round((ans.getResponseTimeMs() / 1000.0) * 10.0) / 10.0;
                        if (Boolean.TRUE.equals(ans.getIsCorrect())) {
                            cell.setCellValue("✓ +" + ans.getScoreAwarded() + " (" + timeSec + "s)");
                            cell.setCellStyle(greenStyle);
                        } else {
                            cell.setCellValue("✗ 0 (" + timeSec + "s)");
                            cell.setCellStyle(redStyle);
                        }
                    } else {
                        cell.setCellValue("-");
                        cell.setCellStyle(greyStyle);
                    }
                }

                Cell rTotal = row.createCell(questions.size() + 2);
                rTotal.setCellValue(entry.getTotalScore());
                rTotal.setCellStyle(boldRightStyle);

                matrixRowIdx++;
            }

            // Freeze first 2 columns and header
            sheet2.createFreezePane(2, 1);
            sheet2.autoSizeColumn(0);
            sheet2.autoSizeColumn(1);
            sheet2.setColumnWidth(1, Math.max(6000, sheet2.getColumnWidth(1) + 1200));
            for (int qi = 0; qi < questions.size(); qi++) {
                sheet2.setColumnWidth(qi + 2, 4200);
            }
            sheet2.autoSizeColumn(questions.size() + 2);

            // =========================================================================
            // SHEET 3: 📈 EXECUTIVE SUMMARY
            // =========================================================================
            Sheet sheet3 = workbook.createSheet("📈 Executive Summary");
            sheet3.setDisplayGridlines(true);

            Row sumTitleRow = sheet3.createRow(0);
            Cell sumTitleCell = sumTitleRow.createCell(0);
            sumTitleCell.setCellValue("Executive Competition Summary & Analytics");
            sumTitleCell.setCellStyle(titleStyle);
            sheet3.addMergedRegion(new CellRangeAddress(0, 0, 0, 1));

            // Summary Key Metrics
            LeaderboardEntryDto winner = !leaderboard.isEmpty() ? leaderboard.get(0) : null;
            LeaderboardEntryDto runnerUp = leaderboard.size() > 1 ? leaderboard.get(1) : null;
            LeaderboardEntryDto secondRunnerUp = leaderboard.size() > 2 ? leaderboard.get(2) : null;

            int totalParticipants = leaderboard.size();
            int totalQuestions = questions.size();
            int totalScoreSum = leaderboard.stream().mapToInt(LeaderboardEntryDto::getTotalScore).sum();
            double avgScore = totalParticipants > 0 ? (double) totalScoreSum / totalParticipants : 0.0;
            int maxScore = leaderboard.stream().mapToInt(LeaderboardEntryDto::getTotalScore).max().orElse(0);
            int minScore = leaderboard.stream().mapToInt(LeaderboardEntryDto::getTotalScore).min().orElse(0);
            int totalCorrect = leaderboard.stream().mapToInt(LeaderboardEntryDto::getCorrectAnswers).sum();
            int totalPossibleAnswers = totalParticipants * totalQuestions;
            double overallAccuracy = totalPossibleAnswers > 0 ? (double) totalCorrect / totalPossibleAnswers * 100.0 : 0.0;

            String[][] metrics = {
                    {"Competition Title", quiz.getTitle()},
                    {"Competition Description", quiz.getDescription() != null ? quiz.getDescription() : "N/A"},
                    {"Competition Mode", quiz.getMode() == QuizMode.TEAM ? "Team Battle Mode" : "Individual Mode"},
                    {"Total Questions", String.valueOf(totalQuestions)},
                    {"Per-Question Time Limit", (quiz.getDefaultQuestionDurationSeconds() != null ? quiz.getDefaultQuestionDurationSeconds() : 30) + " seconds"},
                    {"Total Teams / Players", String.valueOf(totalParticipants)},
                    {"🥇 Champion / Winner", winner != null ? winner.getName() + " (" + winner.getTotalScore() + " pts)" : "N/A"},
                    {"🥈 2nd Place (Runner-up)", runnerUp != null ? runnerUp.getName() + " (" + runnerUp.getTotalScore() + " pts)" : "N/A"},
                    {"🥉 3rd Place", secondRunnerUp != null ? secondRunnerUp.getName() + " (" + secondRunnerUp.getTotalScore() + " pts)" : "N/A"},
                    {"Highest Score Achieved", String.valueOf(maxScore) + " pts"},
                    {"Lowest Score", String.valueOf(minScore) + " pts"},
                    {"Average Competitor Score", String.format("%.2f pts", avgScore)},
                    {"Overall Accuracy Across All Submissions", String.format("%.2f%%", overallAccuracy)},
                    {"Total Questions Correctly Solved", String.valueOf(totalCorrect)},
                    {"Export Generation Timestamp", LocalDateTime.now().format(DATE_TIME_FORMATTER)}
            };

            Row sumHeaderRow = sheet3.createRow(2);
            Cell sh1 = sumHeaderRow.createCell(0);
            sh1.setCellValue("Metric / Parameter");
            sh1.setCellStyle(headerStyle);

            Cell sh2 = sumHeaderRow.createCell(1);
            sh2.setCellValue("Value / Finding");
            sh2.setCellStyle(headerStyle);

            int sumIdx = 3;
            for (String[] m : metrics) {
                Row r = sheet3.createRow(sumIdx++);
                r.setHeightInPoints(20);

                Cell c1 = r.createCell(0);
                c1.setCellValue(m[0]);
                c1.setCellStyle(boldLeftStyle);

                Cell c2 = r.createCell(1);
                c2.setCellValue(m[1]);
                c2.setCellStyle(leftStyle);
            }

            sheet3.autoSizeColumn(0);
            sheet3.setColumnWidth(0, Math.max(8500, sheet3.getColumnWidth(0) + 1500));
            sheet3.autoSizeColumn(1);
            sheet3.setColumnWidth(1, Math.max(16000, sheet3.getColumnWidth(1) + 2000));

            // Write to output stream
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            log.info("Generated beautiful Excel export for quiz ID: {} ({} sheets, {} participants)",
                    quizId, workbook.getNumberOfSheets(), leaderboard.size());
            return out.toByteArray();

        } catch (Exception e) {
            log.error("Failed to generate Excel export for quiz ID: {}", quizId, e);
            throw new RuntimeException("Failed to generate Excel export: " + e.getMessage(), e);
        }
    }

    private void setBorders(CellStyle style) {
        style.setBorderBottom(BorderStyle.THIN);
        style.setBottomBorderColor(IndexedColors.GREY_40_PERCENT.getIndex());
        style.setBorderTop(BorderStyle.THIN);
        style.setTopBorderColor(IndexedColors.GREY_40_PERCENT.getIndex());
        style.setBorderLeft(BorderStyle.THIN);
        style.setLeftBorderColor(IndexedColors.GREY_40_PERCENT.getIndex());
        style.setBorderRight(BorderStyle.THIN);
        style.setRightBorderColor(IndexedColors.GREY_40_PERCENT.getIndex());
    }

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
