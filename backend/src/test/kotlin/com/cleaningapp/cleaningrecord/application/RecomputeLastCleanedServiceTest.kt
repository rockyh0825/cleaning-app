package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.capabilities.PartManagementPort
import com.cleaningapp.cleaningrecord.domain.CleaningRecordRepository
import com.cleaningapp.floorplan.domain.OwnerType
import com.cleaningapp.floorplan.domain.Part
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
    private lateinit var partManagementPort: PartManagementPort

    private val service by lazy { RecomputeLastCleanedService(cleaningRecordRepository, partManagementPort) }

    private val partId = UUID.randomUUID()

    private fun makePart(lastCleanedAt: Instant? = null) =
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
        val maxCleanedAt = Instant.parse("2024-06-01T10:00:00Z")
        val part = makePart()
        every { cleaningRecordRepository.findMaxCleanedAtByPartId(partId) } returns maxCleanedAt
        every { partManagementPort.findById(partId) } returns part
        val updatedPartSlot = slot<Part>()
        justRun { partManagementPort.update(capture(updatedPartSlot)) }

        // Act
        service.recompute(partId)

        // Assert
        assertThat(updatedPartSlot.captured.lastCleanedAt).isEqualTo(maxCleanedAt)
    }

    @Test
    fun `sets_last_cleaned_at_to_null_when_no_cleaning_records_exist`() {
        // Arrange
        val part = makePart(lastCleanedAt = Instant.parse("2024-05-01T10:00:00Z"))
        every { cleaningRecordRepository.findMaxCleanedAtByPartId(partId) } returns null
        every { partManagementPort.findById(partId) } returns part
        val updatedPartSlot = slot<Part>()
        justRun { partManagementPort.update(capture(updatedPartSlot)) }

        // Act
        service.recompute(partId)

        // Assert
        assertThat(updatedPartSlot.captured.lastCleanedAt).isNull()
    }

    @Test
    fun `calls_part_management_port_update_exactly_once`() {
        // Arrange
        val maxCleanedAt = Instant.parse("2024-06-01T10:00:00Z")
        val part = makePart()
        every { cleaningRecordRepository.findMaxCleanedAtByPartId(partId) } returns maxCleanedAt
        every { partManagementPort.findById(partId) } returns part
        justRun { partManagementPort.update(any()) }

        // Act
        service.recompute(partId)

        // Assert
        verify(exactly = 1) { partManagementPort.update(any()) }
    }

    @Test
    fun `preserves_other_part_fields_when_updating_last_cleaned_at`() {
        // Arrange
        val maxCleanedAt = Instant.parse("2024-06-01T10:00:00Z")
        val part = makePart()
        every { cleaningRecordRepository.findMaxCleanedAtByPartId(partId) } returns maxCleanedAt
        every { partManagementPort.findById(partId) } returns part
        val updatedPartSlot = slot<Part>()
        justRun { partManagementPort.update(capture(updatedPartSlot)) }

        // Act
        service.recompute(partId)

        // Assert
        val updated = updatedPartSlot.captured
        assertThat(updated.id).isEqualTo(part.id)
        assertThat(updated.name).isEqualTo(part.name)
        assertThat(updated.recommendedCycleDays).isEqualTo(part.recommendedCycleDays)
        assertThat(updated.ownerType).isEqualTo(part.ownerType)
        assertThat(updated.ownerId).isEqualTo(part.ownerId)
    }
}
