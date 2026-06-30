package com.cleaningapp.cleaningrecord.presentation

import jakarta.validation.constraints.Min

/**
 * PATCH /parts/{partId} のリクエストボディ。
 * openapi.yaml PartUpdate スキーマに対応。省略フィールドは変更しない（部分更新）。
 */
data class PartUpdateRequest(
    val name: String? = null,
    @field:Min(1) val recommendedCycleDays: Int? = null,
)
