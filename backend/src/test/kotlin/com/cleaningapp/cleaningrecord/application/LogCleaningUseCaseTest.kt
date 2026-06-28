package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.cleaningrecord.domain.CleaningRecordRepository
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.justRun
import io.mockk.verify
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import java.util.UUID

@ExtendWith(MockKExtension::class)
class LogCleaningUseCaseTest {
    @MockK
    private lateinit var cleaningRecordRepository: CleaningRecordRepository

    @MockK
    private lateinit var recomputeLastCleanedService: RecomputeLastCleanedService

    private val useCase by lazy {
        LogCleaningUseCase(cleaningRecordRepository, recomputeLastCleanedService)
    }

    private val userId: UUID = UUID.randomUUID()

    @Test
    fun `saves_records_for_all_part_ids_and_calls_recompute_for_each`() {
        // Arrange
        val partId1 = UUID.randomUUID()
        val partId2 = UUID.randomUUID()
        every { cleaningRecordRepository.save(any()) } answers { firstArg() }
        justRun { recomputeLastCleanedService.execute(any()) }

        val command =
            LogCleaningCommand(
                userId = userId,
                partIds = listOf(partId1, partId2),
            )

        // Act
        useCase.execute(command)

        // Assert
        verify(exactly = 2) { cleaningRecordRepository.save(any()) }
        verify(exactly = 1) { recomputeLastCleanedService.execute(partId1) }
        verify(exactly = 1) { recomputeLastCleanedService.execute(partId2) }
    }

    @Test
    fun `does_not_call_recompute_when_repository_save_throws_exception`() {
        // Arrange
        val partId = UUID.randomUUID()
        every { cleaningRecordRepository.save(any()) } throws RuntimeException("DB error")

        val command =
            LogCleaningCommand(
                userId = userId,
                partIds = listOf(partId),
            )

        // Act & Assert
        assertThrows<RuntimeException> { useCase.execute(command) }
        verify(exactly = 0) { recomputeLastCleanedService.execute(any()) }
    }
}
