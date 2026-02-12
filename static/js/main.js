let currentLanguage = null;
let selectedVoice = null;
let lastSpokenText = "";

function loadVoices() {
    let voices = speechSynthesis.getVoices();
    if (!currentLanguage) return;
    selectedVoice = voices.find(v => v.lang === currentLanguage);
    if (!selectedVoice) selectedVoice = voices.find(v =>
        v.lang.startsWith(currentLanguage.split("-")[0])
    );
}

speechSynthesis.onvoiceschanged = loadVoices;

function speak(text, callback = null) {
    window.speechSynthesis.cancel();
    let speech = new SpeechSynthesisUtterance(text);
    speech.rate = 1;
    speech.lang = currentLanguage || "en-IN";
    if (selectedVoice) speech.voice = selectedVoice;
    if (callback) speech.onend = callback;
    window.speechSynthesis.speak(speech);
}

function askLanguage() {
    speak("Please say your language. English, Hindi or Marathi.", startListening);
}

function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.start();

    recognition.onresult = function(event) {
        let spokenText = event.results[0][0].transcript.toLowerCase();
        console.log("User said:", spokenText);

        if (spokenText.includes("english")) {
            currentLanguage = "en-IN";
            speak("You selected English.", startDetection);
        } else if (spokenText.includes("hindi")) {
            currentLanguage = "hi-IN";
            speak("आपने हिंदी चुनी है।", startDetection);
        } else if (spokenText.includes("marathi")) {
            currentLanguage = "mr-IN";
            speak("तुम्ही मराठी निवडली आहे.", startDetection);
        } else {
            speak("Sorry, I did not understand. Please say English, Hindi or Marathi.", startListening);
        }

        loadVoices();
    };

    recognition.onerror = function () {
        speak("Please try again.", startListening);
    };
}

function checkNotes() {
    fetch("/get_notes")
        .then(res => res.json())
        .then(data => { speakNotes(data.notes); })
        .catch(err => console.log(err));
}

function speakNotes(notes) {
    if (!notes || notes.length === 0) return;

    let total = notes.reduce((sum, n) => sum + parseInt(n), 0);
    let text = "";

    if (currentLanguage === "en-IN") text = notes.join(" and ") + " detected. Sum is " + total;
    else if (currentLanguage === "hi-IN") text = notes.join(" और ") + " नोट मिले। कुल योग " + total;
    else if (currentLanguage === "mr-IN") text = notes.join(" आणि ") + " नोट सापडल्या. एकूण रक्कम " + total;

    if (text !== lastSpokenText) {
        lastSpokenText = text;
        speak(text);
    }
}

function startDetection() {
    if (!isMobile()) setInterval(checkNotes, 2000);
}

function isMobile() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

window.onload = function() {
    if (isMobile()) {
        const btn = document.getElementById("start-btn");
        btn.style.display = "block";
        btn.addEventListener("click", () => {
            askLanguage();
            btn.style.display = "none";
        });
    } else {
        askLanguage(); // auto start on desktop
    }
};
