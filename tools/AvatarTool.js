async function getAvatar(client, userId) {
    try {
        const user = await client.users.fetch(userId);
        if (user) {
            return user.displayAvatarURL({ size: 1024, extension: 'png' });
        }
        return "User not found.";
    } catch (e) {
        return `Failed to fetch avatar: ${e.message}`;
    }
}

module.exports = { getAvatar };
