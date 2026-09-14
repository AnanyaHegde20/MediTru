package com.meditru.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    private final MeditruProperties properties;

    public CorsConfig(MeditruProperties properties) {
        this.properties = properties;
    }

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        String origins = properties.getAllowedOrigins();
        if (origins != null && !origins.isBlank()) {
            config.setAllowedOrigins(Arrays.asList(origins.split(",")));
        }

        config.setAllowedMethods(List.of("GET", "POST"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);

        return new CorsFilter(source);
    }
}
