package com.cleaningapp.floorplan.application

import com.cleaningapp.floorplan.domain.Room
import com.cleaningapp.floorplan.domain.RoomRepository
import com.cleaningapp.shared.exception.NotFoundException
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.UUID

data class UpdateRoomCommand(
    val userId: UUID,
    val roomId: UUID,
    val name: String?,
    val gridX: Int?,
    val gridY: Int?,
    val gridW: Int?,
    val gridH: Int?,
)

@Service
class UpdateRoomUseCase(
    private val roomRepository: RoomRepository,
) {
    fun execute(command: UpdateRoomCommand): Room {
        val room =
            roomRepository.findById(command.roomId)?.takeIf { it.userId == command.userId }
                ?: throw NotFoundException("Room not found: ${command.roomId}")

        val updated =
            room.copy(
                name = command.name ?: room.name,
                gridX = command.gridX ?: room.gridX,
                gridY = command.gridY ?: room.gridY,
                gridW = command.gridW ?: room.gridW,
                gridH = command.gridH ?: room.gridH,
                updatedAt = Instant.now(),
            )
        roomRepository.update(updated)
        return updated
    }
}
