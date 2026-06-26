package com.cleaningapp.layout.domain

import java.time.Instant
import java.util.UUID

/**
 * 部屋のドメインモデル。Spring/MyBatis に非依存な純粋 Kotlin。
 * 座標はグリッド単位の整数（実寸・住所は持たない）。
 * 全フィールド val（不変）— 変更時は copy() で新インスタンスを作る。
 */
data class Room(
    val id: UUID,
    val userId: UUID,
    val name: String,
    val type: RoomType,
    val gridX: Int,
    val gridY: Int,
    val gridW: Int,
    val gridH: Int,
    val createdAt: Instant,
    val updatedAt: Instant,
)
