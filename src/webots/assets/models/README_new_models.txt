NEW MODELS - copy toàn bộ các file trong thư mục này vào:
  src/webots/assets/models/

Đã xử lý sẵn (đổi tên gọn, bỏ dấu cách, sửa mtllib & sửa case texture .JPG->.jpg):

1. Fence.obj  (+ Fence.mtl, Fence_diffuse.jpg)
   - Hàng rào gỗ (post & rail). Dùng dựng 4 cạnh khuôn viên.
   - Nguồn: Free3D "Wooden Post and Rail Fence".

2. Sprinkler.obj  (+ Sprinkler.mtl + các *_color_*.png / *_metalness_*.png)
   - Vòi phun nước. Cần 2 cái -> đặt Sprinkler1, Sprinkler2 trong vườn.
   - Nguồn: "Godly Sprinkler (Grow A Garden Remake)" by R7rus10, Sketchfab.
   - LICENSE: CC Attribution -> PHẢI ghi credit R7rus10 trong báo cáo/README.

3. WheatField.obj  (+ WheatField.mtl, WheatField_diffuse.jpg)
   - Ruộng lúa mì -> dùng làm luống cây trồng trong vườn.
   - Nguồn: Free3D "Wheat Field v1".

GHI CHÚ:
- Đường dẫn trong .wbt phải là TƯƠNG ĐỐI, vd:
    url [ "../assets/models/Fence.obj" ]
- Sprinkler.obj xuất từ Nomad Sculpt (vertex có kèm vertex-color), Webots đọc bình thường.
- File grass .blend (24-grass.rar) KHÔNG kèm .obj nên đã bỏ; dùng model Grass_* có sẵn.
