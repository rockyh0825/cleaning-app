package com.cleaningapp.cleaningrecord.domain

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.Instant
import java.time.temporal.ChronoUnit

class CleaningStatusTest {

    @Test
    fun `elapsed_ratio_is_1_0_when_last_cleaned_exactly_at_cycle_boundary`() {
        // Arrange
        val now = Instant.now()
        val lastCleanedAt = now.minus(7, ChronoUnit.DAYS)
        val recommendedCycleDays = 7

        // Act
        val status = CleaningStatus.compute(lastCleanedAt, recommendedCycleDays, now)

        // Assert
        assertThat(status.elapsedRatio).isEqualTo(1.0)
    }

    @Test
    fun `level_is_GREEN_when_elapsed_ratio_is_below_0_8`() {
        // Arrange
        val now = Instant.now()
        // 5 days elapsed / 10 day cycle = 0.5 (< 0.8)
        val lastCleanedAt = now.minus(5, ChronoUnit.DAYS)
        val recommendedCycleDays = 10

        // Act
        val status = CleaningStatus.compute(lastCleanedAt, recommendedCycleDays, now)

        // Assert
        assertThat(status.level).isEqualTo(CleaningStatusLevel.GREEN)
    }

    @Test
    fun `level_is_YELLOW_when_elapsed_ratio_is_0_8_or_above_but_below_1_0`() {
        // Arrange
        val now = Instant.now()
        // 8 days elapsed / 10 day cycle = 0.8 (>= 0.8, < 1.0)
        val lastCleanedAt = now.minus(8, ChronoUnit.DAYS)
        val recommendedCycleDays = 10

        // Act
        val status = CleaningStatus.compute(lastCleanedAt, recommendedCycleDays, now)

        // Assert
        assertThat(status.level).isEqualTo(CleaningStatusLevel.YELLOW)
    }

    @Test
    fun `level_is_RED_when_elapsed_ratio_is_1_0_or_above`() {
        // Arrange
        val now = Instant.now()
        // 11 days elapsed / 10 day cycle = 1.1 (>= 1.0)
        val lastCleanedAt = now.minus(11, ChronoUnit.DAYS)
        val recommendedCycleDays = 10

        // Act
        val status = CleaningStatus.compute(lastCleanedAt, recommendedCycleDays, now)

        // Assert
        assertThat(status.level).isEqualTo(CleaningStatusLevel.RED)
    }

    @Test
    fun `level_is_RED_when_last_cleaned_at_is_null`() {
        // Arrange
        val now = Instant.now()
        val recommendedCycleDays = 7

        // Act
        val status = CleaningStatus.compute(null, recommendedCycleDays, now)

        // Assert
        assertThat(status.level).isEqualTo(CleaningStatusLevel.RED)
        assertThat(status.elapsedRatio).isEqualTo(Double.MAX_VALUE)
    }
}
