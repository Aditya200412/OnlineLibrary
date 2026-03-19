package com.library.exception;

public class BorrowLimitExceededException extends RuntimeException {
    public BorrowLimitExceededException(int limit) {
        super("Borrow limit reached. A member can borrow a maximum of " + limit + " books at a time.");
    }
}
