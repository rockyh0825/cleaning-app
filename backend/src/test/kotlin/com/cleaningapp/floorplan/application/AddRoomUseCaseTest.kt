package com.cleaningapp.floorplan.application

import com.cleaningapp.floorplan.domain.OwnerType
import com.cleaningapp.floorplan.domain.Part
import com.cleaningapp.floorplan.domain.PartRepository
import com.cleaningapp.floorplan.domain.Room
import com.cleaningapp.floorplan.domain.RoomRepository
import com.cleaningapp.floorplan.domain.RoomType
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.justRun
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import java.util.UUID

@ExtendWith(MockKExtension::class)
class AddRoomUseCaseTest {
    @MockK
    private lateinit var roomRepository: RoomRepository

    @MockK
    private lateinit var partRepository: PartRepository

    private val useCase by lazy { AddRoomUseCase(roomRepository, partRepository) }

    private val userId: UUID = UUID.randomUUID()

    @Test
    fun `saves_room_with_given_properties_when_command_is_valid`() {
        // Arrange
        justRun { roomRepository.save(any()) }
        justRun { partRepository.saveAll(any()) }
        val command =
            AddRoomCommand(
                userId = userId,
                name = "キッチン",
                type = RoomType.KITCHEN,
                gridX = 1,
                gridY = 2,
                gridW = 4,
                gridH = 3,
            )

        // Act
        val result = useCase.execute(command)

        // Assert
        assertThat(result.userId).isEqualTo(userId)
        assertThat(result.name).isEqualTo("キッチン")
        assertThat(result.type).isEqualTo(RoomType.KITCHEN)
        assertThat(result.gridX).isEqualTo(1)
        assertThat(result.gridY).isEqualTo(2)
        assertThat(result.gridW).isEqualTo(4)
        assertThat(result.gridH).isEqualTo(3)
    }

    @Test
    fun `assigns_new_uuid_to_room`() {
        // Arrange
        justRun { roomRepository.save(any()) }
        justRun { partRepository.saveAll(any()) }
        val command =
            AddRoomCommand(
                userId = userId,
                name = "寝室",
                type = RoomType.BEDROOM,
                gridX = 0,
                gridY = 0,
                gridW = 3,
                gridH = 3,
            )

        // Act
        val result = useCase.execute(command)

        // Assert
        assertThat(result.id).isNotNull()
    }

    @Test
    fun `saves_preset_parts_with_correct_count_for_kitchen`() {
        // Arrange
        justRun { roomRepository.save(any()) }
        val partsSlot = slot<List<Part>>()
        every { partRepository.saveAll(capture(partsSlot)) } returns Unit
        val command =
            AddRoomCommand(
                userId = userId,
                name = "キッチン",
                type = RoomType.KITCHEN,
                gridX = 0,
                gridY = 0,
                gridW = 4,
                gridH = 4,
            )

        // Act
        useCase.execute(command)

        // Assert
        assertThat(partsSlot.captured).hasSize(4) // KITCHEN のプリセットパーツ数
    }

    @Test
    fun `saved_preset_parts_belong_to_created_room`() {
        // Arrange
        val roomSlot = slot<Room>()
        every { roomRepository.save(capture(roomSlot)) } returns Unit
        val partsSlot = slot<List<Part>>()
        every { partRepository.saveAll(capture(partsSlot)) } returns Unit
        val command =
            AddRoomCommand(
                userId = userId,
                name = "浴室",
                type = RoomType.BATHROOM,
                gridX = 0,
                gridY = 0,
                gridW = 3,
                gridH = 3,
            )

        // Act
        useCase.execute(command)

        // Assert
        val savedRoom = roomSlot.captured
        assertThat(partsSlot.captured).allMatch { it.ownerId == savedRoom.id }
        assertThat(partsSlot.captured).allMatch { it.ownerType == OwnerType.ROOM }
    }

    @Test
    fun `saved_preset_parts_have_null_last_cleaned_at`() {
        // Arrange
        justRun { roomRepository.save(any()) }
        val partsSlot = slot<List<Part>>()
        every { partRepository.saveAll(capture(partsSlot)) } returns Unit
        val command =
            AddRoomCommand(
                userId = userId,
                name = "トイレ",
                type = RoomType.TOILET,
                gridX = 0,
                gridY = 0,
                gridW = 2,
                gridH = 2,
            )

        // Act
        useCase.execute(command)

        // Assert
        assertThat(partsSlot.captured).allMatch { it.lastCleanedAt == null }
    }

    @Test
    fun `calls_room_repository_save_exactly_once`() {
        // Arrange
        justRun { roomRepository.save(any()) }
        justRun { partRepository.saveAll(any()) }
        val command =
            AddRoomCommand(
                userId = userId,
                name = "リビング",
                type = RoomType.LIVING,
                gridX = 0,
                gridY = 0,
                gridW = 5,
                gridH = 5,
            )

        // Act
        useCase.execute(command)

        // Assert
        verify(exactly = 1) { roomRepository.save(any()) }
    }
}
