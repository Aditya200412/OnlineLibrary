package com.library.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents the CONCEPT of a book (title, author, ISBN).
 * Physical copies are tracked separately via {@link BookCopy}.
 *
 * Relationship: One Book → Many BookCopies
 */
@Entity
@Table(name = "books", indexes = {
        @Index(name = "idx_book_isbn", columnList = "isbn", unique = true),
        @Index(name = "idx_book_title", columnList = "title"),
        @Index(name = "idx_book_author", columnList = "author")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "copies")
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 150)
    private String author;

    @Column(nullable = false, unique = true, length = 20)
    private String isbn;

    @Column(length = 100)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 4)
    private String publishedYear;

    @Column(updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Physical copies of this book in the library.
     * orphanRemoval = true: deleting a BookCopy removes it from DB.
     */
    @OneToMany(mappedBy = "book", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<BookCopy> copies = new ArrayList<>();

    // ── Convenience helper ──────────────────────────────────────────────────────

    /** Returns the count of AVAILABLE copies without loading all copies. */
    @Transient
    public long getAvailableCopyCount() {
        return copies.stream()
                .filter(c -> c.getStatus() == com.library.enums.CopyStatus.AVAILABLE)
                .count();
    }
}
