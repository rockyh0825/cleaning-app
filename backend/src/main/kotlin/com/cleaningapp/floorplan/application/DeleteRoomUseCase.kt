package com.cleaningapp.floorplan.application

import com.cleaningapp.floorplan.domain.FurnitureRepository
import com.cleaningapp.floorplan.domain.PartRepository
import com.cleaningapp.floorplan.domain.RoomRepository
import com.cleaningapp.shared.exception.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

data class DeleteRoomCommand(
    val userId: UUID,
    val roomId: UUID,
)

@Service
class DeleteRoomUseCase(
    private val roomRepository: RoomRepository,
    private val furnitureRepository: FurnitureRepository,
    private val partRepository: PartRepository,
) {
    @Transactional
    fun execute(command: DeleteRoomCommand) {
        roomRepository.findById(command.roomId)?.takeIf { it.userId == command.userId }
            ?: throw NotFoundException("Room not found: ${command.roomId}")

        // part には FK がないため、application 層で明示削除する
        furnitureRepository.findByRoomId(command.roomId)
            .forEach { partRepository.deleteByOwnerId(it.id) }
        partRepository.deleteByOwnerId(command.roomId)

        // DB の ON DELETE CASCADE が furniture を連鎖削除する
        roomRepository.deleteById(command.roomId)
    }
}
