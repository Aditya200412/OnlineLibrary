package com.library.repository;

import com.library.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    Optional<Book> findByIsbn(String isbn);

    boolean existsByIsbn(String isbn);

    /**
     * CUSTOM QUERY — partial match search on title OR author (case-insensitive).
     * Uses JPQL LIKE with LOWER() for DB-agnostic case folding.
     * Supports pagination for large catalogs.
     */
    @Query("""
            SELECT b FROM Book b
            WHERE LOWER(b.title)  LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(b.author) LIKE LOWER(CONCAT('%', :keyword, '%'))
            ORDER BY b.title ASC
            """)
    Page<Book> searchByTitleOrAuthor(@Param("keyword") String keyword, Pageable pageable);

    /** Filter by category with pagination. */
    Page<Book> findByCategoryIgnoreCase(String category, Pageable pageable);

    /**
     * Fetch books that still have at least one AVAILABLE copy.
     * Joins to copies and filters by status — avoids N+1 by using a JOIN.
     */
    @Query("""
            SELECT DISTINCT b FROM Book b
            JOIN b.copies c
            WHERE c.status = 'AVAILABLE'
            ORDER BY b.title ASC
            """)
    List<Book> findBooksWithAvailableCopies();

    /** Books by a specific author, sorted by title. */
    List<Book> findByAuthorContainingIgnoreCaseOrderByTitleAsc(String author);
}
