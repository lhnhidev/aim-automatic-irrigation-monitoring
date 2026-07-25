""" Controller: soil_temp_sensor_controller (Nâu) """
from controller import Robot
import json
import random
import paho.mqtt.client as mqtt

MQTT_BROKER, MQTT_PORT = "localhost", 1883
TOPIC_SOIL_TEMP = "garden/sensor/soil_temperature"

mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="Webots_SoilTempSensor")
is_connected = False
try:
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, keepalive=10)
    mqtt_client.loop_start()
    is_connected = True
except Exception as e:
    print(f"-> [MQTT Error] {e}")

robot = Robot()
time_step = int(robot.getBasicTimeStep())

current_val = 23.0       # Nhiệt độ đất ban đầu (°C)
MIN_VAL, MAX_VAL = 18.0, 30.0
MAX_STEP = 0.3           # Đất thay đổi nhiệt rất chậm (tối đa 0.3°C / 3s)

sim_time = 0.0
the_time = 3000

while robot.step(time_step) != -1:
    sim_time += time_step / 1000.0

    if int(sim_time * 1000) % the_time < time_step:
        delta = random.uniform(-MAX_STEP, MAX_STEP)
        if random.choice([0, 1, 2, 3, 4]) != 1:
            current_val = max(MIN_VAL, min(MAX_VAL, current_val + delta))
        sensor_reading = round(current_val, 2)

        payload = {"timestamp": round(sim_time, 1), "soil_temperature": sensor_reading, "unit": "C"}
        json_data = json.dumps(payload)

        if is_connected:
            mqtt_client.publish(TOPIC_SOIL_TEMP, json_data)
        print(f"[Thời gian: {int(sim_time)}s] Published -> {TOPIC_SOIL_TEMP}: {json_data}")

if is_connected:
    mqtt_client.loop_stop()
    mqtt_client.disconnect()
