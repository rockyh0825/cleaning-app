package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.cleaningrecord.domain.CleaningRecord
import com.cleaningapp.cleaningrecord.domain.CleaningRecordRepository
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.justRun
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import java.time.Instant
import java.util.UUID

@ExtendWith(MockKExtension::class)
class LogCleaningUseCaseTest {
    @MockK
    private lateinit var cleaningRecordRepository: CleaningRecordRepository

    @MockK
    private lateinit var recomputeLastCleanedService: RecomputeLastCleanedService

    private val useCase by lazy { LogCleaningUseCase(cleaningRecordRepository, recomputeLastCleanedService) }

    private val userId = UUID.randomUUID()
    private val cleanedAt = Instant.parse("2024-06-01T10:00:00Z")

    @Test
    fun `returns_saved_records_when_logging_multiple_parts`() {
        // Arrange
        val partId1 = UUID.randomUUID()
        val partId2 = UUID.randomUUID()
        val recordSlot = slot<CleaningRecord>()
        every { cleaningRecordRepository.save(capture(recordSlot)) } answers { recordSlot.captured }
        justRun { recomputeLastCleanedService.recompute(any()) }

        // Act
        val result = useCase.execute(userId, listOf(partId1, partId2), cleanedAt, "メモ")

        // Assert
        assertThat(result).hasSize(2)
    }

    @Test
    fun `records_are_saved_in_single_transaction_when_logging_multiple_parts`() {
        // Arrange
        val partIds = listOf(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID())
        val recordSlot = slot<CleaningRecord>()
        every { cleaningRecordRepository.save(capture(recordSlot)) } answers { recordSlot.captured }
        justRun { recomputeLastCleanedService.recompute(any()) }

        // Act
        useCase.execute(userId, partIds, cleanedAt, null)

        // Assert
        verify(exactly = 3) { cleaningRecordRepository.save(any()) }
    }

    @Test
    fun `recompute_is_called_for_each_part_after_saving`() {
        // Arrange
        val partId1 = UUID.randomUUID()
        val partId2 = UUID.randomUUID()
        val recordSlot = slot<CleaningRecord>()
        every { cleaningRecordRepository.save(capture(recordSlot)) } answers { recordSlot.captured }
        justRun { recomputeLastCleanedService.recompute(any()) }

        // Act
        useCase.execute(userId, listOf(partId1, partId2), cleanedAt, null)

        // Assert
        verify(exactly = 1) { recomputeLastCleanedService.recompute(partId1) }
        verify(exactly = 1) { recomputeLastCleanedService.recompute(partId2) }
    }

    @Test
    fun `saved_records_have_correct_properties`() {
        // Arrange
        val partId = UUID.randomUUID()
        val note = "テストメモ"
        val recordSlot = slot<CleaningRecord>()
        every { cleaningRecordRepository.save(capture(recordSlot)) } answers { recordSlot.captured }
        justRun { recomputeLastCleanedService.recompute(any()) }

        // Act
        val result = useCase.execute(userId, listOf(partId), cleanedAt, note)

        // Assert
        val record = result.first()
        assertThat(record.partId).isEqualTo(partId)
        assertThat(record.userId).isEqualTo(userId)
        assertThat(record.cleanedAt).isEqualTo(cleanedAt)
        assertThat(record.note).isEqualTo(note)
    }

    @Test
    fun `each_record_has_unique_uuid`() {
        // Arrange
        val partIds = listOf(UUID.randomUUID(), UUID.randomUUID())
        val recordSlot = slot<CleaningRecord>()
        every { cleaningRecordRepository.save(capture(recordSlot)) } answers { recordSlot.captured }
        justRun { recomputeLastCleanedService.recompute(any()) }

        // Act
        val result = useCase.execute(userId, partIds, cleanedAt, null)

        // Assert
        val ids = result.map { it.id }
        assertThat(ids).doesNotHaveDuplicates()
    }
}
