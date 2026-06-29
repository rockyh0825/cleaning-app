package com.cleaningapp.floorplan.presentation

import com.cleaningapp.floorplan.application.GetFloorPlanUseCase
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/floor-plan")
class FloorPlanController(
    private val getFloorPlanUseCase: GetFloorPlanUseCase,
) {
    @GetMapping
    fun get(
        @RequestHeader("X-User-Id") userId: UUID,
    ): FloorPlanResponse = FloorPlanResponse.from(getFloorPlanUseCase.execute(userId))
}
