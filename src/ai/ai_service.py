import os
import joblib
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Mở CORS để nhận request

# 1. Đường dẫn tới file model .pkl
MODEL_PATH = './irrigation_model.pkl'

# Load model khi khởi động service
if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
    print(f" Loaded AI Model successfully from '{MODEL_PATH}'!")
else:
    print(f"❌ Error: Could not find '{MODEL_PATH}'. Please train the model first!")
    model = None

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'AI Model is not loaded'}), 500

    try:
        data = request.json

        # 2. Lấy dữ liệu từ Backend gửi sang (Đúng thứ tự cột lúc train!)
        features = np.array([[
            float(data.get('soil_moisture', 0)),
            float(data.get('soil_temp', 0)),
            float(data.get('temp', 0)),
            float(data.get('humidity', 0)),
            float(data.get('light', 0)),
            float(data.get('rain_forecast', 0)) # % từ 0 - 100
        ]])

        # 3. Dự đoán (0: Không tưới, 1: Tưới)
        prediction = int(model.predict(features)[0])
        probabilities = model.predict_proba(features)[0]
        confidence = float(probabilities[prediction]) # Độ tin cậy (VD: 0.95)

        # 4. Trả kết quả về cho Backend Node.js
        return jsonify({
            'should_water': bool(prediction == 1),
            'confidence': round(confidence * 100, 2), # % Độ tin cậy
            'message': 'Nên tưới nước ngay!' if prediction == 1 else 'Đất đủ ẩm hoặc khả năng mưa cao, không cần tưới.'
        })

    except Exception as e:
        print("❌ Prediction error:", str(e))
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    # Chạy AI Microservice ở port 5001
    print("🚀 AI Service is running on http://127.0.0.1:5001")
    app.run(host='127.0.0.1', port=5001, debug=True)
