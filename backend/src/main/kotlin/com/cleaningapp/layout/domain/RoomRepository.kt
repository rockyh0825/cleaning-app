package com.cleaningapp.layout.domain

import java.util.UUID

/**
 * 部屋の永続化の抽象（ポート）。
 * domain がインターフェースを定義し、infrastructure が MyBatis で実装する。
 * これにより application 層は MyBatis を知らずに済む（依存の逆転）。
 */
interface RoomRepository {
    fun save(room: Room)

    fun findByUserId(userId: UUID): List<Room>
}
