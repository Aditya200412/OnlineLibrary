package com.library.service;

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
import com.library.service.impl.TransactionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

/**
 * Unit tests for {@link TransactionServiceImpl}.
 *
 * Strategy: Use Mockito to stub all repositories and library properties,
 * isolating the service's pure business logic from infrastructure concerns.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TransactionService Unit Tests")
class TransactionServiceTest {

    // ── Mocks ────────────────────────────────────────────────────────────────────

    @Mock private TransactionRepository transactionRepository;
    @Mock private UserRepository        userRepository;
    @Mock private BookRepository        bookRepository;
    @Mock private BookCopyRepository    bookCopyRepository;
    @Mock private LibraryProperties     libraryProperties;

    @InjectMocks
    private TransactionServiceImpl transactionService;

    // ── Test Fixtures ─────────────────────────────────────────────────────────────

    private User     activeMember;
    private Book     book;
    private BookCopy availableCopy;

    @BeforeEach
    void setUp() {
        activeMember = User.builder()
                .id(1L).fullName("Alice Smith")
                .email("alice@library.com")
                .password("hashed")
                .role(UserRole.MEMBER)
                .active(true)
                .build();

        book = Book.builder()
                .id(10L).title("Clean Code")
                .author("Robert C. Martin")
                .isbn("978-0132350884")
                .category("Programming")
                .publishedYear("2008")
                .build();

        availableCopy = BookCopy.builder()
                .id(100L)
                .book(book)
                .copyCode("BOOK-00010-COPY-001")
                .status(CopyStatus.AVAILABLE)
                .build();

        // Default library settings used across most tests
        given(libraryProperties.getMaxBorrowLimit()).willReturn(5);
        given(libraryProperties.getBorrowDurationDays()).willReturn(14);
        given(libraryProperties.getFinePerDay()).willReturn(new BigDecimal("0.50"));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BORROW TESTS
    // ═══════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("borrowBook()")
    class BorrowBookTests {

        private BorrowRequest borrowRequest;

        @BeforeEach
        void setUp() {
            borrowRequest = new BorrowRequest();
            borrowRequest.setUserId(1L);
            borrowRequest.setBookId(10L);
        }

        @Test
        @DisplayName("✅ Happy path: valid member borrows an available book")
        void borrowBook_happyPath_returnsActiveTransaction() {
            // Arrange
            given(userRepository.findById(1L)).willReturn(Optional.of(activeMember));
            given(transactionRepository.countActiveBorrowsByUser(1L)).willReturn(0L);
            given(bookRepository.findById(10L)).willReturn(Optional.of(book));
            given(bookCopyRepository.findFirstAvailableCopyByBookId(10L))
                    .willReturn(Optional.of(availableCopy));
            given(transactionRepository.save(any(Transaction.class)))
                    .willAnswer(inv -> {
                        Transaction t = inv.getArgument(0);
                        t = Transaction.builder()
                                .id(999L).user(t.getUser()).bookCopy(t.getBookCopy())
                                .issueDate(t.getIssueDate()).dueDate(t.getDueDate())
                                .status(TransactionStatus.ACTIVE).build();
                        return t;
                    });

            // Act
            TransactionResponse response = transactionService.borrowBook(borrowRequest);

            // Assert
            assertThat(response.getStatus()).isEqualTo(TransactionStatus.ACTIVE);
            assertThat(response.getUserId()).isEqualTo(1L);
            assertThat(response.getBookTitle()).isEqualTo("Clean Code");
            assertThat(response.getReturnDate()).isNull();
            assertThat(response.getDueDate())
                    .isEqualTo(LocalDate.now().plusDays(14));

            // Verify the copy was marked BORROWED
            then(bookCopyRepository).should().save(argThat(c -> c.getStatus() == CopyStatus.BORROWED));
        }

        @Test
        @DisplayName("❌ Throws ResourceNotFoundException when user does not exist")
        void borrowBook_userNotFound_throwsException() {
            given(userRepository.findById(1L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> transactionService.borrowBook(borrowRequest))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }

        @Test
        @DisplayName("❌ Throws InvalidOperationException when user is inactive")
        void borrowBook_inactiveUser_throwsException() {
            activeMember.setActive(false);
            given(userRepository.findById(1L)).willReturn(Optional.of(activeMember));

            assertThatThrownBy(() -> transactionService.borrowBook(borrowRequest))
                    .isInstanceOf(InvalidOperationException.class)
                    .hasMessageContaining("deactivated");
        }

        @Test
        @DisplayName("❌ Throws InvalidOperationException when user is a LIBRARIAN (not a member)")
        void borrowBook_librarianCannotBorrow_throwsException() {
            activeMember.setRole(UserRole.LIBRARIAN);
            given(userRepository.findById(1L)).willReturn(Optional.of(activeMember));

            assertThatThrownBy(() -> transactionService.borrowBook(borrowRequest))
                    .isInstanceOf(InvalidOperationException.class)
                    .hasMessageContaining("MEMBER");
        }

        @Test
        @DisplayName("❌ Throws BorrowLimitExceededException when member is at max borrows")
        void borrowBook_atBorrowLimit_throwsException() {
            given(userRepository.findById(1L)).willReturn(Optional.of(activeMember));
            given(transactionRepository.countActiveBorrowsByUser(1L)).willReturn(5L); // at the limit

            assertThatThrownBy(() -> transactionService.borrowBook(borrowRequest))
                    .isInstanceOf(BorrowLimitExceededException.class)
                    .hasMessageContaining("5");
        }

        @Test
        @DisplayName("❌ Throws NoCopyAvailableException when all copies are borrowed")
        void borrowBook_noAvailableCopies_throwsException() {
            given(userRepository.findById(1L)).willReturn(Optional.of(activeMember));
            given(transactionRepository.countActiveBorrowsByUser(1L)).willReturn(1L);
            given(bookRepository.findById(10L)).willReturn(Optional.of(book));
            given(bookCopyRepository.findFirstAvailableCopyByBookId(10L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> transactionService.borrowBook(borrowRequest))
                    .isInstanceOf(NoCopyAvailableException.class)
                    .hasMessageContaining("Clean Code");
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RETURN TESTS
    // ═══════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("returnBook()")
    class ReturnBookTests {

        private ReturnRequest returnRequest;
        private Transaction   activeTransaction;

        @BeforeEach
        void setUp() {
            returnRequest = new ReturnRequest();
            returnRequest.setTransactionId(999L);

            activeTransaction = Transaction.builder()
                    .id(999L)
                    .user(activeMember)
                    .bookCopy(availableCopy)
                    .issueDate(LocalDate.now().minusDays(10))
                    .dueDate(LocalDate.now().plusDays(4))   // not yet overdue
                    .status(TransactionStatus.ACTIVE)
                    .build();
        }

        @Test
        @DisplayName("✅ On-time return: status = RETURNED, fine = $0.00")
        void returnBook_onTime_noFine() {
            // Due date is in the future → returned on time
            given(transactionRepository.findById(999L)).willReturn(Optional.of(activeTransaction));
            given(transactionRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            TransactionResponse response = transactionService.returnBook(returnRequest);

            assertThat(response.getStatus()).isEqualTo(TransactionStatus.RETURNED);
            assertThat(response.getFine()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(response.getReturnDate()).isEqualTo(LocalDate.now());
        }

        @Test
        @DisplayName("✅ Overdue return: status = OVERDUE, fine correctly calculated")
        void returnBook_overdue_correctFineCalculated() {
            // Set due date 5 days in the past → 5 days overdue × $0.50 = $2.50
            activeTransaction.setDueDate(LocalDate.now().minusDays(5));

            given(transactionRepository.findById(999L)).willReturn(Optional.of(activeTransaction));
            given(transactionRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            TransactionResponse response = transactionService.returnBook(returnRequest);

            assertThat(response.getStatus()).isEqualTo(TransactionStatus.OVERDUE);
            assertThat(response.getFine()).isEqualByComparingTo(new BigDecimal("2.50"));
        }

        @Test
        @DisplayName("✅ After return, BookCopy status is reset to AVAILABLE")
        void returnBook_resetsBookCopyToAvailable() {
            given(transactionRepository.findById(999L)).willReturn(Optional.of(activeTransaction));
            given(transactionRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            transactionService.returnBook(returnRequest);

            then(bookCopyRepository).should().save(argThat(c -> c.getStatus() == CopyStatus.AVAILABLE));
        }

        @Test
        @DisplayName("❌ Throws ResourceNotFoundException when transaction ID is invalid")
        void returnBook_invalidTransactionId_throwsException() {
            given(transactionRepository.findById(999L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> transactionService.returnBook(returnRequest))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Transaction");
        }

        @Test
        @DisplayName("❌ Throws InvalidOperationException when transaction is already closed")
        void returnBook_alreadyReturned_throwsException() {
            activeTransaction.setStatus(TransactionStatus.RETURNED);
            activeTransaction.setReturnDate(LocalDate.now().minusDays(1));

            given(transactionRepository.findById(999L)).willReturn(Optional.of(activeTransaction));

            assertThatThrownBy(() -> transactionService.returnBook(returnRequest))
                    .isInstanceOf(InvalidOperationException.class)
                    .hasMessageContaining("already been closed");
        }
    }
}
