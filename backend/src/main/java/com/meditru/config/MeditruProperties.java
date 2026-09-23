package com.meditru.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "meditru")
public class MeditruProperties {

    private String allowedOrigins = "http://localhost:3000";
    private Gemini gemini = new Gemini();
    private RateLimit rateLimit = new RateLimit();
    private Jwt jwt = new Jwt();

    public String getAllowedOrigins() {
        return allowedOrigins;
    }

    public void setAllowedOrigins(String allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    public Gemini getGemini() {
        return gemini;
    }

    public void setGemini(Gemini gemini) {
        this.gemini = gemini;
    }

    public RateLimit getRateLimit() {
        return rateLimit;
    }

    public void setRateLimit(RateLimit rateLimit) {
        this.rateLimit = rateLimit;
    }

    public Jwt getJwt() {
        return jwt;
    }

    public void setJwt(Jwt jwt) {
        this.jwt = jwt;
    }

    public static class Jwt {
        private String secret = "meditru-dev-secret-key-change-me-in-production-0123456789abcdef";
        private long expirationMs = 86400000;

        public String getSecret() { return secret; }
        public void setSecret(String secret) { this.secret = secret; }
        public long getExpirationMs() { return expirationMs; }
        public void setExpirationMs(long expirationMs) { this.expirationMs = expirationMs; }
    }

    public static class Gemini {
        private String apiKey = "";
        private String model = "gemini-3.7-flash";

        public String getApiKey() { return apiKey; }
        public void setApiKey(String apiKey) { this.apiKey = apiKey; }
        public String getModel() { return model; }
        public void setModel(String model) { this.model = model; }
    }

    public static class RateLimit {
        private int maxRequests = 100;
        private long windowMs = 60000;

        public int getMaxRequests() { return maxRequests; }
        public void setMaxRequests(int maxRequests) { this.maxRequests = maxRequests; }
        public long getWindowMs() { return windowMs; }
        public void setWindowMs(long windowMs) { this.windowMs = windowMs; }
    }
}
