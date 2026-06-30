package com.cleaningapp.cleaningrecord.presentation

import com.cleaningapp.cleaningrecord.application.DeleteRecordUseCase
import com.cleaningapp.cleaningrecord.application.EditRecordUseCase
import com.cleaningapp.cleaningrecord.application.ListRecordUseCase
import com.cleaningapp.cleaningrecord.application.LogCleaningUseCase
import com.cleaningapp.cleaningrecord.domain.CleaningRecord
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
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.Instant
import java.util.UUID

/**
 * CleaningRecordController の @WebMvcTest。
 * 各ユースケースを MockkBean で差し替え、HTTP 入出力のみを検証する。
 */
@WebMvcTest(CleaningRecordController::class)
class CleaningRecordControllerTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockkBean
    private lateinit var logCleaningUseCase: LogCleaningUseCase

    @MockkBean
    private lateinit var listRecordUseCase: ListRecordUseCase

    @MockkBean
    private lateinit var editRecordUseCase: EditRecordUseCase

    @MockkBean
    private lateinit var deleteRecordUseCase: DeleteRecordUseCase

    private val userId = UUID.fromString("00000000-0000-0000-0000-000000000001")
    private val partId = UUID.fromString("00000000-0000-0000-0000-000000000002")
    private val recordId = UUID.fromString("00000000-0000-0000-0000-000000000003")

    private fun buildRecord(
        id: UUID = recordId,
        pId: UUID = partId,
    ): CleaningRecord {
        val now = Instant.parse("2024-06-01T10:00:00Z")
        return CleaningRecord(
            id = id,
            partId = pId,
            userId = userId,
            cleanedAt = now,
            note = null,
            createdAt = now,
            updatedAt = now,
        )
    }

    @Test
    fun `returns_201_and_record_list_when_creating_cleaning_records`() {
        // Arrange
        every { logCleaningUseCase.execute(any(), any(), any(), any()) } returns listOf(buildRecord())

        // Act + Assert
        mockMvc
            .perform(
                post("/cleaning-records")
                    .header("X-User-Id", userId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"partIds": ["$partId"]}"""),
            ).andExpect(status().isCreated)
            .andExpect(jsonPath("$[0].id").value(recordId.toString()))
            .andExpect(jsonPath("$[0].partId").value(partId.toString()))
    }

    @Test
    fun `returns_200_and_filtered_records_when_listing_with_partId`() {
        // Arrange
        every { listRecordUseCase.execute(any(), eq(partId), any(), any()) } returns listOf(buildRecord())

        // Act + Assert
        mockMvc
            .perform(
                get("/cleaning-records")
                    .header("X-User-Id", userId)
                    .param("partId", partId.toString()),
            ).andExpect(status().isOk)
            .andExpect(jsonPath("$.items[0].partId").value(partId.toString()))
            .andExpect(jsonPath("$.total").value(1))
            .andExpect(jsonPath("$.page").value(1))
    }

    @Test
    fun `returns_200_and_all_records_when_listing_without_partId`() {
        // Arrange
        every { listRecordUseCase.execute(any(), null, any(), any()) } returns emptyList()

        // Act + Assert
        mockMvc
            .perform(
                get("/cleaning-records")
                    .header("X-User-Id", userId),
            ).andExpect(status().isOk)
            .andExpect(jsonPath("$.items").isArray)
            .andExpect(jsonPath("$.total").value(0))
    }

    @Test
    fun `returns_204_when_deleting_cleaning_record`() {
        // Arrange
        justRun { deleteRecordUseCase.execute(any(), eq(recordId)) }

        // Act + Assert
        mockMvc
            .perform(
                delete("/cleaning-records/$recordId")
                    .header("X-User-Id", userId),
            ).andExpect(status().isNoContent)
    }

    @Test
    fun `returns_404_when_record_not_found`() {
        // Arrange
        every { deleteRecordUseCase.execute(any(), any()) } throws
            NotFoundException("CleaningRecord not found: $recordId")

        // Act + Assert
        mockMvc
            .perform(
                delete("/cleaning-records/$recordId")
                    .header("X-User-Id", userId),
            ).andExpect(status().isNotFound)
    }

    @Test
    fun `returns_400_when_x_user_id_header_is_missing`() {
        // Act + Assert
        mockMvc
            .perform(
                get("/cleaning-records"),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `returns_200_and_updated_record_when_patching_record`() {
        // Arrange
        val updated = buildRecord()
        every { editRecordUseCase.execute(any(), eq(recordId), any(), any(), any()) } returns updated

        // Act + Assert
        mockMvc
            .perform(
                patch("/cleaning-records/$recordId")
                    .header("X-User-Id", userId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"note": "更新メモ"}"""),
            ).andExpect(status().isOk)
            .andExpect(jsonPath("$.id").value(recordId.toString()))
    }
}
