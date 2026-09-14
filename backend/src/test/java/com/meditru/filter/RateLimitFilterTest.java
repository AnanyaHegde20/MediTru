package com.meditru.filter;

import com.meditru.config.MeditruProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.*;

class RateLimitFilterTest {

    private RateLimitFilter filter;

    @BeforeEach
    void setUp() {
        MeditruProperties props = new MeditruProperties();
        MeditruProperties.RateLimit rateLimit = new MeditruProperties.RateLimit();
        rateLimit.setMaxRequests(3);
        rateLimit.setWindowMs(60000);
        props.setRateLimit(rateLimit);
        filter = new RateLimitFilter(props);
    }

    @Test
    void allowsRequestsWithinLimit() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/health");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilterInternal(request, response, chain);
        assertEquals(200, response.getStatus());
    }

    @Test
    void blocksRequestsExceedingLimit() throws Exception {
        for (int i = 0; i < 4; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/health");
            request.setRemoteAddr("127.0.0.1");
            MockHttpServletResponse response = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();
            filter.doFilterInternal(request, response, chain);
            if (i == 3) {
                assertEquals(429, response.getStatus());
            }
        }
    }

    @Test
    void validatesForwardedForHeaderFormat() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/health");
        request.addHeader("X-Forwarded-For", "not-an-ip");
        request.setRemoteAddr("192.168.1.1");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilterInternal(request, response, chain);
        assertEquals(200, response.getStatus());
    }

    @Test
    void acceptsValidForwardedForHeader() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/health");
        request.addHeader("X-Forwarded-For", "10.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilterInternal(request, response, chain);
        assertEquals(200, response.getStatus());
    }
}
