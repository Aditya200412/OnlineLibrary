package com.library.entity;

import com.library.enums.TransactionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Records a single BORROW or RETURN event.
 *
 * Lifecycle:
 *  1. Borrow → status = ACTIVE, returnDate = null, fine = null
 *  2. Return on time → status = RETURNED, returnDate set, fine = 0
 *  3. Return late → status = OVERDUE, returnDate set, fine calculated
 *
 * Relationships:
 *  - Many Transactions → One User
 *  - Many Transactions → One BookCopy
 */
@Entity
@Table(name = "transactions", indexes = {
        @Index(name = "idx_txn_user", columnList = "user_id"),
        @Index(name = "idx_txn_copy", columnList = "book_copy_id"),
        @Index(name = "idx_txn_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"user", "bookCopy"})
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The member who borrowed the book. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** The specific physical copy that was borrowed. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_copy_id", nullable = false)
    private BookCopy bookCopy;

    /** Date the book was issued/borrowed. */
    @Column(nullable = false)
    private LocalDate issueDate;

    /** Date the book is due back. */
    @Column(nullable = false)
    private LocalDate dueDate;

    /**
     * Date the book was actually returned.
     * Null while the book is still borrowed (ACTIVE status).
     */
    @Column
    private LocalDate returnDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TransactionStatus status = TransactionStatus.ACTIVE;

    /**
     * Calculated fine in dollars. Zero if returned on time.
     * Null until the book is returned.
     */
    @Column(precision = 10, scale = 2)
    private BigDecimal fine;

    @Column(updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // ── Domain Logic ────────────────────────────────────────────────────────────

    /**
     * Calculates overdue fine based on days past the due date.
     *
     * @param finePerDay dollar amount charged per overdue day
     * @return calculated fine (ZERO if returned on time or not yet returned)
     */
    public BigDecimal calculateFine(BigDecimal finePerDay) {
        if (returnDate == null || !returnDate.isAfter(dueDate)) {
            return BigDecimal.ZERO;
        }
        long daysOverdue = ChronoUnit.DAYS.between(dueDate, returnDate);
        return finePerDay.multiply(BigDecimal.valueOf(daysOverdue));
    }

    /** Convenience: is this transaction still open? */
    public boolean isActive() {
        return this.status == TransactionStatus.ACTIVE;
    }
}
