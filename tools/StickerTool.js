async function getStickers(client) {
    const allStickers = [];
    client.guilds.cache.forEach(guild => {
        guild.stickers.cache.forEach(sticker => {
            allStickers.push({ name: sticker.name, id: sticker.id });
        });
    });
    return allStickers;
}

module.exports = { getStickers };
