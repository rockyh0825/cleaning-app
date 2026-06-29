package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.cleaningrecord.domain.CleaningRecord
import com.cleaningapp.cleaningrecord.domain.CleaningRecordRepository
import com.cleaningapp.shared.exception.NotFoundException
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.justRun
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import java.time.Instant
import java.util.UUID

@ExtendWith(MockKExtension::class)
class EditRecordUseCaseTest {
    @MockK
    private lateinit var cleaningRecordRepository: CleaningRecordRepository

    @MockK
    private lateinit var recomputeLastCleanedService: RecomputeLastCleanedService

    private val useCase by lazy { EditRecordUseCase(cleaningRecordRepository, recomputeLastCleanedService) }

    private val userId = UUID.randomUUID()
    private val recordId = UUID.randomUUID()
    private val partId = UUID.randomUUID()
    private val originalCleanedAt = Instant.parse("2024-05-01T10:00:00Z")

    private fun makeRecord() =
        CleaningRecord(
            id = recordId,
            partId = partId,
            userId = userId,
            cleanedAt = originalCleanedAt,
            note = "元のメモ",
            createdAt = Instant.now(),
            updatedAt = Instant.now(),
        )

    @Test
    fun `throws_not_found_exception_when_record_does_not_exist`() {
        // Arrange
        every { cleaningRecordRepository.findById(recordId) } returns null

        // Act / Assert
        assertThatThrownBy {
            useCase.execute(userId, recordId, null, null)
        }.isInstanceOf(NotFoundException::class.java)
    }

    @Test
    fun `updates_cleaned_at_when_new_value_is_provided`() {
        // Arrange
        val record = makeRecord()
        val newCleanedAt = Instant.parse("2024-06-01T10:00:00Z")
        every { cleaningRecordRepository.findById(recordId) } returns record
        val savedSlot = slot<CleaningRecord>()
        every { cleaningRecordRepository.save(capture(savedSlot)) } answers { savedSlot.captured }
        justRun { recomputeLastCleanedService.recompute(any()) }

        // Act
        val result = useCase.execute(userId, recordId, newCleanedAt, null)

        // Assert
        assertThat(result.cleanedAt).isEqualTo(newCleanedAt)
    }

    @Test
    fun `updates_note_when_new_value_is_provided`() {
        // Arrange
        val record = makeRecord()
        val newNote = "新しいメモ"
        every { cleaningRecordRepository.findById(recordId) } returns record
        val savedSlot = slot<CleaningRecord>()
        every { cleaningRecordRepository.save(capture(savedSlot)) } answers { savedSlot.captured }
        justRun { recomputeLastCleanedService.recompute(any()) }

        // Act
        val result = useCase.execute(userId, recordId, null, newNote)

        // Assert
        assertThat(result.note).isEqualTo(newNote)
    }

    @Test
    fun `preserves_existing_cleaned_at_when_new_value_is_null`() {
        // Arrange
        val record = makeRecord()
        every { cleaningRecordRepository.findById(recordId) } returns record
        val savedSlot = slot<CleaningRecord>()
        every { cleaningRecordRepository.save(capture(savedSlot)) } answers { savedSlot.captured }
        justRun { recomputeLastCleanedService.recompute(any()) }

        // Act
        val result = useCase.execute(userId, recordId, null, "新メモ")

        // Assert
        assertThat(result.cleanedAt).isEqualTo(originalCleanedAt)
    }

    @Test
    fun `calls_recompute_after_saving_updated_record`() {
        // Arrange
        val record = makeRecord()
        every { cleaningRecordRepository.findById(recordId) } returns record
        val savedSlot = slot<CleaningRecord>()
        every { cleaningRecordRepository.save(capture(savedSlot)) } answers { savedSlot.captured }
        justRun { recomputeLastCleanedService.recompute(any()) }

        // Act
        useCase.execute(userId, recordId, Instant.now(), null)

        // Assert
        verify(exactly = 1) { recomputeLastCleanedService.recompute(partId) }
    }
}
