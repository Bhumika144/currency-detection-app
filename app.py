from flask import Flask, render_template, Response, jsonify, request
import cv2
from ultralytics import YOLO
import threading
import webbrowser
import numpy as np

app = Flask(__name__)

# Load YOLO model
model = YOLO("best_currency_v2.pt")

# Laptop camera setup
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

# Mobile camera detection route
@app.route("/detect_frame", methods=["POST"])
def detect_frame():
    if "frame" not in request.files:
        return jsonify({"notes": []})

    file = request.files["frame"]
    nparr = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    results = model(frame, conf=0.70, iou=0.5, verbose=False)

    detected_notes = []
    for r in results:
        if r.boxes:
            for box in r.boxes:
                label = model.names[int(box.cls[0])]
                detected_notes.append(label)

    global latest_notes
    latest_notes = detected_notes
    return jsonify({"notes": detected_notes})

if __name__ == "__main__":
    # Auto-open browser
    threading.Timer(0.1, lambda: webbrowser.open("http://127.0.0.1:5000/")).start()
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
