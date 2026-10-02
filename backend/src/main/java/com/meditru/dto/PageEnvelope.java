package com.meditru.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PageEnvelope<T>(
        List<T> items,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext,
        boolean hasPrevious,
        Map<String, Long> facets
) {

    public static <T> PageEnvelope<T> of(List<T> all, int page, int size) {
        return of(all, page, size, null);
    }

    public static <T> PageEnvelope<T> of(List<T> all, int page, int size, Map<String, Long> facets) {
        int safeSize = Math.max(1, size);
        long total = all.size();
        int totalPages = (int) Math.ceil((double) total / safeSize);
        int safePage = Math.min(Math.max(0, page), Math.max(totalPages - 1, 0));
        int from = Math.min(safePage * safeSize, all.size());
        int to = Math.min(from + safeSize, all.size());
        return new PageEnvelope<>(
                all.subList(from, to),
                safePage,
                safeSize,
                total,
                totalPages,
                safePage < totalPages - 1,
                safePage > 0,
                facets);
    }
}
