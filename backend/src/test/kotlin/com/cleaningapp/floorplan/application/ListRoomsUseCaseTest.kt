package com.cleaningapp.floorplan.application

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
class ListRoomsUseCaseTest {
    @MockK
    private lateinit var roomRepository: RoomRepository

    private val useCase by lazy { ListRoomsUseCase(roomRepository) }

    private val userId: UUID = UUID.randomUUID()

    private fun buildRoom(name: String = "テスト") =
        Room(
            id = UUID.randomUUID(),
            userId = userId,
            name = name,
            type = RoomType.OTHER,
            gridX = 0,
            gridY = 0,
            gridW = 3,
            gridH = 3,
            createdAt = Instant.now(),
            updatedAt = Instant.now(),
        )

    @Test
    fun `returns_empty_list_when_user_has_no_rooms`() {
        // Arrange
        every { roomRepository.findByUserId(userId) } returns emptyList()

        // Act
        val result = useCase.execute(userId)

        // Assert
        assertThat(result).isEmpty()
    }

    @Test
    fun `returns_all_rooms_belonging_to_user`() {
        // Arrange
        val rooms = listOf(buildRoom("部屋A"), buildRoom("部屋B"), buildRoom("部屋C"))
        every { roomRepository.findByUserId(userId) } returns rooms

        // Act
        val result = useCase.execute(userId)

        // Assert
        assertThat(result).hasSize(3)
        assertThat(result.map { it.name }).containsExactly("部屋A", "部屋B", "部屋C")
    }

    @Test
    fun `delegates_to_room_repository_with_correct_user_id`() {
        // Arrange
        val otherUserId = UUID.randomUUID()
        every { roomRepository.findByUserId(userId) } returns listOf(buildRoom())
        every { roomRepository.findByUserId(otherUserId) } returns emptyList()

        // Act
        val result = useCase.execute(userId)

        // Assert
        assertThat(result).hasSize(1)
    }
}
