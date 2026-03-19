package com.library.controller;

import com.library.dto.request.BorrowRequest;
import com.library.dto.request.ReturnRequest;
import com.library.dto.response.ApiResponse;
import com.library.dto.response.TransactionResponse;
import com.library.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoints for library transaction management (borrow / return).
 *
 * POST /api/transactions/borrow                    — borrow a book
 * POST /api/transactions/return                    — return a book
 * GET  /api/transactions/{id}                      — get transaction by ID
 * GET  /api/transactions/user/{userId}             — transaction history for a member
 * GET  /api/transactions/book/{bookId}             — transaction history for a book
 * GET  /api/transactions/overdue                   — all currently overdue borrows
 */
@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping("/borrow")
    public ResponseEntity<ApiResponse<TransactionResponse>> borrowBook(
            @Valid @RequestBody BorrowRequest request) {
        TransactionResponse response = transactionService.borrowBook(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Book borrowed successfully", response));
    }

    @PostMapping("/return")
    public ResponseEntity<ApiResponse<TransactionResponse>> returnBook(
            @Valid @RequestBody ReturnRequest request) {
        TransactionResponse response = transactionService.returnBook(request);
        return ResponseEntity.ok(ApiResponse.ok("Book returned successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(transactionService.getTransactionById(id)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("issueDate").descending());
        return ResponseEntity.ok(ApiResponse.ok(transactionService.getTransactionsByUser(userId, pageable)));
    }

    @GetMapping("/book/{bookId}")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getByBook(
            @PathVariable Long bookId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("issueDate").descending());
        return ResponseEntity.ok(ApiResponse.ok(transactionService.getTransactionsByBook(bookId, pageable)));
    }

    @GetMapping("/overdue")
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getOverdue() {
        return ResponseEntity.ok(ApiResponse.ok(transactionService.getOverdueTransactions()));
    }
}
