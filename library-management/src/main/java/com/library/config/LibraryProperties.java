package com.library.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

/**
 * Binds library.* properties from application.yml into a typed bean.
 * Avoids scattering @Value annotations across services.
 */
@Configuration
@ConfigurationProperties(prefix = "library")
@Getter
@Setter
public class LibraryProperties {

    /** Maximum books a member may have borrowed concurrently. */
    private int maxBorrowLimit = 5;

    /** Default loan period in calendar days. */
    private int borrowDurationDays = 14;

    /** Fine charged per overdue day (in dollars). */
    private BigDecimal finePerDay = new BigDecimal("0.50");
}
