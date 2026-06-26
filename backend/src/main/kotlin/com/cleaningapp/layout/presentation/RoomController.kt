package com.cleaningapp.layout.presentation

import com.cleaningapp.layout.application.AddRoomCommand
import com.cleaningapp.layout.application.AddRoomUseCase
import com.cleaningapp.layout.application.ListRoomsUseCase
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

/**
 * /rooms の REST コントローラ。HTTPの入出力に専念し、ロジックはユースケースに委譲する。
 * X-User-Id ヘッダでユーザーを識別する（MVPの認証なし方式）。
 */
@RestController
@RequestMapping("/rooms")
class RoomController(
    private val addRoomUseCase: AddRoomUseCase,
    private val listRoomsUseCase: ListRoomsUseCase,
) {
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @RequestHeader("X-User-Id") userId: UUID,
        @Valid @RequestBody request: RoomCreateRequest,
    ): RoomResponse {
        val room =
            addRoomUseCase.execute(
                AddRoomCommand(
                    userId = userId,
                    name = request.name,
                    type = request.type,
                    gridX = request.gridX,
                    gridY = request.gridY,
                    gridW = request.gridW,
                    gridH = request.gridH,
                ),
            )
        return RoomResponse.from(room)
    }

    @GetMapping
    fun list(
        @RequestHeader("X-User-Id") userId: UUID,
    ): List<RoomResponse> = listRoomsUseCase.execute(userId).map(RoomResponse::from)
}
