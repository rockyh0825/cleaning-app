package com.cleaningapp.floorplan.application

import com.cleaningapp.floorplan.domain.Furniture
import com.cleaningapp.floorplan.domain.FurnitureRepository
import com.cleaningapp.floorplan.domain.Room
import com.cleaningapp.floorplan.domain.RoomRepository
import com.cleaningapp.floorplan.domain.RoomType
import com.cleaningapp.shared.exception.NotFoundException
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.justRun
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import java.time.Instant
import java.util.UUID

@ExtendWith(MockKExtension::class)
class UpdateFurnitureUseCaseTest {
    @MockK
    private lateinit var roomRepository: RoomRepository

    @MockK
    private lateinit var furnitureRepository: FurnitureRepository

    private val useCase by lazy { UpdateFurnitureUseCase(roomRepository, furnitureRepository) }

    private val userId: UUID = UUID.randomUUID()
    private val roomId: UUID = UUID.randomUUID()
    private val furnitureId: UUID = UUID.randomUUID()

    private fun buildRoom(ownerId: UUID = userId) =
        Room(
            id = roomId,
            userId = ownerId,
            name = "テストルーム",
            type = RoomType.BEDROOM,
            gridX = 0,
            gridY = 0,
            gridW = 5,
            gridH = 5,
            createdAt = Instant.now(),
            updatedAt = Instant.now(),
        )

    private fun buildFurniture() =
        Furniture(
            id = furnitureId,
            roomId = roomId,
            name = "元の名前",
            presetKey = null,
            gridX = 0,
            gridY = 0,
            gridW = 2,
            gridH = 2,
            createdAt = Instant.now(),
            updatedAt = Instant.now(),
        )

    @Test
    fun `updates_all_provided_fields`() {
        // Arrange
        every { furnitureRepository.findById(furnitureId) } returns buildFurniture()
        every { roomRepository.findById(roomId) } returns buildRoom()
        justRun { furnitureRepository.update(any()) }
        val command =
            UpdateFurnitureCommand(
                userId = userId,
                furnitureId = furnitureId,
                name = "新しい名前",
                gridX = 3,
                gridY = 4,
                gridW = 5,
                gridH = 6,
            )

        // Act
        val result = useCase.execute(command)

        // Assert
        assertThat(result.name).isEqualTo("新しい名前")
        assertThat(result.gridX).isEqualTo(3)
        assertThat(result.gridY).isEqualTo(4)
        assertThat(result.gridW).isEqualTo(5)
        assertThat(result.gridH).isEqualTo(6)
    }

    @Test
    fun `keeps_existing_values_when_fields_are_null`() {
        // Arrange
        val original = buildFurniture()
        every { furnitureRepository.findById(furnitureId) } returns original
        every { roomRepository.findById(roomId) } returns buildRoom()
        justRun { furnitureRepository.update(any()) }
        val command =
            UpdateFurnitureCommand(
                userId = userId,
                furnitureId = furnitureId,
                name = null,
                gridX = null,
                gridY = null,
                gridW = null,
                gridH = null,
            )

        // Act
        val result = useCase.execute(command)

        // Assert
        assertThat(result.name).isEqualTo(original.name)
        assertThat(result.gridX).isEqualTo(original.gridX)
        assertThat(result.gridY).isEqualTo(original.gridY)
        assertThat(result.gridW).isEqualTo(original.gridW)
        assertThat(result.gridH).isEqualTo(original.gridH)
    }

    @Test
    fun `updates_only_grid_when_name_is_null`() {
        // Arrange
        val original = buildFurniture()
        every { furnitureRepository.findById(furnitureId) } returns original
        every { roomRepository.findById(roomId) } returns buildRoom()
        justRun { furnitureRepository.update(any()) }
        val command =
            UpdateFurnitureCommand(
                userId = userId,
                furnitureId = furnitureId,
                name = null,
                gridX = 9,
                gridY = null,
                gridW = null,
                gridH = null,
            )

        // Act
        val result = useCase.execute(command)

        // Assert
        assertThat(result.name).isEqualTo(original.name)
        assertThat(result.gridX).isEqualTo(9)
    }

    @Test
    fun `persists_update_via_furniture_repository`() {
        // Arrange
        every { furnitureRepository.findById(furnitureId) } returns buildFurniture()
        every { roomRepository.findById(roomId) } returns buildRoom()
        val updatedSlot = slot<Furniture>()
        every { furnitureRepository.update(capture(updatedSlot)) } returns Unit
        val command =
            UpdateFurnitureCommand(
                userId = userId,
                furnitureId = furnitureId,
                name = "保存確認",
                gridX = null,
                gridY = null,
                gridW = null,
                gridH = null,
            )

        // Act
        useCase.execute(command)

        // Assert
        verify(exactly = 1) { furnitureRepository.update(any()) }
        assertThat(updatedSlot.captured.name).isEqualTo("保存確認")
    }

    @Test
    fun `throws_not_found_when_furniture_does_not_exist`() {
        // Arrange
        every { furnitureRepository.findById(furnitureId) } returns null
        val command =
            UpdateFurnitureCommand(
                userId = userId,
                furnitureId = furnitureId,
                name = "名前",
                gridX = null,
                gridY = null,
                gridW = null,
                gridH = null,
            )

        // Act & Assert
        assertThrows<NotFoundException> { useCase.execute(command) }
    }

    @Test
    fun `throws_not_found_when_owning_room_belongs_to_different_user`() {
        // Arrange
        val otherUserId = UUID.randomUUID()
        every { furnitureRepository.findById(furnitureId) } returns buildFurniture()
        every { roomRepository.findById(roomId) } returns buildRoom(ownerId = otherUserId)
        val command =
            UpdateFurnitureCommand(
                userId = userId,
                furnitureId = furnitureId,
                name = "名前",
                gridX = null,
                gridY = null,
                gridW = null,
                gridH = null,
            )

        // Act & Assert
        assertThrows<NotFoundException> { useCase.execute(command) }
    }

    @Test
    fun `throws_not_found_when_owning_room_does_not_exist`() {
        // Arrange
        every { furnitureRepository.findById(furnitureId) } returns buildFurniture()
        every { roomRepository.findById(roomId) } returns null
        val command =
            UpdateFurnitureCommand(
                userId = userId,
                furnitureId = furnitureId,
                name = "名前",
                gridX = null,
                gridY = null,
                gridW = null,
                gridH = null,
            )

        // Act & Assert
        assertThrows<NotFoundException> { useCase.execute(command) }
    }
}
