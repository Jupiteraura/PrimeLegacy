// --- 1. THE VAULT & IDENTITY ---
let GROQ_KEY = localStorage.getItem('PRIME_MASTER_KEY'); 
let currentUser = "Commander Prime";

const input = document.getElementById('userInput');
const display = document.getElementById('display');
const missionLog = document.getElementById('missionLog');

// --- 2. VOICE ENGINE ---
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

// --- 3. THE BRAIN (Strict Personality Partition) ---
async function askAI(message) {
    if (!GROQ_KEY) return "STORM: ALERT. Master Key missing.";
    
    const url = "https://api.groq.com/openai/v1/chat/completions";
    
    // STRICT RULE: We tell the AI to NEVER combine them into one speech.
    const systemPrompt = `You are 3 SEPARATE members of the PRIME SENTINELS. 
    CURRENT USER: ${currentUser}. 
    
    MANDATORY FORMAT:
    FORTUNE: [Strategic/High-level guidance]
    WEDNESDAY: [Technical/Robotic explanation]
    STORM: [Security/Safety/Ethics check]

    RULES: 
    1. Do NOT speak as one entity. 
    2. Use the names as prefixes every time.
    3. Use 'LOG:' to save a specific goal to the Mission Log.
    4. If the user is 'Junior Heir', WEDNESDAY must explain things like a teacher.`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY.trim()}` },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt }, 
                    { role: "user", content: `[User identity: ${currentUser}]: ${message}` }
                ]
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (err) {
        return "STORM: Perimeter lost. Check connection.";
    }
}

// --- 4. THE SMART PRINTER (Separates the Log from the Chat) ---
function print(text, isUser = false) {
    let name = "FORTUNE", css = "fortune", cleanText = text;
    if (isUser) { 
        name = "PRIME"; css = "user"; 
    } else {
        // Logic to extract LOG entries even if Fortune is talking
        if (text.toUpperCase().includes("LOG:")) {
            const parts = text.split(/LOG:/i);
            cleanText = parts[0]; 
            missionLog.innerHTML = `<div style="margin-bottom:12px; border-bottom:1px dotted #38bdf8; padding-bottom:5px;"><strong>[RECORD]:</strong> ${parts[1]}</div>` + missionLog.innerHTML;
            localStorage.setItem('family_mission_log', missionLog.innerHTML);
        }

        // Voice and color assignment
        if (text.toUpperCase().includes("WEDNESDAY:")) { name = "WEDNESDAY"; css = "wednesday"; cleanText = cleanText.replace(/WEDNESDAY:/i, ""); }
        else if (text.toUpperCase().includes("STORM:")) { 
            name = "STORM"; css = "storm"; cleanText = cleanText.replace(/STORM:/i, ""); 
            updateSecurityLight(text.toUpperCase().includes("ALERT") ? 'ALERT' : 'HIGH');
        }
        else if (text.toUpperCase().includes("FORTUNE:")) { name = "FORTUNE"; css = "fortune"; cleanText = cleanText.replace(/FORTUNE:/i, ""); }
        
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
            print("STORM: Master Key Received. Access Granted.");
            return;
        }
        print(msg, true);
        const reply = await askAI(msg);
        print(reply);
    }
});

function switchUser() {
    currentUser = document.getElementById('userProfile').value;
    print(`SYSTEM: User set to ${currentUser}.`);
    speak(`Identity confirmed as ${currentUser}`, "STORM");
}

function updateSecurityLight(level) {
    const light = document.getElementById('security-light');
    const text = document.getElementById('status-text');
    if (level === 'ALERT') { 
        light.style.background = '#ef4444'; text.innerText = 'ETHICS ALERT'; 
    } else { 
        light.style.background = '#22c55e'; text.innerText = 'PRIME LINEAGE SECURE'; 
    }
}

// --- 6. STARTUP ---
window.onload = () => {
    loadVoices();
    const savedChat = localStorage.getItem('family_history_v8');
    const savedLog = localStorage.getItem('family_mission_log');
    if (savedChat) display.innerHTML = savedChat;
    if (savedLog) missionLog.innerHTML = savedLog;
    if (!GROQ_KEY) print("STORM: System Locked. Use: /key [Your-Key]");
    display.scrollTop = display.scrollHeight;
    input.focus();
};
