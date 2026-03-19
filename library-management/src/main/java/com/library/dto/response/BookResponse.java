package com.library.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BookResponse {
    private Long id;
    private String title;
    private String author;
    private String isbn;
    private String category;
    private String description;
    private String publishedYear;
    private int totalCopies;
    private long availableCopies;
    private LocalDateTime createdAt;
}
