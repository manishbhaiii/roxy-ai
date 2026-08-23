async function sendDm(client, userId, text, requesterId, isAdmin) {
    if (!userId || !text) return { error: "User ID and text are required." };
    
    if (userId !== requesterId && !isAdmin) {
        return { error: "Permission Denied: You cannot send DMs to other users on their behalf. You can only DM yourself for reminders." };
    }

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
