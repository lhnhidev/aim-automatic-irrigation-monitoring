from controller import Supervisor
import random

supervisor = Supervisor()
time_step = int(supervisor.getBasicTimeStep())
root_children = supervisor.getRoot().getField("children")

# Lấy danh sách các vòi nước theo DEF name
sprinklers = [
    supervisor.getFromDef("SPRINKLER1"),
    supervisor.getFromDef("SPRINKLER2")
]

# =========================================================================
# CẤU HÌNH TRẠNG THÁI TƯỚI NƯỚC
# Set False: Tắt vòi tưới (Mặc định)
# Set True : Bật vòi tưới
watering = False
# =========================================================================

drop_count = 0
frame_counter = 0
HEIGHT_OFFSET = 0.4  # Đưa giọt nước sinh ra trên đỉnh vòi

while supervisor.step(time_step) != -1:
    frame_counter += 1
    
    # 1. KÍCH HOẠT TƯỚI: Chỉ sinh giọt nước mới nếu watering == True
    if watering and (frame_counter % 2 == 0):
        for spk in sprinklers:
            if spk is None:
                continue
                
            pos = spk.getPosition()
            spk_x = pos[0]
            spk_y = pos[1] + HEIGHT_OFFSET
            spk_z = pos[2]
            
            drop_count += 1
            drop_name = f"Drop_{drop_count}"
            
            water_node_str = f'''
            Solid {{
              translation {spk_x} {spk_y} {spk_z}
              children [
                Shape {{
                  appearance PBRAppearance {{
                    baseColor 0 0.2 1.0
                    roughness 0.0
                  }}
                  geometry Sphere {{ radius 0.06 }}
                }}
              ]
              name "{drop_name}"
              boundingObject Sphere {{ radius 0.06 }}
              physics Physics {{ 
                density -1
                mass 0.01 
              }}
            }}
            '''
            root_children.importMFNodeFromString(-1, water_node_str)
            
            # Đặt lực bắn xòe hình vòm
            new_drop = root_children.getMFNode(-1)
            if new_drop is not None:
                vx = random.uniform(-3.0, 3.0)
                vy = random.uniform(3.0, 5.0)
                vz = random.uniform(-3.0, 3.0)
                new_drop.setVelocity([vx, vy, vz, 0, 0, 0])

    # 2. XÓA GIỌT NƯỚC: Xóa khi rơi chạm đất (y <= 0.05)
    total_nodes = root_children.getCount()
    for i in range(total_nodes - 1, -1, -1):
        node = root_children.getMFNode(i)
        if node is not None:
            name_field = node.getField("name")
            if name_field is not None:
                node_name = name_field.getSFString()
                if node_name.startswith("Drop_"):
                    pos = node.getPosition()
                    if pos[1] <= 0.05:
                        node.remove()