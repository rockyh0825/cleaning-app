package com.cleaningapp.cleaningrecord.domain

import java.time.Instant
import java.util.UUID

/**
 * 掃除記録のドメインモデル。Part に紐づく1回分の掃除履歴。
 * Spring/MyBatis に非依存な純粋 Kotlin。
 * 全フィールド val（不変）— 変更時は copy() で新インスタンスを作る。
 */
data class CleaningRecord(
    val id: UUID,
    val partId: UUID,
    val userId: UUID,
    val cleanedAt: Instant,
    val note: String?,
    val createdAt: Instant,
    val updatedAt: Instant,
)
