async function getGif(action, pairing) {
    try {
        const queryParams = pairing ? `?pairing=${pairing}` : '';
        const url = `https://api.gifukai.com/v1/${action}${queryParams}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            return { error: `Failed to fetch GIF. Status: ${response.status}. Make sure the action exists (e.g., hug, pat, kiss, punch).` };
        }

        const data = await response.json();
        if (data && data.url) {
            return { url: data.url };
        } else {
            return { error: "No URL found in the response." };
        }
    } catch (e) {
        return { error: `Error fetching GIF: ${e.message}` };
    }
}

module.exports = { getGif };
