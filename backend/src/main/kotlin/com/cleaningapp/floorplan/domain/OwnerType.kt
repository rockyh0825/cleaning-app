package com.cleaningapp.floorplan.domain

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
