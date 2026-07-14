package com.cleaningapp.floorplan.application

import com.cleaningapp.floorplan.domain.Furniture
import com.cleaningapp.floorplan.domain.FurnitureRepository
import com.cleaningapp.floorplan.domain.Room
import com.cleaningapp.floorplan.domain.RoomRepository
import com.cleaningapp.floorplan.domain.RoomType
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import java.time.Instant
import java.util.UUID

@ExtendWith(MockKExtension::class)
class GetFloorPlanUseCaseTest {
    @MockK
    private lateinit var roomRepository: RoomRepository

    @MockK
    private lateinit var furnitureRepository: FurnitureRepository

    private val useCase by lazy { GetFloorPlanUseCase(roomRepository, furnitureRepository) }

    private val userId: UUID = UUID.randomUUID()

    private fun buildRoom(id: UUID = UUID.randomUUID()) =
        Room(
            id = id,
            userId = userId,
            name = "テストルーム",
            type = RoomType.LIVING,
            gridX = 0,
            gridY = 0,
            gridW = 4,
            gridH = 4,
            createdAt = Instant.now(),
            updatedAt = Instant.now(),
        )

    private fun buildFurniture(roomId: UUID) =
        Furniture(
            id = UUID.randomUUID(),
            roomId = roomId,
            name = "ソファ",
            presetKey = null,
            gridX = 0,
            gridY = 0,
            gridW = 2,
            gridH = 2,
            rotation = 0,
            createdAt = Instant.now(),
            updatedAt = Instant.now(),
        )

    @Test
    fun `returns_empty_floor_plan_when_user_has_no_rooms`() {
        // Arrange
        every { roomRepository.findByUserId(userId) } returns emptyList()

        // Act
        val result = useCase.execute(userId)

        // Assert
        assertThat(result.rooms).isEmpty()
    }

    @Test
    fun `returns_floor_plan_with_rooms_and_their_furniture`() {
        // Arrange
        val roomId = UUID.randomUUID()
        val room = buildRoom(roomId)
        val furniture = buildFurniture(roomId)
        every { roomRepository.findByUserId(userId) } returns listOf(room)
        every { furnitureRepository.findByRoomId(roomId) } returns listOf(furniture)

        // Act
        val result = useCase.execute(userId)

        // Assert
        assertThat(result.rooms).hasSize(1)
        assertThat(result.rooms[0].room).isEqualTo(room)
        assertThat(result.rooms[0].furniture).containsExactly(furniture)
    }

    @Test
    fun `returns_empty_furniture_list_for_room_with_no_furniture`() {
        // Arrange
        val roomId = UUID.randomUUID()
        val room = buildRoom(roomId)
        every { roomRepository.findByUserId(userId) } returns listOf(room)
        every { furnitureRepository.findByRoomId(roomId) } returns emptyList()

        // Act
        val result = useCase.execute(userId)

        // Assert
        assertThat(result.rooms[0].furniture).isEmpty()
    }

    @Test
    fun `returns_all_rooms_with_their_respective_furniture`() {
        // Arrange
        val roomId1 = UUID.randomUUID()
        val roomId2 = UUID.randomUUID()
        val room1 = buildRoom(roomId1)
        val room2 = buildRoom(roomId2)
        val furniture1 = buildFurniture(roomId1)
        val furniture2a = buildFurniture(roomId2)
        val furniture2b = buildFurniture(roomId2)
        every { roomRepository.findByUserId(userId) } returns listOf(room1, room2)
        every { furnitureRepository.findByRoomId(roomId1) } returns listOf(furniture1)
        every { furnitureRepository.findByRoomId(roomId2) } returns listOf(furniture2a, furniture2b)

        // Act
        val result = useCase.execute(userId)

        // Assert
        assertThat(result.rooms).hasSize(2)
        val roomResult1 = result.rooms.first { it.room.id == roomId1 }
        val roomResult2 = result.rooms.first { it.room.id == roomId2 }
        assertThat(roomResult1.furniture).hasSize(1)
        assertThat(roomResult2.furniture).hasSize(2)
    }
}
