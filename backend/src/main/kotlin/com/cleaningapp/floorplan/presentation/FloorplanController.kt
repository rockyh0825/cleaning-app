package com.cleaningapp.floorplan.presentation

import com.cleaningapp.floorplan.application.GetFloorplanUseCase
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/floor-plan")
class FloorplanController(
    private val getFloorplanUseCase: GetFloorplanUseCase,
) {
    @GetMapping
    fun get(
        @RequestHeader("X-User-Id") userId: UUID,
    ): FloorplanResponse = FloorplanResponse.from(getFloorplanUseCase.execute(userId))
}
