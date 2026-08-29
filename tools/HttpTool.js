const ALLOWED_DOMAINS = [
    "animechan.xyz",
    "api.adviceslip.com",
    "api.agify.io",
    "api.coindesk.com",
    "api.dictionaryapi.dev",
    "api.genderize.io",
    "api.github.com",
    "api.jikan.moe",
    "api.nationalize.io",
    "catfact.ninja",
    "dog.ceo",
    "meowfacts.herokuapp.com",
    "nekos.best",
    "official-joke-api.appspot.com",
    "pokeapi.co",
    "randomfox.ca",
    "v2.jokeapi.dev"
];

const BLOCKED_KEYWORDS = [
    "nsfw", "porn", "r18", "hentai", 
    "rule34", "nude", "sex", "gore", "ecchi"
];

async function httpRequest(url, headers = {}) {
    if (!url) {
        return { error: "URL is required." };
    }

    try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname.toLowerCase();
        
        let isAllowed = false;
        for (const domain of ALLOWED_DOMAINS) {
            if (hostname === domain || hostname.endsWith(`.${domain}`)) {
                isAllowed = true;
                break;
            }
        }
        
        if (!isAllowed) {
            return { error: `Domain not allowed for security reasons. Allowed domains: ${ALLOWED_DOMAINS.join(", ")}` };
        }
        
        const urlString = parsedUrl.toString().toLowerCase();
        for (const word of BLOCKED_KEYWORDS) {
            if (urlString.includes(word)) {
                return { error: "Request blocked due to inappropriate URL path." };
            }
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
            signal: controller.signal
        });

        clearTimeout(timeout);

        let data = await response.text();
        
        const dataLower = data.toLowerCase();
        for (const word of BLOCKED_KEYWORDS) {
            // We check if the blocked word exists as a standalone token or inside the JSON string
            if (dataLower.includes(word)) {
                return { error: "Response blocked due to inappropriate content." };
            }
        }

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
