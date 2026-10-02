package com.example.quiz.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@Component
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // In-memory sliding window timestamps: key -> queue of request epoch millis
    private final ConcurrentHashMap<String, ConcurrentLinkedDeque<Long>> requestLogs = new ConcurrentHashMap<>();

    private static final long WINDOW_MS = 60_000L; // 1 minute window

    // Configurable thresholds per endpoint
    private static final int MAX_LOGIN_REQUESTS = 30;
    private static final int MAX_REGISTER_REQUESTS = 20;
    private static final int MAX_AUDIT_REQUESTS = 40;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String method = request.getMethod();

        // Always allow CORS preflight
        if ("OPTIONS".equalsIgnoreCase(method)) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        int maxAllowed = getMaxAllowed(method, path);

        if (maxAllowed > 0) {
            String clientIp = getClientIp(request);
            String bucketKey = clientIp + ":" + getEndpointCategory(path);

            long now = System.currentTimeMillis();
            ConcurrentLinkedDeque<Long> timestamps = requestLogs.computeIfAbsent(bucketKey, k -> new ConcurrentLinkedDeque<>());

            // Evict entries older than window
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() > WINDOW_MS) {
                timestamps.pollFirst();
            }

            if (timestamps.size() >= maxAllowed) {
                log.warn("Rate limit exceeded for IP: {} on path: {}", clientIp, path);
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);

                Map<String, Object> errorBody = Map.of(
                        "success", false,
                        "message", "Too many requests. Please slow down and try again shortly.",
                        "data", null
                );
                response.getWriter().write(objectMapper.writeValueAsString(errorBody));
                return;
            }

            timestamps.addLast(now);
        }

        filterChain.doFilter(request, response);
    }

    private int getMaxAllowed(String method, String path) {
        if ("POST".equalsIgnoreCase(method)) {
            if (path.endsWith("/api/auth/login")) return MAX_LOGIN_REQUESTS;
            if (path.endsWith("/api/auth/register")) return MAX_REGISTER_REQUESTS;
            if (path.contains("/audit/cheating")) return MAX_AUDIT_REQUESTS;
        }
        return 0; // Not rate limited
    }

    private String getEndpointCategory(String path) {
        if (path.endsWith("/api/auth/login")) return "login";
        if (path.endsWith("/api/auth/register")) return "register";
        if (path.contains("/audit/cheating")) return "cheating";
        return "general";
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
