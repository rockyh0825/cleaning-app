package com.cleaningapp.floorplan.domain

import java.util.UUID

/**
 * パーツの永続化の抽象（ポート）。
 * domain がインターフェースを定義し、infrastructure が MyBatis で実装する。
 *
 * パーツは Room または Furniture に所属し、ownerType + ownerId の組み合わせで一括操作する。
 * owner_id は種別間で一意とは限らないため、必ず ownerType とセットで絞り込む。
 * cleaning-record / heatmap feature も同じインターフェースを通じて参照・更新する。
 */
interface PartRepository {
    fun findById(id: UUID): Part?

    fun findByOwnerId(
        ownerType: OwnerType,
        ownerId: UUID,
    ): List<Part>

    /** userId に紐づく room / furniture のすべてのパーツを返す（JOIN クエリ） */
    fun findAllByUserId(userId: UUID): List<Part>

    fun create(part: Part): Part

    fun saveAll(parts: List<Part>)

    fun update(part: Part)

    fun deleteById(id: UUID)

    fun deleteByOwnerId(
        ownerType: OwnerType,
        ownerId: UUID,
    )
}
