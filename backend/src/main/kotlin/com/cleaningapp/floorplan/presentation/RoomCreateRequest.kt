package com.cleaningapp.floorplan.presentation

import com.cleaningapp.floorplan.domain.RoomType
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank

data class RoomCreateRequest(
    @field:NotBlank val name: String,
    val type: RoomType,
    @field:Min(0) val gridX: Int,
    @field:Min(0) val gridY: Int,
    @field:Min(1) val gridW: Int,
    @field:Min(1) val gridH: Int,
)
