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
class DeleteFurnitureUseCaseTest {

    @MockK
    private lateinit var roomRepository: RoomRepository

    @MockK
    private lateinit var furnitureRepository: FurnitureRepository

    @MockK
    private lateinit var partRepository: PartRepository

    private val useCase by lazy {
        DeleteFurnitureUseCase(roomRepository, furnitureRepository, partRepository)
    }

    private val userId: UUID = UUID.randomUUID()
    private val roomId: UUID = UUID.randomUUID()
    private val furnitureId: UUID = UUID.randomUUID()

    private fun buildRoom(ownerId: UUID = userId) = Room(
        id = roomId,
        userId = ownerId,
        name = "テストルーム",
        type = RoomType.LIVING,
        gridX = 0, gridY = 0, gridW = 5, gridH = 5,
        createdAt = Instant.now(),
        updatedAt = Instant.now(),
    )

    private fun buildFurniture() = Furniture(
        id = furnitureId,
        roomId = roomId,
        name = "ソファ",
        presetKey = null,
        gridX = 0, gridY = 0, gridW = 2, gridH = 2,
        createdAt = Instant.now(),
        updatedAt = Instant.now(),
    )

    @Test
    fun `deletes_furniture_parts_and_then_furniture_when_command_is_valid`() {
        // Arrange
        every { furnitureRepository.findById(furnitureId) } returns buildFurniture()
        every { roomRepository.findById(roomId) } returns buildRoom()
        justRun { partRepository.deleteByOwnerId(any(), any()) }
        justRun { furnitureRepository.deleteById(furnitureId) }

        // Act
        useCase.execute(DeleteFurnitureCommand(userId, furnitureId))

        // Assert
        verify { partRepository.deleteByOwnerId(OwnerType.FURNITURE, furnitureId) }
        verify { furnitureRepository.deleteById(furnitureId) }
    }

    @Test
    fun `deletes_parts_before_furniture`() {
        // Arrange
        every { furnitureRepository.findById(furnitureId) } returns buildFurniture()
        every { roomRepository.findById(roomId) } returns buildRoom()
        justRun { partRepository.deleteByOwnerId(any(), any()) }
        justRun { furnitureRepository.deleteById(furnitureId) }

        // Act
        useCase.execute(DeleteFurnitureCommand(userId, furnitureId))

        // Assert
        verifyOrder {
            partRepository.deleteByOwnerId(OwnerType.FURNITURE, furnitureId)
            furnitureRepository.deleteById(furnitureId)
        }
    }

    @Test
    fun `throws_not_found_when_furniture_does_not_exist`() {
        // Arrange
        every { furnitureRepository.findById(furnitureId) } returns null

        // Act & Assert
        assertThrows<NotFoundException> {
            useCase.execute(DeleteFurnitureCommand(userId, furnitureId))
        }
    }

    @Test
    fun `throws_not_found_when_owning_room_belongs_to_different_user`() {
        // Arrange
        val otherUserId = UUID.randomUUID()
        every { furnitureRepository.findById(furnitureId) } returns buildFurniture()
        every { roomRepository.findById(roomId) } returns buildRoom(ownerId = otherUserId)

        // Act & Assert
        assertThrows<NotFoundException> {
            useCase.execute(DeleteFurnitureCommand(userId, furnitureId))
        }
    }

    @Test
    fun `throws_not_found_when_owning_room_does_not_exist`() {
        // Arrange
        every { furnitureRepository.findById(furnitureId) } returns buildFurniture()
        every { roomRepository.findById(roomId) } returns null

        // Act & Assert
        assertThrows<NotFoundException> {
            useCase.execute(DeleteFurnitureCommand(userId, furnitureId))
        }
    }

    @Test
    fun `does_not_delete_furniture_when_not_found`() {
        // Arrange
        every { furnitureRepository.findById(furnitureId) } returns null

        // Act & Assert
        assertThrows<NotFoundException> {
            useCase.execute(DeleteFurnitureCommand(userId, furnitureId))
        }
        verify(exactly = 0) { furnitureRepository.deleteById(any()) }
    }
}
