package com.cleaningapp.floorplan.application

import com.cleaningapp.floorplan.domain.FurnitureRepository
import com.cleaningapp.floorplan.domain.Room
import com.cleaningapp.floorplan.domain.RoomRepository
import com.cleaningapp.floorplan.domain.RoomType
import com.cleaningapp.shared.exception.NotFoundException
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.justRun
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import java.time.Instant
import java.util.UUID

@ExtendWith(MockKExtension::class)
class AddFurnitureUseCaseTest {
    @MockK
    private lateinit var roomRepository: RoomRepository

    @MockK
    private lateinit var furnitureRepository: FurnitureRepository

    private val useCase by lazy { AddFurnitureUseCase(roomRepository, furnitureRepository) }

    private val userId: UUID = UUID.randomUUID()
    private val roomId: UUID = UUID.randomUUID()

    private fun buildRoom(ownerId: UUID = userId) =
        Room(
            id = roomId,
            userId = ownerId,
            name = "テストルーム",
            type = RoomType.BEDROOM,
            gridX = 0,
            gridY = 0,
            gridW = 4,
            gridH = 4,
            createdAt = Instant.now(),
            updatedAt = Instant.now(),
        )

    @Test
    fun `saves_furniture_with_given_properties_when_command_is_valid`() {
        // Arrange
        every { roomRepository.findById(roomId) } returns buildRoom()
        justRun { furnitureRepository.save(any()) }
        val command =
            AddFurnitureCommand(
                userId = userId,
                roomId = roomId,
                name = "ベッド",
                presetKey = "bed",
                gridX = 1,
                gridY = 1,
                gridW = 2,
                gridH = 3,
            )

        // Act
        val result = useCase.execute(command)

        // Assert
        assertThat(result.roomId).isEqualTo(roomId)
        assertThat(result.name).isEqualTo("ベッド")
        assertThat(result.presetKey).isEqualTo("bed")
        assertThat(result.gridX).isEqualTo(1)
        assertThat(result.gridY).isEqualTo(1)
        assertThat(result.gridW).isEqualTo(2)
        assertThat(result.gridH).isEqualTo(3)
    }

    @Test
    fun `saves_furniture_with_given_rotation`() {
        // Arrange
        every { roomRepository.findById(roomId) } returns buildRoom()
        justRun { furnitureRepository.save(any()) }
        val command =
            AddFurnitureCommand(
                userId = userId,
                roomId = roomId,
                name = "ベッド",
                presetKey = "bed",
                gridX = 0,
                gridY = 0,
                gridW = 3,
                gridH = 2,
                rotation = 90,
            )

        // Act
        val result = useCase.execute(command)

        // Assert
        assertThat(result.rotation).isEqualTo(90)
    }

    @Test
    fun `defaults_rotation_to_zero_when_command_omits_rotation`() {
        // Arrange
        every { roomRepository.findById(roomId) } returns buildRoom()
        justRun { furnitureRepository.save(any()) }
        val command =
            AddFurnitureCommand(
                userId = userId,
                roomId = roomId,
                name = "棚",
                presetKey = null,
                gridX = 0,
                gridY = 0,
                gridW = 1,
                gridH = 1,
            )

        // Act
        val result = useCase.execute(command)

        // Assert
        assertThat(result.rotation).isEqualTo(0)
    }

    @Test
    fun `assigns_new_uuid_to_furniture`() {
        // Arrange
        every { roomRepository.findById(roomId) } returns buildRoom()
        justRun { furnitureRepository.save(any()) }
        val command =
            AddFurnitureCommand(
                userId = userId,
                roomId = roomId,
                name = "ベッド",
                presetKey = null,
                gridX = 0,
                gridY = 0,
                gridW = 2,
                gridH = 2,
            )

        // Act
        val result = useCase.execute(command)

        // Assert
        assertThat(result.id).isNotNull()
    }

    @Test
    fun `saves_furniture_with_null_preset_key_when_not_provided`() {
        // Arrange
        every { roomRepository.findById(roomId) } returns buildRoom()
        justRun { furnitureRepository.save(any()) }
        val command =
            AddFurnitureCommand(
                userId = userId,
                roomId = roomId,
                name = "棚",
                presetKey = null,
                gridX = 0,
                gridY = 0,
                gridW = 1,
                gridH = 1,
            )

        // Act
        val result = useCase.execute(command)

        // Assert
        assertThat(result.presetKey).isNull()
    }

    @Test
    fun `throws_not_found_when_room_does_not_exist`() {
        // Arrange
        every { roomRepository.findById(roomId) } returns null
        val command =
            AddFurnitureCommand(
                userId = userId,
                roomId = roomId,
                name = "ソファ",
                presetKey = null,
                gridX = 0,
                gridY = 0,
                gridW = 2,
                gridH = 1,
            )

        // Act & Assert
        assertThrows<NotFoundException> { useCase.execute(command) }
    }

    @Test
    fun `throws_not_found_when_room_belongs_to_different_user`() {
        // Arrange
        val otherUserId = UUID.randomUUID()
        every { roomRepository.findById(roomId) } returns buildRoom(ownerId = otherUserId)
        val command =
            AddFurnitureCommand(
                userId = userId,
                roomId = roomId,
                name = "ソファ",
                presetKey = null,
                gridX = 0,
                gridY = 0,
                gridW = 2,
                gridH = 1,
            )

        // Act & Assert
        assertThrows<NotFoundException> { useCase.execute(command) }
    }

    @Test
    fun `calls_furniture_repository_save_exactly_once_when_room_found`() {
        // Arrange
        every { roomRepository.findById(roomId) } returns buildRoom()
        justRun { furnitureRepository.save(any()) }
        val command =
            AddFurnitureCommand(
                userId = userId,
                roomId = roomId,
                name = "テーブル",
                presetKey = null,
                gridX = 0,
                gridY = 0,
                gridW = 2,
                gridH = 2,
            )

        // Act
        useCase.execute(command)

        // Assert
        verify(exactly = 1) { furnitureRepository.save(any()) }
    }
}
