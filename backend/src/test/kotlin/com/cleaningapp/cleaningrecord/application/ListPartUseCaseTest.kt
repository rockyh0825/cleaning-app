package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.capabilities.PartManagementPort
import com.cleaningapp.floorplan.domain.OwnerType
import com.cleaningapp.floorplan.domain.Part
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import java.time.Instant
import java.util.UUID

@ExtendWith(MockKExtension::class)
class ListPartUseCaseTest {
    @MockK
    private lateinit var partManagementPort: PartManagementPort

    private val useCase by lazy { ListPartUseCase(partManagementPort) }

    private val userId = UUID.randomUUID()
    private val roomId = UUID.randomUUID()
    private val furnitureId = UUID.randomUUID()

    private fun makePart(
        ownerType: OwnerType = OwnerType.ROOM,
        ownerId: UUID = roomId,
        name: String = "床",
    ) = Part(
        id = UUID.randomUUID(),
        ownerType = ownerType,
        ownerId = ownerId,
        name = name,
        recommendedCycleDays = 7,
        lastCleanedAt = null,
        createdAt = Instant.now(),
        updatedAt = Instant.now(),
    )

    @Test
    fun `returns_all_parts_for_user_when_owner_id_is_not_specified`() {
        // Arrange
        val roomPart = makePart(ownerType = OwnerType.ROOM, ownerId = roomId, name = "床")
        val furniturePart = makePart(ownerType = OwnerType.FURNITURE, ownerId = furnitureId, name = "ソファ下")
        every { partManagementPort.findAllByUserId(userId) } returns listOf(roomPart, furniturePart)

        // Act
        val result = useCase.execute(userId, ownerId = null)

        // Assert
        assertThat(result).containsExactly(roomPart, furniturePart)
    }

    @Test
    fun `returns_only_parts_matching_owner_id_when_specified`() {
        // Arrange
        val roomPart = makePart(ownerType = OwnerType.ROOM, ownerId = roomId, name = "床")
        val furniturePart = makePart(ownerType = OwnerType.FURNITURE, ownerId = furnitureId, name = "ソファ下")
        every { partManagementPort.findAllByUserId(userId) } returns listOf(roomPart, furniturePart)

        // Act
        val result = useCase.execute(userId, ownerId = roomId)

        // Assert
        assertThat(result).containsExactly(roomPart)
    }

    @Test
    fun `returns_empty_list_when_no_parts_exist`() {
        // Arrange
        every { partManagementPort.findAllByUserId(userId) } returns emptyList()

        // Act
        val result = useCase.execute(userId, ownerId = null)

        // Assert
        assertThat(result).isEmpty()
    }

    @Test
    fun `returns_empty_list_when_owner_id_matches_no_parts`() {
        // Arrange
        val roomPart = makePart(ownerType = OwnerType.ROOM, ownerId = roomId)
        every { partManagementPort.findAllByUserId(userId) } returns listOf(roomPart)

        // Act
        val result = useCase.execute(userId, ownerId = UUID.randomUUID())

        // Assert
        assertThat(result).isEmpty()
    }
}
