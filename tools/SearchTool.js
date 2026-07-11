const { search } = require('duck-duck-scrape');

async function webSearch(query) {
    if (!query) return { error: "Search query is required." };

    try {
        const searchResults = await search(query, {
            safeSearch: 'moderate'
        });

        if (!searchResults.results || searchResults.results.length === 0) {
            return { message: "No results found for your search query." };
        }

        // Return the top 5 results to keep the payload reasonably sized
        const topResults = searchResults.results.slice(0, 5).map(r => ({
            title: r.title,
            description: r.description,
            url: r.url
        }));

        return {
            query: query,
            results: topResults
        };
    } catch (e) {
        return { error: `Failed to execute web search: ${e.message}` };
    }
}

module.exports = { webSearch };
