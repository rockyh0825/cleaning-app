package com.cleaningapp.cleaningrecord.presentation

import com.cleaningapp.floorplan.domain.OwnerType
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import java.util.UUID

/**
 * POST /parts のリクエストボディ。
 * openapi.yaml PartCreate スキーマに対応。
 */
data class PartCreateRequest(
    val ownerType: OwnerType,
    val ownerId: UUID,
    @field:NotBlank val name: String,
    @field:Min(1) val recommendedCycleDays: Int = 7,
)
