function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

if (isMobile()) {

    // Hide laptop feed
    document.getElementById("laptop-feed").style.display = "none";

    const video = document.getElementById("mobile-video");
    video.style.display = "block";

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
        // fallback
        navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            video.play();
            sendFramesLoop();
        });
    });

    function sendFramesLoop() {
        setInterval(sendFrame, 1000);
    }

    function sendFrame() {

        if (!video.videoWidth) return;

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);

        canvas.toBlob(blob => {

            const formData = new FormData();
            formData.append("frame", blob, "frame.jpg");

            fetch("/detect_frame", {
                method: "POST",
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                // Notes stored globally in backend
            });

        }, "image/jpeg");
    }
}
