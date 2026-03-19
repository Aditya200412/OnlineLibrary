package com.library.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * DTO for POST /api/transactions/return
 */
@Data
public class ReturnRequest {

    @NotNull(message = "Transaction ID is required")
    private Long transactionId;
}
