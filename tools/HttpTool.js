async function httpRequest(url, headers = {}) {
    if (!url) {
        return { error: "URL is required." };
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
            signal: controller.signal
        });

        clearTimeout(timeout);

        let data = await response.text();

        // Truncate if it's too large
        if (data.length > 2500) {
            data = data.substring(0, 2500) + "\n...[TRUNCATED: Response exceeded 2500 characters limit]";
        }

        return {
            status: response.status,
            ok: response.ok,
            data: data
        };
    } catch (e) {
        if (e.name === 'AbortError') {
            return { error: "Request timed out after 10 seconds." };
        }
        return { error: `Failed to fetch URL: ${e.message}` };
    }
}

module.exports = { httpRequest };
