package com.library.service;

import com.library.dto.request.CreateUserRequest;
import com.library.dto.response.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {

    UserResponse createUser(CreateUserRequest request);

    UserResponse getUserById(Long id);

    UserResponse getUserByEmail(String email);

    Page<UserResponse> getAllUsers(Pageable pageable);

    UserResponse updateUser(Long id, CreateUserRequest request);

    void deactivateUser(Long id);
}
