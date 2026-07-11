package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.capabilities.PartManagementPort
import com.cleaningapp.floorplan.domain.Part
import org.springframework.stereotype.Service
import java.util.UUID

/**
 * ユーザーのパーツ一覧を取得するユースケース。
 * ownerId を指定した場合はそのエリア（部屋・家具）に属するパーツのみに絞り込む。
 * Part への直接アクセスは [PartManagementPort] を通じて行い、floorplan feature への直接依存を回避する。
 */
@Service
class ListPartUseCase(
    private val partManagementPort: PartManagementPort,
) {
    fun execute(
        userId: UUID,
        ownerId: UUID?,
    ): List<Part> {
        val parts = partManagementPort.findAllByUserId(userId)
        if (ownerId == null) return parts
        return parts.filter { it.ownerId == ownerId }
    }
}
