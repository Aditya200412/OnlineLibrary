package com.library.service;

import com.library.dto.request.CreateBookRequest;
import com.library.dto.response.BookResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface BookService {

    BookResponse createBook(CreateBookRequest request);

    BookResponse getBookById(Long id);

    BookResponse getBookByIsbn(String isbn);

    Page<BookResponse> searchBooks(String keyword, Pageable pageable);

    Page<BookResponse> getBooksByCategory(String category, Pageable pageable);

    Page<BookResponse> getAllBooks(Pageable pageable);

    List<BookResponse> getBooksWithAvailableCopies();

    BookResponse updateBook(Long id, CreateBookRequest request);

    void deleteBook(Long id);

    /** Add more physical copies to an existing book record. */
    BookResponse addCopies(Long bookId, int count);
}
