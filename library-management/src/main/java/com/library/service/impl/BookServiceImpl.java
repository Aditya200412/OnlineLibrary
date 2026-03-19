package com.library.service.impl;

import com.library.dto.request.CreateBookRequest;
import com.library.dto.response.BookResponse;
import com.library.entity.Book;
import com.library.entity.BookCopy;
import com.library.enums.CopyStatus;
import com.library.exception.DuplicateResourceException;
import com.library.exception.ResourceNotFoundException;
import com.library.repository.BookCopyRepository;
import com.library.repository.BookRepository;
import com.library.service.BookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class BookServiceImpl implements BookService {

    private final BookRepository    bookRepository;
    private final BookCopyRepository bookCopyRepository;

    // ── Create ───────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public BookResponse createBook(CreateBookRequest request) {
        if (bookRepository.existsByIsbn(request.getIsbn())) {
            throw new DuplicateResourceException(
                    "A book with ISBN '" + request.getIsbn() + "' already exists.");
        }

        Book book = Book.builder()
                .title(request.getTitle())
                .author(request.getAuthor())
                .isbn(request.getIsbn())
                .category(request.getCategory())
                .description(request.getDescription())
                .publishedYear(request.getPublishedYear())
                .build();

        book = bookRepository.save(book);

        // Create the requested number of physical copies
        final Book savedBook = book;
        List<BookCopy> copies = IntStream.rangeClosed(1, request.getInitialCopies())
                .mapToObj(i -> BookCopy.builder()
                        .book(savedBook)
                        .copyCode(generateCopyCode(savedBook.getId(), i))
                        .status(CopyStatus.AVAILABLE)
                        .build())
                .toList();

        bookCopyRepository.saveAll(copies);
        savedBook.getCopies().addAll(copies);

        log.info("Created book '{}' (ISBN: {}) with {} copies", book.getTitle(), book.getIsbn(), copies.size());
        return toResponse(savedBook);
    }

    // ── Read ─────────────────────────────────────────────────────────────────────

    @Override
    public BookResponse getBookById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Override
    public BookResponse getBookByIsbn(String isbn) {
        Book book = bookRepository.findByIsbn(isbn)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with ISBN: " + isbn));
        return toResponse(book);
    }

    @Override
    public Page<BookResponse> searchBooks(String keyword, Pageable pageable) {
        return bookRepository.searchByTitleOrAuthor(keyword, pageable)
                .map(this::toResponse);
    }

    @Override
    public Page<BookResponse> getBooksByCategory(String category, Pageable pageable) {
        return bookRepository.findByCategoryIgnoreCase(category, pageable)
                .map(this::toResponse);
    }

    @Override
    public Page<BookResponse> getAllBooks(Pageable pageable) {
        return bookRepository.findAll(pageable).map(this::toResponse);
    }

    @Override
    public List<BookResponse> getBooksWithAvailableCopies() {
        return bookRepository.findBooksWithAvailableCopies()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ── Update ───────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public BookResponse updateBook(Long id, CreateBookRequest request) {
        Book book = findOrThrow(id);

        // If ISBN changed, ensure no collision
        if (!book.getIsbn().equals(request.getIsbn()) && bookRepository.existsByIsbn(request.getIsbn())) {
            throw new DuplicateResourceException("ISBN '" + request.getIsbn() + "' is already taken.");
        }

        book.setTitle(request.getTitle());
        book.setAuthor(request.getAuthor());
        book.setIsbn(request.getIsbn());
        book.setCategory(request.getCategory());
        book.setDescription(request.getDescription());
        book.setPublishedYear(request.getPublishedYear());

        return toResponse(bookRepository.save(book));
    }

    @Override
    @Transactional
    public void deleteBook(Long id) {
        Book book = findOrThrow(id);
        bookRepository.delete(book);
        log.info("Deleted book id={}", id);
    }

    @Override
    @Transactional
    public BookResponse addCopies(Long bookId, int count) {
        Book book = findOrThrow(bookId);
        int existing = book.getCopies().size();

        List<BookCopy> newCopies = IntStream.rangeClosed(existing + 1, existing + count)
                .mapToObj(i -> BookCopy.builder()
                        .book(book)
                        .copyCode(generateCopyCode(book.getId(), i))
                        .status(CopyStatus.AVAILABLE)
                        .build())
                .toList();

        bookCopyRepository.saveAll(newCopies);
        book.getCopies().addAll(newCopies);
        log.info("Added {} copies to book id={}", count, bookId);
        return toResponse(book);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private Book findOrThrow(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book", id));
    }

    /** Generates a deterministic copy code: BOOK-{bookId}-COPY-{seq} */
    private String generateCopyCode(Long bookId, int sequence) {
        return String.format("BOOK-%05d-COPY-%03d", bookId, sequence);
    }

    private BookResponse toResponse(Book book) {
        long available = book.getCopies().stream()
                .filter(c -> c.getStatus() == CopyStatus.AVAILABLE)
                .count();

        return BookResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .author(book.getAuthor())
                .isbn(book.getIsbn())
                .category(book.getCategory())
                .description(book.getDescription())
                .publishedYear(book.getPublishedYear())
                .totalCopies(book.getCopies().size())
                .availableCopies(available)
                .createdAt(book.getCreatedAt())
                .build();
    }
}
