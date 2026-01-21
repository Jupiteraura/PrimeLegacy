let GROQ_KEY = localStorage.getItem('PRIME_MASTER_KEY');
const input = document.getElementById('userInput');
const display = document.getElementById('display');
const missionLog = document.getElementById('missionLog');

function unlockAudio() {
    // 1. Wakes up the speakers
    const silent = new SpeechSynthesisUtterance(' ');
    window.speechSynthesis.speak(silent);
   
    // 2. FORCES iPhone to ask for Microphone permission
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                // We stop the stream immediately; we just wanted the "Allow" box to pop up
                stream.getTracks().forEach(track => track.stop());
                console.log("Mic Access Granted");
            })
            .catch(err => console.log("Mic Access Denied by User or Settings"));
    }

    window.speechSynthesis.getVoices();
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('click', unlockAudio);
}


// --- 2. THE BRAIN (SOLO MODE FILTER) ---
async function askAI(message) {
    if (!GROQ_KEY) return "STORM: Neural link required. Enter /key.";
   
    let target = "";
    const msgUpper = message.toUpperCase();
    if (msgUpper.includes("FORTUNE")) target = "FORTUNE";
    else if (msgUpper.includes("WEDNESDAY")) target = "WEDNESDAY";
    else if (msgUpper.includes("STORM")) target = "STORM";

    const history = localStorage.getItem('prime_memory') || "";
   
    // THE "SILENCE" FILTER
    let systemPrompt = "";
    if (target !== "") {
        systemPrompt = `You are ONLY ${target}. The others (Fortune, Wednesday, Storm) are OFFLINE. Speak only as ${target}. NO TEAM REPORTS. Format: ${target}: [Message]`;
    } else {
        systemPrompt = `You are the Sentinels (Fortune, Wednesday, Storm). Give a brief report from each. Context: ${history}`;
    }

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY.trim()}` },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: message }],
                temperature: 0.5 // Lower temperature = more obedient
            })
        });
        const data = await response.json();
        const reply = data.choices[0].message.content;
        localStorage.setItem('prime_memory', (history + " | " + reply).slice(-600));
        return reply;
    } catch { return "STORM: Transmission failed."; }
}

// --- 3. UI ENGINE ---
function print(text, isUser = false) {
    let name = "FORTUNE", css = "fortune", cleanText = text;
    if (isUser) { name = "PRIME"; css = "user"; }
    else {
        // Log Detection
        if (text.toUpperCase().includes("LOG:")) {
            const entry = text.split(/LOG:/i)[1];
            missionLog.innerHTML = `<div class="log-entry">> ${entry}</div>` + missionLog.innerHTML;
            localStorage.setItem('prime_logs', missionLog.innerHTML);
        }
        // Persona Detection
        if (text.toUpperCase().includes("WEDNESDAY:")) { name = "WEDNESDAY"; css = "wednesday"; cleanText = cleanText.replace(/WEDNESDAY:/i, ""); }
        else if (text.toUpperCase().includes("STORM:")) { name = "STORM"; css = "storm"; cleanText = cleanText.replace(/STORM:/i, ""); }
        else if (text.toUpperCase().includes("FORTUNE:")) { name = "FORTUNE"; css = "fortune"; cleanText = cleanText.replace(/FORTUNE:/i, ""); }
        speak(cleanText, name);
    }
    display.innerHTML += `<div class="${css}"><strong>${name}:</strong> ${cleanText}</div>`;
    display.scrollTop = display.scrollHeight;
    localStorage.setItem('prime_chat', display.innerHTML);
}

// --- 4. COMMANDS ---
input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && input.value.trim() !== "") {
        const val = input.value; input.value = "";
        if (val.startsWith("/key ")) {
            GROQ_KEY = val.split(" ")[1];
            localStorage.setItem('PRIME_MASTER_KEY', GROQ_KEY);
            print("STORM: Master Key Accepted.");
            return;
        }
        print(val, true);
        const reply = await askAI(val);
        print(reply);
    }
});

function signOut() { localStorage.clear(); location.reload(); }
async function quickSummon(name) {
    const reply = await askAI(`Status update, ${name}. Speak alone.`);
    print(reply);
}

window.onload = () => {
    display.innerHTML = localStorage.getItem('prime_chat') || "";
    missionLog.innerHTML = localStorage.getItem('prime_logs') || "";
    display.scrollTop = display.scrollHeight;
};
// --- NEURAL LISTENER (Voice Input with Speaker Reset) ---
const micBtn = document.getElementById('micBtn');
const micIcon = document.getElementById('micIcon');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    micBtn.onclick = () => {
        window.speechSynthesis.cancel(); // Clear any hanging speech
        recognition.start();
        micIcon.innerText = "📡";
        micBtn.style.boxShadow = "0 0 15px #00ffcc";
    };

    recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        micIcon.innerText = "🎤";
        micBtn.style.boxShadow = "none";
        
        // 1. Force the microphone to shut down completely
        recognition.stop(); 

        // 2. THE RE-ENGAGEMENT: Tap the speaker engine back to life
        const wakeup = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(wakeup);

        print(transcript, true);
        const reply = await askAI(transcript);
        
        // 3. Wait 500ms for iPhone to switch hardware modes
        setTimeout(() => {
            print(reply);
        }, 500);
    };

    recognition.onerror = () => {
        micIcon.innerText = "🎤";
        micBtn.style.boxShadow = "none";
    };
}
