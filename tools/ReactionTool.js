async function reactToMessage(message, emojiNameOrId) {
    try {
        if (!message) return false;
        
        let emoji = message.client.emojis.cache.find(e => e.name === emojiNameOrId || e.id === emojiNameOrId);
        if (emoji) {
            await message.react(emoji);
            return true;
        } else {
            await message.react(emojiNameOrId); // fallback for unicode
            return true;
        }
    } catch (e) {
        console.error("Reaction failed:", e);
        return false;
    }
}

module.exports = { reactToMessage };
