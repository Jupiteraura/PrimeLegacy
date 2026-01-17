// --- 1. CORE VAULT & IDENTITY ---
let GROQ_KEY = localStorage.getItem('PRIME_MASTER_KEY');
let currentUser = "Commander Prime";
const input = document.getElementById('userInput');
const display = document.getElementById('display');
const missionLog = document.getElementById('missionLog');

// --- 2. MOBILE AUDIO ENGINE (iPhone Fix) ---
// Note: You MUST tap the screen once after refresh to enable sound.
function unlockAudio() {
    const msg = new SpeechSynthesisUtterance('');
    window.speechSynthesis.speak(msg);
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
}
window.addEventListener('click', unlockAudio);
window.addEventListener('touchstart', unlockAudio);

let voices = [];
function loadVoices() { voices = window.speechSynthesis.getVoices(); }
window.speechSynthesis.onvoiceschanged = loadVoices;

function speak(text, persona) {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
   
    // Voice Pitch Mapping
    const male = voices.find(v => v.name.includes('David') || v.name.includes('Male'));
    const female = voices.find(v => v.name.includes('Zira') || v.name.includes('Female'));

    if (persona === "FORTUNE") { if (male) utterance.voice = male; utterance.pitch = 0.6; }
    else if (persona === "WEDNESDAY") { if (female) utterance.voice = female; utterance.pitch = 1.3; }
    else if (persona === "STORM") { if (female) utterance.voice = female; utterance.pitch = 0.8; }
   
    window.speechSynthesis.speak(utterance);
}

// --- 3. THE BRAIN (With Solo-Mode Logic) ---
async function askAI(message) {
    if (!GROQ_KEY) return "STORM: ACCESS DENIED. Terminal is dark.";
   
    // Check if the user is targeting a specific Sentinel
    let target = "";
    const msgUpper = message.toUpperCase();
    if (msgUpper.includes("FORTUNE")) target = "FORTUNE";
    else if (msgUpper.includes("WEDNESDAY")) target = "WEDNESDAY";
    else if (msgUpper.includes("STORM")) target = "STORM";

    const url = "https://api.groq.com/openai/v1/chat/completions";
   
    // Dynamic instruction: If target exists, MUTE the others.
    let systemPrompt = "";
    if (target !== "") {
        systemPrompt = `You are ONLY ${target}. Do NOT speak for the other Sentinels. Respond ONLY as ${target}. Format: ${target}: [Message]`;
    } else {
        systemPrompt = `You are the PRIME SENTINELS team. Provide a brief status from FORTUNE, WEDNESDAY, and STORM separately. Format: NAME: [Message]`;
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY.trim()}` },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `[User: ${currentUser}]: ${message}` }
                ]
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (err) { return "STORM: Perimeter lost. Check connection."; }
}

// --- 4. THE SMART INTERFACE ---
function print(text, isUser = false) {
    let name = "FORTUNE", css = "fortune", cleanText = text;
   
    if (isUser) {
        name = "PRIME"; css = "user";
    } else {
        // Mission Log detection
        if (text.toUpperCase().includes("LOG:")) {
            const parts = text.split(/LOG:/i);
            cleanText = parts[0];
            missionLog.innerHTML = `<div style="margin-bottom:10px; border-bottom:1px solid #1e293b;">> ${parts[1]}</div>` + missionLog.innerHTML;
            localStorage.setItem('family_mission_log', missionLog.innerHTML);
        }

        // Persona Identification
        const textUpper = text.toUpperCase();
        if (textUpper.includes("WEDNESDAY:")) { name = "WEDNESDAY"; css = "wednesday"; cleanText = cleanText.replace(/WEDNESDAY:/i, ""); }
        else if (textUpper.includes("STORM:")) { name = "STORM"; css = "storm"; cleanText = cleanText.replace(/STORM:/i, ""); }
        else if (textUpper.includes("FORTUNE:")) { name = "FORTUNE"; css = "fortune"; cleanText = cleanText.replace(/FORTUNE:/i, ""); }
       
        speak(cleanText, name);
    }

    display.innerHTML += `<div class="${css}"><strong>${name}:</strong> ${cleanText}</div>`;
    display.scrollTop = display.scrollHeight;
    if (GROQ_KEY) localStorage.setItem('family_history_v9', display.innerHTML);
}

// --- 5. COMMANDS & LOCKDOWN ---
function signOut() {
    if(confirm("LOCKDOWN: Purge Master Key and History?")) {
        localStorage.clear();
        GROQ_KEY = null;
        location.reload();
    }
}

input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && input.value.trim() !== "") {
        const msg = input.value; input.value = "";
       
        // Key Entry Command
        if (msg.startsWith("/key ")) {
            GROQ_KEY = msg.replace("/key ", "").trim();
            localStorage.setItem('PRIME_MASTER_KEY', GROQ_KEY);
            display.innerHTML = "";
            print("STORM: Master Key Accepted. Welcome back, Commander.");
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
}

async function summon(sibling) {
    const reply = await askAI(`Status update, ${sibling}.`);
    print(reply);
}

// --- 6. STARTUP ---
window.onload = () => {
    loadVoices();
    if (!GROQ_KEY) {
        display.innerHTML = "<div class='storm'><strong>STORM:</strong> SYSTEM ENCRYPTED. Enter Master Key.</div>";
    } else {
        if (localStorage.getItem('family_history_v9')) display.innerHTML = localStorage.getItem('family_history_v9');
        if (localStorage.getItem('family_mission_log')) missionLog.innerHTML = localStorage.getItem('family_mission_log');
    }
    display.scrollTop = display.scrollHeight;
};

