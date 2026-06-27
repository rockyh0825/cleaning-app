package com.cleaningapp.floorplan.domain

import java.util.UUID

/**
 * パーツの永続化の抽象（ポート）。
 * domain がインターフェースを定義し、infrastructure が MyBatis で実装する。
 *
 * パーツは Room または Furniture に所属し、ownerId 単位で一括操作する。
 * cleaning-record / heatmap feature も同じインターフェースを通じて参照・更新する。
 */
interface PartRepository {
    fun findByOwnerId(ownerId: UUID): List<Part>

    fun saveAll(parts: List<Part>)

    fun update(part: Part)

    fun deleteByOwnerId(ownerId: UUID)
}
