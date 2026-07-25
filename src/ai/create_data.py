import pandas as pd
import numpy as np

# Số lượng mẫu muốn khởi tạo
NUM_SAMPLES = 1000
np.random.seed(42)

# 1. Sinh dữ liệu giả lập chuẩn thực tế nông nghiệp
soil_moisture = np.random.uniform(10, 85, NUM_SAMPLES)      # Độ ẩm đất (%)
soil_temp = np.random.uniform(18, 35, NUM_SAMPLES)          # Nhiệt độ đất (°C)
temp = soil_temp + np.random.uniform(2, 8, NUM_SAMPLES)      # Nhiệt độ không khí (°C)
humidity = np.random.uniform(30, 90, NUM_SAMPLES)           # Độ ẩm không khí (%)
light = np.random.uniform(500, 90000, NUM_SAMPLES)           # Cường độ ánh sáng (Lux)

#  SỬA ĐỔI: Dự báo khả năng mưa theo phần trăm (0% - 100%)
# Tạo phân phối tự nhiên hơn (nhiều ngày nắng/mưa ít, ít ngày xác suất mưa cực cao)
rain_forecast = np.random.uniform(0, 100, NUM_SAMPLES)

# 2. Tạo logic tưới tiêu thông minh (Label `should_water`)
should_water = []

for i in range(NUM_SAMPLES):
    sm = soil_moisture[i]
    rf = rain_forecast[i] # Khả năng mưa (%)
    t = temp[i]

    # LOGIC NÔNG NGHIỆP CẬP NHẬT:
    # - Khả năng mưa cao (>= 70%): Không tưới vì sắp có mưa lớn.
    # - Khả năng mưa trung bình (50% - 70%): Chỉ tưới nếu đất CỰC KỲ KHÔ (< 25%).
    # - Khả năng mưa thấp (< 50%):
    #     + Nếu đất khô (< 35%) -> Tưới.
    #     + Nếu đất ẩm vừa (35 - 50%) nhưng nhiệt độ cao (> 33°C) -> Tưới nhẹ.
    #     + Đất ẩm tốt (> 50%) -> Không tưới.

    if rf >= 70:
        should_water.append(0)
    elif 50 <= rf < 70:
        if sm < 25:
            should_water.append(1)
        else:
            should_water.append(0)
    else: # rf < 50
        if sm < 35:
            should_water.append(1)
        elif 35 <= sm <= 50 and t > 33:
            should_water.append(1)
        else:
            should_water.append(0)

# 3. Đóng gói thành DataFrame
df = pd.DataFrame({
    'soil_moisture': np.round(soil_moisture, 2),
    'soil_temp': np.round(soil_temp, 2),
    'temp': np.round(temp, 2),
    'humidity': np.round(humidity, 2),
    'light': np.round(light, 1),
    'rain_forecast': np.round(rain_forecast, 1), # Làm tròn 1 chữ số thập phân (ví dụ: 65.4%)
    'should_water': should_water
})

# 4. Xuất ra file Excel dataset.xlsx
df.to_excel('./data/dataset.xlsx', index=False)
print(" Đã tạo thành công file 'dataset.xlsx' với 1,000 dòng (dự báo mưa % từ 0-100)!")
