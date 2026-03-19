package com.library.enums;

public enum TransactionStatus {
    ACTIVE,      // Book is currently borrowed
    RETURNED,    // Book returned on time
    OVERDUE      // Book returned late (or still outstanding past due date)
}
