let GROQ_KEY = localStorage.getItem('PRIME_MASTER_KEY');
const input = document.getElementById('userInput');
const display = document.getElementById('display');
const missionLog = document.getElementById('missionLog');

// 1. IPHONE AUDIO UNLOCK
function unlock() {
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    window.removeEventListener('touchstart', unlock);
}
window.addEventListener('touchstart', unlock);

function speak(text, persona) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
   
    if (persona === "FORTUNE") utterance.pitch = 0.8;
    else if (persona === "WEDNESDAY") utterance.pitch = 1.3;
    else utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
}

// 2. THE BRAIN WITH SOLO FILTER
async function askAI(message) {
    if (!GROQ_KEY) return "STORM: System Locked. Enter Key.";
   
    let target = "";
    if (message.toUpperCase().includes("FORTUNE")) target = "FORTUNE";
    if (message.toUpperCase().includes("WEDNESDAY")) target = "WEDNESDAY";
    if (message.toUpperCase().includes("STORM")) target = "STORM";

    const history = localStorage.getItem('prime_memory') || "";
    const systemPrompt = target !== ""
        ? `You are ONLY ${target}. Do not speak as others. Context: ${history}`
        : `You are the Sentinels (Fortune, Wednesday, Storm). Give a brief team report. Context: ${history}`;

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: message }]
            })
        });
        const data = await response.json();
        const reply = data.choices[0].message.content;
        localStorage.setItem('prime_memory', (history + " " + reply).slice(-500));
        return reply;
    } catch { return "STORM: Connection Lost."; }
}

// 3. UI HANDLERS
function print(text, isUser = false) {
    let name = "FORTUNE", css = "fortune", cleanText = text;
    if (isUser) { name = "PRIME"; css = "user"; }
    else {
        if (text.toUpperCase().includes("LOG:")) {
            const entry = text.split(/LOG:/i)[1];
            missionLog.innerHTML = `<div>> ${entry}</div>` + missionLog.innerHTML;
            localStorage.setItem('prime_logs', missionLog.innerHTML);
        }
        if (text.toUpperCase().includes("WEDNESDAY:")) { name = "WEDNESDAY"; css = "wednesday"; }
        else if (text.toUpperCase().includes("STORM:")) { name = "STORM"; css = "storm"; }
        speak(cleanText, name);
    }
    display.innerHTML += `<div class="${css}"><strong>${name}:</strong> ${cleanText}</div>`;
    display.scrollTop = display.scrollHeight;
    localStorage.setItem('prime_chat', display.innerHTML);
}

input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
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
async function quickSummon(name) { print(await askAI(`Status update, ${name}`)); }

window.onload = () => {
    display.innerHTML = localStorage.getItem('prime_chat') || "";
    missionLog.innerHTML = localStorage.getItem('prime_logs') || "";
};


