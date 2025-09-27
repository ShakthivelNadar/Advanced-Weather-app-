# Weather Forecast App

![License](https://img.shields.io/badge/License-MIT-blue.svg)

A simple, responsive web application that provides current weather information and a 5-day forecast for any city worldwide. The app features dynamic themes based on weather conditions and uses modern SVG icons for a clean interface.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [How to Run](#how-to-run)
- [Project Structure](#project-structure)
- [APIs and Data Sources](#apis-and-data-sources)
- [Browser Support](#browser-support)
- [Contributing](#contributing)
- [License](#license)

## Features

### Core Functionality
- **Real-Time Weather Data**: Fetches live weather information from Open-Meteo API, including current conditions and forecasts
- **Current Weather Display**:
  - Temperature in Celsius
  - Feels-like temperature (adjusted for wind and humidity)
  - Weather description (e.g., Clear, Partly Cloudy, Rain, Snow, Thunderstorm)
  - Location name with pin icon
  - Current date and time
- **Comprehensive Weather Statistics**:
  - Humidity percentage with comfort level (Dry, Comfortable, Humid)
  - Atmospheric pressure in millibars
  - Visibility in kilometers with descriptive text (Excellent, Good, Moderate, Poor)
  - Wind speed in km/h with intensity description (Calm, Breezy, Windy, Gale)
  - Air Quality Index (AQI) with health advisory (Good, Moderate, Unhealthy, etc.)
- **5-Day Forecast**:
  - Daily high and low temperatures
  - Weather icons and descriptions for each day
  - Weekday names for easy reference
- **Location-Based Features**:
  - Automatic geolocation detection for current position
  - City search with intelligent geocoding (prioritizes Indian locations, falls back to global search)
  - Reverse geocoding for location names from coordinates
- **Favorites System**:
  - Save frequently visited cities
  - Quick access dropdown menu for saved locations
  - Persistent storage using localStorage
- **Historical Weather Lookup**:
  - Select past dates and specific times
  - View historical weather conditions for any previous date
  - Displays full weather stats for the selected historical moment
  - Includes temperature, humidity, pressure, wind, and visibility data

### User Experience
- **Dynamic Visual Themes**: Automatic background changes based on weather conditions and time of day (Clear, Cloudy, Rain, Thunderstorm, Snow, Fog, Night)
- **Responsive Design**: Optimized layouts for desktop, tablet, and mobile devices with adaptive grid systems
- **Loading Animations**: Smooth loader with sun-cloud animation during data fetching
- **Offline Support**: Remembers last searched city for quick reload on return visits
- **Error Handling**: Graceful fallbacks for failed API calls and location detection
- **Accessibility**: Semantic HTML structure and descriptive alt texts for icons

### Technical Features
- **Multi-API Integration**:
  - Open-Meteo Weather API for current and forecast data
  - Open-Meteo Air Quality API for AQI data
  - Open-Meteo Geocoding API for location search
  - Nominatim (OpenStreetMap) for fallback geocoding and reverse geocoding
- **Custom Icon System**: Extensive collection of SVG weather icons for all conditions
- **Performance Optimized**: Efficient API calls with caching and minimal data fetching
- **Modern JavaScript**: ES6+ features with async/await for smooth user interactions
- **CSS Grid & Flexbox**: Responsive layouts without external frameworks

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **APIs**:
  - [Open-Meteo Weather API](https://open-meteo.com/) - Weather data
  - [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) - Air quality data
  - [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) - Location search
  - [Nominatim (OpenStreetMap)](https://nominatim.org/) - Reverse geocoding fallback
- **Icons**: Custom SVG weather icons
- **Fonts**: Google Fonts (Inter)

## How to Run

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Allow location access for automatic weather detection (optional)
4. Search for a city or use your current location

No server or build process required - it's a static web app!

## Project Structure

```
weather-app/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and themes
├── script.js           # JavaScript logic and API calls
├── TODO.md             # Task list
├── README.md           # This file
├── air.png             # Air quality icon
├── cloud.png           # Cloud icon
├── weather.png         # Weather icon
├── icons/              # Weather icon SVGs
│   ├── clear-day.svg/
│   ├── rain.svg/
│   └── ... (other weather icons)
└── icons new/          # Alternative/new icon set
```

## APIs and Data Sources

The app fetches data from free, open-source APIs:

- **Weather Data**: Hourly and daily forecasts from Open-Meteo
- **Air Quality**: US AQI index from Open-Meteo
- **Geocoding**: Converts city names to coordinates
- **Reverse Geocoding**: Converts coordinates to location names

All data is fetched in real-time and cached locally for performance.

## Browser Support

Works in all modern browsers that support:
- ES6 JavaScript features
- Fetch API
- Geolocation API
- CSS Grid and Flexbox

## Contributing

Feel free to submit issues, feature requests, or pull requests!

## License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ using free APIs and open-source tools.
