# 📖 Libra — Online Library Management System

A full-stack **Library Management System** built with **Java 17**, **Spring Boot 3**, **Spring Data JPA**, **MySQL**, and a **React** frontend. Designed with real-world business logic including copy-level tracking, borrow limits, overdue fines, and a global exception handling strategy.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Language | Java 17 |
| Framework | Spring Boot 3.2 |
| Persistence | Spring Data JPA + Hibernate |
| Database | MySQL 8 |
| Validation | Jakarta Validation (Bean Validation 3.0) |
| Boilerplate | Lombok |
| Build Tool | Maven |
| Frontend | React 18 (JSX, Hooks) |
| Styling | CSS-in-JS (custom design system) |

---

## 📁 Project Structure

```
library-management/
├── pom.xml
└── src/
    ├── main/
    │   ├── java/com/library/
    │   │   ├── LibraryManagementApplication.java
    │   │   ├── config/
    │   │   │   └── LibraryProperties.java          # Typed config binding (borrow limit, fine rate)
    │   │   ├── controller/
    │   │   │   ├── BookController.java              # GET/POST/PUT/DELETE /api/books
    │   │   │   ├── TransactionController.java       # POST /api/transactions/borrow|return
    │   │   │   └── UserController.java              # GET/POST/PUT/DELETE /api/users
    │   │   ├── dto/
    │   │   │   ├── request/
    │   │   │   │   ├── BorrowRequest.java
    │   │   │   │   ├── CreateBookRequest.java
    │   │   │   │   ├── CreateUserRequest.java
    │   │   │   │   └── ReturnRequest.java
    │   │   │   └── response/
    │   │   │       ├── ApiResponse.java             # Standardised envelope { success, data, message }
    │   │   │       ├── BookResponse.java
    │   │   │       ├── TransactionResponse.java
    │   │   │       └── UserResponse.java
    │   │   ├── entity/
    │   │   │   ├── Book.java                        # Title, Author, ISBN, Category
    │   │   │   ├── BookCopy.java                    # Physical copy with AVAILABLE/BORROWED status
    │   │   │   ├── Transaction.java                 # Borrow record with fine calculation logic
    │   │   │   └── User.java                        # LIBRARIAN or MEMBER role
    │   │   ├── enums/
    │   │   │   ├── CopyStatus.java                  # AVAILABLE, BORROWED, DAMAGED, LOST
    │   │   │   ├── TransactionStatus.java           # ACTIVE, RETURNED, OVERDUE
    │   │   │   └── UserRole.java                    # LIBRARIAN, MEMBER
    │   │   ├── exception/
    │   │   │   ├── GlobalExceptionHandler.java      # @RestControllerAdvice — central error handling
    │   │   │   ├── BorrowLimitExceededException.java
    │   │   │   ├── DuplicateResourceException.java
    │   │   │   ├── InvalidOperationException.java
    │   │   │   ├── NoCopyAvailableException.java
    │   │   │   └── ResourceNotFoundException.java
    │   │   ├── repository/
    │   │   │   ├── BookCopyRepository.java          # findFirstAvailableCopyByBookId (custom JPQL)
    │   │   │   ├── BookRepository.java              # searchByTitleOrAuthor (partial match JPQL)
    │   │   │   ├── TransactionRepository.java       # findOverdueTransactions, countActiveBorrows
    │   │   │   └── UserRepository.java
    │   │   └── service/
    │   │       ├── BookService.java
    │   │       ├── TransactionService.java
    │   │       ├── UserService.java
    │   │       └── impl/
    │   │           ├── BookServiceImpl.java
    │   │           ├── TransactionServiceImpl.java  # Core borrow/return business logic
    │   │           └── UserServiceImpl.java
    │   └── resources/
    │       └── application.yml
    └── test/
        └── java/com/library/service/
            └── TransactionServiceTest.java          # 10 JUnit 5 + Mockito unit tests
```

---

## ⚙️ Configuration

All business rules are configurable via `application.yml` — no hardcoded magic numbers:

```yaml
library:
  max-borrow-limit: 5        # Max books a member can borrow concurrently
  borrow-duration-days: 14   # Default loan period
  fine-per-day: 0.50         # Fine in USD per overdue day

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/library_db
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:password}
```

---

## 🚀 Getting Started

### Prerequisites

- Java 17+
- Maven 3.8+
- MySQL 8+
- Node.js 18+ *(for the React frontend)*

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/library-management.git
cd library-management
```

### 2. Set Up the Database

```sql
CREATE DATABASE library_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configure Environment

Set environment variables or edit `application.yml` directly:

```bash
export DB_USERNAME=root
export DB_PASSWORD=your_password
```

### 4. Run the Backend

```bash
mvn clean install
mvn spring-boot:run
```

The API will start at **http://localhost:8080**.

> Hibernate will auto-create tables on first run (`ddl-auto: update`). Switch to `validate` or `none` in production.

### 5. Run the Frontend

The frontend is a single-file React component (`LibrarySystem.jsx`). To use it:

```bash
# Create a new React app (or add to an existing one)
npx create-react-app libra-frontend
cd libra-frontend

# Replace src/App.js with LibrarySystem.jsx content
# Then start the dev server
npm start
```

The frontend runs at **http://localhost:3000**.

---

## 📡 API Reference

All endpoints return a standardised envelope:

```json
{
  "success": true,
  "message": "Success",
  "data": { ... },
  "timestamp": "2026-03-20T10:00:00"
}
```

### Books — `/api/books`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/books` | Add a new book + initial copies |
| `GET` | `/api/books` | List all books (paginated) |
| `GET` | `/api/books/{id}` | Get book by ID |
| `GET` | `/api/books/isbn/{isbn}` | Get book by ISBN |
| `GET` | `/api/books/search?keyword=` | Search by title or author (partial match) |
| `GET` | `/api/books/category/{category}` | Filter by category |
| `GET` | `/api/books/available` | Books with at least one available copy |
| `PUT` | `/api/books/{id}` | Update book metadata |
| `DELETE` | `/api/books/{id}` | Delete a book |
| `POST` | `/api/books/{id}/copies?count=N` | Add more physical copies |

### Users — `/api/users`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/users` | Register a librarian or member |
| `GET` | `/api/users` | List all users (paginated) |
| `GET` | `/api/users/{id}` | Get user by ID |
| `GET` | `/api/users/email/{email}` | Get user by email |
| `PUT` | `/api/users/{id}` | Update user profile |
| `DELETE` | `/api/users/{id}` | Deactivate user (soft delete) |

### Transactions — `/api/transactions`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/transactions/borrow` | Borrow a book |
| `POST` | `/api/transactions/return` | Return a book + calculate fine |
| `GET` | `/api/transactions/{id}` | Get transaction by ID |
| `GET` | `/api/transactions/user/{userId}` | Transaction history for a member |
| `GET` | `/api/transactions/book/{bookId}` | Transaction history for a book |
| `GET` | `/api/transactions/overdue` | All currently overdue borrows |

### Example: Borrow a Book

```bash
POST /api/transactions/borrow
Content-Type: application/json

{
  "userId": 2,
  "bookId": 1
}
```

```json
{
  "success": true,
  "message": "Book borrowed successfully",
  "data": {
    "id": 101,
    "memberName": "James Sutherland",
    "bookTitle": "Clean Code",
    "copyCode": "BOOK-00001-COPY-002",
    "issueDate": "2026-03-20",
    "dueDate": "2026-04-03",
    "status": "ACTIVE",
    "fine": null
  }
}
```

### Example: Return a Book

```bash
POST /api/transactions/return
Content-Type: application/json

{
  "transactionId": 101
}
```

---

## 🏗️ Data Model

```
User (LIBRARIAN | MEMBER)
 └── has many → Transaction

Book
 └── has many → BookCopy (physical copies)
      └── has many → Transaction

Transaction
 ├── belongs to → User
 ├── belongs to → BookCopy
 ├── issueDate, dueDate, returnDate
 ├── status: ACTIVE | RETURNED | OVERDUE
 └── fine: calculated as (returnDate - dueDate) × $0.50/day
```

---

## 🔁 Business Logic

### Borrow Flow

The `TransactionServiceImpl.borrowBook()` enforces these guards in order:

1. User must exist and be **active**
2. User must have **MEMBER** role (Librarians cannot borrow)
3. User must not have exceeded **`maxBorrowLimit`** (default: 5) active borrows
4. At least one copy of the requested book must be **AVAILABLE**
5. Auto-assigns the first available `BookCopy`, marks it `BORROWED`
6. Creates a `Transaction` with `status = ACTIVE` and `dueDate = today + 14 days`

### Return + Fine Calculation

The `Transaction.calculateFine()` method lives on the entity itself:

```java
public BigDecimal calculateFine(BigDecimal finePerDay) {
    if (returnDate == null || !returnDate.isAfter(dueDate)) {
        return BigDecimal.ZERO;
    }
    long daysOverdue = ChronoUnit.DAYS.between(dueDate, returnDate);
    return finePerDay.multiply(BigDecimal.valueOf(daysOverdue));
}
```

- Returned on time → `status = RETURNED`, `fine = $0.00`
- Returned late → `status = OVERDUE`, `fine = daysLate × $0.50`
- `BookCopy` is reset to `AVAILABLE` in both cases

---

## 🧪 Running Tests

```bash
mvn test
```

`TransactionServiceTest` covers 10 unit tests using **JUnit 5 + Mockito**:

| Test | Scenario |
|------|----------|
| ✅ | Happy path borrow — valid member, available copy |
| ❌ | User not found |
| ❌ | Inactive user cannot borrow |
| ❌ | Librarian cannot borrow |
| ❌ | Member at borrow limit (5 books) |
| ❌ | No available copies |
| ✅ | On-time return — no fine |
| ✅ | Overdue return — correct fine calculated |
| ✅ | Return resets BookCopy to AVAILABLE |
| ❌ | Already-closed transaction cannot be returned again |

---

## 🛡️ Error Handling

All errors are caught by `GlobalExceptionHandler` (`@RestControllerAdvice`) and returned as consistent JSON:

| Exception | HTTP Status |
|-----------|-------------|
| `ResourceNotFoundException` | `404 Not Found` |
| `DuplicateResourceException` | `409 Conflict` |
| `NoCopyAvailableException` | `409 Conflict` |
| `BorrowLimitExceededException` | `422 Unprocessable Entity` |
| `InvalidOperationException` | `400 Bad Request` |
| `MethodArgumentNotValidException` | `400 Bad Request` (field-level errors) |
| Unhandled `Exception` | `500 Internal Server Error` |

---

## 🗺️ Roadmap

- [ ] **Spring Security + JWT** — protect endpoints; only Librarians can add/delete books
- [ ] **Swagger / OpenAPI** — auto-generated API docs at `/swagger-ui.html`
- [ ] **Email Notifications** — notify members when books are due or overdue
- [ ] **Integration Tests** — `@SpringBootTest` with H2 in-memory DB
- [ ] **Docker Compose** — containerise backend + MySQL together
- [ ] **Pagination UI** — page controls in the React frontend

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Built with ☕ Java · 🌱 Spring Boot · ⚛️ React
</div>
