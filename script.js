// ===== Helpers =====
const $ = (s) => document.querySelector(s);

let currentLat, currentLon, currentName;
let mumbaiDefault = null;

function setLoading(msg = "Loading...") {
  const el = $('#place');
  if (el) el.textContent = msg;
}

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));
}

function startSearchAnimation() {
  $('.search').classList.add('searching');
}

function endSearchAnimation() {
  $('.search').classList.remove('searching');
}

// ===== Maps =====
const codeToDesc = (code) => {
  const map = {
    0:'Clear', 1:'Mainly clear', 2:'Partly cloudy', 3:'Overcast',
    45:'Fog', 48:'Rime fog',
    51:'Light drizzle', 53:'Drizzle', 55:'Dense drizzle',
    56:'Freezing drizzle', 57:'Dense freezing drizzle',
    61:'Light rain', 63:'Rain', 65:'Heavy rain',
    66:'Freezing rain', 67:'Heavy freezing rain',
    71:'Light snow', 73:'Snow', 75:'Heavy snow',
    77:'Snow grains',
    80:'Rain showers', 81:'Showers', 82:'Violent showers',
    85:'Snow showers', 86:'Heavy snow showers',
    95:'Thunderstorm', 96:'Thunder w/ hail', 99:'Thunder w/ heavy hail'
  };
  return map[code] || '—';
};

// ===== Icons =====
const codeToMeteocon = (code, isDay=true) => {
  if (code === 0) return isDay ? 'clear-day' : 'clear-night';
  if ([1,2].includes(code)) return isDay ? 'partly-cloudy-day' : 'partly-cloudy-night';
  if (code === 3) return 'overcast';
  if ([45,48].includes(code)) return 'fog';
  if ([51,53,55,56,57].includes(code)) return 'drizzle';
  if ([61].includes(code)) return 'light-drizzle';
  if ([63,65,66,67].includes(code)) return 'rain';
  if ([80].includes(code)) return 'rain-showers';
  if ([81,82].includes(code)) return 'heavy-rain-showers';
  if ([71,73].includes(code)) return 'snow';
  if ([75,85,86].includes(code)) return 'heavy-snow';
  if ([77].includes(code)) return 'snow-grains';
  if ([95,96,99].includes(code)) return 'thunderstorm';
  return 'na';
};

// point to local folder
const meteoconURL = (name) => `./icons-new/${name}.svg/${name}.svg`;

// ===== Comfort texts =====
const humComfort = (h) => h < 30 ? 'Dry' : (h <= 60 ? 'Comfortable' : 'Humid');
const visText = (km) => km >= 10 ? 'Excellent visibility' : (km >= 5 ? 'Good' : (km >= 2 ? 'Moderate' : 'Poor'));
const windText = (k) => k < 6 ? 'Calm' : (k < 20 ? 'Breezy' : (k < 38 ? 'Windy' : 'Gale'));
const getBeaufort = (speed) => {
  if (speed < 1) return 0;
  if (speed <= 5) return 1;
  if (speed <= 12) return 2;
  if (speed <= 20) return 3;
  if (speed <= 29) return 4;
  if (speed <= 39) return 5;
  if (speed <= 50) return 6;
  return 6; // cap at 6
};
const aqiText = (v) => v==null ? '—' : v<=50?'Good':v<=100?'Moderate':v<=150?'Unhealthy (SG)':v<=200?'Unhealthy':v<=300?'Very Unhealthy':'Hazardous';
const fmtDateLong = (iso) => new Date(iso).toLocaleDateString(undefined,{weekday:'long', month:'long', day:'numeric'});

// ===== Themes =====
const codeToTheme = (code, isDay) => {
  if (!isDay) return 'theme-night';
  if (code === 0) return 'theme-clear';
  if ([1,2,3].includes(code)) return 'theme-cloudy';
  if ([45,48].includes(code)) return 'theme-fog';
  if ([61,63,65,66,67,80,81,82].includes(code)) return 'theme-rain';
  if ([71,73,75,77,85,86].includes(code)) return 'theme-snow';
  if ([95,96,99].includes(code)) return 'theme-thunder';
  return 'theme-cloudy';
};
function setTheme(code, isDay){
  document.body.className = document.body.className
    .split(' ')
    .filter(c => !c.startsWith('theme-'))
    .join(' ');
  document.body.classList.add(codeToTheme(code, !!isDay));
}









// ===== APIs =====
async function geocodeCity(city) {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=10&language=en&format=json`
    );
    const data = await response.json();

    if (data && data.results && data.results.length > 0) {
      const indianResult = data.results.find(r => r.country_code === "IN");
      return indianResult || data.results[0];
    }

    // fallback: OpenStreetMap (Nominatim)
    const alt = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(city)}`
    );
    const altData = await alt.json();

    if (altData.length === 0) throw new Error("Place not found in any geocoder");

    const addr = altData[0].address || {};
    let properName = addr.city || addr.town || addr.village || addr.hamlet || addr.county || addr.state || addr.country;
    if (!properName || /^\d/.test(properName)) properName = altData[0].display_name;

    return {
      latitude: parseFloat(altData[0].lat),
      longitude: parseFloat(altData[0].lon),
      name: properName,
      country_code: addr.country_code?.toUpperCase() || "XX",
    };
  } catch (err) {
    console.error("Geocoding failed:", err);
    throw err;
  }
}

async function reverseGeocode(lat, lon){
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
    );
    const data = await res.json();
    const addr = data.address || {};
    let properName = addr.city || addr.town || addr.village || addr.hamlet || addr.county || addr.state || addr.country;
    if (!properName || /^\d/.test(properName)) properName = data.display_name;
    return { name: properName, lat, lon };
  } catch {
    return { name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`, lat, lon };
  }
}

async function fetchWeather(lat, lon){
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: lat, longitude: lon,
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,pressure_msl,wind_speed_10m,weather_code,is_day',
    hourly: 'visibility',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    windspeed_unit: 'kmh',
    timezone: 'auto',
    forecast_days: '7'
  });
  return await fetch(url).then(x=>x.json());
}

async function fetchAQI(lat, lon){
  const url = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
  url.search = new URLSearchParams({ latitude: lat, longitude: lon, hourly: 'us_aqi', timezone: 'auto' });
  return await fetch(url).then(x=>x.json());
}

async function fetchHistorical(lat, lon, dateStr, timeStr = null){
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&hourly=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,pressure_msl,wind_speed_10m,visibility&timezone=auto`;
  const data = await fetch(url).then(x=>x.json());
  if (timeStr) {
    const targetHour = parseInt(timeStr.split(':')[0]);
    const hourTimes = data.hourly.time.map(t => new Date(t).getHours());
    const closestIdx = hourTimes.indexOf(targetHour);
    if (closestIdx !== -1) {
      data.hourly.selectedIdx = closestIdx;
    } else {
      // Fallback to closest
      let minDiff = Infinity, idx = 0;
      hourTimes.forEach((h, i) => {
        const diff = Math.abs(h - targetHour);
        if (diff < minDiff) {
          minDiff = diff;
          idx = i;
        }
      });
      data.hourly.selectedIdx = idx;
    }
  } else {
    data.hourly.selectedIdx = 12; // Noon default
  }
  return data;
}

function closestHourIdx(times, targetISO){
  const arr = Array.isArray(times) ? times : [];
  if (!arr.length || !targetISO) return 0;
  const t = new Date(targetISO).getTime();
  let best = 0, diff = Infinity;
  arr.forEach((iso, i) => {
    const d = Math.abs(new Date(iso).getTime() - t);
    if (d < diff){ diff = d; best = i; }
  });
  return best;
}

// ===== UI fragments =====
function setNowIcon(code, isDay, el){
  const name = codeToMeteocon(code, isDay);
  let src = meteoconURL(name);
  if (name === 'clear-day') {
    src = './icons-new/clear-day.svg/clear.svg';
  } else if (name === 'clear-night') {
    src = './icons-new/clear-night.svg/clear-night.svg';
  }
  el.innerHTML = `<img src="${src}" alt="${codeToDesc(code)}" />`;
}

function setForecastIcons(daily, wrap){
  wrap.innerHTML = '';
  const daysAvailable = Math.max(0, Math.min(5, (daily?.time?.length || 0) - 1));
  for (let i=0; i<daysAvailable; i++){
    const date = daily.time[i];
    const code = daily.weather_code?.[i];
    const iconName = codeToMeteocon(code ?? 0, true);
    const max = Math.round(daily.temperature_2m_max?.[i] ?? 0);
    const min = Math.round(daily.temperature_2m_min?.[i] ?? 0);
    const card = document.createElement('div');
    card.className = 'daycard card';
    card.innerHTML = `
      <div class="muted">${new Date(date).toLocaleDateString(undefined,{weekday:'long'})}</div>
      <div class="icon" style="margin:6px 0">
        <img src="${meteoconURL(iconName)}" alt="${codeToDesc(code)}"/>
      </div>
      <div class="t">${max}°<small> / ${min}°</small></div>
      <small>${codeToDesc(code)}</small>
    `;
    wrap.appendChild(card);
  }
}

function displayHistoricalDay(data, wrap){
  wrap.innerHTML = '';
  if (!data?.hourly?.time || !data.hourly.time.length) {
    wrap.innerHTML = 'No historical data available for this date.';
    wrap.style.display = 'block';
    return;
  }
  const idx = data.hourly.selectedIdx || 0;
  const temp = data.hourly.temperature_2m[idx];
  const feels = data.hourly.apparent_temperature[idx];
  const hum = data.hourly.relative_humidity_2m[idx];
  const press = data.hourly.pressure_msl[idx];
  const wind = data.hourly.wind_speed_10m[idx];
  const visKm = (data.hourly.visibility[idx] || 0) / 1000;
  const code = data.hourly.weather_code[idx];
  const desc = codeToDesc(code);
  const timeStr = data.hourly.time[idx];
  const hour = new Date(timeStr).getHours();
  const isDay = hour >= 6 && hour <= 18;
  const iconName = codeToMeteocon(code, isDay);
  const timeDate = new Date(timeStr).toLocaleString(undefined, {month:'long', day:'numeric', year:'numeric'});

  // Main card like "now"
  const mainCard = document.createElement('div');
  mainCard.className = 'card now historical-main';
  mainCard.innerHTML = `
    <div class="left">
      <div class="city">
        <span class="pin">📍</span>
        <span>${currentName || 'Current Location'}</span>
      </div>
      <div class="icon" id="histIcon"></div>
    </div>
    <div class="right">
      <div class="temp" id="histTemp">${Math.round(temp)}°C</div>
      <div id="histDesc" class="muted" style="background: transparent; padding: 0; border-radius: 0; margin: 0;">${desc}</div>
      <div id="histDate" class="muted" style="background: transparent; padding: 0; border-radius: 0; margin: 0;">${timeDate}</div>
    </div>
  `;
  setNowIcon(code, isDay, mainCard.querySelector('#histIcon'));

  // Stats grid
  const statsDiv = document.createElement('div');
  statsDiv.className = 'stats grid';

  let feelsIcon = 'icons-new/thermometer.svg/thermometer.svg';
  if (Number.isFinite(feels)) {
    if (feels > 35) {
      feelsIcon = 'icons-new/thermometer-warmer.svg/thermometer-warmer.svg';
    } else if (feels <= 20) {
      feelsIcon = 'icons-new/thermometer-colder.svg/thermometer-colder.svg';
    }
  }

  const stats = [
    { id: 'histHum', title: 'Humidity', value: `${Math.round(hum)}%`, text: humComfort(hum), icon: 'icons-new/humidity.svg/humidity.svg' },
    { id: 'histPress', title: 'Pressure', value: `${Math.round(press)} mb`, text: 'Normal pressure', icon: 'icons-new/barometer.svg/barometer.svg' },
    { id: 'histWind', title: 'Wind Speed', value: `${Math.round(wind)} km/h`, text: windText(wind), icon: `icons-new/wind-beaufort-${getBeaufort(wind)}.svg/wind-beaufort-${getBeaufort(wind)}.svg` },
    { id: 'histFeels', title: 'Feels Like', value: `${Math.round(feels)}°C`, text: 'Relative to wind & humidity', icon: feelsIcon }
  ];

  stats.forEach(stat => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="text">
        <h4>${stat.title}</h4>
        <div class="value" id="${stat.id}">${stat.value}</div>
        <div class="muted" id="${stat.id}Text">${stat.text}</div>
      </div>
      <div class="icon">
        <img src="${stat.icon}" alt="${stat.title}"/>
      </div>
    `;
    statsDiv.appendChild(card);
  });

  // Feels like is already in stats, but add if needed

  wrap.appendChild(mainCard);
  wrap.appendChild(statsDiv);
  wrap.style.display = 'block';
}

// ===== Update UI =====
async function updateAll(place){
  try{
    setLoading("Fetching weather...");
    const {lat, lon, name} = place;
    currentLat = lat;
    currentLon = lon;
    currentName = name;
    const [w, aq] = await Promise.all([fetchWeather(lat, lon), fetchAQI(lat, lon)]);
    if (!w?.current) throw new Error('No current weather in response');
    const c = w.current;

    let visKm = null;
    if (w?.hourly?.time && Array.isArray(w?.hourly?.visibility)) {
      const idx = closestHourIdx(w.hourly.time, c.time);
      const v = w.hourly.visibility[idx];
      if (typeof v === 'number') visKm = v / 1000;
    }

    let aqiVal = null;
    if (aq?.hourly?.time && Array.isArray(aq?.hourly?.us_aqi)){
      const aqIdx = closestHourIdx(aq.hourly.time, c.time);
      aqiVal = aq.hourly.us_aqi[aqIdx] ?? null;
    }

    $('#place').textContent = name ?? '—';
    $('#nowTemp').textContent = Number.isFinite(c.temperature_2m) ? `${Math.round(c.temperature_2m)}°C` : '—';
    $('#feels').textContent = Number.isFinite(c.apparent_temperature) ? `Feels like ${Math.round(c.apparent_temperature)}°C` : '—';
    const feelsTemp = c.apparent_temperature;
    if (Number.isFinite(feelsTemp)) {
      let iconSrc;
      if (feelsTemp > 35) {
        iconSrc = 'icons-new/thermometer-warmer.svg/thermometer-warmer.svg';
      } else if (feelsTemp > 20) {
        iconSrc = 'icons-new/thermometer.svg/thermometer.svg';
      } else {
        iconSrc = 'icons-new/thermometer-colder.svg/thermometer-colder.svg';
      }
      $('#feelsIcon').src = iconSrc;
    }
    $('#hum').textContent = Number.isFinite(c.relative_humidity_2m) ? `${Math.round(c.relative_humidity_2m)}%` : '—';
    $('#humText').textContent = Number.isFinite(c.relative_humidity_2m) ? humComfort(c.relative_humidity_2m) : '—';
    $('#press').textContent = Number.isFinite(c.pressure_msl) ? `${Math.round(c.pressure_msl)} mb` : '—';
    $('#vis').textContent = visKm != null ? `${visKm.toFixed(0)} km` : '—';
    $('#visText').textContent = visKm != null ? visText(visKm) : '—';
    $('#wind').textContent = Number.isFinite(c.wind_speed_10m) ? `${Math.round(c.wind_speed_10m)} km/h` : '—';
    $('#windText').textContent = Number.isFinite(c.wind_speed_10m) ? windText(c.wind_speed_10m) : '—';
    if (Number.isFinite(c.wind_speed_10m)) {
      const beaufort = getBeaufort(c.wind_speed_10m);
      $('#windIcon').src = `./icons-new/wind-beaufort-${beaufort}.svg/wind-beaufort-${beaufort}.svg`;
    }
    $('#nowDesc').textContent = codeToDesc(c.weather_code ?? 0);
    $('#nowDate').textContent = c.time ? fmtDateLong(c.time) : '—';
    $('#aqi').textContent = aqiVal != null ? `${aqiVal} AQI` : 'N/A';
    $('#aqiText').textContent = aqiText(aqiVal);

    const isDay = (c.is_day === 1 || c.is_day === true);
    setNowIcon(c.weather_code ?? 0, isDay, $('#nowIcon'));
    setTheme(c.weather_code ?? 0, isDay);

    if (w?.daily) setForecastIcons(w.daily, $('#forecast'));

    if (name) localStorage.setItem("lastCity", JSON.stringify({ name, lat, lon }));
  } catch(err) {
    console.error('[updateAll] failed:', err);
    $('#place').textContent = "Error loading weather";
  }
}

// ===== Search + Event Listeners =====
async function search(){
  const q = $('#q').value.trim();
  if (!q) return;

  startSearchAnimation();
  setLoading(`Searching "${q}"...`);

  const searchPromise = geocodeCity(q)
    .then(p => updateAll({ name: p.name, lat: p.latitude, lon: p.longitude }));

  Promise.race([searchPromise, timeout(5000)])
    .then(() => {
      endSearchAnimation();
    })
    .catch(e => {
      endSearchAnimation();
      if (e.message === 'Timeout') {
        console.warn('[search] timed out, falling back to Mumbai');
        setLoading("Search timed out, showing Mumbai...");
        updateAll({ name: mumbaiDefault.name, lat: mumbaiDefault.latitude, lon: mumbaiDefault.longitude });
      } else {
        console.error('[search] failed:', e);
        $('#place').textContent = "City not found";
      }
    });
}
$('#go').addEventListener('click', search);
$('#q').addEventListener('keydown', (e)=>{ if(e.key==='Enter') search(); });

// ===== Favorites =====
function loadFavorites() {
  const favs = JSON.parse(localStorage.getItem('weatherFavorites') || '[]');
  return favs;
}

function saveFavorites(favs) {
  localStorage.setItem('weatherFavorites', JSON.stringify(favs));
}

function populateFavorites() {
  const favs = loadFavorites();
  const list = $('#favList');
  list.innerHTML = '';
  if (favs.length === 0) {
    list.innerHTML = '<div style="padding:10px; color:var(--muted);">No favorites saved</div>';
    return;
  }
  favs.forEach((fav, idx) => {
    const div = document.createElement('div');
    div.textContent = fav.name;
    div.dataset.idx = idx;
    div.addEventListener('click', () => {
      updateAll(fav);
      list.style.display = 'none';
    });
    list.appendChild(div);
  });
}

function saveCurrentAsFavorite() {
  const placeEl = $('#place');
  const name = placeEl.textContent.trim();
  if (!name || name === '—' || name === "Error loading weather" || name === "City not found") return;
  const lastCity = JSON.parse(localStorage.getItem("lastCity") || '{}');
  if (!lastCity.name || lastCity.name !== name) return; // ensure it's the current
  const favs = loadFavorites();
  const exists = favs.find(f => f.name === name);
  if (exists) return; // already saved
  favs.push({ name, lat: lastCity.lat, lon: lastCity.lon });
  saveFavorites(favs);
  populateFavorites();
  alert(`Saved ${name} to favorites!`);
}

$('#saveFav').addEventListener('click', saveCurrentAsFavorite);
$('#favBtn').addEventListener('click', () => {
  const list = $('#favList');
  list.style.display = list.style.display === 'block' ? 'none' : 'block';
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown')) {
    $('#favList').style.display = 'none';
  }
});

// Historical search event listener
$('#histSearch').addEventListener('click', async () => {
  const dateInput = $('#histDate').value;
  if (!dateInput) {
    alert('Please select a date.');
    return;
  }
  const selectedDate = new Date(dateInput);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);
  if (selectedDate >= today) {
    alert('Please select a past date.');
    return;
  }
  if (!currentLat || !currentLon) {
    alert('Please search for a location first.');
    return;
  }
  try {
    const histData = await fetchHistorical(currentLat, currentLon, dateInput);
    displayHistoricalDay(histData, $('#historicalData'));
  } catch (err) {
    console.error('Historical fetch failed:', err);
    $('#historicalData').innerHTML = 'Error loading historical data.';
    $('#historicalData').style.display = 'block';
  }
});

// Clear historical search
$('#histClear').addEventListener('click', () => {
  $('#histDate').value = '';
  $('#historicalData').innerHTML = '';
  $('#historicalData').style.display = 'none';
});

const todayStr = new Date().toISOString().split('T')[0];
$('#histDate').max = todayStr;

// ===== Init: Location > Last city > Mumbai =====
(async function init() {
  try {
    // Set Mumbai default once
    if (!mumbaiDefault) {
      mumbaiDefault = await geocodeCity('Mumbai');
    }

    setLoading("Detecting location...");

    let place = null;

    if (navigator.geolocation) {
      const getPosition = () =>
        new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            maximumAge: 60000,
            timeout: 5000
          });
        });

      try {
        const pos = await getPosition();
        const lat = pos.coords.latitude,
          lon = pos.coords.longitude;
        place = await reverseGeocode(lat, lon);
      } catch (err) {
        console.warn('[geolocation failed/denied]', err);
      }
    }

    if (!place) {
      const last = localStorage.getItem("lastCity");
      if (last) {
        const parsed = JSON.parse(last);
        if (parsed?.lat && parsed?.lon) place = parsed;
      }
    }

    if (!place) {
      place = { name: mumbaiDefault.name, lat: mumbaiDefault.latitude, lon: mumbaiDefault.longitude };
    }

    await updateAll(place);
  } catch (err) {
    console.error('[init] failed:', err);
    await updateAll({ name: mumbaiDefault.name, lat: mumbaiDefault.latitude, lon: mumbaiDefault.longitude });
  }
  populateFavorites();
})();
