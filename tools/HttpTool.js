const ALLOWED_DOMAINS = [
    "amiiboapi.com", "anapioficeandfire.com", "animechan.xyz", "api.adviceslip.com", "api.agify.io",
    "api.artic.edu", "api.aviationapi.com", "api.aviationstack.com", "api.bible-api.com", "api.carbonintensity.org.uk",
    "api.cdnjs.com", "api.chess.com", "api.chucknorris.io", "api.citybik.es", "api.coindesk.com",
    "api.coinpaprika.com", "api.country.is", "api.covid19api.com", "api.deezer.com", "api.dicebear.com",
    "api.dictionaryapi.dev", "api.doge-meme.lol", "api.exchangerate-api.com", "api.exchangerate.host", "api.forismatic.com",
    "api.frankfurter.app", "api.funtranslations.com", "api.gbif.org", "api.genderize.io", "api.generadordni.es",
    "api.giphy.com", "api.github.com", "api.hackertarget.com", "api.harvardartmuseums.org", "api.hypixel.net",
    "api.imgbb.com", "api.ipify.org", "api.jikan.moe", "api.kanye.rest", "api.le-systeme-solaire.net",
    "api.lyrics.ovh", "api.mangadex.org", "api.mathjs.org", "api.mcsrvstat.us", "api.met.no",
    "api.namefake.com", "api.nasa.gov", "api.nationalize.io", "api.nbp.pl", "api.open-meteo.com",
    "api.openweathermap.org", "api.publicapis.org", "api.qrserver.com", "api.quotable.io", "api.radio-browser.info",
    "api.rawg.io", "api.spacexdata.com", "api.spoonacular.com", "api.taylor.rest", "api.thecatapi.com",
    "api.thedogapi.com", "api.thronesapi.com", "api.waifu.im", "api.weatherapi.com", "api.zippopotam.us",
    "axoltlapi.herokuapp.com", "boringapi.com", "catfact.ninja", "collectionapi.metmuseum.org", "deckofcardsapi.com",
    "disease.sh", "dog.ceo", "evilinsult.com", "favqs.com", "gutendex.com",
    "http.cat", "http.dog", "httpbin.org", "icanhazdadjoke.com", "ipapi.co",
    "ipinfo.io", "itunes.apple.com", "jsonplaceholder.typicode.com", "kitsu.io", "meowfacts.herokuapp.com",
    "musicbrainz.org", "nekos.best", "nominatim.openstreetmap.org", "numbersapi.com", "official-joke-api.appspot.com",
    "open.er-api.com", "openlibrary.org", "opentdb.com", "place.dog", "placekitten.com",
    "pokeapi.co", "postman-echo.com", "random-d.uk", "randomfox.ca", "randomuser.me",
    "reqres.in", "restcountries.com", "robohash.org", "shibe.online", "tenor.googleapis.com",
    "trace.moe", "ui-avatars.com", "uinames.com", "uselessfacts.jsph.pl", "uuidgenerator.net",
    "v2.jokeapi.dev", "wttr.in", "www.dnd5eapi.co", "www.fruityvice.com", "www.thecocktaildb.com",
    "www.themealdb.com", "yesno.wtf", "zenquotes.io"
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
        
        if (hostname === "api.waifu.im") {
            if (parsedUrl.searchParams.get('is_nsfw') !== 'false') {
                return { error: "Security restriction: api.waifu.im must be called with ?is_nsfw=false" };
            }
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
