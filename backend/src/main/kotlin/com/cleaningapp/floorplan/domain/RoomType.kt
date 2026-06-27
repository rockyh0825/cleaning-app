package com.cleaningapp.floorplan.domain

/**
 * プリセットパーツの定義。RoomType ごとに seed される掃除単位の雛形。
 * [name] パーツ名（例: 床、シンク）
 * [recommendedCycleDays] 推奨掃除周期（日）
 */
data class PresetPartDefinition(
    val name: String,
    val recommendedCycleDays: Int,
)

/**
 * 部屋の種別。openapi の RoomType と一致させる。
 * DBには enum 名（"KITCHEN" 等）を TEXT で保存する。
 *
 * 各種別は [presetParts] でプリセットパーツの雛形リストを返す。
 * 部屋追加時（AddRoomUseCase）にこのリストを Part として seed する。
 */
enum class RoomType {
    KITCHEN,
    BATHROOM,
    BEDROOM,
    LIVING,
    TOILET,
    OTHER;

    /**
     * 種別に対応するプリセットパーツ定義を返す。
     * application 層がこのリストを元に Part エンティティを生成・保存する。
     *
     * recommendedCycleDays の設計方針：
     * - 毎日触れる面（コンロ・シンク・浴槽）は短めに設定
     * - 床は週1回を基準とし、水回りは汚れが溜まりやすいため短めに調整
     * - フィルター・換気扇・窓など見えにくい箇所は月1回を目安に設定
     */
    fun presetParts(): List<PresetPartDefinition> = when (this) {
        KITCHEN -> listOf(
            PresetPartDefinition(name = "シンク",   recommendedCycleDays = 3),
            PresetPartDefinition(name = "コンロ",   recommendedCycleDays = 7),
            PresetPartDefinition(name = "換気扇",   recommendedCycleDays = 30),
            PresetPartDefinition(name = "床",       recommendedCycleDays = 7),
        )
        BATHROOM -> listOf(
            PresetPartDefinition(name = "浴槽",     recommendedCycleDays = 3),
            PresetPartDefinition(name = "床",       recommendedCycleDays = 7),
            PresetPartDefinition(name = "鏡",       recommendedCycleDays = 7),
            PresetPartDefinition(name = "排水口",   recommendedCycleDays = 14),
        )
        TOILET -> listOf(
            PresetPartDefinition(name = "便器",     recommendedCycleDays = 7),
            PresetPartDefinition(name = "床",       recommendedCycleDays = 7),
            PresetPartDefinition(name = "壁",       recommendedCycleDays = 30),
        )
        BEDROOM -> listOf(
            PresetPartDefinition(name = "床",       recommendedCycleDays = 7),
            PresetPartDefinition(name = "寝具まわり", recommendedCycleDays = 7),
        )
        LIVING -> listOf(
            PresetPartDefinition(name = "床",               recommendedCycleDays = 7),
            PresetPartDefinition(name = "窓",               recommendedCycleDays = 30),
            PresetPartDefinition(name = "エアコンフィルター", recommendedCycleDays = 30),
        )
        OTHER -> listOf(
            PresetPartDefinition(name = "床", recommendedCycleDays = 7),
        )
    }
}
