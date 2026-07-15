async function manageTimeout(guild, targetUserId, durationMinutes, executorId) {
    if (!guild) return { error: "This command can only be used in a server." };

    try {
        const executor = await guild.members.fetch(executorId);
        if (!executor || (!executor.permissions.has('ModerateMembers') && !executor.permissions.has('Administrator'))) {
            return { error: "Access Denied: You do not have permission to timeout members." };
        }

        const cleanUserId = targetUserId.replace(/[^0-9]/g, '');
        const target = await guild.members.fetch(cleanUserId);
        
        if (!target) return { error: "Target user not found." };

        if (durationMinutes > 0) {
            await target.timeout(durationMinutes * 60 * 1000, `Timed out by AI at the request of ${executor.user.tag}`);
            return { message: `Successfully muted user for ${durationMinutes} minutes.` };
        } else {
            await target.timeout(null, `Unmuted by AI at the request of ${executor.user.tag}`);
            return { message: "Successfully unmuted the user." };
        }
    } catch (e) {
        return { error: `Failed to execute timeout: ${e.message}` };
    }
}

module.exports = { manageTimeout };
