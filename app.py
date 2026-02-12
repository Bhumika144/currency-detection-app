from flask import Flask, render_template, request, jsonify
from ultralytics import YOLO
import numpy as np
import cv2
import threading
import webbrowser

app = Flask(__name__)

# Load your YOLO model
model = YOLO("best_currency_v2.pt")

latest_notes = []

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/detect_frame", methods=["POST"])
def detect_frame():
    global latest_notes

    if "frame" not in request.files:
        return jsonify({"notes": []})

    file = request.files["frame"]
    nparr = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    results = model(frame, conf=0.7, iou=0.5, verbose=False)

    detected_notes = []
    for r in results:
        if r.boxes:
            for box in r.boxes:
                label = model.names[int(box.cls[0])]
                detected_notes.append(label)

    latest_notes = detected_notes

    return jsonify({"notes": detected_notes})

if __name__ == "__main__":
    threading.Timer(0.1, lambda: webbrowser.open("http://127.0.0.1:5000/")).start()
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
