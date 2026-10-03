package com.example.quiz.service;

import com.example.quiz.dto.leaderboard.LeaderboardEntryDto;
import com.example.quiz.dto.leaderboard.QuestionResultDto;
import com.example.quiz.dto.leaderboard.QuizResultsDto;
import com.example.quiz.entity.*;
import com.example.quiz.entity.enums.QuizMode;
import com.example.quiz.exception.ResourceNotFoundException;
import com.example.quiz.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaderboardService {

    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final TeamRepository teamRepository;
    private final QuizParticipantRepository participantRepository;

    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> calculateLeaderboard(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));

        int totalQuestions = (int) questionRepository.countByQuizId(quizId);

        if (quiz.getMode() == QuizMode.TEAM) {
            return calculateTeamLeaderboard(quiz, totalQuestions);
        } else {
            return calculateIndividualLeaderboard(quiz, totalQuestions);
        }
    }

    private List<LeaderboardEntryDto> calculateTeamLeaderboard(Quiz quiz, int totalQuestions) {
        List<Team> teams = teamRepository.findByQuizIdWithMembersAndUsersOrderByNameAsc(quiz.getId());
        List<Answer> officialAnswers = answerRepository.findOfficialTeamAnswersByQuizId(quiz.getId());

        Map<Long, List<Answer>> answersByTeam = officialAnswers.stream()
                .filter(a -> a.getTeam() != null)
                .collect(Collectors.groupingBy(a -> a.getTeam().getId()));

        List<LeaderboardEntryDto> entries = new ArrayList<>();

        for (Team team : teams) {
            List<Answer> teamAnswers = answersByTeam.getOrDefault(team.getId(), Collections.emptyList());

            int totalScore = 0;
            int correctAnswers = 0;
            int incorrectAnswers = 0;
            long totalResponseTimeMs = 0;
            Long lastSubmissionTimeMs = null;

            for (Answer a : teamAnswers) {
                totalScore += a.getScoreAwarded();
                if (Boolean.TRUE.equals(a.getIsCorrect())) {
                    correctAnswers++;
                } else {
                    incorrectAnswers++;
                }
                totalResponseTimeMs += a.getResponseTimeMs();
                if (lastSubmissionTimeMs == null || a.getServerSubmissionTimeMs() > lastSubmissionTimeMs) {
                    lastSubmissionTimeMs = a.getServerSubmissionTimeMs();
                }
            }

            int answeredCount = correctAnswers + incorrectAnswers;
            int unansweredCount = Math.max(0, totalQuestions - answeredCount);
            double avgResponseTime = answeredCount > 0 ? (double) totalResponseTimeMs / answeredCount : 0.0;

            List<String> memberNames = team.getMembers().stream()
                    .map(m -> m.getUser().getFullName())
                    .collect(Collectors.toList());

            entries.add(LeaderboardEntryDto.builder()
                    .id(team.getId())
                    .name(team.getName())
                    .isTeam(true)
                    .totalScore(totalScore)
                    .correctAnswers(correctAnswers)
                    .incorrectAnswers(incorrectAnswers)
                    .unansweredCount(unansweredCount)
                    .totalResponseTimeMs(totalResponseTimeMs)
                    .averageResponseTimeMs(Math.round(avgResponseTime * 100.0) / 100.0)
                    .lastSubmissionTimeMs(lastSubmissionTimeMs)
                    .memberNames(memberNames)
                    .build());
        }

        // Sort using deterministic tie breaking
        Collections.sort(entries);

        // Assign ranks
        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRank(i + 1);
        }

        return entries;
    }

    private List<LeaderboardEntryDto> calculateIndividualLeaderboard(Quiz quiz, int totalQuestions) {
        List<QuizParticipant> participants = participantRepository.findByQuizIdWithUserOrderByJoinedAtAsc(quiz.getId());
        List<Answer> acceptedAnswers = answerRepository.findIndividualAcceptedAnswersByQuizId(quiz.getId());

        Map<Long, List<Answer>> answersByUser = acceptedAnswers.stream()
                .collect(Collectors.groupingBy(a -> a.getUser().getId()));

        List<LeaderboardEntryDto> entries = new ArrayList<>();

        for (QuizParticipant p : participants) {
            User user = p.getUser();
            List<Answer> userAnswers = answersByUser.getOrDefault(user.getId(), Collections.emptyList());

            int totalScore = 0;
            int correctAnswers = 0;
            int incorrectAnswers = 0;
            long totalResponseTimeMs = 0;
            Long lastSubmissionTimeMs = null;

            for (Answer a : userAnswers) {
                totalScore += a.getScoreAwarded();
                if (Boolean.TRUE.equals(a.getIsCorrect())) {
                    correctAnswers++;
                } else {
                    incorrectAnswers++;
                }
                totalResponseTimeMs += a.getResponseTimeMs();
                if (lastSubmissionTimeMs == null || a.getServerSubmissionTimeMs() > lastSubmissionTimeMs) {
                    lastSubmissionTimeMs = a.getServerSubmissionTimeMs();
                }
            }

            int answeredCount = correctAnswers + incorrectAnswers;
            int unansweredCount = Math.max(0, totalQuestions - answeredCount);
            double avgResponseTime = answeredCount > 0 ? (double) totalResponseTimeMs / answeredCount : 0.0;

            entries.add(LeaderboardEntryDto.builder()
                    .id(user.getId())
                    .name(user.getFullName())
                    .isTeam(false)
                    .totalScore(totalScore)
                    .correctAnswers(correctAnswers)
                    .incorrectAnswers(incorrectAnswers)
                    .unansweredCount(unansweredCount)
                    .totalResponseTimeMs(totalResponseTimeMs)
                    .averageResponseTimeMs(Math.round(avgResponseTime * 100.0) / 100.0)
                    .lastSubmissionTimeMs(lastSubmissionTimeMs)
                    .memberNames(Collections.singletonList(user.getFullName()))
                    .build());
        }

        // Sort using deterministic tie breaking
        Collections.sort(entries);

        // Assign ranks
        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRank(i + 1);
        }

        return entries;
    }

    @Transactional(readOnly = true)
    public QuizResultsDto getDetailedResults(Long quizId, Long userId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));

        List<LeaderboardEntryDto> leaderboard = calculateLeaderboard(quizId);
        List<Question> questions = questionRepository.findByQuizIdOrderByDisplayOrderAsc(quizId);

        // Determine if user has a team
        Optional<QuizParticipant> participantOpt = participantRepository.findByQuizIdAndUserId(quizId, userId);
        Team team = participantOpt.flatMap(p -> Optional.ofNullable(p.getTeam())).orElse(null);

        List<Answer> answers;
        if (quiz.getMode() == QuizMode.TEAM && team != null) {
            answers = answerRepository.findByQuizIdAndTeamId(quizId, team.getId()).stream()
                    .filter(Answer::getIsOfficialTeamAnswer)
                    .collect(Collectors.toList());
        } else {
            answers = answerRepository.findByQuizIdAndUserId(quizId, userId);
        }

        Map<Long, Answer> answerMap = answers.stream()
                .collect(Collectors.toMap(a -> a.getQuestion().getId(), a -> a, (k1, k2) -> k1));

        List<QuestionResultDto> questionResults = new ArrayList<>();
        int myTotalScore = 0;

        for (Question q : questions) {
            Answer a = answerMap.get(q.getId());
            String correctOptionText = q.getOptions().stream()
                    .filter(QuestionOption::getIsCorrect)
                    .map(QuestionOption::getOptionText)
                    .findFirst()
                    .orElse("N/A");

            if (a != null) {
                myTotalScore += a.getScoreAwarded();
                questionResults.add(QuestionResultDto.builder()
                        .questionId(q.getId())
                        .questionText(q.getQuestionText())
                        .displayOrder(q.getDisplayOrder())
                        .selectedOptionText(a.getSelectedOption() != null ? a.getSelectedOption().getOptionText() : "None")
                        .correctOptionText(correctOptionText)
                        .correct(Boolean.TRUE.equals(a.getIsCorrect()))
                        .responseTimeMs(a.getResponseTimeMs())
                        .scoreAwarded(a.getScoreAwarded())
                        .submittedByName(a.getUser() != null ? a.getUser().getFullName() : "Unknown")
                        .build());
            } else {
                questionResults.add(QuestionResultDto.builder()
                        .questionId(q.getId())
                        .questionText(q.getQuestionText())
                        .displayOrder(q.getDisplayOrder())
                        .selectedOptionText("No Answer")
                        .correctOptionText(correctOptionText)
                        .correct(false)
                        .responseTimeMs(0)
                        .scoreAwarded(0)
                        .submittedByName("N/A")
                        .build());
            }
        }

        Integer myRank = null;
        Long targetId = (quiz.getMode() == QuizMode.TEAM && team != null) ? team.getId() : userId;
        for (LeaderboardEntryDto entry : leaderboard) {
            if (entry.getId().equals(targetId)) {
                myRank = entry.getRank();
                myTotalScore = entry.getTotalScore();
                break;
            }
        }

        return QuizResultsDto.builder()
                .quizId(quiz.getId())
                .quizTitle(quiz.getTitle())
                .leaderboard(leaderboard)
                .myQuestionResults(questionResults)
                .myRank(myRank)
                .myTotalScore(myTotalScore)
                .build();
    }
}
