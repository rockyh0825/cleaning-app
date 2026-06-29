package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.cleaningrecord.domain.CleaningRecord
import com.cleaningapp.cleaningrecord.domain.CleaningRecordRepository
import com.cleaningapp.shared.exception.NotFoundException
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.justRun
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import java.time.Instant
import java.util.UUID

@ExtendWith(MockKExtension::class)
class DeleteRecordUseCaseTest {
    @MockK
    private lateinit var cleaningRecordRepository: CleaningRecordRepository

    @MockK
    private lateinit var recomputeLastCleanedService: RecomputeLastCleanedService

    private val useCase by lazy { DeleteRecordUseCase(cleaningRecordRepository, recomputeLastCleanedService) }

    private val userId = UUID.randomUUID()
    private val recordId = UUID.randomUUID()
    private val partId = UUID.randomUUID()

    private fun makeRecord() =
        CleaningRecord(
            id = recordId,
            partId = partId,
            userId = userId,
            cleanedAt = Instant.parse("2024-06-01T10:00:00Z"),
            note = null,
            createdAt = Instant.now(),
            updatedAt = Instant.now(),
        )

    @Test
    fun `throws_not_found_exception_when_record_does_not_exist`() {
        // Arrange
        every { cleaningRecordRepository.findById(recordId) } returns null

        // Act / Assert
        assertThatThrownBy {
            useCase.execute(userId, recordId)
        }.isInstanceOf(NotFoundException::class.java)
    }

    @Test
    fun `deletes_record_when_it_exists`() {
        // Arrange
        val record = makeRecord()
        every { cleaningRecordRepository.findById(recordId) } returns record
        justRun { cleaningRecordRepository.delete(recordId) }
        justRun { recomputeLastCleanedService.recompute(any()) }

        // Act
        useCase.execute(userId, recordId)

        // Assert
        verify(exactly = 1) { cleaningRecordRepository.delete(recordId) }
    }

    @Test
    fun `calls_recompute_after_deleting_record`() {
        // Arrange
        val record = makeRecord()
        every { cleaningRecordRepository.findById(recordId) } returns record
        justRun { cleaningRecordRepository.delete(recordId) }
        justRun { recomputeLastCleanedService.recompute(any()) }

        // Act
        useCase.execute(userId, recordId)

        // Assert
        verify(exactly = 1) { recomputeLastCleanedService.recompute(partId) }
    }

    @Test
    fun `recompute_is_called_after_delete_so_last_cleaned_at_can_become_null`() {
        // Arrange
        val record = makeRecord()
        every { cleaningRecordRepository.findById(recordId) } returns record
        justRun { cleaningRecordRepository.delete(recordId) }
        justRun { recomputeLastCleanedService.recompute(any()) }

        // Act
        useCase.execute(userId, recordId)

        // Assert
        // 削除後に recompute が呼ばれることで lastCleanedAt が null になりうる
        verify { cleaningRecordRepository.delete(recordId) }
        verify { recomputeLastCleanedService.recompute(partId) }
    }
}
