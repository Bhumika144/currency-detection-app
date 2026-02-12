const video = document.getElementById("video");

// Open mobile back camera
function openBackCamera() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile && video) {
        navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: "environment" } }
        })
        .then(stream => {
            video.srcObject = stream;
            video.play();
            startSendingFrames();
        })
        .catch(err => console.error("Error opening back camera:", err));
    }
}

// Send frames to Flask every 500ms
function startSendingFrames() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    setInterval(() => {
        if (video.videoWidth === 0 || video.videoHeight === 0) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataURL = canvas.toDataURL("image/jpeg");

        fetch("/detect_mobile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: dataURL })
        })
        .then(res => res.json())
        .then(data => {
            if (data.notes && data.notes.length > 0) {
                processNotes(data.notes); // Use main.js voice function
            }
        })
        .catch(err => console.error(err));
    }, 500);
}

// Trigger back camera on first tap
document.body.addEventListener("click", () => openBackCamera(), { once: true });
