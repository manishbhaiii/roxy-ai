async function manageSystem(action, executorId) {
    if (executorId !== process.env.OWNER_ID) {
        return { error: "Access Denied: Only the bot owner can execute system power commands." };
    }

    if (action === "restart") {
        setTimeout(() => {
            process.exit(2);
        }, 2000);
        return { message: "Bot is restarting... It will be back online in a few seconds." };
    } else if (action === "stop") {
        setTimeout(() => {
            process.exit(1);
        }, 2000);
        return { message: "Bot is shutting down completely..." };
    } else {
        return { error: "Invalid action. Use 'restart' or 'stop'." };
    }
}

module.exports = { manageSystem };
