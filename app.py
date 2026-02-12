from flask import Flask, render_template, Response, jsonify
import cv2
from ultralytics import YOLO
import threading
import webbrowser

app = Flask(__name__)

# Load Model (Keep your path)
model = YOLO("best_currency_v2.pt")

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

        # Inference - conf remains 0.70 for accuracy
        results = model(frame, conf=0.70, iou=0.5, verbose=False)

        detected_notes = []
        for r in results:
            if r.boxes:
                for box in r.boxes:
                    label = model.names[int(box.cls[0])]
                    detected_notes.append(label)

        # Update the list globally for the /get_notes route
        latest_notes = detected_notes

        # Annotated frame
        annotated = results[0].plot()
        ret, buffer = cv2.imencode(".jpg", annotated)
        yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n")

# (Imports and Camera setup stay the same)


@app.route("/")
def index():
    return render_template("index.html")

@app.route("/video_feed")
def video_feed():
    return Response(
        generate_frames(),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )

# (Keep imports and model loading as they are)

@app.route("/get_notes")
def get_notes():
    # ⚡ No processing here, just send the latest global notes
    return jsonify({"notes": latest_notes})

# (Keep generate_frames exactly as it is for the video stream)

if __name__ == "__main__":
    import threading
    import webbrowser
    # Extremely fast browser open
    threading.Timer(0.1, lambda: webbrowser.open("http://127.0.0.1:5000/")).start()
    # threaded=True allows multiple fast fetch requests from JS
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)