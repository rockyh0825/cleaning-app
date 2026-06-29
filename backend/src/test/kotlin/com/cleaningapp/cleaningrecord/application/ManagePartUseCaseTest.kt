package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.capabilities.PartManagementPort
import com.cleaningapp.floorplan.domain.OwnerType
import com.cleaningapp.floorplan.domain.Part
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
class ManagePartUseCaseTest {
    @MockK
    private lateinit var partManagementPort: PartManagementPort

    private val useCase by lazy { ManagePartUseCase(partManagementPort) }

    private val userId = UUID.randomUUID()
    private val partId = UUID.randomUUID()
    private val ownerId = UUID.randomUUID()

    private fun makePart(
        id: UUID = partId,
        name: String = "テストパーツ",
        recommendedCycleDays: Int = 7,
    ) = Part(
        id = id,
        ownerType = OwnerType.ROOM,
        ownerId = ownerId,
        name = name,
        recommendedCycleDays = recommendedCycleDays,
        lastCleanedAt = null,
        createdAt = Instant.now(),
        updatedAt = Instant.now(),
    )

    @Test
    fun `creates_part_with_given_properties`() {
        // Arrange
        val partSlot = slot<Part>()
        every { partManagementPort.create(capture(partSlot)) } answers { partSlot.captured }

        // Act
        val result = useCase.createPart(userId, OwnerType.ROOM, ownerId, "床", 7)

        // Assert
        assertThat(result.name).isEqualTo("床")
        assertThat(result.ownerType).isEqualTo(OwnerType.ROOM)
        assertThat(result.ownerId).isEqualTo(ownerId)
        assertThat(result.recommendedCycleDays).isEqualTo(7)
        assertThat(result.lastCleanedAt).isNull()
    }

    @Test
    fun `created_part_has_new_uuid`() {
        // Arrange
        val partSlot = slot<Part>()
        every { partManagementPort.create(capture(partSlot)) } answers { partSlot.captured }

        // Act
        val result = useCase.createPart(userId, OwnerType.ROOM, ownerId, "床", 7)

        // Assert
        assertThat(result.id).isNotNull()
    }

    @Test
    fun `updates_part_name_when_new_name_is_provided`() {
        // Arrange
        val part = makePart(name = "古い名前")
        every { partManagementPort.findById(partId) } returns part
        val updatedSlot = slot<Part>()
        justRun { partManagementPort.update(capture(updatedSlot)) }

        // Act
        val result = useCase.updatePart(userId, partId, "新しい名前", null)

        // Assert
        assertThat(result.name).isEqualTo("新しい名前")
    }

    @Test
    fun `updates_recommended_cycle_days_when_new_value_is_provided`() {
        // Arrange
        val part = makePart(recommendedCycleDays = 7)
        every { partManagementPort.findById(partId) } returns part
        val updatedSlot = slot<Part>()
        justRun { partManagementPort.update(capture(updatedSlot)) }

        // Act
        val result = useCase.updatePart(userId, partId, null, 14)

        // Assert
        assertThat(result.recommendedCycleDays).isEqualTo(14)
    }

    @Test
    fun `preserves_existing_name_when_null_is_provided`() {
        // Arrange
        val part = makePart(name = "元の名前")
        every { partManagementPort.findById(partId) } returns part
        val updatedSlot = slot<Part>()
        justRun { partManagementPort.update(capture(updatedSlot)) }

        // Act
        val result = useCase.updatePart(userId, partId, null, 14)

        // Assert
        assertThat(result.name).isEqualTo("元の名前")
    }

    @Test
    fun `throws_not_found_exception_when_updating_non_existent_part`() {
        // Arrange
        every { partManagementPort.findById(partId) } returns null

        // Act / Assert
        assertThatThrownBy {
            useCase.updatePart(userId, partId, "新名前", null)
        }.isInstanceOf(NotFoundException::class.java)
    }

    @Test
    fun `deletes_part_when_it_exists`() {
        // Arrange
        justRun { partManagementPort.delete(partId) }

        // Act
        useCase.deletePart(userId, partId)

        // Assert
        verify(exactly = 1) { partManagementPort.delete(partId) }
    }
}
