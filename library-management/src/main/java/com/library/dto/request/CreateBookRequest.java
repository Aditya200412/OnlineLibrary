package com.library.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * DTO for POST /api/books — create a new book record.
 * Jakarta Validation annotations enforce business rules at the API boundary.
 */
@Data
public class CreateBookRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @NotBlank(message = "Author is required")
    @Size(max = 150, message = "Author name must not exceed 150 characters")
    private String author;

    @NotBlank(message = "ISBN is required")
    @Pattern(
        regexp = "^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$",
        message = "ISBN format is invalid"
    )
    private String isbn;

    @Size(max = 100, message = "Category must not exceed 100 characters")
    private String category;

    private String description;

    @NotBlank(message = "Published year is required")
    @Pattern(regexp = "^\\d{4}$", message = "Published year must be a 4-digit year")
    private String publishedYear;

    /** Number of physical copies to create when registering the book. */
    @Min(value = 1, message = "At least 1 copy must be added")
    @Max(value = 100, message = "Cannot add more than 100 copies at once")
    private int initialCopies = 1;
}
