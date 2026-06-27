package com.cleaningapp.floorplan.presentation

import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank

data class FurnitureCreateRequest(
    @field:NotBlank val name: String,
    val presetKey: String?,
    @field:Min(0) val gridX: Int,
    @field:Min(0) val gridY: Int,
    @field:Min(1) val gridW: Int,
    @field:Min(1) val gridH: Int,
)
