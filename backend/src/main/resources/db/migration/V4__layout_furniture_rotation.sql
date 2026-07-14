-- layout-editor: 家具の回転（issue #171）
-- 家具に時計回りの回転角（度）を持たせる。描画にのみ影響し、占有矩形は常に
-- grid_w × grid_h の軸平行矩形のまま（90/270 度では追加時・回転時に w/h を入れ替えて保存する）。
-- 許容値は契約（api/openapi.yaml の Furniture.rotation）と揃えて 0/90/180/270 のみ。

ALTER TABLE furniture
    ADD COLUMN rotation INTEGER NOT NULL DEFAULT 0
        CONSTRAINT furniture_rotation_check
        CHECK (rotation IN (0, 90, 180, 270));
