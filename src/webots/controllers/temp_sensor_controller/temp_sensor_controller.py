"""
Controller: temp_sensor_controller
Chức năng: Giả lập nhiệt độ khu vườn và gửi dữ liệu tới EMQX MQTT Broker.
"""

from controller import Robot
import math
import json
import paho.mqtt.client as mqtt

# --- 1. CẤU HÌNH MQTT BROKER ---
MQTT_BROKER = "localhost" # Nếu chạy Docker trên cùng máy tính với Webots
MQTT_PORT = 1883
TOPIC_TEMP = "garden/sensor/temperature"

# Khởi tạo MQTT Client
mqtt_client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2, client_id="Webots_TempSensor"
)

try:
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
    mqtt_client.loop_start() # Chạy vòng lặp MQTT ở background
    print(f"-> [MQTT] Đã kết nối thành công tới Broker: {MQTT_BROKER}:{MQTT_PORT}")
except Exception as e:
    print(f"-> [MQTT Error] Không thể kết nối tới Broker: {e}")

# --- 2. KHỞI TẠO WEBOTS ROBOT ---
robot = Robot()
time_step = int(robot.getBasicTimeStep())

BASE_TEMP = 27.0
TEMP_AMPLITUDE = 8.0
sim_time = 0.0

print("--- KHỞI ĐỘNG CẢM BIẾN NHIỆT ĐỘ KHU VƯỜN ---")

# --- 3. VÒNG LẶP MÔ PHỎNG ---
while robot.step(time_step) != -1:
    sim_time += time_step / 1000.0 # Quy đổi ra giây
    
    # Giả lập nhiệt độ môi trường biến thiên
    current_temp = BASE_TEMP + TEMP_AMPLITUDE * math.sin(2 * math.pi * sim_time / 60.0)
    sensor_reading = round(current_temp, 2)
    
    # Gửi dữ liệu qua MQTT mỗi 1 giây mô phỏng (1000ms)
    if int(sim_time * 1000) % 1000 < time_step:
        # Tạo payload định dạng JSON
        payload = {
            "timestamp": round(sim_time, 1),
            "temperature": sensor_reading,
            "unit": "C"
        }
        
        # Publish tin nhắn lên EMQX
        json_data = json.dumps(payload)
        mqtt_client.publish(TOPIC_TEMP, json_data)
        
        print(f"[Thời gian: {int(sim_time)}s] Published -> {TOPIC_TEMP}: {json_data}")

# Dọn dẹp kết nối khi dừng mô phỏng
mqtt_client.loop_stop()
mqtt_client.disconnect()