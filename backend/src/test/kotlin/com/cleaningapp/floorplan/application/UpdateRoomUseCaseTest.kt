package com.cleaningapp.floorplan.application

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
class UpdateRoomUseCaseTest {
    @MockK
    private lateinit var roomRepository: RoomRepository

    private val useCase by lazy { UpdateRoomUseCase(roomRepository) }

    private val userId: UUID = UUID.randomUUID()
    private val roomId: UUID = UUID.randomUUID()

    private fun buildRoom() =
        Room(
            id = roomId,
            userId = userId,
            name = "元の名前",
            type = RoomType.BEDROOM,
            gridX = 0,
            gridY = 0,
            gridW = 3,
            gridH = 3,
            createdAt = Instant.now(),
            updatedAt = Instant.now(),
        )

    @Test
    fun `updates_all_provided_fields`() {
        // Arrange
        every { roomRepository.findById(roomId) } returns buildRoom()
        justRun { roomRepository.update(any()) }
        val command =
            UpdateRoomCommand(
                userId = userId,
                roomId = roomId,
                name = "新しい名前",
                gridX = 5,
                gridY = 6,
                gridW = 7,
                gridH = 8,
            )

        // Act
        val result = useCase.execute(command)

        // Assert
        assertThat(result.name).isEqualTo("新しい名前")
        assertThat(result.gridX).isEqualTo(5)
        assertThat(result.gridY).isEqualTo(6)
        assertThat(result.gridW).isEqualTo(7)
        assertThat(result.gridH).isEqualTo(8)
    }

    @Test
    fun `keeps_existing_values_when_fields_are_null`() {
        // Arrange
        val originalRoom = buildRoom()
        every { roomRepository.findById(roomId) } returns originalRoom
        justRun { roomRepository.update(any()) }
        val command =
            UpdateRoomCommand(
                userId = userId,
                roomId = roomId,
                name = null,
                gridX = null,
                gridY = null,
                gridW = null,
                gridH = null,
            )

        // Act
        val result = useCase.execute(command)

        // Assert
        assertThat(result.name).isEqualTo(originalRoom.name)
        assertThat(result.gridX).isEqualTo(originalRoom.gridX)
        assertThat(result.gridY).isEqualTo(originalRoom.gridY)
        assertThat(result.gridW).isEqualTo(originalRoom.gridW)
        assertThat(result.gridH).isEqualTo(originalRoom.gridH)
    }

    @Test
    fun `updates_only_name_when_grid_fields_are_null`() {
        // Arrange
        val originalRoom = buildRoom()
        every { roomRepository.findById(roomId) } returns originalRoom
        justRun { roomRepository.update(any()) }
        val command =
            UpdateRoomCommand(
                userId = userId,
                roomId = roomId,
                name = "更新後の名前",
                gridX = null,
                gridY = null,
                gridW = null,
                gridH = null,
            )

        // Act
        val result = useCase.execute(command)

        // Assert
        assertThat(result.name).isEqualTo("更新後の名前")
        assertThat(result.gridX).isEqualTo(originalRoom.gridX)
    }

    @Test
    fun `persists_update_via_room_repository`() {
        // Arrange
        every { roomRepository.findById(roomId) } returns buildRoom()
        val updatedSlot = slot<Room>()
        every { roomRepository.update(capture(updatedSlot)) } returns Unit
        val command =
            UpdateRoomCommand(
                userId = userId,
                roomId = roomId,
                name = "保存確認",
                gridX = null,
                gridY = null,
                gridW = null,
                gridH = null,
            )

        // Act
        useCase.execute(command)

        // Assert
        verify(exactly = 1) { roomRepository.update(any()) }
        assertThat(updatedSlot.captured.name).isEqualTo("保存確認")
    }

    @Test
    fun `throws_not_found_when_room_does_not_exist`() {
        // Arrange
        every { roomRepository.findById(roomId) } returns null
        val command =
            UpdateRoomCommand(
                userId = userId,
                roomId = roomId,
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
    fun `throws_not_found_when_room_belongs_to_different_user`() {
        // Arrange
        val otherUserId = UUID.randomUUID()
        every { roomRepository.findById(roomId) } returns buildRoom().copy(userId = otherUserId)
        val command =
            UpdateRoomCommand(
                userId = userId,
                roomId = roomId,
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
