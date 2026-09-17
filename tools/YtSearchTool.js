const ytSearch = require('yt-search');

async function searchYoutube(query) {
    try {
        const r = await ytSearch(query);
        if (!r || !r.videos || r.videos.length === 0) {
            return { error: "No results found for your query." };
        }
        
        // Return only the top 1 result
        const v = r.videos[0];
        return {
            title: v.title,
            url: v.url,
            duration: v.timestamp,
            views: v.views,
            channel: v.author.name
        };
    } catch (e) {
        console.error("YouTube search error:", e);
        return { error: "Failed to perform YouTube search." };
    }
}

module.exports = { searchYoutube };
