package com.cleaningapp.floorplan.application

import com.cleaningapp.floorplan.domain.Furniture
import com.cleaningapp.floorplan.domain.FurnitureRepository
import com.cleaningapp.floorplan.domain.RoomRepository
import com.cleaningapp.shared.exception.NotFoundException
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.UUID

data class UpdateFurnitureCommand(
    val userId: UUID,
    val furnitureId: UUID,
    val name: String?,
    val gridX: Int?,
    val gridY: Int?,
    val gridW: Int?,
    val gridH: Int?,
)

@Service
class UpdateFurnitureUseCase(
    private val roomRepository: RoomRepository,
    private val furnitureRepository: FurnitureRepository,
) {
    fun execute(command: UpdateFurnitureCommand): Furniture {
        val furniture =
            furnitureRepository.findById(command.furnitureId)
                ?: throw NotFoundException("Furniture not found: ${command.furnitureId}")

        // 所有権を部屋経由で確認する
        roomRepository.findById(furniture.roomId)?.takeIf { it.userId == command.userId }
            ?: throw NotFoundException("Furniture not found: ${command.furnitureId}")

        val updated =
            furniture.copy(
                name = command.name ?: furniture.name,
                gridX = command.gridX ?: furniture.gridX,
                gridY = command.gridY ?: furniture.gridY,
                gridW = command.gridW ?: furniture.gridW,
                gridH = command.gridH ?: furniture.gridH,
                updatedAt = Instant.now(),
            )
        furnitureRepository.update(updated)
        return updated
    }
}
