package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.cleaningrecord.domain.CleaningRecord
import com.cleaningapp.cleaningrecord.domain.CleaningRecordRepository
import com.cleaningapp.shared.exception.NotFoundException
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.justRun
import io.mockk.verify
import io.mockk.verifyOrder
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import java.time.Instant
import java.util.UUID

@ExtendWith(MockKExtension::class)
class DeleteRecordUseCaseTest {
    @MockK
    private lateinit var cleaningRecordRepository: CleaningRecordRepository

    @MockK
    private lateinit var recomputeLastCleanedService: RecomputeLastCleanedService

    private val useCase by lazy {
        DeleteRecordUseCase(cleaningRecordRepository, recomputeLastCleanedService)
    }

    private val partId: UUID = UUID.randomUUID()
    private val recordId: UUID = UUID.randomUUID()

    private fun buildRecord() =
        CleaningRecord(
            id = recordId,
            partId = partId,
            userId = UUID.randomUUID(),
            cleanedAt = Instant.now(),
            note = null,
            createdAt = Instant.now(),
            updatedAt = Instant.now(),
        )

    @Test
    fun `deletes_record_and_calls_recompute_for_part`() {
        // Arrange
        every { cleaningRecordRepository.findById(recordId) } returns buildRecord()
        justRun { cleaningRecordRepository.delete(recordId) }
        justRun { recomputeLastCleanedService.execute(partId) }

        // Act
        useCase.execute(recordId)

        // Assert
        verify { cleaningRecordRepository.delete(recordId) }
        verify { recomputeLastCleanedService.execute(partId) }
    }

    @Test
    fun `calls_recompute_after_delete_not_before`() {
        // Arrange
        every { cleaningRecordRepository.findById(recordId) } returns buildRecord()
        justRun { cleaningRecordRepository.delete(recordId) }
        justRun { recomputeLastCleanedService.execute(partId) }

        // Act
        useCase.execute(recordId)

        // Assert
        verifyOrder {
            cleaningRecordRepository.delete(recordId)
            recomputeLastCleanedService.execute(partId)
        }
    }

    @Test
    fun `throws_not_found_when_record_does_not_exist`() {
        // Arrange
        every { cleaningRecordRepository.findById(recordId) } returns null

        // Act & Assert
        assertThrows<NotFoundException> { useCase.execute(recordId) }
        verify(exactly = 0) { cleaningRecordRepository.delete(any()) }
        verify(exactly = 0) { recomputeLastCleanedService.execute(any()) }
    }
}
