package com.library.repository;

import com.library.entity.BookCopy;
import com.library.enums.CopyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookCopyRepository extends JpaRepository<BookCopy, Long> {

    List<BookCopy> findByBookId(Long bookId);

    List<BookCopy> findByBookIdAndStatus(Long bookId, CopyStatus status);

    boolean existsByCopyCode(String copyCode);

    Optional<BookCopy> findByCopyCode(String copyCode);

    /**
     * Finds the FIRST available copy for a given book.
     * Used by the borrow service to auto-assign a copy.
     */
    @Query("""
            SELECT c FROM BookCopy c
            WHERE c.book.id = :bookId
              AND c.status  = 'AVAILABLE'
            ORDER BY c.id ASC
            LIMIT 1
            """)
    Optional<BookCopy> findFirstAvailableCopyByBookId(@Param("bookId") Long bookId);

    /** Count available copies for a book — lightweight check before full fetch. */
    @Query("SELECT COUNT(c) FROM BookCopy c WHERE c.book.id = :bookId AND c.status = 'AVAILABLE'")
    long countAvailableCopiesByBookId(@Param("bookId") Long bookId);
}
