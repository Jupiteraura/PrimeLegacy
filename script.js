let GROQ_KEY = localStorage.getItem('PRIME_MASTER_KEY'); 
const input = document.getElementById('userInput');
const display = document.getElementById('display');
const missionLog = document.getElementById('missionLog');

// --- 1. IPHONE POWER UNLOCK & MIC WAKEUP ---
function unlockAudio() {
    const silent = new SpeechSynthesisUtterance(' ');
    window.speechSynthesis.speak(silent);
    
    // Force permission check immediately on first tap
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => stream.getTracks().forEach(track => track.stop()))
            .catch(err => console.log("Mic access requires settings check."));
    }

    window.speechSynthesis.getVoices(); 
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('click', unlockAudio);
}
window.addEventListener('touchstart', unlockAudio);
window.addEventListener('click', unlockAudio);

function speak(text, persona) {
    window.speechSynthesis.cancel();
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Sentinel Voice Profiles
    if (persona === "FORTUNE") { utterance.pitch = 0.7; utterance.rate = 0.9; }
    else if (persona === "WEDNESDAY") { utterance.pitch = 1.4; utterance.rate = 1.1; }
    else { utterance.pitch = 1.0; utterance.rate = 1.0; }

    // iPhone Hardware Nudge: Play a silent puff to reclaim the speaker channel
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    
    setTimeout(() => {
        window.speechSynthesis.speak(utterance);
    }, 150);
}

// --- 2. THE BRAIN (AGGRESSIVE SOLO FILTER) ---
async function askAI(message) {
    if (!GROQ_KEY) return "STORM: Neural link required. Enter /key.";
    
    let target = "";
    const msgUpper = message.toUpperCase();
    if (msgUpper.includes("FORTUNE")) target = "FORTUNE";
    else if (msgUpper.includes("WEDNESDAY")) target = "WEDNESDAY";
    else if (msgUpper.includes("STORM")) target = "STORM";

    const history = localStorage.getItem('prime_memory') || "";
    
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
                temperature: 0.5 
            })
        });
        const data = await response.json();
        const reply = data.choices[0].message.content;
        localStorage.setItem('prime_memory', (history + " | " + reply).slice(-600));
        return reply;
    } catch { return "STORM: Transmission failed."; }
}

// --- 3. UI & LOG ENGINE ---
function print(text, isUser = false) {
    let name = "FORTUNE", css = "fortune", cleanText = text;
    if (isUser) { name = "PRIME"; css = "user"; }
    else {
        if (text.toUpperCase().includes("LOG:")) {
            const entry = text.split(/LOG:/i)[1];
            missionLog.innerHTML = `<div class="log-entry">> ${entry}</div>` + missionLog.innerHTML;
            localStorage.setItem('prime_logs', missionLog.innerHTML);
        }
        if (text.toUpperCase().includes("WEDNESDAY:")) { name = "WEDNESDAY"; css = "wednesday"; cleanText = cleanText.replace(/WEDNESDAY:/i, ""); }
        else if (text.toUpperCase().includes("STORM:")) { name = "STORM"; css = "storm"; cleanText = cleanText.replace(/STORM:/i, ""); }
        else if (text.toUpperCase().includes("FORTUNE:")) { name = "FORTUNE"; css = "fortune"; cleanText = cleanText.replace(/FORTUNE:/i, ""); }
        speak(cleanText, name);
    }
    display.innerHTML += `<div class="${css}"><strong>${name}:</strong> ${cleanText}</div>`;
    display.scrollTop = display.scrollHeight;
    localStorage.setItem('prime_chat', display.innerHTML);
}

// --- 4. NEURAL LISTENER (VOICE INPUT) ---
const micBtn = document.getElementById('micBtn');
const micIcon = document.getElementById('micIcon');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    micBtn.onclick = () => {
        window.speechSynthesis.cancel(); 
        recognition.start();
        micIcon.innerText = "📡";
    };

    recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        micIcon.innerText = "🎤";
        recognition.stop(); 

        // CRITICAL: Force a silent utterance to flip iPhone hardware from REC to PLAY
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(' '));

        print(transcript, true);
        const reply = await askAI(transcript);
        
        // Wait for hardware handoff
        setTimeout(() => { print(reply); }, 600);
    };
}

input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && input.value.trim() !== "") {
        const val = input.value; input.value = "";
        if (val.startsWith("/key ")) {
            GROQ_KEY = val.split(" ")[1];
            localStorage.setItem('PRIME_MASTER_KEY', GROQ_KEY);
            return;
        }
        print(val, true);
        print(await askAI(val));
    }
});

function signOut() { localStorage.clear(); location.reload(); }
async function quickSummon(name) { print(await askAI(`Status update, ${name}. Speak alone.`)); }

window.onload = () => {
    display.innerHTML = localStorage.getItem('prime_chat') || "";
    missionLog.innerHTML = localStorage.getItem('prime_logs') || "";
    display.scrollTop = display.scrollHeight;
};
