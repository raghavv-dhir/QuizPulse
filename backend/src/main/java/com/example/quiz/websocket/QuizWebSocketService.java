package com.example.quiz.websocket;

import com.example.quiz.websocket.dto.QuizEventMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastQuizEvent(Long quizId, String eventType, Object payload) {
        QuizEventMessage message = QuizEventMessage.builder()
                .eventType(eventType)
                .quizId(quizId)
                .timestamp(System.currentTimeMillis())
                .payload(payload)
                .build();

        String destination = "/topic/quiz/" + quizId;
        log.info("Broadcasting event [{}] to {}", eventType, destination);
        messagingTemplate.convertAndSend(destination, message);

        // Also broadcast to admin channel
        messagingTemplate.convertAndSend("/topic/admin/quiz/" + quizId, message);
    }

    public void sendTeamEvent(Long quizId, Long teamId, String eventType, Object payload) {
        QuizEventMessage message = QuizEventMessage.builder()
                .eventType(eventType)
                .quizId(quizId)
                .timestamp(System.currentTimeMillis())
                .payload(payload)
                .build();

        String destination = "/topic/quiz/" + quizId + "/team/" + teamId;
        log.info("Sending team event [{}] to {}", eventType, destination);
        messagingTemplate.convertAndSend(destination, message);
    }
}
