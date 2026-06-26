-- layout-editor スライス1: room テーブル
-- openapi の Room スキーマに対応する。座標はグリッド単位の整数（実寸・住所は持たない）。
-- カラムは snake_case（application.yml の map-underscore-to-camel-case と対になる）。

CREATE TABLE room (
    -- 主キーは UUID。id はアプリ側で生成してから INSERT する（DBのデフォルトは設定しない）
    id          UUID        PRIMARY KEY,

    -- 所有者識別。MVPは初回発行UUID、V2以降はKeycloakのsub。これで他人のデータと分離する
    user_id     UUID        NOT NULL,

    name        TEXT        NOT NULL,

    -- 種別。enum値の妥当性はアプリ層(RoomType)で担保する。
    -- 将来、値を固定したくなったら CHECK 制約を足せる:
    --   CONSTRAINT room_type_check CHECK (type IN ('KITCHEN','BATHROOM','BEDROOM','LIVING','TOILET','OTHER'))
    type        TEXT        NOT NULL,

    -- グリッド座標（左上セル位置とセル数）
    grid_x      INTEGER     NOT NULL,
    grid_y      INTEGER     NOT NULL,
    grid_w      INTEGER     NOT NULL,
    grid_h      INTEGER     NOT NULL,

    -- TIMESTAMPTZ = タイムゾーン付き。now() でサーバー時刻を既定値に
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 間取り取得は user_id で絞り込むため、インデックスを張る
CREATE INDEX idx_room_user_id ON room (user_id);
