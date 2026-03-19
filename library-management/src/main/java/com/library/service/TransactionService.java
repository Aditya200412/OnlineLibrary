package com.library.service;

import com.library.dto.request.BorrowRequest;
import com.library.dto.request.ReturnRequest;
import com.library.dto.response.TransactionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface TransactionService {

    /** Borrow a book: assigns an available copy & creates a Transaction. */
    TransactionResponse borrowBook(BorrowRequest request);

    /** Return a book: marks transaction RETURNED/OVERDUE and calculates fine. */
    TransactionResponse returnBook(ReturnRequest request);

    TransactionResponse getTransactionById(Long id);

    Page<TransactionResponse> getTransactionsByUser(Long userId, Pageable pageable);

    Page<TransactionResponse> getTransactionsByBook(Long bookId, Pageable pageable);

    /** Returns all currently active (unreturned) borrows. */
    List<TransactionResponse> getOverdueTransactions();
}
