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


/* ------------------ LANGUAGE SELECTION BY VOICE ------------------ */

function askLanguage() {

    speak("Please say your language. English, Hindi or Marathi.", startListening);
}

function startListening() {

    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.start();

    recognition.onresult = function (event) {

        let spokenText = event.results[0][0].transcript.toLowerCase();
        console.log("User said:", spokenText);

        if (spokenText.includes("english")) {
            currentLanguage = "en-IN";
            speak("You selected English.", startDetection);
        }
        else if (spokenText.includes("hindi")) {
            currentLanguage = "hi-IN";
            speak("आपने हिंदी चुनी है।", startDetection);
        }
        else if (spokenText.includes("marathi")) {
            currentLanguage = "mr-IN";
            speak("तुम्ही मराठी निवडली आहे.", startDetection);
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


/* ------------------ NOTE DETECTION ------------------ */

function checkNotes() {

    fetch("/get_notes")
        .then(res => res.json())
        .then(data => {

            if (!data.notes || data.notes.length === 0) return;

            let total = data.notes.reduce((sum, n) => sum + parseInt(n), 0);
            let text = "";

            /* English */
            if (currentLanguage === "en-IN") {
                text = data.notes.join(" and ") +
                    " detected. Sum is " + total;
            }

            /* Hindi */
            else if (currentLanguage === "hi-IN") {
                text = data.notes.join(" और ") +
                    " नोट मिले। कुल योग " + total;
            }

            /* Marathi */
            else if (currentLanguage === "mr-IN") {
                text = data.notes.join(" आणि ") +
                    " नोट सापडल्या. एकूण रक्कम " + total;
            }

            if (text !== lastSpokenText) {
                lastSpokenText = text;
                speak(text);
            }

        })
        .catch(err => console.log(err));
}


function startDetection() {
    setInterval(checkNotes, 2000);
}


/* ------------------ START SYSTEM ------------------ */
window.onload = function () {
    askLanguage();
};

