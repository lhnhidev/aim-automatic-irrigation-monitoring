import random
import socket
import threading
from controller import Supervisor

supervisor = Supervisor()
time_step = int(supervisor.getBasicTimeStep())
root_children = supervisor.getRoot().getField("children")

sprinklers = [
    supervisor.getFromDef("SPRINKLER1"),
    supervisor.getFromDef("SPRINKLER2")
]

# Trạng thái tưới nước
watering = False

# --- CẤU HÌNH SOCKET SERVER ĐỂ NHẬN LỆNH TỪ FE ---
def socket_server():
    global watering
    HOST = '127.0.0.1'  # localhost
    PORT = 8888        # Cổng giao tiếp

    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    # Cho phép tái sử dụng cổng nhanh chóng
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind((HOST, PORT))
    server_socket.listen()
    print(f"[Webots Socket] Listening on {HOST}:{PORT}...")

    while True:
        try:
            conn, addr = server_socket.accept()
            data = conn.recv(1024).decode('utf-8').strip()
            if data:
                print(f"[Webots Received]: {data}")
                if data == "START_WATERING":
                    watering = True
                    conn.sendall(b"OK: WATERING_STARTED")
                elif data == "STOP_WATERING":
                    watering = False
                    conn.sendall(b"OK: WATERING_STOPPED")
                elif data == "TOGGLE_WATERING":
                    watering = not watering
                    conn.sendall(f"OK: WATERING_{watering}".encode())
                else:
                    conn.sendall(b"ERROR: UNKNOWN_COMMAND")
            conn.close()
        except Exception as e:
            print(f"[Socket Error]: {e}")

# Chạy Socket Server trên một Thread độc lập
server_thread = threading.Thread(target=socket_server, daemon=True)
server_thread.daemon = True
server_thread.start()

# --- VÒNG LẶP CHÍNH CỦA WEBOTS ---
drop_count = 0
frame_counter = 0
HEIGHT_OFFSET = 0.4

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
