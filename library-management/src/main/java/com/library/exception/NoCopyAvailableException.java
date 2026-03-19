package com.library.exception;

public class NoCopyAvailableException extends RuntimeException {
    public NoCopyAvailableException(String bookTitle) {
        super("No available copies of '" + bookTitle + "'. All copies are currently borrowed.");
    }
}
