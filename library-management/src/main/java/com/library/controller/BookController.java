package com.library.controller;

import com.library.dto.request.CreateBookRequest;
import com.library.dto.response.ApiResponse;
import com.library.dto.response.BookResponse;
import com.library.service.BookService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoints for book catalog management.
 *
 * POST   /api/books                         — add a new book
 * GET    /api/books                         — list all books (paginated)
 * GET    /api/books/{id}                    — get book by ID
 * GET    /api/books/isbn/{isbn}             — get book by ISBN
 * GET    /api/books/search?keyword=&page=   — search by title or author
 * GET    /api/books/category/{cat}          — filter by category
 * GET    /api/books/available               — books with available copies
 * PUT    /api/books/{id}                    — update book metadata
 * DELETE /api/books/{id}                    — remove a book
 * POST   /api/books/{id}/copies?count=N     — add more physical copies
 */
@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
@Validated
public class BookController {

    private final BookService bookService;

    @PostMapping
    public ResponseEntity<ApiResponse<BookResponse>> createBook(
            @Valid @RequestBody CreateBookRequest request) {
        BookResponse response = bookService.createBook(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Book created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BookResponse>>> getAllBooks(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "title") String sortBy) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).ascending());
        return ResponseEntity.ok(ApiResponse.ok(bookService.getAllBooks(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookResponse>> getBookById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(bookService.getBookById(id)));
    }

    @GetMapping("/isbn/{isbn}")
    public ResponseEntity<ApiResponse<BookResponse>> getBookByIsbn(@PathVariable String isbn) {
        return ResponseEntity.ok(ApiResponse.ok(bookService.getBookByIsbn(isbn)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<BookResponse>>> searchBooks(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(bookService.searchBooks(keyword, pageable)));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<Page<BookResponse>>> getByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("title").ascending());
        return ResponseEntity.ok(ApiResponse.ok(bookService.getBooksByCategory(category, pageable)));
    }

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<BookResponse>>> getAvailableBooks() {
        return ResponseEntity.ok(ApiResponse.ok(bookService.getBooksWithAvailableCopies()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BookResponse>> updateBook(
            @PathVariable Long id,
            @Valid @RequestBody CreateBookRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Book updated successfully", bookService.updateBook(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBook(@PathVariable Long id) {
        bookService.deleteBook(id);
        return ResponseEntity.ok(ApiResponse.ok("Book deleted successfully", null));
    }

    @PostMapping("/{id}/copies")
    public ResponseEntity<ApiResponse<BookResponse>> addCopies(
            @PathVariable Long id,
            @RequestParam @Min(1) int count) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok(count + " copy/copies added", bookService.addCopies(id, count)));
    }
}
