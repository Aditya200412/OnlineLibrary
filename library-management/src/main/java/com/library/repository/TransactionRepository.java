package com.library.repository;

import com.library.entity.Transaction;
import com.library.enums.TransactionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    /** All transactions for a specific user (member history). */
    Page<Transaction> findByUserId(Long userId, Pageable pageable);

    /** Active (not yet returned) transactions for a user. */
    List<Transaction> findByUserIdAndStatus(Long userId, TransactionStatus status);

    /** Count how many books a user currently has borrowed. */
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.user.id = :userId AND t.status = 'ACTIVE'")
    long countActiveBorrowsByUser(@Param("userId") Long userId);

    /**
     * Find the active transaction for a specific book copy.
     * There should be at most ONE active transaction per copy at any time.
     */
    @Query("""
            SELECT t FROM Transaction t
            WHERE t.bookCopy.id = :copyId
              AND t.status = 'ACTIVE'
            """)
    Optional<Transaction> findActiveTransactionByBookCopyId(@Param("copyId") Long copyId);

    /**
     * Find all overdue transactions (ACTIVE and past due date).
     * Used for daily overdue reports / notifications.
     */
    @Query("""
            SELECT t FROM Transaction t
            WHERE t.status = 'ACTIVE'
              AND t.dueDate < :today
            ORDER BY t.dueDate ASC
            """)
    List<Transaction> findOverdueTransactions(@Param("today") LocalDate today);

    /** Transactions by book (via its copies). */
    @Query("""
            SELECT t FROM Transaction t
            WHERE t.bookCopy.book.id = :bookId
            ORDER BY t.issueDate DESC
            """)
    Page<Transaction> findByBookId(@Param("bookId") Long bookId, Pageable pageable);
}
