package com.meditru.filter;

import com.meditru.config.MeditruProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final ConcurrentHashMap<String, RateLimitEntry> rateLimitMap = new ConcurrentHashMap<>();
    private final int maxRequests;
    private final long windowMs;

    public RateLimitFilter(MeditruProperties properties) {
        this.maxRequests = properties.getRateLimit().getMaxRequests();
        this.windowMs = properties.getRateLimit().getWindowMs();

        // Cleanup expired entries every 5 minutes
        ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
        scheduler.scheduleAtFixedRate(() -> {
            long now = System.currentTimeMillis();
            rateLimitMap.entrySet().removeIf(entry -> now > entry.getValue().resetAt);
        }, 5, 5, TimeUnit.MINUTES);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String ip = getClientIp(request);
        long now = System.currentTimeMillis();

        RateLimitEntry entry = rateLimitMap.compute(ip, (key, existing) -> {
            if (existing == null || now > existing.resetAt) {
                return new RateLimitEntry(1, now + windowMs);
            }
            existing.count++;
            return existing;
        });

        if (entry.count > maxRequests) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                """
                {"error":"Too many requests","message":"Rate limit exceeded. Please try again later."}
                """
            );
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    private static class RateLimitEntry {
        volatile int count;
        volatile long resetAt;

        RateLimitEntry(int count, long resetAt) {
            this.count = count;
            this.resetAt = resetAt;
        }
    }
}
