package com.cleaningapp.cleaningrecord.application

import com.cleaningapp.capabilities.PartManagementPort
import com.cleaningapp.shared.exception.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * パーツを削除するユースケース。
 * Part への直接アクセスは [PartManagementPort] を通じて行い、floorplan feature への直接依存を回避する。
 */
@Service
class DeletePartUseCase(
    private val partManagementPort: PartManagementPort,
) {
    @Transactional
    // userId: 将来の認可チェック（自分のデータのみ操作可能）で使用する予定
    @Suppress("UnusedParameter")
    fun execute(
        userId: UUID,
        partId: UUID,
    ) {
        partManagementPort.findById(partId)
            ?: throw NotFoundException("Part not found: $partId")
        partManagementPort.delete(partId)
    }
}
