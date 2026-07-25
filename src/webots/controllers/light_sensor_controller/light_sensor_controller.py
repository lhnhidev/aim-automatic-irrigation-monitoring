""" Controller: light_sensor_controller (Vàng) """
from controller import Robot
import json
import math
import random
import paho.mqtt.client as mqtt

# --- 1. CẤU HÌNH MQTT BROKER ---
MQTT_BROKER, MQTT_PORT = "localhost", 1883
TOPIC_LIGHT = "garden/sensor/light"

mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="Webots_LightSensor")
is_connected = False
try:
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, keepalive=10)
    mqtt_client.loop_start()
    is_connected = True
    print(f"-> [MQTT] Đã kết nối thành công tới Broker: {MQTT_BROKER}:{MQTT_PORT}")
except Exception as e:
    print(f"-> [MQTT Error] {e}")

# --- 2. KHỞI TẠO WEBOTS ROBOT ---
robot = Robot()
time_step = int(robot.getBasicTimeStep())

# --- 3. THIẾT LẬP THÔNG SỐ ÁNH SÁNG SÂN VƯỜN ---
# Giả định 1 chu kỳ ngày/đêm trong mô phỏng dài 360 giây (6 phút)
DAY_CYCLE_SECONDS = 360.0
PEAK_LUX = 65000.0  # Nắng sân vườn trung bình đạt ~65,000 lux lúc giữa trưa

sim_time = 0.0
the_time = 3000     # 3 giây gửi dữ liệu 1 lần

print("--- KHỞI ĐỘNG CẢM BIẾN CƯỜNG ĐỘ ÁNH SÁNG SÂN VƯỜN ---")

# --- 4. VÒNG LẶP MÔ PHỎNG ---
while robot.step(time_step) != -1:
    sim_time += time_step / 1000.0

    if int(sim_time * 1000) % the_time < time_step:
        # 1. Tính ánh sáng theo chu kỳ Mặt Trời (Nửa chu kỳ ban ngày, nửa chu kỳ ban đêm)
        sun_position = math.sin(2 * math.pi * sim_time / DAY_CYCLE_SECONDS)

        if sun_position > 0:
            # BAN NGÀY: Ánh sáng nền tăng/giảm theo góc mặt trời
            base_lux = PEAK_LUX * sun_position

            # Giả lập Mây che & Bóng cây: Tỷ lệ biến thiên 5-15% ánh sáng hiện tại
            cloud_factor = random.uniform(0.85, 1.05)
            if random.choice([0, 1, 2, 3, 4]) != 1:
                current_lux = base_lux * cloud_factor
        else:
            # BAN ĐÊM: Ánh sáng cực thấp (trăng/đèn đường nhẹ)
            if random.choice([0, 1, 2, 3, 4]) != 1:
                current_lux = random.uniform(0.0, 5.0)

        sensor_reading = round(current_lux, 1)

        payload = {
            "timestamp": round(sim_time, 1),
            "light_intensity": sensor_reading,
            "unit": "lux"
        }
        json_data = json.dumps(payload)

        if is_connected:
            mqtt_client.publish(TOPIC_LIGHT, json_data)
        print(f"[Thời gian: {int(sim_time)}s] Published -> {TOPIC_LIGHT}: {json_data}")

# --- 5. DỌN DẸP KHI NGẮT MÔ PHỎNG ---
if is_connected:
    mqtt_client.loop_stop()
    mqtt_client.disconnect()
