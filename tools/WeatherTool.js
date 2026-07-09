async function getWeather(location) {
    if (!location) return { error: "Location is required" };

    try {
        const response = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
        if (!response.ok) {
            return { error: `Failed to fetch weather data. Status: ${response.status}` };
        }

        const data = await response.json();
        const current = data.current_condition[0];
        const area = data.nearest_area[0];

        return {
            location: `${area.areaName[0].value}, ${area.country[0].value}`,
            temperature_C: current.temp_C,
            feels_like_C: current.FeelsLikeC,
            condition: current.weatherDesc[0].value,
            humidity: `${current.humidity}%`,
            wind_speed: `${current.windspeedKmph} km/h`,
            observation_time: current.observation_time
        };
    } catch (e) {
        return { error: `Failed to fetch weather: ${e.message}` };
    }
}

module.exports = { getWeather };
