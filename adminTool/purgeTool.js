async function purgeMessages(channel, amount) {
    if (!channel || !channel.isTextBased()) {
        return { error: "Invalid channel." };
    }
    
    if (amount < 1 || amount > 100) {
        return { error: "Amount must be between 1 and 100." };
    }

    try {
        const deleted = await channel.bulkDelete(amount, true);
        return { message: `Successfully deleted ${deleted.size} messages.` };
    } catch (e) {
        return { error: `Failed to delete messages: ${e.message}` };
    }
}

module.exports = { purgeMessages };
