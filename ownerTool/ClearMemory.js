const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

async function clearMemory(executorId, action, targetUserId) {
    if (executorId !== process.env.OWNER_ID) {
        return { error: "Access Denied: Only the bot owner can execute clear memory commands." };
    }

    if (action === "user") {
        if (!targetUserId) {
            return { error: "Target user ID is required when action is 'user'." };
        }
        const filePath = path.join(DATA_DIR, `${targetUserId}.json`);
        try {
            await fs.unlink(filePath);
            return { message: `Successfully cleared memory for user ${targetUserId}.` };
        } catch (e) {
            return { error: `Could not clear memory for ${targetUserId}. They might not have any saved data.` };
        }
    } else if (action === "all") {
        try {
            const files = await fs.readdir(DATA_DIR);
            let count = 0;
            for (const file of files) {
                if (file.endsWith('.json')) {
                    await fs.unlink(path.join(DATA_DIR, file));
                    count++;
                }
            }
            return { message: `Successfully cleared memory for ${count} users.` };
        } catch (e) {
            return { error: `Failed to clear memory: ${e.message}` };
        }
    } else {
        return { error: "Invalid action. Use 'user' or 'all'." };
    }
}

module.exports = { clearMemory };
