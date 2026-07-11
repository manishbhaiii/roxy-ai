async function webSearch(query) {
    if (!query) return { error: "Search query is required." };

    try {
        const payload = {
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: {
                name: "web_search",
                arguments: {
                    objective: query,
                    search_queries: [query]
                }
            }
        };

        const response = await fetch("https://search.parallel.ai/mcp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            return { error: `HTTP Error: ${response.status}` };
        }

        const data = await response.json();
        
        if (data.error || (data.result && data.result.isError)) {
            return { error: data.error || data.result.content[0].text };
        }

        // We only want the first couple of results to avoid massive JSON payloads
        let searchResults = [];
        try {
            const rawContent = data.result.content[0];
            
            // The content might be a large JSON string or pre-parsed object inside the response depending on MCP result formatting
            // In parallel.ai's case, it returns a markdown/JSON structure in content array.
            
            // If the content itself is the results array:
            if (rawContent && rawContent.text && typeof rawContent.text === 'string') {
                // If it's returning raw text, just return the first 2000 chars of it to keep it safe
                return { query: query, summary: rawContent.text.substring(0, 2000) };
            } else if (data.result.content.length > 0) {
                // if it's an object array 
                return { query: query, results: data.result.content.slice(0, 3) };
            }
        } catch (e) {
            // fallback
            return { query: query, raw: data.result };
        }

        return data.result.content || { message: "No content returned." };
    } catch (e) {
        return { error: `Failed to execute web search: ${e.message}` };
    }
}

module.exports = { webSearch };
