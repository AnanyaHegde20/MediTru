package com.meditru.controller;

import com.meditru.dto.AuthUser;
import com.meditru.service.AuthService;
import com.meditru.service.SearchService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SearchService service;
    private final AuthService authService;

    public SearchController(SearchService service, AuthService authService) {
        this.service = service;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<?> search(@RequestParam(value = "q", required = false) String q,
                                    Authentication authentication) {
        try {
            AuthUser actor = requireActor(authentication);
            if (q == null || q.trim().length() < 2) {
                return ResponseEntity.ok(List.of());
            }
            return ResponseEntity.ok(service.search(q, actor));
        } catch (AuthService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }
    }

    private AuthUser requireActor(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AuthService.UnauthorizedException("Not authenticated");
        }
        return authService.currentUser(authentication.getName());
    }
}
