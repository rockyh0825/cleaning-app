package com.cleaningapp.capabilities

import com.cleaningapp.floorplan.domain.OwnerType
import com.cleaningapp.floorplan.domain.Part
import java.util.UUID

/**
 * feature 間の依存を仲介するポート（Capability パターン）。
 * cleaningrecord / heatmap などの feature が Part を参照・操作する際に使うインターフェース。
 * floorplan feature への直接 import を避けるための抽象レイヤー。
 *
 * 実装は [com.cleaningapp.floorplan.infrastructure.PartManagementAdapter] が担う。
 */
interface PartManagementPort {
    fun findById(id: UUID): Part?

    /** ownerType と ownerId の組み合わせでパーツを取得する（getLastCleanedAt 用） */
    fun findByOwnerId(
        ownerType: OwnerType,
        ownerId: UUID,
    ): List<Part>

    /** userId に紐づくすべてのパーツを取得する（getOverdueAreas 用） */
    fun findAllByUserId(userId: UUID): List<Part>

    fun create(part: Part): Part

    fun update(part: Part)

    fun delete(id: UUID)
}
