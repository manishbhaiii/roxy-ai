async function manageSystem(client, action, executorId) {
    if (executorId !== process.env.OWNER_ID) {
        return { error: "Access Denied: Only the bot owner can execute system power commands." };
    }

    try {
        const owner = await client.users.fetch(executorId);
        if (action === "restart") {
            await owner.send("Server restarting...");
            setTimeout(() => {
                process.exit(2);
            }, 2000);
            return { message: "Bot is restarting... It will be back online in a few seconds." };
        } else if (action === "stop") {
            await owner.send("Server stopping...");
            setTimeout(() => {
                process.exit(1);
            }, 2000);
            return { message: "Bot is shutting down completely..." };
        } else {
            return { error: "Invalid action. Use 'restart' or 'stop'." };
        }
    } catch (e) {
        console.error("Failed to send DM to owner:", e);
        return { error: "Action initiated, but failed to send DM." };
    }
}

module.exports = { manageSystem };
