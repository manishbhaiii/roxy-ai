async function purgeMessages(channel, amount, message_id, user_id) {
    if (!channel || !channel.isTextBased()) {
        return { error: "Invalid channel." };
    }
    
    try {
        if (message_id) {
            const msg = await channel.messages.fetch(message_id).catch(() => null);
            if (msg) {
                await msg.delete();
                return { message: `Successfully deleted message ${message_id}.` };
            }
            return { error: "Message not found or could not be deleted." };
        }
        
        if (!amount || amount < 1 || amount > 100) {
            return { error: "Amount must be between 1 and 100." };
        }

        if (user_id) {
            const fetched = await channel.messages.fetch({ limit: amount });
            const userMessages = fetched.filter(m => m.author.id === user_id);
            if (userMessages.size === 0) {
                return { error: "No messages found for that user in the requested range." };
            }
            const deleted = await channel.bulkDelete(userMessages, true);
            return { message: `Successfully deleted ${deleted.size} messages from user ${user_id}.` };
        }
        
        const deleted = await channel.bulkDelete(amount, true);
        return { message: `Successfully deleted ${deleted.size} messages.` };
    } catch (e) {
        return { error: `Failed to delete messages: ${e.message}` };
    }
}

module.exports = { purgeMessages };
