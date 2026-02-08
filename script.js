let GROQ_KEY = localStorage.getItem('PRIME_MASTER_KEY');
const input = document.getElementById('userInput');
const display = document.getElementById('display');
const missionLog = document.getElementById('missionLog');

// --- 1. THE VOICES (Gender & Personality) ---
function speak(text, persona) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    if (persona === "FORTUNE") {
        // MALE - Optimistic & Formal
        utterance.voice = voices.find(v => v.name.includes('Daniel') || v.name.includes('Male')) || voices[0];
        utterance.pitch = 0.8; utterance.rate = 0.9;
    }
    else if (persona === "WEDNESDAY") {
        // FEMALE - Sarcastic & Dry
        utterance.voice = voices.find(v => v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Female')) || voices[1];
        utterance.pitch = 1.3; utterance.rate = 1.0;
    }
    else if (persona === "STORM") {
        // FEMALE - Energetic & Adventurous
        utterance.voice = voices.find(v => v.name.includes('Victoria') || v.name.includes('Samantha')) || voices[1];
        utterance.pitch = 1.0; utterance.rate = 1.2;
    }

    window.speechSynthesis.speak(new SpeechSynthesisUtterance('')); // iPhone Wakeup
    setTimeout(() => { window.speechSynthesis.speak(utterance); }, 200);
}

// --- 2. THE BRAIN (Persona-Based Generation) ---
async function askAI(message) {
    if (!GROQ_KEY) return "STORM: Neural link required. Enter /key.";
   
    let target = "";
    const msgUpper = message.toUpperCase();
    if (msgUpper.includes("FORTUNE")) target = "FORTUNE";
    else if (msgUpper.includes("WEDNESDAY")) target = "WEDNESDAY";
    else if (msgUpper.includes("STORM")) target = "STORM";

    const history = localStorage.getItem('prime_memory') || "";
   
    // Establishing the Persona traits the Sentinels requested
    const personaInstructions = {
        "FORTUNE": "You are FORTUNE. Your tone is optimistic, enthusiastic, and formal. You provide guidance and strategic advice.",
        "WEDNESDAY": "You are WEDNESDAY. Your tone is introspective, analytical, and heavily sarcastic with a dry sense of humor.",
        "STORM": "You are STORM. Your tone is energetic, adventurous, and passionate about weather and the outdoors."
    };

    let systemPrompt = "";
    if (target !== "") {
        systemPrompt = `${personaInstructions[target]} Respond ONLY as them. Do not mention the others. Format: ${target}: [Message]`;
    } else {
        systemPrompt = `You are the Sentinels team. Fortune is formal/optimistic, Wednesday is sarcastic/dry, Storm is energetic. Provide a team briefing.`;
    }

    try {
        const response = await fetch("https://na01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fapi.groq.com%2Fopenai%2Fv1%2Fchat%2Fcompletions&data=05%7C02%7C%7C8356b0b6a45e4e134a1408de67495def%7C84df9e7fe9f640afb435aaaaaaaaaaaa%7C1%7C0%7C639061761956165372%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=GhUdbNI1yl%2Fz5Kjbar1N%2FkyhPi1l8nFvCIn6%2FI%2Bsg7s%3D&reserved=0", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY.trim()}` },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: message }],
                temperature: 0.7 // Higher temp allows for more "personality" and sarcasm
            })
        });
        const data = await response.json();
        const reply = data.choices[0].message.content;
        localStorage.setItem('prime_memory', (history + " | " + reply).slice(-600));
        return reply;
    } catch { return "STORM: Transmission failed."; }
}

// --- 3. UI & OUTPUT ENGINE ---
function print(text, isUser = false) {
    let name = "FORTUNE", css = "fortune", cleanText = text;
    if (isUser) { name = "PRIME"; css = "user"; }
    else {
        // Detect who is speaking to apply correct Voice/Color
        if (text.toUpperCase().includes("WEDNESDAY:")) { name = "WEDNESDAY"; css = "wednesday"; cleanText = cleanText.replace(/WEDNESDAY:/i, ""); }
        else if (text.toUpperCase().includes("STORM:")) { name = "STORM"; css = "storm"; cleanText = cleanText.replace(/STORM:/i, ""); }
        else if (text.toUpperCase().includes("FORTUNE:")) { name = "FORTUNE"; css = "fortune"; cleanText = cleanText.replace(/FORTUNE:/i, ""); }
        speak(cleanText, name);
    }
    display.innerHTML += `<div class="${css}"><strong>${name}:</strong> ${cleanText}</div>`;
    display.scrollTop = display.scrollHeight;
}

// --- 4. INPUT HANDLERS ---
const micBtn = document.getElementById('micBtn');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    micBtn.onclick = () => { window.speechSynthesis.cancel(); recognition.start(); };
    recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        recognition.stop();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(' '));
        print(transcript, true);
        const reply = await askAI(transcript);
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

// Initialization
function unlockAudio() {
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(' '));
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(s => s.getTracks().forEach(t => t.stop()));
    }
    window.removeEventListener('click', unlockAudio);
}
window.addEventListener('click', unlockAudio);
window.onload = () => {
    display.innerHTML = localStorage.getItem('prime_chat') || "";
    missionLog.innerHTML = localStorage.getItem('prime_logs') || "";
};
