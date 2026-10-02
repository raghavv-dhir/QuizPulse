package com.example.quiz.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.ArrayList;
import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${quiz.cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://localhost:8080,https://*.vercel.app,https://*.onrender.com}")
    private String allowedOriginsConfig;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        List<String> origins = new ArrayList<>();
        if (allowedOriginsConfig != null && !allowedOriginsConfig.isBlank()) {
            for (String origin : allowedOriginsConfig.split(",")) {
                if (!origin.trim().isEmpty()) {
                    origins.add(origin.trim());
                }
            }
        }
        if (origins.isEmpty()) {
            origins.addAll(List.of("http://localhost:5173", "http://localhost:3000", "http://localhost:8080"));
        }
        String[] originPatterns = origins.toArray(new String[0]);

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(originPatterns)
                .withSockJS();

        // Also register pure websocket endpoint for native clients
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(originPatterns);
    }
}
