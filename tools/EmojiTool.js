async function getEmojis(client) {
    const emojis = client.emojis.cache.map(e => ({
        name: e.name,
        id: e.id,
        format: `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`
    }));
    return emojis;
}

module.exports = { getEmojis };
