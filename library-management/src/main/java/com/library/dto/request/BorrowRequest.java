package com.library.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * DTO for POST /api/transactions/borrow
 * The service will auto-select an available copy for the given book.
 */
@Data
public class BorrowRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Book ID is required")
    private Long bookId;
}
