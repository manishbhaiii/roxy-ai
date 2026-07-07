async function getBanner(client, userId) {
    try {
        const user = await client.users.fetch(userId, { force: true });
        if (user) {
            const banner = user.bannerURL({ size: 1024, extension: 'png' });
            return banner || "This user does not have a banner.";
        }
        return "User not found.";
    } catch (e) {
        return `Failed to fetch banner: ${e.message}`;
    }
}

module.exports = { getBanner };
