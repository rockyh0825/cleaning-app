package com.cleaningapp.floorplan.domain

/**
 * プリセットパーツの定義。RoomType ごとに seed される掃除単位の雛形。
 * [name] パーツ名（例: 床、シンク）
 * [recommendedCycleDays] 推奨掃除周期（日）
 */
data class PresetPartDefinition(
    val name: String,
    val recommendedCycleDays: Int,
)
