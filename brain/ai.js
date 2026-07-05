const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: false });
    } catch (error) { }
}

async function getAiConfig() {
    try {
        const data = await fs.readFile(path.join(__dirname, '../config/ai_config.json'), 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return { name: "Roxy AI", backstory: "", personality: "", system_rule: "" };
    }
}

async function getUserHistory(userId) {
    try {
        const filePath = path.join(DATA_DIR, `${userId}.json`);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

async function saveUserHistory(userId, history) {
    try {
        await ensureDataDir();
        if (history.length > 10) {
            history = history.slice(history.length - 10);
        }
        await fs.writeFile(path.join(DATA_DIR, `${userId}.json`), JSON.stringify(history, null, 2));
    } catch (e) {
        console.error("Error saving user history:", e);
    }
}

async function getChatResponse(userId, displayName, userMessage) {
    try {
        const config = await getAiConfig();
        const history = await getUserHistory(userId);

        const systemMsg = {
            role: "system",
            content: `Name: ${config.name}\nBackstory: ${config.backstory}\nPersonality: ${config.personality}\nRules: ${config.system_rule}`
        };

        const effectiveContent = `(User: ${displayName}) ${userMessage}`;

        const messages = [
            systemMsg,
            ...history,
            { role: "user", content: effectiveContent }
        ];

        const response = await fetch('https://opencode.ai/zen/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Accept': 'text/event-stream',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "deepseek-v4-flash-free",
                messages: messages,
                temperature: 1.0,
                top_p: 1.0,
                max_tokens: 8192,
                stream: true,
                reasoning_effort: "max",
                chat_template_kwargs: { thinking: true }
            })
        });

        if (!response.ok) {
            console.error(`[AI] HTTP Error: ${response.status} ${await response.text()}`);
            return "what you mean?";
        }

        let fullContent = "";
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let newlineIndex;
            while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                const line = buffer.slice(0, newlineIndex).trim();
                buffer = buffer.slice(newlineIndex + 1);

                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6).trim();
                    if (dataStr === '[DONE]') continue;
                    try {
                        const data = JSON.parse(dataStr);
                        const delta = data.choices?.[0]?.delta;
                        if (delta?.content) {
                            fullContent += delta.content;
                        }
                    } catch (e) { }
                } else if (line.startsWith('event: error')) {
                    console.error("[AI] Stream Error Event Received.");
                }
            }
        }

        fullContent = fullContent.replace(/<think>[\s\S]*?(?:<\/think>|$)\s*/gi, '');

        if (fullContent.trim()) {
            history.push({ role: "user", content: effectiveContent });
            history.push({ role: "assistant", content: fullContent });
            await saveUserHistory(userId, history);
            return fullContent;
        }

        return "what you mean?";
    } catch (error) {
        console.error("Error generating reply:", error);
        return "what you mean?";
    }
}

module.exports = { getChatResponse };
