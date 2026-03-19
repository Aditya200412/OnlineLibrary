package com.library.service.impl;

import com.library.config.LibraryProperties;
import com.library.dto.request.BorrowRequest;
import com.library.dto.request.ReturnRequest;
import com.library.dto.response.TransactionResponse;
import com.library.entity.Book;
import com.library.entity.BookCopy;
import com.library.entity.Transaction;
import com.library.entity.User;
import com.library.enums.CopyStatus;
import com.library.enums.TransactionStatus;
import com.library.enums.UserRole;
import com.library.exception.*;
import com.library.repository.BookCopyRepository;
import com.library.repository.BookRepository;
import com.library.repository.TransactionRepository;
import com.library.repository.UserRepository;
import com.library.service.TransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Core business logic for borrowing and returning books.
 *
 * BORROW FLOW:
 *  1. Validate user exists & is an active MEMBER
 *  2. Check member hasn't exceeded the max borrow limit
 *  3. Find the first available copy of the requested book
 *  4. Mark copy BORROWED, create Transaction (ACTIVE)
 *  5. Persist and return response
 *
 * RETURN FLOW:
 *  1. Load the active Transaction
 *  2. Set returnDate = today
 *  3. Calculate fine (0 if on time, finePerDay * daysOverdue if late)
 *  4. Update Transaction status to RETURNED or OVERDUE
 *  5. Mark BookCopy back to AVAILABLE
 *  6. Persist and return response
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository        userRepository;
    private final BookRepository        bookRepository;
    private final BookCopyRepository    bookCopyRepository;
    private final LibraryProperties     libraryProperties;

    // ── BORROW ───────────────────────────────────────────────────────────────────

    /**
     * Processes a book borrow request.
     *
     * Guards:
     *  - User must exist and be active
     *  - User must have MEMBER role
     *  - User must not have exceeded maxBorrowLimit active borrows
     *  - At least one copy of the book must be AVAILABLE
     */
    @Override
    @Transactional
    public TransactionResponse borrowBook(BorrowRequest request) {

        // 1. Validate user
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getUserId()));

        if (!user.isActive()) {
            throw new InvalidOperationException("User account is deactivated and cannot borrow books.");
        }
        if (user.getRole() != UserRole.MEMBER) {
            throw new InvalidOperationException("Only MEMBER users can borrow books.");
        }

        // 2. Check borrow limit
        long activeBorrows = transactionRepository.countActiveBorrowsByUser(user.getId());
        if (activeBorrows >= libraryProperties.getMaxBorrowLimit()) {
            throw new BorrowLimitExceededException(libraryProperties.getMaxBorrowLimit());
        }

        // 3. Locate an available copy
        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book", request.getBookId()));

        BookCopy copy = bookCopyRepository
                .findFirstAvailableCopyByBookId(book.getId())
                .orElseThrow(() -> new NoCopyAvailableException(book.getTitle()));

        // 4. Create the transaction
        LocalDate today   = LocalDate.now();
        LocalDate dueDate = today.plusDays(libraryProperties.getBorrowDurationDays());

        Transaction transaction = Transaction.builder()
                .user(user)
                .bookCopy(copy)
                .issueDate(today)
                .dueDate(dueDate)
                .status(TransactionStatus.ACTIVE)
                .build();

        // 5. Update copy status
        copy.setStatus(CopyStatus.BORROWED);
        bookCopyRepository.save(copy);

        transaction = transactionRepository.save(transaction);

        log.info("BORROW | User '{}' borrowed '{}' (copy: {}) | Due: {}",
                user.getEmail(), book.getTitle(), copy.getCopyCode(), dueDate);

        return toResponse(transaction);
    }

    // ── RETURN ───────────────────────────────────────────────────────────────────

    /**
     * Processes a book return.
     *
     * Fine calculation:
     *  - If returnDate <= dueDate → fine = $0.00
     *  - If returnDate >  dueDate → fine = finePerDay * daysOverdue
     */
    @Override
    @Transactional
    public TransactionResponse returnBook(ReturnRequest request) {

        // 1. Load the active transaction
        Transaction transaction = transactionRepository.findById(request.getTransactionId())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", request.getTransactionId()));

        if (!transaction.isActive()) {
            throw new InvalidOperationException(
                    "Transaction " + transaction.getId() + " has already been closed (status: "
                    + transaction.getStatus() + ").");
        }

        // 2. Record return date
        LocalDate returnDate = LocalDate.now();
        transaction.setReturnDate(returnDate);

        // 3. Calculate fine
        BigDecimal fine = transaction.calculateFine(libraryProperties.getFinePerDay());
        transaction.setFine(fine);

        // 4. Set status
        boolean isOverdue = returnDate.isAfter(transaction.getDueDate());
        transaction.setStatus(isOverdue ? TransactionStatus.OVERDUE : TransactionStatus.RETURNED);

        // 5. Free up the copy
        BookCopy copy = transaction.getBookCopy();
        copy.setStatus(CopyStatus.AVAILABLE);
        bookCopyRepository.save(copy);

        transaction = transactionRepository.save(transaction);

        log.info("RETURN | Transaction {} | Copy '{}' | Status: {} | Fine: ${}",
                transaction.getId(), copy.getCopyCode(), transaction.getStatus(), fine);

        return toResponse(transaction);
    }

    // ── Read ─────────────────────────────────────────────────────────────────────

    @Override
    public TransactionResponse getTransactionById(Long id) {
        return toResponse(transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", id)));
    }

    @Override
    public Page<TransactionResponse> getTransactionsByUser(Long userId, Pageable pageable) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", userId);
        }
        return transactionRepository.findByUserId(userId, pageable).map(this::toResponse);
    }

    @Override
    public Page<TransactionResponse> getTransactionsByBook(Long bookId, Pageable pageable) {
        if (!bookRepository.existsById(bookId)) {
            throw new ResourceNotFoundException("Book", bookId);
        }
        return transactionRepository.findByBookId(bookId, pageable).map(this::toResponse);
    }

    @Override
    public List<TransactionResponse> getOverdueTransactions() {
        return transactionRepository.findOverdueTransactions(LocalDate.now())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ── Mapper ───────────────────────────────────────────────────────────────────

    private TransactionResponse toResponse(Transaction t) {
        BookCopy copy = t.getBookCopy();
        Book     book = copy.getBook();
        User     user = t.getUser();

        return TransactionResponse.builder()
                .id(t.getId())
                .userId(user.getId())
                .memberName(user.getFullName())
                .bookCopyId(copy.getId())
                .copyCode(copy.getCopyCode())
                .bookId(book.getId())
                .bookTitle(book.getTitle())
                .bookIsbn(book.getIsbn())
                .issueDate(t.getIssueDate())
                .dueDate(t.getDueDate())
                .returnDate(t.getReturnDate())
                .status(t.getStatus())
                .fine(t.getFine())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
