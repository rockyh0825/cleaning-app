-- cleaning-record スライス1: cleaning_record テーブル
-- openapi の CleaningRecord スキーマに対応する。掃除履歴を part 単位で記録する。
-- カラムは snake_case（application.yml の map-underscore-to-camel-case と対になる）。

CREATE TABLE cleaning_record (
    -- 主キーは UUID。id はアプリ側で生成してから INSERT する（DBのデフォルトは設定しない）
    id          UUID        PRIMARY KEY,

    -- 紐づくパーツ。パーツ削除時に掃除記録も連鎖削除する
    part_id     UUID        NOT NULL REFERENCES part(id) ON DELETE CASCADE,

    -- 実際に掃除した日時。TIMESTAMPTZ = タイムゾーン付き
    cleaned_at  TIMESTAMPTZ NOT NULL,

    -- 掃除メモ（任意）
    note        TEXT,

    -- 記録した利用者。MVPは初回発行UUID、V2以降はKeycloakのsub。
    user_id     UUID        NOT NULL,

    -- TIMESTAMPTZ = タイムゾーン付き。now() でサーバー時刻を既定値に
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- パーツ別の記録絞り込みは part_id で行うため、インデックスを張る
CREATE INDEX idx_cleaning_record_part_id ON cleaning_record (part_id);

-- ユーザースコープ絞り込みは user_id で行うため、インデックスを張る
CREATE INDEX idx_cleaning_record_user_id ON cleaning_record (user_id);

-- 最終掃除日時の取得（SELECT MAX(cleaned_at)）を高速化するため、降順インデックスを張る
CREATE INDEX idx_cleaning_record_cleaned_at ON cleaning_record (cleaned_at DESC);
