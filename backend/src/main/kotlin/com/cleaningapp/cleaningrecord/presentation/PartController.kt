package com.cleaningapp.cleaningrecord.presentation

import com.cleaningapp.cleaningrecord.application.CreatePartUseCase
import com.cleaningapp.cleaningrecord.application.DeletePartUseCase
import com.cleaningapp.cleaningrecord.application.UpdatePartUseCase
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

/**
 * /parts の REST コントローラ。HTTP 入出力に専念し、ロジックはユースケースに委譲する。
 * X-User-Id ヘッダでユーザーを識別する（MVP の認証なし方式）。
 */
@RestController
@RequestMapping("/parts")
class PartController(
    private val createPartUseCase: CreatePartUseCase,
    private val updatePartUseCase: UpdatePartUseCase,
    private val deletePartUseCase: DeletePartUseCase,
) {
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @RequestHeader("X-User-Id") userId: UUID,
        @Valid @RequestBody request: PartCreateRequest,
    ): PartResponse {
        val part =
            createPartUseCase.execute(
                userId = userId,
                ownerType = request.ownerType,
                ownerId = request.ownerId,
                name = request.name,
                recommendedCycleDays = request.recommendedCycleDays,
            )
        return PartResponse.from(part)
    }

    @PatchMapping("/{partId}")
    fun update(
        @RequestHeader("X-User-Id") userId: UUID,
        @PathVariable partId: UUID,
        @Valid @RequestBody request: PartUpdateRequest,
    ): PartResponse {
        val part =
            updatePartUseCase.execute(
                userId = userId,
                partId = partId,
                name = request.name,
                recommendedCycleDays = request.recommendedCycleDays,
            )
        return PartResponse.from(part)
    }

    @DeleteMapping("/{partId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(
        @RequestHeader("X-User-Id") userId: UUID,
        @PathVariable partId: UUID,
    ) {
        deletePartUseCase.execute(userId, partId)
    }
}
