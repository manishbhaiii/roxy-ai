const fs = require('fs/promises');
const path = require('path');
const { getEmojis } = require('../tools/EmojiTool');
const { getStickers } = require('../tools/StickerTool');
const { reactToMessage } = require('../tools/ReactionTool');
const { getUserInfo } = require('../tools/UserInfoTool');
const { getAvatar } = require('../tools/AvatarTool');
const { getBanner } = require('../tools/BannerTool');
const { getWeather } = require('../tools/WeatherTool');

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

async function getChatResponse(message, displayName, userMessage) {
    try {
        const userId = message.author.id;
        const config = await getAiConfig();
        const history = await getUserHistory(userId);

        const systemMsg = {
            role: "system",
            content: `Name: ${config.name}\nBackstory: ${config.backstory}\nPersonality: ${config.personality}\nRules: ${config.system_rule}\n\nCRITICAL RULES FOR EMOJIS & STICKERS:\n1. NEVER guess or hallucinate emoji names or IDs.\n2. If you want to use an emoji or sticker, you MUST call get_emojis or get_stickers first to get the exact list of available items.\n3. ONLY pick from the provided list. Do not use generic emojis like :Pepega: if it's not in the list.\n4. ALWAYS call execute_response to deliver your final reply to the user using the available combinations (text, sticker, reaction, etc.). Do not reply with normal text without calling execute_response.\n5. DO NOT spam or repeat the same emoji across multiple responses. Keep it varied and dynamic.\n6. WARNING: Emoji names might be in Hindi or other languages (e.g. 'ye_kya_hora_hai'). DO NOT let the emoji names influence your response language. You MUST strictly reply in the exact language the user is speaking (e.g. if the user speaks English, reply strictly in English).\n7. When asked for an avatar or banner, use get_user_info to find the user's ID, then call get_avatar or get_banner. When sending the URL via execute_response, put ONLY the raw URL string in the 'text' field (e.g., "https://cdn.discordapp.com/..."). DO NOT add any extra text, or the image will fail to embed.`
        };

        const effectiveContent = `(User: ${displayName}) ${userMessage}`;

        let messages = [
            systemMsg,
            ...history,
            { role: "user", content: effectiveContent }
        ];

        const tools = [
            {
                type: "function",
                function: {
                    name: "get_emojis",
                    description: "Fetch a list of available custom emojis from the server."
                }
            },
            {
                type: "function",
                function: {
                    name: "get_stickers",
                    description: "Fetch a list of available custom stickers from the server."
                }
            },
            {
                type: "function",
                function: {
                    name: "get_weather",
                    description: "Fetch the current weather for a specific city or location.",
                    parameters: {
                        "type": "object",
                        "properties": {
                            "location": { "type": "string", "description": "The name of the city or location." }
                        },
                        "required": ["location"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_user_info",
                    description: "Resolve a user's ID and details using a fuzzy search query (e.g., username, display name, nickname, or raw ID).",
                    parameters: {
                        "type": "object",
                        "properties": {
                            "query": { "type": "string", "description": "The search query (ID or username) to find the user." }
                        },
                        "required": ["query"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_avatar",
                    description: "Fetch the avatar URL of a specific user ID.",
                    parameters: {
                        "type": "object",
                        "properties": {
                            "user_id": { "type": "string", "description": "The resolved user ID." }
                        },
                        "required": ["user_id"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_banner",
                    description: "Fetch the banner URL of a specific user ID.",
                    parameters: {
                        "type": "object",
                        "properties": {
                            "user_id": { "type": "string", "description": "The resolved user ID." }
                        },
                        "required": ["user_id"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "execute_response",
                    description: "Master tool to execute the final response. Use this to select a combination of text, emojis, stickers, and reactions.",
                    parameters: {
                        "type": "object",
                        "properties": {
                            "text": { "type": "string", "description": "Text message to reply with (optional)." },
                            "reaction_emoji": { "type": "string", "description": "Emoji name to react to the user's message (optional)." },
                            "sticker_id": { "type": "string", "description": "ID of the sticker to send (optional)." },
                            "custom_emoji_name": { "type": "string", "description": "Name of custom emoji to append to the text (optional)." }
                        }
                    }
                }
            }
        ];

        let maxLoops = 6;
        let finalReply = "";

        while (maxLoops > 0) {
            maxLoops--;

            const response = await fetch('https://opencode.ai/zen/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "deepseek-v4-flash-free",
                    messages: messages,
                    temperature: 1.0,
                    top_p: 1.0,
                    max_tokens: 8192,
                    reasoning_effort: "max",
                    chat_template_kwargs: { thinking: true },
                    tools: tools,
                    tool_choice: "auto"
                })
            });

            if (!response.ok) {
                console.error(`[AI] HTTP Error: ${response.status} ${await response.text()}`);
                return null;
            }

            const data = await response.json();
            const responseMessage = data.choices[0].message;
            messages.push(responseMessage);

            if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                for (const toolCall of responseMessage.tool_calls) {
                    const fnName = toolCall.function.name;
                    let args = {};
                    try { args = JSON.parse(toolCall.function.arguments || '{}'); } catch (e) { }

                    let toolResult = "";

                    if (fnName === "get_emojis") {
                        const emojis = await getEmojis(message.client);
                        toolResult = JSON.stringify(emojis);
                    } else if (fnName === "get_stickers") {
                        const stickers = await getStickers(message.client);
                        toolResult = JSON.stringify(stickers);
                    } else if (fnName === "get_weather") {
                        const weather = await getWeather(args.location);
                        toolResult = JSON.stringify(weather);
                    } else if (fnName === "get_user_info") {
                        const info = await getUserInfo(message, args.query);
                        toolResult = JSON.stringify(info);
                    } else if (fnName === "get_avatar") {
                        const avatar = await getAvatar(message.client, args.user_id);
                        toolResult = JSON.stringify({ url: avatar });
                    } else if (fnName === "get_banner") {
                        const banner = await getBanner(message.client, args.user_id);
                        toolResult = JSON.stringify({ url: banner });
                    } else if (fnName === "execute_response") {
                        let validationErrors = [];
                        let textReply = args.text || "";

                        if (args.reaction_emoji) {
                            const isCustom = /^[a-zA-Z0-9_]+$/.test(args.reaction_emoji);
                            if (isCustom) {
                                const emj = message.client.emojis.cache.find(e => e.name === args.reaction_emoji || e.id === args.reaction_emoji);
                                if (!emj) validationErrors.push(`Reaction emoji '${args.reaction_emoji}' not found.`);
                            }
                        }

                        if (args.custom_emoji_name) {
                            const emj = message.client.emojis.cache.find(e => e.name === args.custom_emoji_name);
                            if (!emj) validationErrors.push(`Custom emoji '${args.custom_emoji_name}' not found.`);
                        }

                        if (textReply) {
                            const emojiRegex = /<a?:([a-zA-Z0-9_]+):\d+>|:([a-zA-Z0-9_]+):/g;
                            let match;
                            while ((match = emojiRegex.exec(textReply)) !== null) {
                                const name = match[1] || match[2];
                                const emj = message.client.emojis.cache.find(e => e.name === name);
                                if (!emj) {
                                    validationErrors.push(`Emoji '${name}' used in text not found.`);
                                }
                            }
                        }

                        if (validationErrors.length > 0) {
                            toolResult = JSON.stringify({
                                error: "Validation failed. You hallucinated emojis that do not exist in the server.",
                                details: validationErrors,
                                instruction: "Please call get_emojis to see the actual list, and then call execute_response again using ONLY valid emoji names from the list."
                            });
                        } else {
                            let comboLog = [];

                            if (args.reaction_emoji) {
                                await reactToMessage(message, args.reaction_emoji);
                                comboLog.push(`[Reacted: ${args.reaction_emoji}]`);
                            }

                            if (args.sticker_id) {
                                try {
                                    await message.reply({ stickers: [args.sticker_id] });
                                    comboLog.push(`[Sent Sticker: ${args.sticker_id}]`);
                                } catch (e) { }
                            }

                            if (textReply) {
                                textReply = textReply.replace(/@everyone/gi, 'everyone')
                                                     .replace(/@here/gi, 'here')
                                                     .replace(/<@&\d+>/g, '');

                                textReply = textReply.replace(/<a?:([a-zA-Z0-9_]+):\d+>|:([a-zA-Z0-9_]+):/g, (match, name1, name2) => {
                                    const name = name1 || name2;
                                    const emj = message.client.emojis.cache.find(e => e.name === name);
                                    if (emj) {
                                        return `<${emj.animated ? 'a' : ''}:${emj.name}:${emj.id}>`;
                                    }
                                    return match;
                                });
                            }

                            if (args.custom_emoji_name) {
                                const emj = message.client.emojis.cache.find(e => e.name === args.custom_emoji_name);
                                if (emj) {
                                    textReply += ` <${emj.animated ? 'a' : ''}:${emj.name}:${emj.id}>`;
                                    comboLog.push(`[Appended Emoji: ${args.custom_emoji_name}]`);
                                }
                            }

                            if (textReply.trim()) {
                                finalReply = textReply;
                            }

                            let historyText = textReply;
                            if (comboLog.length > 0) historyText += ` ${comboLog.join(" ")}`;

                            if (historyText.trim()) {
                                history.push({ role: "user", content: effectiveContent });
                                history.push({ role: "assistant", content: historyText.trim() });
                                await saveUserHistory(userId, history);
                            }

                            return finalReply || null;
                        }
                    }

                    messages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: toolResult
                    });
                }
            } else {
                let content = responseMessage.content || "";
                content = content.replace(/<think>[\s\S]*?(?:<\/think>|$)\s*/gi, '');

                if (content.trim()) {
                    let validationErrors = [];
                    const emojiRegex = /<a?:([a-zA-Z0-9_]+):\d+>|:([a-zA-Z0-9_]+):/g;
                    let match;
                    while ((match = emojiRegex.exec(content)) !== null) {
                        const name = match[1] || match[2];
                        const emj = message.client.emojis.cache.find(e => e.name === name);
                        if (!emj) validationErrors.push(`Emoji '${name}' not found`);
                    }

                    if (validationErrors.length > 0) {
                        messages.push({
                            role: "user",
                            content: `SYSTEM ERROR: You hallucinated emojis (${validationErrors.join(", ")}). DO NOT guess emojis. Call get_emojis to see the real list, and ALWAYS use execute_response tool to reply.`
                        });
                        continue;
                    }

                    content = content.replace(/@everyone/gi, 'everyone')
                                     .replace(/@here/gi, 'here')
                                     .replace(/<@&\d+>/g, '');

                    content = content.replace(/<a?:([a-zA-Z0-9_]+):\d+>|:([a-zA-Z0-9_]+):/g, (match, name1, name2) => {
                        const name = name1 || name2;
                        const emj = message.client.emojis.cache.find(e => e.name === name);
                        if (emj) {
                            return `<${emj.animated ? 'a' : ''}:${emj.name}:${emj.id}>`;
                        }
                        return match;
                    });

                    history.push({ role: "user", content: effectiveContent });
                    history.push({ role: "assistant", content: content });
                    await saveUserHistory(userId, history);
                    return content;
                }
                return null;
            }
        }

        return null;
    } catch (error) {
        console.error("Error generating reply:", error);
        return null;
    }
}

module.exports = { getChatResponse };
