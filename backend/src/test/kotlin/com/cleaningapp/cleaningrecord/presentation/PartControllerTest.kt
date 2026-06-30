package com.cleaningapp.cleaningrecord.presentation

import com.cleaningapp.cleaningrecord.application.CreatePartUseCase
import com.cleaningapp.cleaningrecord.application.DeletePartUseCase
import com.cleaningapp.cleaningrecord.application.UpdatePartUseCase
import com.cleaningapp.floorplan.domain.OwnerType
import com.cleaningapp.floorplan.domain.Part
import com.cleaningapp.shared.exception.NotFoundException
import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import io.mockk.justRun
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.Instant
import java.util.UUID

/**
 * PartController の @WebMvcTest。
 * 各ユースケースを MockkBean で差し替え、HTTP 入出力のみを検証する。
 */
@WebMvcTest(PartController::class)
class PartControllerTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockkBean
    private lateinit var createPartUseCase: CreatePartUseCase

    @MockkBean
    private lateinit var updatePartUseCase: UpdatePartUseCase

    @MockkBean
    private lateinit var deletePartUseCase: DeletePartUseCase

    private val userId = UUID.fromString("00000000-0000-0000-0000-000000000001")
    private val ownerId = UUID.fromString("00000000-0000-0000-0000-000000000002")
    private val partId = UUID.fromString("00000000-0000-0000-0000-000000000003")

    private fun buildPart(id: UUID = partId): Part {
        val now = Instant.parse("2024-06-01T10:00:00Z")
        return Part(
            id = id,
            ownerType = OwnerType.ROOM,
            ownerId = ownerId,
            name = "床",
            recommendedCycleDays = 7,
            lastCleanedAt = null,
            createdAt = now,
            updatedAt = now,
        )
    }

    @Test
    fun `returns_201_and_part_when_creating_part`() {
        // Arrange
        every { createPartUseCase.execute(any(), any(), any(), any(), any()) } returns buildPart()

        // Act + Assert
        mockMvc
            .perform(
                post("/parts")
                    .header("X-User-Id", userId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"ownerType": "ROOM", "ownerId": "$ownerId", "name": "床"}"""),
            ).andExpect(status().isCreated)
            .andExpect(jsonPath("$.id").value(partId.toString()))
            .andExpect(jsonPath("$.name").value("床"))
    }

    @Test
    fun `returns_200_and_updated_part_when_patching_part`() {
        // Arrange
        val updated = buildPart().copy(name = "天井")
        every { updatePartUseCase.execute(any(), eq(partId), any(), any()) } returns updated

        // Act + Assert
        mockMvc
            .perform(
                patch("/parts/$partId")
                    .header("X-User-Id", userId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"name": "天井"}"""),
            ).andExpect(status().isOk)
            .andExpect(jsonPath("$.name").value("天井"))
    }

    @Test
    fun `returns_204_when_deleting_part`() {
        // Arrange
        justRun { deletePartUseCase.execute(any(), eq(partId)) }

        // Act + Assert
        mockMvc
            .perform(
                delete("/parts/$partId")
                    .header("X-User-Id", userId),
            ).andExpect(status().isNoContent)
    }

    @Test
    fun `returns_404_when_part_not_found`() {
        // Arrange
        every { deletePartUseCase.execute(any(), any()) } throws
            NotFoundException("Part not found: $partId")

        // Act + Assert
        mockMvc
            .perform(
                delete("/parts/$partId")
                    .header("X-User-Id", userId),
            ).andExpect(status().isNotFound)
    }

    @Test
    fun `returns_400_when_x_user_id_header_is_missing`() {
        // Act + Assert
        mockMvc
            .perform(
                post("/parts")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"ownerType": "ROOM", "ownerId": "$ownerId", "name": "床"}"""),
            ).andExpect(status().isBadRequest)
    }
}
