package com.cleaningapp.floorplan.presentation

import com.cleaningapp.floorplan.application.AddFurnitureCommand
import com.cleaningapp.floorplan.application.AddFurnitureUseCase
import com.cleaningapp.floorplan.application.DeleteFurnitureCommand
import com.cleaningapp.floorplan.application.DeleteFurnitureUseCase
import com.cleaningapp.floorplan.application.UpdateFurnitureCommand
import com.cleaningapp.floorplan.application.UpdateFurnitureUseCase
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
class FurnitureController(
    private val addFurnitureUseCase: AddFurnitureUseCase,
    private val updateFurnitureUseCase: UpdateFurnitureUseCase,
    private val deleteFurnitureUseCase: DeleteFurnitureUseCase,
) {
    @PostMapping("/rooms/{roomId}/furniture")
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @RequestHeader("X-User-Id") userId: UUID,
        @PathVariable roomId: UUID,
        @Valid @RequestBody request: FurnitureCreateRequest,
    ): FurnitureResponse =
        FurnitureResponse.from(
            addFurnitureUseCase.execute(
                AddFurnitureCommand(
                    userId = userId,
                    roomId = roomId,
                    name = request.name,
                    presetKey = request.presetKey,
                    gridX = request.gridX,
                    gridY = request.gridY,
                    gridW = request.gridW,
                    gridH = request.gridH,
                    rotation = request.rotation,
                ),
            ),
        )

    @PatchMapping("/furniture/{furnitureId}")
    fun update(
        @RequestHeader("X-User-Id") userId: UUID,
        @PathVariable furnitureId: UUID,
        @Valid @RequestBody request: FurnitureUpdateRequest,
    ): FurnitureResponse =
        FurnitureResponse.from(
            updateFurnitureUseCase.execute(
                UpdateFurnitureCommand(
                    userId = userId,
                    furnitureId = furnitureId,
                    name = request.name,
                    gridX = request.gridX,
                    gridY = request.gridY,
                    gridW = request.gridW,
                    gridH = request.gridH,
                    rotation = request.rotation,
                ),
            ),
        )

    @DeleteMapping("/furniture/{furnitureId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(
        @RequestHeader("X-User-Id") userId: UUID,
        @PathVariable furnitureId: UUID,
    ) {
        deleteFurnitureUseCase.execute(DeleteFurnitureCommand(userId, furnitureId))
    }
}
