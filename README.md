# aim-automatic-irrigation-monitoring

Mô phỏng Webots cho hệ thống tưới tự động trong khu vườn 10×10 m.

## Chạy

Cần **Webots R2025a**. Lần mở đầu tiên phải có internet để tải PROTO
(`TexturedBackground`, `TexturedBackgroundLight`, `Floor`) — bản cài R2025a không
kèm sẵn file `.proto` nào trên máy.

```sh
webots src/webots/worlds/garden.wbt
```

## Cấu trúc scene

Khu vườn 10×10 m (rào tại `x = ±5`, `z = ±5`) trên nền 14×14 m. World dùng
`coordinateSystem "NUE"` nên **trục Y hướng lên**.

| Thành phần | DEF | Vị trí |
| --- | --- | --- |
| 4 cạnh rào | `FENCE_NORTH` / `FENCE_SOUTH` / `FENCE_EAST` / `FENCE_WEST` | mỗi cạnh 2 đoạn 5 m, cao 1.11 m |
| 2 vòi phun | `SPRINKLER1` / `SPRINKLER2` | `(-2.5, 0, -2.5)` và `(2.5, 0, 2.5)`, cao 0.45 m |
| 2 luống lúa mì | `CROPBED1` / `CROPBED2` | `(1.5, 0, -2)` và `(-1.5, 0, 2)`, mỗi luống 12 bụi |
| Trang trí | `TREE_*`, `BUSH_*`, `ROCK_*`, `GRASS_*` | 4 cây, 6 bụi, 4 đá, 8 cỏ |

Tổng 30 `Solid` / 56 `CadShape`. Controller sau này tham chiếu vòi phun qua
`getFromDef("SPRINKLER1")` / `getFromDef("SPRINKLER2")`.

## Credit models

| Model | Nguồn | License |
| --- | --- | --- |
| `Sprinkler.obj` | **"Godly Sprinkler (Grow A Garden Remake)" by R7rus10** (Sketchfab) | **CC Attribution** — bắt buộc ghi credit |
| `Fence.obj` | "Wooden Post and Rail Fence" (Free3D) | — |
| `WheatField.obj` | "Wheat Field v1" (Free3D) | — |
| `Tree_*`, `Bush_*`, `Rock_*`, `Grass_*` | Forest Nature Pack | — |
