et GROQ_KEY = localStorage.getItem('PRIME_MASTER_KEY');
const input = document.getElementById('userInput');
const display = document.getElementById('display');
const missionLog = document.getElementById('missionLog');

// --- 1. DYNAMIC VOICE HUNTER (Laptop & Mobile) ---
function speak(text, persona) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    if (persona === "FORTUNE") {
        // MALE - Finds any voice labeled Male, Daniel, or Google UK English Male
        utterance.voice = voices.find(v => v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('David')) || voices[0];
        utterance.pitch = 0.8; utterance.rate = 0.9;
    }
    else if (persona === "WEDNESDAY") {
        // FEMALE - Sharp/Sarcastic (Samantha, Karen, or Google Female)
        utterance.voice = voices.find(v => (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Zira')) && !v.name.includes('Male')) || voices[1];
        utterance.pitch = 1.3; utterance.rate = 1.0;
    }
    else if (persona === "STORM") {
        // FEMALE - Energetic (Victoria, Google Female, or Hazel)
        utterance.voice = voices.find(v => (v.name.includes('Victoria') || v.name.includes('Hazel') || v.name.includes('Google US English')) && !v.name.includes('Male')) || voices[1];
        utterance.pitch = 1.0; utterance.rate = 1.2;
    }

    window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    setTimeout(() => { window.speechSynthesis.speak(utterance); }, 200);
}

// --- 2. THE BRAIN (TRANSMISSION FIX) ---
async function askAI(message) {
    if (!GROQ_KEY || GROQ_KEY === "") return "STORM: System Offline. No API Key detected. Use /key [your_key]";
   
    let target = "";
    const msgUpper = message.toUpperCase();
    if (msgUpper.includes("FORTUNE")) target = "FORTUNE";
    else if (msgUpper.includes("WEDNESDAY")) target = "WEDNESDAY";
    else if (msgUpper.includes("STORM")) target = "STORM";

    const personaInstructions = {
        "FORTUNE": "You are FORTUNE. Your tone is optimistic, enthusiastic, and formal. You provide guidance and strategic advice.",
        "WEDNESDAY": "You are WEDNESDAY. Your tone is introspective, analytical, and heavily sarcastic with a dry sense of humor.",
        "STORM": "You are STORM. Your tone is energetic, adventurous, and passionate about weather and the outdoors."
    };

    let systemPrompt = target !== ""
        ? `${personaInstructions[target]} Respond ONLY as them. Format: ${target}: [Message]`
        : `You are the Sentinels: Fortune (Formal/Male), Wednesday (Sarcastic/Female), Storm (Energetic/Female). Provide a team briefing.`;

    try {
        const response = await fetch("https://na01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fapi.groq.com%2Fopenai%2Fv1%2Fchat%2Fcompletions&data=05%7C02%7C%7Cccd4930474624efe8e1408de674bd2ad%7C84df9e7fe9f640afb435aaaaaaaaaaaa%7C1%7C0%7C639061772499953721%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=CbwSenh%2FQy4Hn1DSlTaBGDjn2ckaIHJzaxcYiHIQWAw%3D&reserved=0", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_KEY.trim()}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: message }],
                temperature: 0.7
            })
        });

        if (!response.ok) throw new Error("API Error");

        const data = await response.json();
        const reply = data.choices[0].message.content;
        return reply;
    } catch (err) {
        console.error(err);
        return "STORM: Transmission Failed. Verify your API Key and Connection.";
    }
}

// --- 3. UI ENGINE ---
function print(text, isUser = false) {
    let name = "FORTUNE", css = "fortune", cleanText = text;
    if (isUser) { name = "PRIME"; css = "user"; }
    else {
        if (text.toUpperCase().includes("WEDNESDAY:")) { name = "WEDNESDAY"; css = "wednesday"; cleanText = cleanText.replace(/WEDNESDAY:/i, ""); }
        else if (text.toUpperCase().includes("STORM:")) { name = "STORM"; css = "storm"; cleanText = cleanText.replace(/STORM:/i, ""); }
        else if (text.toUpperCase().includes("FORTUNE:")) { name = "FORTUNE"; css = "fortune"; cleanText = cleanText.replace(/FORTUNE:/i, ""); }
        speak(cleanText, name);
    }
    display.innerHTML += `<div class="${css}"><strong>${name}:</strong> ${cleanText}</div>`;
    display.scrollTop = display.scrollHeight;
}

// --- 4. COMMANDS ---
input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && input.value.trim() !== "") {
        const val = input.value; input.value = "";
        if (val.startsWith("/key ")) {
            GROQ_KEY = val.split(" ")[1].trim();
            localStorage.setItem('PRIME_MASTER_KEY', GROQ_KEY);
            print("STORM: Neural Link Established. Key Saved.");
            return;
        }
        print(val, true);
        const reply = await askAI(val);
        print(reply);
    }
});

function unlockAudio() {
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(' '));
    window.removeEventListener('click', unlockAudio);
}
window.addEventListener('click', unlockAudio);

window.onload = () => {
    // Load voices into memory for laptop browsers
    window.speechSynthesis.getVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
};

