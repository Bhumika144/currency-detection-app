const video = document.getElementById("video");
const SEND_INTERVAL = 1000;

function startCamera() {
    const constraints = {
        video: { facingMode: { exact: "environment" } },
        audio: false
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            video.srcObject = stream;
            video.play();
            sendFramesLoop();
        })
        .catch(err => {
            console.log("Could not access back camera, using default:", err);
            navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                .then(stream => {
                    video.srcObject = stream;
                    video.play();
                    sendFramesLoop();
                })
                .catch(err2 => console.error("Camera error:", err2));
        });
}

function sendFrame() {
    if (!video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
        const formData = new FormData();
        formData.append("frame", blob, "frame.jpg");

        fetch("/detect_frame", { method: "POST", body: formData })
            .then(res => res.json())
            .then(data => {
                if (data.notes && data.notes.length > 0) {
                    if (typeof speakNotes === "function") speakNotes(data.notes);
                }
            })
            .catch(err => console.log(err));
    }, "image/jpeg");
}

function sendFramesLoop() {
    setInterval(sendFrame, SEND_INTERVAL);
}

startCamera();
