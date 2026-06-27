package com.cleaningapp.floorplan.domain

import java.util.UUID

/**
 * 家具の永続化の抽象（ポート）。
 * domain がインターフェースを定義し、infrastructure が MyBatis で実装する。
 * これにより application 層は MyBatis を知らずに済む（依存の逆転）。
 */
interface FurnitureRepository {
    fun findByRoomId(roomId: UUID): List<Furniture>

    fun findById(id: UUID): Furniture?

    fun save(furniture: Furniture)

    fun update(furniture: Furniture)

    fun deleteById(id: UUID)
}
