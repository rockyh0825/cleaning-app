package com.cleaningapp.floorplan.domain

/**
 * 部屋の種別。openapi の RoomType と一致させる。
 * DBには enum 名（"KITCHEN" 等）を TEXT で保存する。
 */
enum class RoomType {
    KITCHEN,
    BATHROOM,
    BEDROOM,
    LIVING,
    TOILET,
    OTHER,
}
