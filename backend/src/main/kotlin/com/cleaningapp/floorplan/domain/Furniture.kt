package com.cleaningapp.floorplan.domain

import java.time.Instant
import java.util.UUID

/**
 * 家具・家電のドメインモデル。Room に所属し、部屋内の相対グリッド座標を持つ。
 * Spring/MyBatis に非依存な純粋 Kotlin。
 * 全フィールド val（不変）— 変更時は copy() で新インスタンスを作る。
 *
 * [presetKey] プリセット由来の家具は識別キー（例: "sink"）を持つ。
 * 自由名称で追加した家具は null。プリセット由来かどうかの判定に使う。
 *
 * [rotation] 時計回りの回転角（度）。0/90/180/270 のいずれか（値域は presentation 層で検証する）。
 * 描画にのみ影響し、占有矩形は常に [gridW] × [gridH] の軸平行矩形。
 * 90/270 度への回転時は呼び出し側が [gridW]/[gridH] も入れ替えて保存するため、
 * 当たり判定・クランプ・リサイズは回転を意識しなくてよい。
 */
data class Furniture(
    val id: UUID,
    val roomId: UUID,
    val name: String,
    val presetKey: String?,
    val gridX: Int,
    val gridY: Int,
    val gridW: Int,
    val gridH: Int,
    val rotation: Int,
    val createdAt: Instant,
    val updatedAt: Instant,
)
