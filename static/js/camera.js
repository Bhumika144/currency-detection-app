function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

if (isMobile()) {

    const laptopFeed = document.getElementById("laptop-feed");
    if (laptopFeed) laptopFeed.style.display = "none";

    const video = document.getElementById("mobile-video");
    video.style.display = "block";

    // Try to use rear camera first
    navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: "environment" } },
        audio: false
    })
    .then(stream => {
        video.srcObject = stream;
        video.play();
        sendFramesLoop();
    })
    .catch(() => {
        // fallback to any camera
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
            video.srcObject = stream;
            video.play();
            sendFramesLoop();
        })
        .catch(err => {
            console.error("Camera access failed:", err);
        });
    });

    function sendFramesLoop() {
        setInterval(sendFrame, 1000); // 1 FPS
    }

    async function sendFrame() {
        if (!video.videoWidth) return;

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);

        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append("frame", blob, "frame.jpg");

            try {
                const res = await fetch("/detect_frame", {
                    method: "POST",
                    body: formData
                });
                const data = await res.json();
                console.log("Detected notes:", data.notes);

                // Optionally update UI
                const statusText = document.getElementById("status-text");
                if (statusText) {
                    statusText.textContent = data.notes.length
                        ? "Detected: " + data.notes.join(", ")
                        : "No currency detected";
                }

            } catch (err) {
                console.error("Frame detection error:", err);
            }
        }, "image/jpeg");
    }
}
