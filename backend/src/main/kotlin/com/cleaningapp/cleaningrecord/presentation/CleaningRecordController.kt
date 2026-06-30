package com.cleaningapp.cleaningrecord.presentation

import com.cleaningapp.cleaningrecord.application.DeleteRecordUseCase
import com.cleaningapp.cleaningrecord.application.EditRecordUseCase
import com.cleaningapp.cleaningrecord.application.ListRecordUseCase
import com.cleaningapp.cleaningrecord.application.LogCleaningUseCase
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.util.UUID

/**
 * /cleaning-records の REST コントローラ。HTTP 入出力に専念し、ロジックはユースケースに委譲する。
 * X-User-Id ヘッダでユーザーを識別する（MVP の認証なし方式）。
 */
@RestController
@RequestMapping("/cleaning-records")
class CleaningRecordController(
    private val logCleaningUseCase: LogCleaningUseCase,
    private val listRecordUseCase: ListRecordUseCase,
    private val editRecordUseCase: EditRecordUseCase,
    private val deleteRecordUseCase: DeleteRecordUseCase,
) {
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @RequestHeader("X-User-Id") userId: UUID,
        @Valid @RequestBody request: CleaningRecordCreateRequest,
    ): List<CleaningRecordResponse> {
        val records =
            logCleaningUseCase.execute(
                userId = userId,
                partIds = request.partIds,
                cleanedAt = request.cleanedAt ?: Instant.now(),
                note = request.note,
            )
        return records.map(CleaningRecordResponse::from)
    }

    @GetMapping
    fun list(
        @RequestHeader("X-User-Id") userId: UUID,
        @RequestParam partId: UUID? = null,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") pageSize: Int,
    ): CleaningRecordListResponse {
        // openapi.yaml は page 1始まり。UseCase には 0始まりで渡す
        val items = listRecordUseCase.execute(userId, partId, page - 1, pageSize)
        return CleaningRecordListResponse(
            items = items.map(CleaningRecordResponse::from),
            total = items.size,
            page = page,
            pageSize = pageSize,
        )
    }

    @PatchMapping("/{recordId}")
    fun update(
        @RequestHeader("X-User-Id") userId: UUID,
        @PathVariable recordId: UUID,
        @Valid @RequestBody request: CleaningRecordUpdateRequest,
    ): CleaningRecordResponse {
        val record =
            editRecordUseCase.execute(
                userId = userId,
                recordId = recordId,
                cleanedAt = request.cleanedAt,
                note = request.note,
                clearNote = request.clearNote,
            )
        return CleaningRecordResponse.from(record)
    }

    @DeleteMapping("/{recordId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(
        @RequestHeader("X-User-Id") userId: UUID,
        @PathVariable recordId: UUID,
    ) {
        deleteRecordUseCase.execute(userId, recordId)
    }
}
