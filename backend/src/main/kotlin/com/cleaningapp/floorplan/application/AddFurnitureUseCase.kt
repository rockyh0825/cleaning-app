package com.cleaningapp.floorplan.application

import com.cleaningapp.floorplan.domain.Furniture
import com.cleaningapp.floorplan.domain.FurnitureRepository
import com.cleaningapp.floorplan.domain.RoomRepository
import com.cleaningapp.shared.exception.NotFoundException
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.UUID

data class AddFurnitureCommand(
    val userId: UUID,
    val roomId: UUID,
    val name: String,
    val presetKey: String?,
    val gridX: Int,
    val gridY: Int,
    val gridW: Int,
    val gridH: Int,
    /** 時計回りの回転角（度）。省略時は未回転 */
    val rotation: Int = 0,
)

@Service
class AddFurnitureUseCase(
    private val roomRepository: RoomRepository,
    private val furnitureRepository: FurnitureRepository,
) {
    fun execute(command: AddFurnitureCommand): Furniture {
        roomRepository.findById(command.roomId)?.takeIf { it.userId == command.userId }
            ?: throw NotFoundException("Room not found: ${command.roomId}")

        val now = Instant.now()
        val furniture =
            Furniture(
                id = UUID.randomUUID(),
                roomId = command.roomId,
                name = command.name,
                presetKey = command.presetKey,
                gridX = command.gridX,
                gridY = command.gridY,
                gridW = command.gridW,
                gridH = command.gridH,
                rotation = command.rotation,
                createdAt = now,
                updatedAt = now,
            )
        furnitureRepository.save(furniture)
        return furniture
    }
}
