const fs = require('fs/promises');
const path = require('path');

async function getEmojis(client) {
    const emojis = client.emojis.cache
        .filter(e => e.available)
        .map(e => ({
            name: e.name,
            id: e.id,
            format: `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`
        }));
    
    try {
        const dataDir = path.join(__dirname, '../data');
        await fs.mkdir(dataDir, { recursive: true });
        await fs.writeFile(path.join(dataDir, 'emojis.json'), JSON.stringify(emojis, null, 2));
    } catch (error) {
        console.error("Failed to save emojis.json:", error);
    }
    
    return emojis;
}

module.exports = { getEmojis };
