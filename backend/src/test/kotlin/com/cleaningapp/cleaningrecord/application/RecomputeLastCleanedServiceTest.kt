package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.cleaningrecord.domain.CleaningRecordRepository
import com.cleaningapp.floorplan.domain.OwnerType
import com.cleaningapp.floorplan.domain.Part
import com.cleaningapp.floorplan.domain.PartRepository
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
class RecomputeLastCleanedServiceTest {
    @MockK
    private lateinit var cleaningRecordRepository: CleaningRecordRepository

    @MockK
    private lateinit var partRepository: PartRepository

    private val service by lazy {
        RecomputeLastCleanedService(cleaningRecordRepository, partRepository)
    }

    private val partId: UUID = UUID.randomUUID()

    private fun buildPart(lastCleanedAt: Instant? = null) =
        Part(
            id = partId,
            ownerType = OwnerType.ROOM,
            ownerId = UUID.randomUUID(),
            name = "テストパーツ",
            recommendedCycleDays = 7,
            lastCleanedAt = lastCleanedAt,
            createdAt = Instant.now(),
            updatedAt = Instant.now(),
        )

    @Test
    fun `updates_part_last_cleaned_at_with_max_cleaned_at_when_records_exist`() {
        // Arrange
        val maxCleanedAt = Instant.parse("2024-01-15T10:00:00Z")
        val part = buildPart()
        every { cleaningRecordRepository.findMaxCleanedAtByPartId(partId) } returns maxCleanedAt
        every { partRepository.findById(partId) } returns part
        val updatedSlot = slot<Part>()
        justRun { partRepository.update(capture(updatedSlot)) }

        // Act
        service.execute(partId)

        // Assert
        assertThat(updatedSlot.captured.lastCleanedAt).isEqualTo(maxCleanedAt)
        assertThat(updatedSlot.captured.id).isEqualTo(partId)
        verify(exactly = 1) { partRepository.update(any()) }
    }

    @Test
    fun `updates_part_last_cleaned_at_to_null_when_no_records_exist`() {
        // Arrange
        val part = buildPart(lastCleanedAt = Instant.parse("2024-01-10T10:00:00Z"))
        every { cleaningRecordRepository.findMaxCleanedAtByPartId(partId) } returns null
        every { partRepository.findById(partId) } returns part
        val updatedSlot = slot<Part>()
        justRun { partRepository.update(capture(updatedSlot)) }

        // Act
        service.execute(partId)

        // Assert
        assertThat(updatedSlot.captured.lastCleanedAt).isNull()
        verify(exactly = 1) { partRepository.update(any()) }
    }
}
