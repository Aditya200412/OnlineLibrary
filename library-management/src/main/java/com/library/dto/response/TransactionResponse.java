package com.library.dto.response;

import com.library.enums.TransactionStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class TransactionResponse {
    private Long id;

    // User info (denormalized for convenience)
    private Long userId;
    private String memberName;

    // Book info
    private Long bookCopyId;
    private String copyCode;
    private Long bookId;
    private String bookTitle;
    private String bookIsbn;

    // Dates
    private LocalDate issueDate;
    private LocalDate dueDate;
    private LocalDate returnDate;

    // Status & financials
    private TransactionStatus status;
    private BigDecimal fine;

    private LocalDateTime createdAt;
}
