let currentStatus = 'online';
let currentActivities = [];

async function manageBotStatus(client, executorId, options) {
    if (executorId !== process.env.OWNER_ID) {
        return { error: "Access Denied: Only the bot owner can execute this command." };
    }

    try {
        const presence = {};
        
        if (options.status) {
            presence.status = options.status; // 'online', 'idle', 'dnd', 'invisible'
            currentStatus = options.status;
        } else {
            presence.status = currentStatus;
        }

        if (options.activity_type !== undefined || options.activity_name || options.state || options.emoji) {
            let type = 0; // Default to Playing
            if (options.activity_type) {
                const typeMap = {
                    "playing": 0,
                    "streaming": 1,
                    "listening": 2,
                    "watching": 3,
                    "custom": 4,
                    "competing": 5
                };
                type = typeMap[options.activity_type.toLowerCase()] !== undefined ? typeMap[options.activity_type.toLowerCase()] : 0;
            }

            const activity = { type: type };
            if (options.activity_name) {
                activity.name = options.activity_name;
            } else if (type === 4) {
                // For custom status, the API expects name to be 'Custom Status'
                activity.name = "Custom Status";
            }
            
            if (options.state) activity.state = options.state;
            
            if (options.emoji) {
                const customEmojiRegex = /<a?:([a-zA-Z0-9_]+):(\d+)>/;
                const match = options.emoji.match(customEmojiRegex);
                if (match) {
                    activity.emoji = { name: match[1], id: match[2] };
                } else {
                    activity.emoji = { name: options.emoji };
                }
            }
            
            presence.activities = [activity];
            currentActivities = presence.activities;
        } else if (currentActivities.length > 0) {
            presence.activities = currentActivities;
        }

        client.user.setPresence(presence);
        
        return { success: true, message: "Bot status updated successfully.", applied_presence: presence };
    } catch (e) {
        console.error("Failed to update bot status:", e);
        return { error: `Failed to update status: ${e.message}` };
    }
}

module.exports = { manageBotStatus };
