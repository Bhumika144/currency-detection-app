// camera.js

// Function to open mobile back camera
function openBackCamera() {
    const video = document.getElementById("video");
    
    // Check if running on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile && video) {
        navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: "environment" } } // back camera
        })
        .then(stream => {
            video.srcObject = stream;
            video.play();
        })
        .catch(err => {
            console.error("Error opening back camera:", err);
        });
    }
}

// Automatically trigger after first tap anywhere
document.body.addEventListener("click", () => {
    openBackCamera();
}, { once: true });
