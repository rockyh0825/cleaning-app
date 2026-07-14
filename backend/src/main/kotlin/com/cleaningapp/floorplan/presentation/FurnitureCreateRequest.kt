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
    // 省略時は未回転。契約の default: 0 と揃える
    @field:RotationDegrees val rotation: Int = 0,
)
