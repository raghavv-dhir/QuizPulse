package com.example.quiz.service;

import com.example.quiz.dto.team.CreateTeamRequest;
import com.example.quiz.dto.team.TeamDto;
import com.example.quiz.dto.team.TeamMemberDto;
import com.example.quiz.entity.Quiz;
import com.example.quiz.entity.QuizParticipant;
import com.example.quiz.entity.Team;
import com.example.quiz.entity.TeamMember;
import com.example.quiz.entity.User;
import com.example.quiz.exception.BadRequestException;
import com.example.quiz.exception.ResourceNotFoundException;
import com.example.quiz.repository.QuizParticipantRepository;
import com.example.quiz.repository.QuizRepository;
import com.example.quiz.repository.TeamMemberRepository;
import com.example.quiz.repository.TeamRepository;
import com.example.quiz.repository.UserRepository;
import com.example.quiz.websocket.QuizWebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeamService {

    private static final int MAX_TEAM_MEMBERS = 4;
    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final QuizRepository quizRepository;
    private final UserRepository userRepository;
    private final QuizParticipantRepository quizParticipantRepository;
    private final QuizWebSocketService webSocketService;

    @Transactional
    public TeamDto createTeam(Long quizId, CreateTeamRequest request, Long creatorUserId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));

        String teamName = request.getName().trim();
        if (teamRepository.existsByQuizIdAndName(quizId, teamName)) {
            throw new BadRequestException("Team name already exists in this quiz: " + teamName);
        }

        String code = request.getCode() != null && !request.getCode().isBlank()
                ? request.getCode().trim().toUpperCase()
                : generateUniqueTeamCode(quizId);

        if (teamRepository.existsByQuizIdAndCode(quizId, code)) {
            throw new BadRequestException("Team code already in use: " + code);
        }

        Team team = Team.builder()
                .quiz(quiz)
                .name(teamName)
                .code(code)
                .build();

        Team savedTeam = teamRepository.save(team);

        // If creatorUserId is provided, auto-join the creator to the team
        if (creatorUserId != null) {
            User creator = userRepository.findById(creatorUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + creatorUserId));
            addMemberInternal(savedTeam, creator);
        }

        log.info("Created team '{}' (code: {}) for quiz {}", savedTeam.getName(), savedTeam.getCode(), quizId);
        TeamDto dto = mapToDto(savedTeam);
        webSocketService.broadcastQuizEvent(quizId, "TEAM_CREATED", dto);
        return dto;
    }

    @Transactional
    public TeamDto addMemberToTeam(Long teamId, Long userId) {
        return addMemberToTeam(teamId, userId, userId, true);
    }

    @Transactional
    public TeamDto addMemberToTeam(Long teamId, Long userId, Long callerUserId, boolean isAdmin) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found: " + teamId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (!isAdmin && callerUserId != null && !callerUserId.equals(userId)) {
            boolean callerIsMember = teamMemberRepository.existsByTeamIdAndUserId(teamId, callerUserId);
            if (!callerIsMember) {
                throw new BadRequestException("Unauthorized: You can only add yourself or you must be an existing team member");
            }
        }

        addMemberInternal(team, user);
        TeamDto dto = mapToDto(team);
        webSocketService.broadcastQuizEvent(team.getQuiz().getId(), "TEAM_MEMBER_JOINED", dto);
        return dto;
    }

    @Transactional
    public TeamDto joinTeamByCode(Long quizId, String code, Long userId) {
        if (code == null || code.trim().isEmpty()) {
            throw new BadRequestException("Team code is required");
        }
        Team team = teamRepository.findByQuizIdAndCode(quizId, code.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("No team found with code: " + code));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        addMemberInternal(team, user);
        TeamDto dto = mapToDto(team);
        webSocketService.broadcastQuizEvent(quizId, "TEAM_MEMBER_JOINED", dto);
        return dto;
    }

    private void addMemberInternal(Team team, User user) {
        Long quizId = team.getQuiz().getId();

        // Check if user is already in another team in this quiz
        List<Team> quizTeams = teamRepository.findByQuizIdOrderByNameAsc(quizId);
        for (Team t : quizTeams) {
            if (teamMemberRepository.existsByTeamIdAndUserId(t.getId(), user.getId())) {
                if (t.getId().equals(team.getId())) {
                    return; // Already a member of this team
                }
                throw new BadRequestException("User is already a member of team: " + t.getName());
            }
        }

        long currentCount = teamMemberRepository.countByTeamId(team.getId());
        if (currentCount >= MAX_TEAM_MEMBERS) {
            throw new BadRequestException("Team has reached the maximum allowed limit of " + MAX_TEAM_MEMBERS + " members.");
        }

        TeamMember member = TeamMember.builder()
                .team(team)
                .user(user)
                .build();
        teamMemberRepository.save(member);

        // Ensure user is also recorded in quiz_participants with this team
        QuizParticipant participant = quizParticipantRepository.findByQuizIdAndUserId(quizId, user.getId())
                .orElseGet(() -> QuizParticipant.builder()
                        .quiz(team.getQuiz())
                        .user(user)
                        .build());
        participant.setTeam(team);
        quizParticipantRepository.save(participant);

        log.info("User {} joined team {} in quiz {}", user.getUsername(), team.getName(), quizId);
    }

    @Transactional
    public void removeMemberFromTeam(Long teamId, Long userId) {
        removeMemberFromTeam(teamId, userId, userId, true);
    }

    @Transactional
    public void removeMemberFromTeam(Long teamId, Long userId, Long callerUserId, boolean isAdmin) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found: " + teamId));

        if (!isAdmin && callerUserId != null && !callerUserId.equals(userId)) {
            boolean callerIsMember = teamMemberRepository.existsByTeamIdAndUserId(teamId, callerUserId);
            if (!callerIsMember) {
                throw new BadRequestException("Unauthorized: You can only remove yourself or you must be a team member/admin");
            }
        }

        teamMemberRepository.deleteByTeamIdAndUserId(teamId, userId);

        quizParticipantRepository.findByQuizIdAndUserId(team.getQuiz().getId(), userId)
                .ifPresent(p -> {
                    p.setTeam(null);
                    quizParticipantRepository.save(p);
                });

        log.info("User {} removed from team {}", userId, team.getName());
    }

    @Transactional(readOnly = true)
    public List<TeamDto> getTeamsForQuiz(Long quizId) {
        return teamRepository.findByQuizIdOrderByNameAsc(quizId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public TeamDto mapToDto(Team team) {
        List<TeamMemberDto> members = teamMemberRepository.findByTeamId(team.getId()).stream()
                .map(m -> TeamMemberDto.builder()
                        .id(m.getId())
                        .userId(m.getUser().getId())
                        .username(m.getUser().getUsername())
                        .fullName(m.getUser().getFullName())
                        .joinedAt(m.getJoinedAt())
                        .build())
                .collect(Collectors.toList());

        return TeamDto.builder()
                .id(team.getId())
                .quizId(team.getQuiz().getId())
                .name(team.getName())
                .code(team.getCode())
                .createdAt(team.getCreatedAt())
                .members(members)
                .memberCount(members.size())
                .build();
    }

    private String generateUniqueTeamCode(Long quizId) {
        for (int i = 0; i < 20; i++) {
            StringBuilder sb = new StringBuilder(6);
            for (int j = 0; j < 6; j++) {
                sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            }
            String code = sb.toString();
            if (!teamRepository.existsByQuizIdAndCode(quizId, code)) {
                return code;
            }
        }
        return "T" + System.currentTimeMillis() % 100000;
    }
}
