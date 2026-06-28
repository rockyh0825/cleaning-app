package com.cleaningapp.floorplan.application

import com.cleaningapp.floorplan.domain.Furniture
import com.cleaningapp.floorplan.domain.FurnitureRepository
import com.cleaningapp.floorplan.domain.OwnerType
import com.cleaningapp.floorplan.domain.PartRepository
import com.cleaningapp.floorplan.domain.Room
import com.cleaningapp.floorplan.domain.RoomRepository
import com.cleaningapp.floorplan.domain.RoomType
import com.cleaningapp.shared.exception.NotFoundException
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.justRun
import io.mockk.verify
import io.mockk.verifyOrder
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import java.time.Instant
import java.util.UUID

@ExtendWith(MockKExtension::class)
class DeleteRoomUseCaseTest {
    @MockK
    private lateinit var roomRepository: RoomRepository

    @MockK
    private lateinit var furnitureRepository: FurnitureRepository

    @MockK
    private lateinit var partRepository: PartRepository

    private val useCase by lazy { DeleteRoomUseCase(roomRepository, furnitureRepository, partRepository) }

    private val userId: UUID = UUID.randomUUID()
    private val roomId: UUID = UUID.randomUUID()

    private fun buildRoom(ownerId: UUID = userId) =
        Room(
            id = roomId,
            userId = ownerId,
            name = "テストルーム",
            type = RoomType.KITCHEN,
            gridX = 0,
            gridY = 0,
            gridW = 4,
            gridH = 4,
            createdAt = Instant.now(),
            updatedAt = Instant.now(),
        )

    private fun buildFurniture(id: UUID = UUID.randomUUID()) =
        Furniture(
            id = id,
            roomId = roomId,
            name = "家具",
            presetKey = null,
            gridX = 0,
            gridY = 0,
            gridW = 1,
            gridH = 1,
            createdAt = Instant.now(),
            updatedAt = Instant.now(),
        )

    @Test
    fun `deletes_room_parts_furniture_parts_and_room_when_command_is_valid`() {
        // Arrange
        val furnitureId = UUID.randomUUID()
        every { roomRepository.findById(roomId) } returns buildRoom()
        every { furnitureRepository.findByRoomId(roomId) } returns listOf(buildFurniture(furnitureId))
        justRun { partRepository.deleteByOwnerId(any(), any()) }
        justRun { roomRepository.deleteById(roomId) }

        // Act
        useCase.execute(DeleteRoomCommand(userId, roomId))

        // Assert
        verify { partRepository.deleteByOwnerId(OwnerType.FURNITURE, furnitureId) }
        verify { partRepository.deleteByOwnerId(OwnerType.ROOM, roomId) }
        verify { roomRepository.deleteById(roomId) }
    }

    @Test
    fun `deletes_room_without_furniture_parts`() {
        // Arrange
        every { roomRepository.findById(roomId) } returns buildRoom()
        every { furnitureRepository.findByRoomId(roomId) } returns emptyList()
        justRun { partRepository.deleteByOwnerId(any(), any()) }
        justRun { roomRepository.deleteById(roomId) }

        // Act
        useCase.execute(DeleteRoomCommand(userId, roomId))

        // Assert
        verify(exactly = 0) { partRepository.deleteByOwnerId(OwnerType.FURNITURE, any()) }
        verify(exactly = 1) { partRepository.deleteByOwnerId(OwnerType.ROOM, roomId) }
        verify { roomRepository.deleteById(roomId) }
    }

    @Test
    fun `deletes_parts_for_each_furniture_in_room`() {
        // Arrange
        val furnitureId1 = UUID.randomUUID()
        val furnitureId2 = UUID.randomUUID()
        every { roomRepository.findById(roomId) } returns buildRoom()
        every { furnitureRepository.findByRoomId(roomId) } returns
            listOf(
                buildFurniture(furnitureId1),
                buildFurniture(furnitureId2),
            )
        justRun { partRepository.deleteByOwnerId(any(), any()) }
        justRun { roomRepository.deleteById(roomId) }

        // Act
        useCase.execute(DeleteRoomCommand(userId, roomId))

        // Assert
        verify { partRepository.deleteByOwnerId(OwnerType.FURNITURE, furnitureId1) }
        verify { partRepository.deleteByOwnerId(OwnerType.FURNITURE, furnitureId2) }
    }

    @Test
    fun `deletes_furniture_parts_before_room_parts`() {
        // Arrange
        val furnitureId = UUID.randomUUID()
        every { roomRepository.findById(roomId) } returns buildRoom()
        every { furnitureRepository.findByRoomId(roomId) } returns listOf(buildFurniture(furnitureId))
        justRun { partRepository.deleteByOwnerId(any(), any()) }
        justRun { roomRepository.deleteById(roomId) }

        // Act
        useCase.execute(DeleteRoomCommand(userId, roomId))

        // Assert
        verifyOrder {
            partRepository.deleteByOwnerId(OwnerType.FURNITURE, furnitureId)
            partRepository.deleteByOwnerId(OwnerType.ROOM, roomId)
        }
    }

    @Test
    fun `deletes_room_parts_before_room_itself`() {
        // Arrange
        every { roomRepository.findById(roomId) } returns buildRoom()
        every { furnitureRepository.findByRoomId(roomId) } returns emptyList()
        justRun { partRepository.deleteByOwnerId(any(), any()) }
        justRun { roomRepository.deleteById(roomId) }

        // Act
        useCase.execute(DeleteRoomCommand(userId, roomId))

        // Assert
        verifyOrder {
            partRepository.deleteByOwnerId(OwnerType.ROOM, roomId)
            roomRepository.deleteById(roomId)
        }
    }

    @Test
    fun `throws_not_found_when_room_does_not_exist`() {
        // Arrange
        every { roomRepository.findById(roomId) } returns null

        // Act & Assert
        assertThrows<NotFoundException> {
            useCase.execute(DeleteRoomCommand(userId, roomId))
        }
    }

    @Test
    fun `throws_not_found_when_room_belongs_to_different_user`() {
        // Arrange
        val otherUserId = UUID.randomUUID()
        every { roomRepository.findById(roomId) } returns buildRoom(ownerId = otherUserId)

        // Act & Assert
        assertThrows<NotFoundException> {
            useCase.execute(DeleteRoomCommand(userId, roomId))
        }
    }
}
