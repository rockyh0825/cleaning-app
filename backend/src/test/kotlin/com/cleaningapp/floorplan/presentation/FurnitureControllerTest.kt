package com.cleaningapp.floorplan.presentation

import com.cleaningapp.floorplan.application.AddFurnitureCommand
import com.cleaningapp.floorplan.application.AddFurnitureUseCase
import com.cleaningapp.floorplan.application.DeleteFurnitureUseCase
import com.cleaningapp.floorplan.application.UpdateFurnitureCommand
import com.cleaningapp.floorplan.application.UpdateFurnitureUseCase
import com.cleaningapp.floorplan.domain.Furniture
import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import io.mockk.slot
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.http.MediaType
import org.springframework.test.context.junit.jupiter.SpringExtension
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.Instant
import java.util.UUID

/**
 * FurnitureController の @WebMvcTest。
 * 各ユースケースを MockkBean で差し替え、HTTP 入出力（特に rotation の値域検証）のみを検証する。
 * rotation は契約上 0/90/180/270 のみ許容するため、それ以外は 400 を返すことを保証する。
 */
@WebMvcTest(FurnitureController::class)
@ExtendWith(SpringExtension::class)
// delete の MockkBean はテストでは未使用だが、FurnitureController のコンストラクタ解決に必要
@Suppress("UnusedPrivateProperty")
class FurnitureControllerTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockkBean
    private lateinit var addFurnitureUseCase: AddFurnitureUseCase

    @MockkBean
    private lateinit var updateFurnitureUseCase: UpdateFurnitureUseCase

    @MockkBean
    private lateinit var deleteFurnitureUseCase: DeleteFurnitureUseCase

    private val userId = UUID.fromString("00000000-0000-0000-0000-000000000001")
    private val roomId = UUID.fromString("00000000-0000-0000-0000-000000000002")
    private val furnitureId = UUID.fromString("00000000-0000-0000-0000-000000000003")

    private fun buildFurniture(rotation: Int = 0): Furniture {
        val now = Instant.parse("2024-06-01T10:00:00Z")
        return Furniture(
            id = furnitureId,
            roomId = roomId,
            name = "ベッド",
            presetKey = "bed",
            gridX = 0,
            gridY = 0,
            gridW = 2,
            gridH = 3,
            rotation = rotation,
            createdAt = now,
            updatedAt = now,
        )
    }

    // ----------------------------------------------------------------
    // 正常系
    // ----------------------------------------------------------------

    @Test
    fun `returns_201_and_rotation_in_body_when_creating_with_valid_rotation`() {
        // Arrange
        every { addFurnitureUseCase.execute(any()) } returns buildFurniture(rotation = 90)

        // Act + Assert
        mockMvc
            .perform(
                post("/rooms/$roomId/furniture")
                    .header("X-User-Id", userId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """{"name":"ベッド","presetKey":"bed","gridX":0,"gridY":0,"gridW":3,"gridH":2,"rotation":90}""",
                    ),
            ).andExpect(status().isCreated)
            .andExpect(jsonPath("$.rotation").value(90))
    }

    @Test
    fun `passes_rotation_to_add_use_case_when_creating`() {
        // Arrange
        val command = slot<AddFurnitureCommand>()
        every { addFurnitureUseCase.execute(capture(command)) } returns buildFurniture(rotation = 180)

        // Act
        mockMvc
            .perform(
                post("/rooms/$roomId/furniture")
                    .header("X-User-Id", userId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """{"name":"ベッド","gridX":0,"gridY":0,"gridW":2,"gridH":3,"rotation":180}""",
                    ),
            ).andExpect(status().isCreated)

        // Assert
        assertThat(command.captured.rotation).isEqualTo(180)
    }

    @Test
    fun `defaults_rotation_to_zero_when_creating_without_rotation`() {
        // Arrange
        val command = slot<AddFurnitureCommand>()
        every { addFurnitureUseCase.execute(capture(command)) } returns buildFurniture()

        // Act
        mockMvc
            .perform(
                post("/rooms/$roomId/furniture")
                    .header("X-User-Id", userId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"name":"棚","gridX":0,"gridY":0,"gridW":1,"gridH":1}"""),
            ).andExpect(status().isCreated)

        // Assert
        assertThat(command.captured.rotation).isEqualTo(0)
    }

    @Test
    fun `returns_200_when_updating_rotation_only`() {
        // Arrange
        val command = slot<UpdateFurnitureCommand>()
        every { updateFurnitureUseCase.execute(capture(command)) } returns buildFurniture(rotation = 270)

        // Act + Assert
        mockMvc
            .perform(
                patch("/furniture/$furnitureId")
                    .header("X-User-Id", userId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"rotation":270}"""),
            ).andExpect(status().isOk)
            .andExpect(jsonPath("$.rotation").value(270))
        assertThat(command.captured.rotation).isEqualTo(270)
    }

    @Test
    fun `keeps_rotation_null_in_command_when_update_omits_rotation`() {
        // Arrange
        val command = slot<UpdateFurnitureCommand>()
        every { updateFurnitureUseCase.execute(capture(command)) } returns buildFurniture()

        // Act
        mockMvc
            .perform(
                patch("/furniture/$furnitureId")
                    .header("X-User-Id", userId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"name":"新しい名前"}"""),
            ).andExpect(status().isOk)

        // Assert
        assertThat(command.captured.rotation).isNull()
    }

    // ----------------------------------------------------------------
    // 境界値: 契約上許容される4値はすべて通す
    // ----------------------------------------------------------------

    @Test
    fun `accepts_all_four_valid_rotation_values_when_creating`() {
        // Arrange
        every { addFurnitureUseCase.execute(any()) } returns buildFurniture()

        // Act + Assert
        listOf(0, 90, 180, 270).forEach { rotation ->
            mockMvc
                .perform(
                    post("/rooms/$roomId/furniture")
                        .header("X-User-Id", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                            """{"name":"ベッド","gridX":0,"gridY":0,"gridW":2,"gridH":3,"rotation":$rotation}""",
                        ),
                ).andExpect(status().isCreated)
        }
    }

    // ----------------------------------------------------------------
    // 異常系: 4値以外は 400
    // ----------------------------------------------------------------

    @Test
    fun `returns_400_when_creating_with_rotation_not_multiple_of_90`() {
        // Act + Assert
        mockMvc
            .perform(
                post("/rooms/$roomId/furniture")
                    .header("X-User-Id", userId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """{"name":"ベッド","gridX":0,"gridY":0,"gridW":2,"gridH":3,"rotation":45}""",
                    ),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `returns_400_when_creating_with_negative_rotation`() {
        // Act + Assert
        mockMvc
            .perform(
                post("/rooms/$roomId/furniture")
                    .header("X-User-Id", userId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """{"name":"ベッド","gridX":0,"gridY":0,"gridW":2,"gridH":3,"rotation":-90}""",
                    ),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `returns_400_when_creating_with_rotation_360`() {
        // Act + Assert
        mockMvc
            .perform(
                post("/rooms/$roomId/furniture")
                    .header("X-User-Id", userId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """{"name":"ベッド","gridX":0,"gridY":0,"gridW":2,"gridH":3,"rotation":360}""",
                    ),
            ).andExpect(status().isBadRequest)
    }

    @Test
    fun `returns_400_when_updating_with_invalid_rotation`() {
        // Act + Assert
        mockMvc
            .perform(
                patch("/furniture/$furnitureId")
                    .header("X-User-Id", userId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"rotation":30}"""),
            ).andExpect(status().isBadRequest)
    }
}
