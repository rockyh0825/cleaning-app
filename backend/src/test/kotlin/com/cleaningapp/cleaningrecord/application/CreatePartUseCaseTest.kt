package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.capabilities.PartManagementPort
import com.cleaningapp.floorplan.domain.OwnerType
import com.cleaningapp.floorplan.domain.Part
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.slot
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import java.util.UUID

@ExtendWith(MockKExtension::class)
class CreatePartUseCaseTest {
    @MockK
    private lateinit var partManagementPort: PartManagementPort

    private val useCase by lazy { CreatePartUseCase(partManagementPort) }

    private val userId = UUID.randomUUID()
    private val ownerId = UUID.randomUUID()

    @Test
    fun `creates_part_with_given_properties`() {
        // Arrange
        val partSlot = slot<Part>()
        every { partManagementPort.create(capture(partSlot)) } answers { partSlot.captured }

        // Act
        val result = useCase.execute(userId, OwnerType.ROOM, ownerId, "床", 7)

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
        val result = useCase.execute(userId, OwnerType.ROOM, ownerId, "床", 7)

        // Assert
        assertThat(result.id).isNotNull()
    }

    @Test
    fun `created_part_has_null_last_cleaned_at`() {
        // Arrange
        val partSlot = slot<Part>()
        every { partManagementPort.create(capture(partSlot)) } answers { partSlot.captured }

        // Act
        val result = useCase.execute(userId, OwnerType.ROOM, ownerId, "床", 7)

        // Assert
        assertThat(result.lastCleanedAt).isNull()
    }

    @Test
    fun `created_at_and_updated_at_are_equal_on_creation`() {
        // Arrange
        val partSlot = slot<Part>()
        every { partManagementPort.create(capture(partSlot)) } answers { partSlot.captured }

        // Act
        val result = useCase.execute(userId, OwnerType.ROOM, ownerId, "床", 7)

        // Assert
        assertThat(result.createdAt).isEqualTo(result.updatedAt)
    }
}
