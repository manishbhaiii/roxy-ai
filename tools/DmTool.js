async function sendDm(client, userId, text) {
    if (!userId || !text) return { error: "User ID and text are required." };

    try {
        const user = await client.users.fetch(userId);
        if (!user) return { error: "User not found." };
        
        await user.send(text);
        return { success: true, message: `DM successfully sent to ${user.username}.` };
    } catch (e) {
        return { error: `Failed to send DM: ${e.message}` };
    }
}

module.exports = { sendDm };
