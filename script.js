// --- 1. THE VAULT ---
let GROQ_KEY = localStorage.getItem('PRIME_MASTER_KEY');
let currentUser = "Commander Prime";
const input = document.getElementById('userInput');
const display = document.getElementById('display');
const missionLog = document.getElementById('missionLog');

// --- 2. THE KILL SWITCH ---
function signOut() {
    // This is the "Hard Reset" - it wipes the key and the memory
    if(confirm("LOCKDOWN INITIATED: Terminate session and purge Master Key?")) {
        localStorage.clear(); // Deletes everything
        GROQ_KEY = null;
        location.reload(); // Reboots to a locked screen
    }
}

// --- 3. THE BRAIN (Requires Key) ---
async function askAI(message) {
    if (!GROQ_KEY) return "STORM: ACCESS DENIED. Terminal is dark.";
    const url = "https://api.groq.com/openai/v1/chat/completions";
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY.trim()}` },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "You are the Prime Sentinels. Respond as FORTUNE, WEDNESDAY, and STORM separately." },
                    { role: "user", content: `[User: ${currentUser}]: ${message}` }
                ]
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (err) { return "STORM: Connection severed."; }
}

// --- 4. CONTROLS & PRINT ---
function print(text, isUser = false) {
    let name = "FORTUNE", css = "fortune", cleanText = text;
    if (isUser) { name = "PRIME"; css = "user"; }
    else {
        if (text.toUpperCase().includes("WEDNESDAY:")) { name = "WEDNESDAY"; css = "wednesday"; cleanText = cleanText.replace(/WEDNESDAY:/i, ""); }
        else if (text.toUpperCase().includes("STORM:")) { name = "STORM"; css = "storm"; cleanText = cleanText.replace(/STORM:/i, ""); }
        else if (text.toUpperCase().includes("FORTUNE:")) { name = "FORTUNE"; css = "fortune"; cleanText = cleanText.replace(/FORTUNE:/i, ""); }
    }
    display.innerHTML += `<div class="${css}"><strong>${name}:</strong> ${cleanText}</div>`;
    display.scrollTop = display.scrollHeight;
    if (GROQ_KEY) localStorage.setItem('family_history_v9', display.innerHTML);
}

input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && input.value.trim() !== "") {
        const msg = input.value; input.value = "";
        if (msg.startsWith("/key ")) {
            GROQ_KEY = msg.replace("/key ", "").trim();
            localStorage.setItem('PRIME_MASTER_KEY', GROQ_KEY);
            display.innerHTML = ""; // Clear screen on login
            print("STORM: Master Key Accepted. Welcome back, Commander.");
            return;
        }
        print(msg, true);
        const reply = await askAI(msg);
        print(reply);
    }
});

window.onload = () => {
    if (!GROQ_KEY) {
        display.innerHTML = "<div class='storm'><strong>STORM:</strong> SYSTEM ENCRYPTED. Enter Master Key to proceed.</div>";
    } else {
        if (localStorage.getItem('family_history_v9')) display.innerHTML = localStorage.getItem('family_history_v9');
    }
};
