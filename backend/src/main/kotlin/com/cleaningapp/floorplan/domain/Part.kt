package com.cleaningapp.floorplan.domain

import java.time.Instant
import java.util.UUID

/**
 * パーツの所属対象の種別。
 * ROOM: 部屋に直接属するパーツ（例: キッチンの床）
 * FURNITURE: 家具に属するパーツ（例: エアコンのフィルター）
 * DBには enum 名（"ROOM" / "FURNITURE"）を TEXT で保存する。
 */
enum class OwnerType {
    ROOM,
    FURNITURE,
}

/**
 * 掃除単位（パーツ）のドメインモデル。Room または Furniture に所属する。
 * cleaning-record / heatmap feature がこのエンティティを参照・更新する。
 * Spring/MyBatis に非依存な純粋 Kotlin。
 * 全フィールド val（不変）— 変更時は copy() で新インスタンスを作る。
 *
 * [ownerType] ROOM or FURNITURE（ownerId の種別を示す）
 * [ownerId] Room.id または Furniture.id
 * [recommendedCycleDays] 推奨掃除周期（日）。RoomType のプリセットから初期値を設定する
 * [lastCleanedAt] 未掃除の場合 null
 */
data class Part(
    val id: UUID,
    val ownerType: OwnerType,
    val ownerId: UUID,
    val name: String,
    val recommendedCycleDays: Int,
    val lastCleanedAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant,
)
