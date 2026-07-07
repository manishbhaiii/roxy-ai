async function getUserInfo(message, query) {
    if (!query) return { error: "Query is required" };

    try {
        // If it looks like a Discord ID (17-20 digits), fetch globally
        if (/^\d{17,20}$/.test(query)) {
            const user = await message.client.users.fetch(query, { force: true });
            if (user) {
                return {
                    id: user.id,
                    username: user.username,
                    globalName: user.globalName,
                    bot: user.bot
                };
            }
        }

        // If not an ID or ID fetch failed, search in current guild
        if (message.guild) {
            const members = await message.guild.members.fetch({ query: query, limit: 1 });
            const member = members.first();
            
            if (member) {
                return {
                    id: member.user.id,
                    username: member.user.username,
                    displayName: member.displayName,
                    globalName: member.user.globalName,
                    bot: member.user.bot
                };
            }
        }

        return { error: `User matching '${query}' not found.` };
    } catch (e) {
        return { error: `Failed to fetch user info: ${e.message}` };
    }
}

module.exports = { getUserInfo };
