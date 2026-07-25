import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

# 1. Đường dẫn tới file Excel
EXCEL_PATH = './data/dataset.xlsx'
MODEL_PATH = 'irrigation_model.pkl'

# 2. Đọc dữ liệu từ file Excel
if not os.path.exists(EXCEL_PATH):
    print(f"❌ Lỗi: Không tìm thấy file '{EXCEL_PATH}'! Hãy kiểm tra lại đường dẫn.")
    exit()

print(f" Data loading from file {EXCEL_PATH}...")
# Nếu file Excel có nhiều sheet, bạn có thể truyền thêm sheet_name='Sheet1'
df = pd.read_excel(EXCEL_PATH)

# Hiển thị 5 dòng đầu tiên để kiểm tra
print("\n--- 5 Dòng dữ liệu đầu tiên ---")
print(df.head())

# 3. Phân tách Features (X) và Target (y)
feature_cols = ['soil_moisture', 'soil_temp', 'temp', 'humidity', 'light', 'rain_forecast']
target_col = 'should_water'

# Kiểm tra xem các cột cần thiết có tồn tại trong file Excel không
missing_cols = [col for col in feature_cols + [target_col] if col not in df.columns]
if missing_cols:
    print(f"❌ File Excel thiếu các cột sau: {missing_cols}")
    exit()

X = df[feature_cols]
y = df[target_col]

# 4. Chia tập dữ liệu Train / Test (80% train, 20% test) để đánh giá mô hình
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 5. Khởi tạo và Train mô hình XGBoost
print("\n🤖 Đang huấn luyện mô hình XGBoost...")
model = XGBClassifier(
    n_estimators=100,  # Số cây
    max_depth=4,       # Độ sâu tối đa của cây
    learning_rate=0.1,
    random_state=42
)
model.fit(X_train, y_train)

# 6. Đánh giá độ chính xác đơn giản trên tập Test
accuracy = model.score(X_test, y_test)
print(f"🎯 Độ chính xác trên tập test: {accuracy * 100:.2f}%")

# 7. Lưu mô hình ra file
joblib.dump(model, MODEL_PATH)
print(f" Đã lưu mô hình thành công vào '{MODEL_PATH}'!")
