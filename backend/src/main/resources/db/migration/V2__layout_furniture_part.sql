-- layout-editor スライス2: furniture / part テーブル
-- furniture は room に所属し、part は room または furniture に所属する。
-- カラムは snake_case（application.yml の map-underscore-to-camel-case と対になる）。

CREATE TABLE furniture (
    -- 主キーは UUID。id はアプリ側で生成してから INSERT する（DBのデフォルトは設定しない）
    id          UUID        PRIMARY KEY,

    -- 所属部屋。部屋削除時に家具も連鎖削除する
    room_id     UUID        NOT NULL REFERENCES room(id) ON DELETE CASCADE,

    name        TEXT        NOT NULL,

    -- プリセット由来の家具は識別キー（例: "sink"）を持つ。自由名称ならNULL
    preset_key  TEXT,

    -- グリッド座標（部屋内の相対セル位置とセル数）
    grid_x      INTEGER     NOT NULL,
    grid_y      INTEGER     NOT NULL,
    grid_w      INTEGER     NOT NULL,
    grid_h      INTEGER     NOT NULL,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 部屋内の家具一覧取得は room_id で絞り込むため、インデックスを張る
CREATE INDEX idx_furniture_room_id ON furniture (room_id);


CREATE TABLE part (
    -- 主キーは UUID。id はアプリ側で生成してから INSERT する（DBのデフォルトは設定しない）
    id                      UUID        PRIMARY KEY,

    -- 所属対象の種別。"ROOM" または "FURNITURE"。妥当性はアプリ層(OwnerType)で担保する
    owner_type              TEXT        NOT NULL,

    -- 所属対象の ID（Room.id または Furniture.id）。
    -- owner_type が ROOM なら room(id)、FURNITURE なら furniture(id) を指す。
    -- 異なる親テーブルを単一カラムで参照するため、FK 制約は付けず
    -- アプリ層で整合性を担保する。部屋・家具の削除時は PartRepository.deleteByOwnerId で
    -- application 層から明示的に削除するか、将来的にトリガーで自動化する。
    owner_id                UUID        NOT NULL,

    name                    TEXT        NOT NULL,

    -- 推奨掃除周期（日）。RoomType.presetParts() の recommendedCycleDays が初期値
    recommended_cycle_days  INTEGER     NOT NULL,

    -- 最終掃除日時。未掃除は NULL
    last_cleaned_at         TIMESTAMPTZ,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- パーツ取得は owner_id で絞り込むため、インデックスを張る
CREATE INDEX idx_part_owner_id ON part (owner_id);
