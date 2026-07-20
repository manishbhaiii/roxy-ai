async function getUserActivity(client, userId) {
    if (!userId) return { error: "User ID is required." };
    
    userId = userId.replace(/[^0-9]/g, '');

    try {
        let foundPresence = null;

        for (const guild of client.guilds.cache.values()) {
            try {
                const member = await guild.members.fetch({ user: userId, withPresences: true, force: true });
                if (member && member.presence) {
                    foundPresence = member.presence;
                    break;
                }
            } catch (e) {
            }
        }

        if (!foundPresence) {
            return { message: "User is currently offline, invisible, or not sharing activity data." };
        }

        const activityTypeMap = {
            0: "Playing",
            1: "Streaming",
            2: "Listening",
            3: "Watching",
            4: "Custom Status",
            5: "Competing"
        };

        const result = {
            status: foundPresence.status,
            devices: foundPresence.clientStatus ? Object.keys(foundPresence.clientStatus) : [],
            activities: []
        };

        if (foundPresence.activities && foundPresence.activities.length > 0) {
            foundPresence.activities.forEach(activity => {
                const act = {
                    type: activityTypeMap[activity.type] || `Type ${activity.type}`,
                    name: activity.name
                };

                if (activity.details) act.details = activity.details;
                if (activity.state) act.state = activity.state;
                if (activity.emoji) act.emoji = activity.emoji.name;
                
                result.activities.push(act);
            });
        }

        return result;
    } catch (e) {
        return { error: `Failed to fetch user activity: ${e.message}` };
    }
}

module.exports = { getUserActivity };
