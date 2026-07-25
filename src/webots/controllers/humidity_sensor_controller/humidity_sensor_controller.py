""" Controller: humidity_sensor_controller (Xanh biển) """
from controller import Robot
import json
import random
import paho.mqtt.client as mqtt

MQTT_BROKER, MQTT_PORT = "localhost", 1883
TOPIC_HUMIDITY = "garden/sensor/humidity"

mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="Webots_HumiditySensor")
is_connected = False
try:
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, keepalive=10)
    mqtt_client.loop_start()
    is_connected = True
except Exception as e:
    print(f"-> [MQTT Error] {e}")

robot = Robot()
time_step = int(robot.getBasicTimeStep())

# Trạng thái ban đầu & Giới hạn
current_val = 65.0       # Giá trị khởi đầu (%)
MIN_VAL, MAX_VAL = 40.0, 90.0
MAX_STEP = 1.2           # Mỗi 3 giây chỉ tăng/giảm tối đa 1.2%

sim_time = 0.0
the_time = 3000

while robot.step(time_step) != -1:
    sim_time += time_step / 1000.0

    if int(sim_time * 1000) % the_time < time_step:
        # Thay đổi ngẫu nhiên nhỏ so với giá trị trước
        delta = random.uniform(-MAX_STEP, MAX_STEP)
        if random.choice([0, 1, 2, 3, 4]) != 1:
            current_val = max(MIN_VAL, min(MAX_VAL, current_val + delta))
        sensor_reading = round(current_val, 2)

        payload = {"timestamp": round(sim_time, 1), "humidity": sensor_reading, "unit": "%"}
        json_data = json.dumps(payload)

        if is_connected:
            mqtt_client.publish(TOPIC_HUMIDITY, json_data)
        print(f"[Thời gian: {int(sim_time)}s] Published -> {TOPIC_HUMIDITY}: {json_data}")

if is_connected:
    mqtt_client.loop_stop()
    mqtt_client.disconnect()
