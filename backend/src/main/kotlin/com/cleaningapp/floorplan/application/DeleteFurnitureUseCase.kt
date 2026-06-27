package com.cleaningapp.floorplan.application

import com.cleaningapp.floorplan.domain.FurnitureRepository
import com.cleaningapp.floorplan.domain.OwnerType
import com.cleaningapp.floorplan.domain.PartRepository
import com.cleaningapp.floorplan.domain.RoomRepository
import com.cleaningapp.shared.exception.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

data class DeleteFurnitureCommand(
    val userId: UUID,
    val furnitureId: UUID,
)

@Service
class DeleteFurnitureUseCase(
    private val roomRepository: RoomRepository,
    private val furnitureRepository: FurnitureRepository,
    private val partRepository: PartRepository,
) {
    @Transactional
    fun execute(command: DeleteFurnitureCommand) {
        val furniture =
            furnitureRepository.findById(command.furnitureId)
                ?: throw NotFoundException("Furniture not found: ${command.furnitureId}")

        roomRepository.findById(furniture.roomId)?.takeIf { it.userId == command.userId }
            ?: throw NotFoundException("Furniture not found: ${command.furnitureId}")

        // part には FK がないため、application 層で明示削除する
        partRepository.deleteByOwnerId(OwnerType.FURNITURE, command.furnitureId)
        furnitureRepository.deleteById(command.furnitureId)
    }
}
