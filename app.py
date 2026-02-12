from flask import Flask, render_template, Response, jsonify, request
import cv2
from ultralytics import YOLO
import threading
import webbrowser
import base64
import numpy as np

app = Flask(__name__)

# Load Model
model = YOLO("best_currency_v2.pt")

# Laptop camera
camera = cv2.VideoCapture(0)
camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

latest_notes = []

def generate_frames():
    global latest_notes
    while True:
        success, frame = camera.read()
        if not success:
            break

        results = model(frame, conf=0.70, iou=0.5, verbose=False)

        detected_notes = []
        for r in results:
            if r.boxes:
                for box in r.boxes:
                    label = model.names[int(box.cls[0])]
                    detected_notes.append(label)

        latest_notes = detected_notes

        annotated = results[0].plot()
        ret, buffer = cv2.imencode(".jpg", annotated)
        yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/video_feed")
def video_feed():
    return Response(
        generate_frames(),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )

@app.route("/get_notes")
def get_notes():
    return jsonify({"notes": latest_notes})

# New route for mobile camera frames
@app.route("/detect_mobile", methods=["POST"])
def detect_mobile():
    global latest_notes
    data = request.json
    img_data = data["image"].split(",")[1]
    nparr = np.frombuffer(base64.b64decode(img_data), np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    results = model(frame, conf=0.70, iou=0.5, verbose=False)

    detected_notes = []
    for r in results:
        if r.boxes:
            for box in r.boxes:
                label = model.names[int(box.cls[0])]
                detected_notes.append(label)

    latest_notes = detected_notes
    return jsonify({"notes": detected_notes})

if __name__ == "__main__":
    # Open browser automatically
    threading.Timer(0.1, lambda: webbrowser.open("http://127.0.0.1:5000/")).start()
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
