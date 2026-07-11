package com.cleaningapp.cleaningrecord.presentation

import com.cleaningapp.cleaningrecord.application.CreatePartUseCase
import com.cleaningapp.cleaningrecord.application.DeletePartUseCase
import com.cleaningapp.cleaningrecord.application.ListPartUseCase
import com.cleaningapp.cleaningrecord.application.UpdatePartUseCase
import com.cleaningapp.floorplan.domain.OwnerType
import com.cleaningapp.floorplan.domain.Part
import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import io.mockk.verify
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.Instant
import java.util.UUID

/**
 * PartController の @WebMvcTest。
 * 各ユースケースを MockkBean で差し替え、HTTP 入出力のみを検証する。
 */
@WebMvcTest(PartController::class)
// create/update/delete の MockkBean はテストでは未使用だが、PartController のコンストラクタ解決に必要
@Suppress("UnusedPrivateProperty")
class PartControllerTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockkBean
    private lateinit var createPartUseCase: CreatePartUseCase

    @MockkBean
    private lateinit var updatePartUseCase: UpdatePartUseCase

    @MockkBean
    private lateinit var deletePartUseCase: DeletePartUseCase

    @MockkBean
    private lateinit var listPartUseCase: ListPartUseCase

    private val userId = UUID.fromString("00000000-0000-0000-0000-000000000001")
    private val roomId = UUID.fromString("00000000-0000-0000-0000-000000000002")
    private val partId = UUID.fromString("00000000-0000-0000-0000-000000000003")

    private fun buildPart(
        id: UUID = partId,
        name: String = "床",
    ): Part {
        val now = Instant.parse("2024-06-01T10:00:00Z")
        return Part(
            id = id,
            ownerType = OwnerType.ROOM,
            ownerId = roomId,
            name = name,
            recommendedCycleDays = 7,
            lastCleanedAt = null,
            createdAt = now,
            updatedAt = now,
        )
    }

    @Test
    fun `returns_200_and_part_list_when_listing_parts`() {
        // Arrange
        every { listPartUseCase.execute(userId, null) } returns listOf(buildPart())

        // Act + Assert
        mockMvc
            .perform(
                get("/parts").header("X-User-Id", userId),
            ).andExpect(status().isOk)
            .andExpect(jsonPath("$[0].id").value(partId.toString()))
            .andExpect(jsonPath("$[0].name").value("床"))
            .andExpect(jsonPath("$[0].ownerId").value(roomId.toString()))
    }

    @Test
    fun `passes_owner_id_to_use_case_when_query_parameter_is_given`() {
        // Arrange
        every { listPartUseCase.execute(userId, roomId) } returns listOf(buildPart())

        // Act + Assert
        mockMvc
            .perform(
                get("/parts")
                    .header("X-User-Id", userId)
                    .queryParam("ownerId", roomId.toString()),
            ).andExpect(status().isOk)

        verify { listPartUseCase.execute(userId, roomId) }
    }

    @Test
    fun `returns_empty_array_when_user_has_no_parts`() {
        // Arrange
        every { listPartUseCase.execute(userId, null) } returns emptyList()

        // Act + Assert
        mockMvc
            .perform(
                get("/parts").header("X-User-Id", userId),
            ).andExpect(status().isOk)
            .andExpect(jsonPath("$").isEmpty)
    }

    @Test
    fun `returns_400_when_user_id_header_is_missing`() {
        // Act + Assert
        mockMvc
            .perform(get("/parts"))
            .andExpect(status().isBadRequest)
    }
}
