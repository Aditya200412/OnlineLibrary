package com.library.repository;

import com.library.entity.User;
import com.library.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(UserRole role);

    List<User> findByActiveTrue();

    /** Find active members only (used for borrow eligibility checks). */
    @Query("SELECT u FROM User u WHERE u.role = 'MEMBER' AND u.active = true")
    List<User> findActiveMembers();
}
