const presets = [
    { name: "Manila", latitude: 14.5995, longitude: 120.9842, timezone: "Asia/Manila" },
    { name: "Tokyo", latitude: 35.6762, longitude: 139.6503, timezone: "Asia/Tokyo" },
    { name: "London", latitude: 51.5072, longitude: -0.1276, timezone: "Europe/London" },
    { name: "New York", latitude: 40.7128, longitude: -74.0060, timezone: "America/New_York" },
    { name: "Sydney", latitude: -33.8688, longitude: 151.2093, timezone: "Australia/Sydney" }
];

const weatherCodeMap = {
    0: { label: "Clear sky", icon: "SUN" },
    1: { label: "Mostly clear", icon: "SUN" },
    2: { label: "Partly cloudy", icon: "CLOUD" },
    3: { label: "Overcast", icon: "CLOUD" },
    45: { label: "Fog", icon: "FOG" },
    48: { label: "Rime fog", icon: "FOG" },
    51: { label: "Light drizzle", icon: "RAIN" },
    53: { label: "Drizzle", icon: "RAIN" },
    55: { label: "Dense drizzle", icon: "RAIN" },
    61: { label: "Light rain", icon: "RAIN" },
    63: { label: "Rain", icon: "RAIN" },
    65: { label: "Heavy rain", icon: "RAIN" },
    71: { label: "Light snow", icon: "SNOW" },
    73: { label: "Snow", icon: "SNOW" },
    75: { label: "Heavy snow", icon: "SNOW" },
    80: { label: "Rain showers", icon: "RAIN" },
    81: { label: "Rain showers", icon: "RAIN" },
    82: { label: "Violent showers", icon: "STORM" },
    95: { label: "Thunderstorm", icon: "STORM" },
    96: { label: "Storm with hail", icon: "STORM" },
    99: { label: "Severe storm", icon: "STORM" }
};

const form = document.getElementById("forecast-form");
const presetRow = document.getElementById("preset-row");
const statusText = document.getElementById("status-text");
const latitudeInput = document.getElementById("latitude");
const longitudeInput = document.getElementById("longitude");
const locationNameInput = document.getElementById("location-name");
const timezoneInput = document.getElementById("timezone");

function weatherInfo(code) {
    return weatherCodeMap[code] ?? { label: "Conditions unavailable", icon: "N/A" };
}

function formatNumber(value, digits = 0) {
    return new Intl.NumberFormat(undefined, {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits
    }).format(value);
}

function formatTime(value, options) {
    return new Intl.DateTimeFormat(undefined, options).format(new Date(value));
}

function setStatus(message, isError = false) {
    statusText.textContent = message;
    statusText.style.color = isError ? "var(--danger)" : "var(--muted)";
}

function applyPreset(preset, activate = true) {
    latitudeInput.value = preset.latitude;
    longitudeInput.value = preset.longitude;
    locationNameInput.value = preset.name;
    timezoneInput.value = preset.timezone;

    document.querySelectorAll(".preset-btn").forEach((button) => {
        button.classList.toggle("active", activate && button.dataset.name === preset.name);
    });
}

function renderPresets() {
    presets.forEach((preset) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "preset-btn";
        button.dataset.name = preset.name;
        button.textContent = preset.name;
        button.addEventListener("click", () => {
            applyPreset(preset);
            loadForecast();
        });
        presetRow.appendChild(button);
    });
}

function renderCurrent(data, locationLabel) {
    const info = weatherInfo(data.current.weather_code);
    document.getElementById("current-place").textContent = locationLabel;
    document.getElementById("current-icon").textContent = info.icon;
    document.getElementById("current-temp").textContent = formatNumber(data.current.temperature_2m);
    document.getElementById("current-description").textContent = info.label;
    document.getElementById("feels-like").textContent = `${formatNumber(data.current.apparent_temperature)} C`;
    document.getElementById("humidity").textContent = `${formatNumber(data.current.relative_humidity_2m)}%`;
    document.getElementById("wind-speed").textContent = `${formatNumber(data.current.wind_speed_10m)} km/h`;
    document.getElementById("precipitation").textContent = `${formatNumber(data.current.precipitation, 1)} mm`;
}

function buildChartSvg(times, temperatures) {
    const width = 760;
    const height = 286;
    const padding = { top: 24, right: 24, bottom: 42, left: 24 };
    const min = Math.min(...temperatures);
    const max = Math.max(...temperatures);
    const spread = Math.max(max - min, 4);
    const usableWidth = width - padding.left - padding.right;
    const usableHeight = height - padding.top - padding.bottom;

    const points = temperatures.map((temp, index) => {
        const x = padding.left + (index / (temperatures.length - 1)) * usableWidth;
        const y = padding.top + ((max - temp) / spread) * usableHeight;
        return { x, y, temp, time: times[index] };
    });

    const linePath = points
        .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
        .join(" ");

    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${height - padding.bottom} L ${points[0].x.toFixed(2)} ${height - padding.bottom} Z`;

    const labels = points
        .filter((_, index) => index % 2 === 0)
        .map((point) => {
            const hourLabel = formatTime(point.time, { hour: "numeric" });
            return `
                <text class="chart-subtle" x="${point.x.toFixed(2)}" y="${height - 12}" text-anchor="middle">${hourLabel}</text>
                <text class="chart-label" x="${point.x.toFixed(2)}" y="${(point.y - 12).toFixed(2)}" text-anchor="middle">${formatNumber(point.temp)}C</text>
            `;
        })
        .join("");

    const circles = points
        .map((point) => `<circle class="chart-point" cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="4.5"></circle>`)
        .join("");

    return `
        <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="12 hour temperature trend">
            <defs>
                <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="rgba(122, 230, 199, 0.30)" />
                    <stop offset="100%" stop-color="rgba(122, 230, 199, 0.02)" />
                </linearGradient>
            </defs>
            <path class="chart-area" d="${areaPath}"></path>
            <path class="chart-line" d="${linePath}"></path>
            ${circles}
            ${labels}
        </svg>
    `;
}

function renderHourly(data) {
    const times = data.hourly.time.slice(0, 12);
    const temperatures = data.hourly.temperature_2m.slice(0, 12);
    document.getElementById("hourly-chart").innerHTML = buildChartSvg(times, temperatures);
}

function renderDaily(data) {
    const container = document.getElementById("daily-forecast");
    container.innerHTML = "";

    data.daily.time.forEach((time, index) => {
        const info = weatherInfo(data.daily.weather_code[index]);
        const sunrise = formatTime(data.daily.sunrise[index], { hour: "numeric", minute: "2-digit" });
        const sunset = formatTime(data.daily.sunset[index], { hour: "numeric", minute: "2-digit" });

        const card = document.createElement("article");
        card.className = "day-card";
        card.innerHTML = `
            <div class="day-name">${formatTime(time, { weekday: "short" })}</div>
            <div class="day-icon" aria-hidden="true">${info.icon}</div>
            <div>${info.label}</div>
            <div class="day-temps">
                <span class="day-high">${formatNumber(data.daily.temperature_2m_max[index])}C</span>
                <span class="day-low">${formatNumber(data.daily.temperature_2m_min[index])}C</span>
            </div>
            <div class="day-meta">Rain ${formatNumber(data.daily.precipitation_sum[index], 1)} mm</div>
            <div class="day-meta">Sun ${sunrise} / ${sunset}</div>
        `;
        container.appendChild(card);
    });
}

async function loadForecast() {
    const latitude = latitudeInput.value.trim();
    const longitude = longitudeInput.value.trim();
    const locationLabel = locationNameInput.value.trim() || `${latitude}, ${longitude}`;
    const timezone = timezoneInput.value;

    if (!latitude || !longitude) {
        setStatus("Enter a latitude and longitude first.", true);
        return;
    }

    setStatus("Pulling the latest forecast...");

    try {
        const response = await fetch(`/api/weather/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&timezone=${encodeURIComponent(timezone)}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Could not load forecast.");
        }

        renderCurrent(data, locationLabel);
        renderHourly(data);
        renderDaily(data);
        setStatus(`Updated ${locationLabel} at ${formatTime(new Date(), { hour: "numeric", minute: "2-digit" })}.`);
    } catch (error) {
        setStatus(error.message || "Could not load forecast.", true);
    }
}

form.addEventListener("submit", (event) => {
    event.preventDefault();
    document.querySelectorAll(".preset-btn").forEach((button) => button.classList.remove("active"));
    loadForecast();
});

renderPresets();
applyPreset(presets[0]);
loadForecast();
