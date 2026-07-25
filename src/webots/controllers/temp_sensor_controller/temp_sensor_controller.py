"""
Controller: temp_sensor_controller
Chức năng: Giả lập nhiệt độ không khí khu vườn và gửi dữ liệu tới EMQX MQTT Broker.
"""

from controller import Robot
import json
import random
import paho.mqtt.client as mqtt

# --- 1. CẤU HÌNH MQTT BROKER ---
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
TOPIC_TEMP = "garden/sensor/temperature"

mqtt_client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2, client_id="Webots_TempSensor"
)

is_connected = False
try:
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, keepalive=10)
    mqtt_client.loop_start()
    is_connected = True
    print(f"-> [MQTT] Đã kết nối thành công tới Broker: {MQTT_BROKER}:{MQTT_PORT}")
except Exception as e:
    print(f"-> [MQTT Error] Không thể kết nối tới Broker: {e}")

# --- 2. KHỞI TẠO WEBOTS ROBOT ---
robot = Robot()
time_step = int(robot.getBasicTimeStep())

# --- 3. THIẾT LẬP THÔNG SỐ BIẾN THIÊN ---
current_val = 28.0       # Nhiệt độ không khí ban đầu (°C)
MIN_VAL, MAX_VAL = 18.0, 38.0
MAX_STEP = 0.5           # Mỗi 3 giây chỉ tăng/giảm tối đa 0.5°C

sim_time = 0.0
the_time = 3000          # 3000ms = 3 giây

print("--- KHỞI ĐỘNG CẢM BIẾN NHIỆT ĐỘ KHÔNG KHÍ ---")

# --- 4. VÒNG LẶP MÔ PHỎNG ---
while robot.step(time_step) != -1:
    sim_time += time_step / 1000.0  # Quy đổi ra giây

    if int(sim_time * 1000) % the_time < time_step:
        # Thay đổi ngẫu nhiên nhỏ dựa trên giá trị trước đó
        delta = random.uniform(-MAX_STEP, MAX_STEP)
        if random.choice([0, 1, 2, 3, 4]) != 1:
            current_val = max(MIN_VAL, min(MAX_VAL, current_val + delta))
        sensor_reading = round(current_val, 2)

        # Tạo payload định dạng JSON
        payload = {
            "timestamp": round(sim_time, 1),
            "temperature": sensor_reading,
            "unit": "C"
        }

        json_data = json.dumps(payload)

        if is_connected:
            mqtt_client.publish(TOPIC_TEMP, json_data)

        print(f"[Thời gian: {int(sim_time)}s] Published -> {TOPIC_TEMP}: {json_data}")

# --- 5. DỌN DẸP KHI NGẮT MÔ PHỎNG ---
if is_connected:
    mqtt_client.loop_stop()
    mqtt_client.disconnect()
