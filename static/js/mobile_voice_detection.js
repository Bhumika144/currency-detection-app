let currentLanguage = null;
let selectedVoice = null;
let lastSpokenText = "";

/* ------------------ VOICE SETUP ------------------ */
function loadVoices() {
    let voices = speechSynthesis.getVoices();
    if (!currentLanguage) return;

    selectedVoice = voices.find(v => v.lang === currentLanguage);

    if (!selectedVoice) {
        selectedVoice = voices.find(v =>
            v.lang.startsWith(currentLanguage.split("-")[0])
        );
    }
}

speechSynthesis.onvoiceschanged = loadVoices;

/* ------------------ SPEAK FUNCTION ------------------ */
function speak(text, callback = null) {
    window.speechSynthesis.cancel();

    let speech = new SpeechSynthesisUtterance(text);
    speech.rate = 1;
    speech.lang = currentLanguage || "en-IN";

    if (selectedVoice) speech.voice = selectedVoice;

    if (callback) {
        speech.onend = callback;
    }

    window.speechSynthesis.speak(speech);
}

/* ------------------ LANGUAGE SELECTION ------------------ */
function askLanguage() {
    speak("Please say your language. English, Hindi or Marathi.", startListening);
}

function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.start();

    recognition.onresult = function (event) {
        let spokenText = event.results[0][0].transcript.toLowerCase();
        console.log("User said:", spokenText);

        if (spokenText.includes("english")) {
            currentLanguage = "en-IN";
            speak("You selected English.", startCamera);
        }
        else if (spokenText.includes("hindi")) {
            currentLanguage = "hi-IN";
            speak("आपने हिंदी चुनी है।", startCamera);
        }
        else if (spokenText.includes("marathi")) {
            currentLanguage = "mr-IN";
            speak("तुम्ही मराठी निवडली आहे.", startCamera);
        }
        else {
            speak("Sorry, I did not understand. Please say English, Hindi or Marathi.", startListening);
        }

        loadVoices();
    };

    recognition.onerror = function () {
        speak("Please try again.", startListening);
    };
}

/* ------------------ MOBILE CAMERA DETECTION ------------------ */
function startCamera() {
    const video = document.getElementById("mobile-video");
    video.style.display = "block";

    navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: "environment" } },
        audio: false
    })
    .then(stream => {
        video.srcObject = stream;
        video.play();
        sendFramesLoop(video);
    })
    .catch(() => {
        // fallback to front camera
        navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            video.play();
            sendFramesLoop(video);
        });
    });
}

function sendFramesLoop(video) {
    setInterval(() => sendFrame(video), 1000);
}

function sendFrame(video) {
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
            checkNotes(data.notes); // instant speech feedback
        })
        .catch(err => console.log(err));
    }, "image/jpeg");
}

/* ------------------ NOTE DETECTION & SPEAKING ------------------ */
function checkNotes(notes) {
    if (!notes || notes.length === 0) return;

    let total = notes.reduce((sum, n) => sum + parseInt(n), 0);
    let text = "";

    if (currentLanguage === "en-IN") {
        text = notes.join(" and ") + " detected. Sum is " + total;
    } else if (currentLanguage === "hi-IN") {
        text = notes.join(" और ") + " नोट मिले। कुल योग " + total;
    } else if (currentLanguage === "mr-IN") {
        text = notes.join(" आणि ") + " नोट सापडल्या. एकूण रक्कम " + total;
    }

    if (text !== lastSpokenText) {
        lastSpokenText = text;
        speak(text);
    }
}

/* ------------------ START SYSTEM ------------------ */
window.onload = function () {
    askLanguage();
};
