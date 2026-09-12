// Weather Dashboard using OpenWeatherMap API
// Free API Key: Use from https://openweathermap.org/api

const API_KEY = 'b6fd43b195e9a0c8a797efb59a31c08a'; // Free tier API key
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEOCODING_API = 'https://api.openweathermap.org/geo/1.0/direct';

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const currentWeatherDiv = document.getElementById('current-weather');
const forecastSection = document.getElementById('forecast-section');
const suggestionsDiv = document.getElementById('suggestions');
const refreshBtn = document.getElementById('refresh-btn');
const updateTimeSpan = document.getElementById('update-time');

let lastSearchedCity = 'London';
let currentWeatherData = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    fetchWeather('London');
    setupEventListeners();
});

function setupEventListeners() {
    searchBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeather(city);
        }
    });

    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = cityInput.value.trim();
            if (city) {
                fetchWeather(city);
            }
        }
    });

    cityInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        if (value.length > 2) {
            fetchCitySuggestions(value);
        } else {
            suggestionsDiv.classList.remove('active');
        }
    });

    locationBtn.addEventListener('click', getUserLocation);
    refreshBtn.addEventListener('click', () => {
        if (lastSearchedCity) {
            fetchWeather(lastSearchedCity);
        }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target !== cityInput && e.target !== suggestionsDiv) {
            suggestionsDiv.classList.remove('active');
        }
    });
}

// Fetch city suggestions
async function fetchCitySuggestions(query) {
    try {
        const response = await fetch(
            `${GEOCODING_API}?q=${query}&limit=5&appid=${API_KEY}`
        );

        if (!response.ok) throw new Error('Failed to fetch suggestions');

        const data = await response.json();
        displaySuggestions(data);
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
}

function displaySuggestions(cities) {
    suggestionsDiv.innerHTML = '';
    
    if (cities.length === 0) {
        suggestionsDiv.classList.remove('active');
        return;
    }

    cities.forEach(city => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = `${city.name}${city.state ? ', ' + city.state : ''}, ${city.country}`;
        item.addEventListener('click', () => {
            cityInput.value = city.name;
            fetchWeather(city.name, city.lat, city.lon);
            suggestionsDiv.classList.remove('active');
        });
        suggestionsDiv.appendChild(item);
    });

    suggestionsDiv.classList.add('active');
}

// Get user's current location
function getUserLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }

    showLoading(true);
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoordinates(latitude, longitude);
        },
        (error) => {
            showError('Unable to get your location: ' + error.message);
            showLoading(false);
        }
    );
}

// Fetch weather by coordinates
async function fetchWeatherByCoordinates(lat, lon) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );

        if (!response.ok) throw new Error('Failed to fetch weather');

        const data = await response.json();
        lastSearchedCity = data.name;
        cityInput.value = data.name;
        displayCurrentWeather(data);
        fetchForecast(data.name);
    } catch (error) {
        showError('Error: ' + error.message);
        showLoading(false);
    }
}

// Fetch weather data
async function fetchWeather(city, lat, lon) {
    try {
        showLoading(true);
        showError(false);

        let weatherData;

        if (lat && lon) {
            // Use provided coordinates
            const response = await fetch(
                `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
            );
            if (!response.ok) throw new Error('Weather data not found');
            weatherData = await response.json();
        } else {
            // Fetch by city name
            const response = await fetch(
                `${API_BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`
            );
            if (!response.ok) throw new Error('City not found');
            weatherData = await response.json();
        }

        lastSearchedCity = weatherData.name;
        displayCurrentWeather(weatherData);
        fetchForecast(weatherData.name);
        updateTime();
    } catch (error) {
        showError('Error: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Display current weather
function displayCurrentWeather(data) {
    currentWeatherData = data;

    document.getElementById('city-name').textContent = data.name;
    document.getElementById('country-name').textContent = data.sys.country;
    document.getElementById('temperature').textContent = Math.round(data.main.temp);
    document.getElementById('description').textContent = data.weather[0].description;
    document.getElementById('feels-like').textContent = `Feels like ${Math.round(data.main.feels_like)}°C`;
    document.getElementById('humidity').textContent = data.main.humidity + '%';
    document.getElementById('wind-speed').textContent = (data.wind.speed * 3.6).toFixed(1) + ' km/h';
    document.getElementById('pressure').textContent = data.main.pressure + ' hPa';
    document.getElementById('visibility').textContent = (data.visibility / 1000).toFixed(1) + ' km';
    document.getElementById('cloud-cover').textContent = data.clouds.all + '%';

    // Wind direction
    const windDeg = data.wind.deg;
    const windDirection = getWindDirection(windDeg);
    document.getElementById('wind-direction').textContent = windDirection + ' (' + windDeg + '°)';

    // Sunrise and Sunset
    const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('sunrise').textContent = sunrise;
    document.getElementById('sunset').textContent = sunset;

    // Weather icon
    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    document.getElementById('weather-icon').src = iconUrl;

    currentWeatherDiv.classList.remove('hidden');
    errorDiv.classList.add('hidden');
}

// Fetch forecast data
async function fetchForecast(city) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`
        );

        if (!response.ok) throw new Error('Forecast data not found');

        const data = await response.json();
        displayForecast(data.list);
    } catch (error) {
        console.error('Error fetching forecast:', error);
    }
}

// Display 5-day forecast
function displayForecast(forecastList) {
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = '';

    // Get one forecast per day (every 8 time intervals = 24 hours)
    const dailyForecasts = {};

    forecastList.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        if (!dailyForecasts[dateKey]) {
            dailyForecasts[dateKey] = {
                date: dateKey,
                temp: Math.round(forecast.main.temp),
                min: Math.round(forecast.main.temp_min),
                max: Math.round(forecast.main.temp_max),
                description: forecast.weather[0].description,
                icon: forecast.weather[0].icon,
                humidity: forecast.main.humidity,
                windSpeed: (forecast.wind.speed * 3.6).toFixed(1)
            };
        }
    });

    // Display first 5 days
    Object.values(dailyForecasts).slice(0, 5).forEach(forecast => {
        const card = document.createElement('div');
        card.className = 'forecast-card';

        const iconUrl = `https://openweathermap.org/img/wn/${forecast.icon}@2x.png`;

        card.innerHTML = `
            <div class="forecast-date">${forecast.date}</div>
            <img src="${iconUrl}" alt="${forecast.description}" class="forecast-icon">
            <div class="forecast-temp">${forecast.max}°</div>
            <div class="forecast-description">${forecast.description}</div>
            <div class="forecast-detail">💧 ${forecast.humidity}%</div>
            <div class="forecast-detail">💨 ${forecast.windSpeed} km/h</div>
        `;

        forecastContainer.appendChild(card);
    });

    forecastSection.classList.remove('hidden');
}

// Get wind direction from degrees
function getWindDirection(degree) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degree / 22.5) % 16;
    return directions[index];
}

// Show/hide loading state
function showLoading(show) {
    if (show) {
        loadingDiv.classList.remove('hidden');
        currentWeatherDiv.classList.add('hidden');
        forecastSection.classList.add('hidden');
    } else {
        loadingDiv.classList.add('hidden');
    }
}

// Show error message
function showError(message) {
    if (message) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    } else {
        errorDiv.classList.add('hidden');
    }
}

// Update time
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    updateTimeSpan.textContent = timeString;
}