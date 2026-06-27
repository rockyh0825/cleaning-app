package com.cleaningapp.layout.presentation

import com.cleaningapp.layout.domain.Room
import com.cleaningapp.layout.domain.RoomType
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import java.time.Instant
import java.util.UUID

/**
 * 部屋作成のリクエスト（openapi の RoomCreate に対応）。
 * id・userId・timestamps は含めない（サーバーが決める値）。
 * ※ いずれ OpenAPI Generator の生成型に置き換える。今は手書きでスライスを通す。
 */
data class RoomCreateRequest(
    @field:NotBlank
    val name: String,
    val type: RoomType,
    @field:Min(0) val gridX: Int,
    @field:Min(0) val gridY: Int,
    @field:Min(1) val gridW: Int,
    @field:Min(1) val gridH: Int,
)

/**
 * 部屋のレスポンス（openapi の Room に対応）。userId は返さない（ヘッダで自明なため）。
 */
data class RoomResponse(
    val id: UUID,
    val name: String,
    val type: RoomType,
    val gridX: Int,
    val gridY: Int,
    val gridW: Int,
    val gridH: Int,
    val createdAt: Instant,
    val updatedAt: Instant,
) {
    companion object {
        fun from(room: Room): RoomResponse =
            RoomResponse(
                id = room.id,
                name = room.name,
                type = room.type,
                gridX = room.gridX,
                gridY = room.gridY,
                gridW = room.gridW,
                gridH = room.gridH,
                createdAt = room.createdAt,
                updatedAt = room.updatedAt,
            )
    }
}
