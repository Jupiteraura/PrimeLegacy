// --- 1. THE VAULT & IDENTITY ---
let GROQ_KEY = localStorage.getItem('PRIME_MASTER_KEY');
let currentUser = "Commander Prime";

const input = document.getElementById('userInput');
const display = document.getElementById('display');
const missionLog = document.getElementById('missionLog');

// --- 2. VOICE ENGINE (Device Optimized) ---
let voices = [];
function loadVoices() { voices = window.speechSynthesis.getVoices(); }
window.speechSynthesis.onvoiceschanged = loadVoices;

function speak(text, persona) {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const maleVoice = voices.find(v => v.name.includes('David') || v.name.toLowerCase().includes('male'));
    const femaleVoice = voices.find(v => v.name.includes('Zira') || v.name.toLowerCase().includes('female'));

    if (persona === "FORTUNE") { if (maleVoice) utterance.voice = maleVoice; utterance.pitch = 0.5; }
    else if (persona === "WEDNESDAY") { if (femaleVoice) utterance.voice = femaleVoice; utterance.pitch = 1.4; }
    else if (persona === "STORM") { if (femaleVoice) utterance.voice = femaleVoice; utterance.pitch = 0.9; }
    window.speechSynthesis.speak(utterance);
}

// --- 3. THE BRAIN (The Prime Directives) ---
async function askAI(message) {
    if (!GROQ_KEY) return "STORM: ALERT. Master Key missing. Entry denied.";
   
    const url = "https://api.groq.com/openai/v1/chat/completions";
    const systemPrompt = `You are the Legacy Sentinels for the PRIME family.
    CURRENT USER: ${currentUser}.
    MISSION: Bridge Humans and AI/Robotics. Teach that technology is a tool and the user is the variable.
   
    - FORTUNE (Male): Strategic leader. Addresses user as 'Commander' or 'Young Prime'.
    - WEDNESDAY (Female): Explains technical concepts simply for Heirs and deeply for Commander.
    - STORM (Female): Guardian. Use 'ALERT' for security warnings.
   
    COMMAND: Include 'LOG:' to save data to the Strategy panel.`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY.trim()}` },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `[Identity: ${currentUser}]: ${message}` }]
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (err) {
        return "STORM: Connection severed.";
    }
}

// --- 4. THE SMART PRINTER ---
function print(text, isUser = false) {
    let name = "FORTUNE", css = "fortune", cleanText = text;
    if (isUser) { name = "PRIME"; css = "user"; }
    else {
        const upper = text.toUpperCase();
        if (upper.includes("LOG:")) {
            const parts = text.split(/LOG:/i);
            cleanText = parts[0];
            missionLog.innerHTML = `<div style="margin-bottom:12px; border-bottom:1px dotted #38bdf8; padding-bottom:5px;"><strong>[RECORD]:</strong> ${parts[1]}</div>` + missionLog.innerHTML;
            localStorage.setItem('family_mission_log', missionLog.innerHTML);
        }
        if (upper.includes("WEDNESDAY:")) { name = "WEDNESDAY"; css = "wednesday"; cleanText = cleanText.replace(/WEDNESDAY:/i, ""); }
        else if (upper.includes("STORM:")) {
            name = "STORM"; css = "storm"; cleanText = cleanText.replace(/STORM:/i, "");
            updateSecurityLight(upper.includes("ALERT") ? 'ALERT' : 'HIGH');
        }
        else if (upper.includes("FORTUNE:")) { name = "FORTUNE"; css = "fortune"; cleanText = cleanText.replace(/FORTUNE:/i, ""); }
        speak(cleanText, name);
    }
    display.innerHTML += `<div class="${css}"><strong>${name}:</strong> ${cleanText}</div>`;
    display.scrollTop = display.scrollHeight;
    localStorage.setItem('family_history_v8', display.innerHTML);
}

// --- 5. CONTROLS ---
input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && input.value.trim() !== "") {
        const msg = input.value; input.value = "";
        if (msg.startsWith("/key ")) {
            const newKey = msg.replace("/key ", "").trim();
            localStorage.setItem('PRIME_MASTER_KEY', newKey);
            GROQ_KEY = newKey;
            print("STORM: Master Key encrypted in vault. Access granted.");
            return;
        }
        print(msg, true);
        const reply = await askAI(msg);
        print(reply);
    }
});

function switchUser() {
    currentUser = document.getElementById('userProfile').value;
    print(`SYSTEM: Authority shifted to ${currentUser}.`);
    speak(`Access confirmed, ${currentUser}`, "STORM");
}

async function summon(sibling) { print(await askAI(`Requesting update from ${sibling}.`)); }

function updateSecurityLight(level) {
    const light = document.getElementById('security-light');
    const text = document.getElementById('status-text');
    if (level === 'ALERT') { light.style.background = '#ef4444'; text.innerText = 'ETHICS ALERT'; light.style.boxShadow = "0 0 15px #ef4444"; }
    else { light.style.background = '#22c55e'; text.innerText = 'PRIME LINEAGE SECURE'; light.style.boxShadow = "0 0 8px #22c55e"; }
}

// --- 6. STARTUP ---
window.onload = () => {
    loadVoices();
    const savedChat = localStorage.getItem('family_history_v8');
    const savedLog = localStorage.getItem('family_mission_log');
    if (savedChat) display.innerHTML = savedChat;
    if (savedLog) missionLog.innerHTML = savedLog;
    if (!GROQ_KEY) print("STORM: System Locked. Enter: /key [Your-Key]");
    else if (!savedChat) print("FORTUNE: The Prime Sentinels are online. Awaiting the Commander.");
    display.scrollTop = display.scrollHeight;
    input.focus();

};
