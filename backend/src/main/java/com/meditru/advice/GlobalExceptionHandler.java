package com.meditru.advice;

import com.meditru.dto.ApiErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleAllExceptions(Exception ex) {
        log.error("[FATAL] {}", ex.getMessage(), ex);
        return ResponseEntity.internalServerError().body(
            ApiErrorResponse.of("Internal server error", "An unexpected error occurred.")
        );
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiErrorResponse> handleRuntimeException(RuntimeException ex) {
        log.error("[ERROR] {}", ex.getMessage(), ex);
        return ResponseEntity.internalServerError().body(
            ApiErrorResponse.of("Service error", ex.getMessage())
        );
    }
}
