""" Controller: soil_moisture_sensor_controller (Cam) """
from controller import Robot
import json
import random
import paho.mqtt.client as mqtt

MQTT_BROKER, MQTT_PORT = "localhost", 1883
TOPIC_SOIL_MOISTURE = "garden/sensor/soil_moisture"

mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="Webots_SoilMoistureSensor")
is_connected = False
try:
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, keepalive=10)
    mqtt_client.loop_start()
    is_connected = True
except Exception as e:
    print(f"-> [MQTT Error] {e}")

robot = Robot()
time_step = int(robot.getBasicTimeStep())

current_val = 55.0       # Độ ẩm đất ban đầu (%)
MIN_VAL, MAX_VAL = 30.0, 80.0
MAX_STEP = 0.5           # Tối đa 0.5% / 3s

sim_time = 0.0
the_time = 3000

while robot.step(time_step) != -1:
    sim_time += time_step / 1000.0

    if int(sim_time * 1000) % the_time < time_step:
        # Độ ẩm đất có xu hướng giảm nhẹ (bốc hơi) cộng thêm nhiễu
        drift = -0.1
        delta = drift + random.uniform(-MAX_STEP, MAX_STEP)
        if random.choice([0, 1, 2, 3, 4]) != 1:
            current_val = max(MIN_VAL, min(MAX_VAL, current_val + delta))
        sensor_reading = round(current_val, 2)

        payload = {"timestamp": round(sim_time, 1), "soil_moisture": sensor_reading, "unit": "%"}
        json_data = json.dumps(payload)

        if is_connected:
            mqtt_client.publish(TOPIC_SOIL_MOISTURE, json_data)
        print(f"[Thời gian: {int(sim_time)}s] Published -> {TOPIC_SOIL_MOISTURE}: {json_data}")

if is_connected:
    mqtt_client.loop_stop()
    mqtt_client.disconnect()
