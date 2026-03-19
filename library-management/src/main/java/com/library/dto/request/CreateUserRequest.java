package com.library.dto.request;

import com.library.enums.UserRole;
import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * DTO for POST /api/users — register a new librarian or member.
 */
@Data
public class CreateUserRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email format is invalid")
    @Size(max = 150)
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
    private String password;

    @NotNull(message = "Role is required (LIBRARIAN or MEMBER)")
    private UserRole role;
}
