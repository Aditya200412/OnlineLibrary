package com.library.dto.response;

import com.library.enums.UserRole;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/** Returned by user endpoints — never exposes password. */
@Data
@Builder
public class UserResponse {
    private Long id;
    private String fullName;
    private String email;
    private UserRole role;
    private boolean active;
    private LocalDateTime createdAt;
}
