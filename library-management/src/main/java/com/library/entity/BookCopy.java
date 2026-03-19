package com.library.entity;

import com.library.enums.CopyStatus;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a PHYSICAL copy of a {@link Book} in the library.
 * A book may have multiple copies; each is individually tracked.
 *
 * Relationship:
 *  - Many BookCopies → One Book
 *  - One BookCopy → Many Transactions (borrow/return history)
 */
@Entity
@Table(name = "book_copies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"book", "transactions"})
public class BookCopy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The parent Book this copy belongs to.
     * LAZY loading: book data fetched only when accessed.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    /**
     * A human-readable copy identifier (e.g., "COPY-001", barcode value).
     * Unique across the library.
     */
    @Column(nullable = false, unique = true, length = 50)
    private String copyCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CopyStatus status = CopyStatus.AVAILABLE;

    /** Transaction history for this specific physical copy. */
    @OneToMany(mappedBy = "bookCopy", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Transaction> transactions = new ArrayList<>();

    // ── Convenience helper ──────────────────────────────────────────────────────

    public boolean isAvailable() {
        return this.status == CopyStatus.AVAILABLE;
    }
}
