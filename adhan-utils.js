/**
 * adhan-utils.js — AdhanLive shared prayer time utility
 * Uses Adhan.js (MIT license) for all calculations.
 * Load this AFTER adhan.min.js in your HTML.
 */

// ── CDN: load Adhan.js if not already present ──
// Add this to your HTML before adhan-utils.js:
// <script src="https://cdn.jsdelivr.net/npm/adhan@4.4.3/lib/bundles/adhan.umd.min.js"></script>

const AdhanUtils = (() => {

  // ── Calculation method auto-detection by country code ──
  const METHOD_MAP = {
    // Umm al-Qura — Arabian Peninsula
    SA: 'UmmAlQura', BH: 'UmmAlQura', KW: 'UmmAlQura',
    QA: 'UmmAlQura', AE: 'UmmAlQura', OM: 'UmmAlQura', YE: 'UmmAlQura',

    // Egyptian General Authority
    EG: 'Egyptian', LY: 'Egyptian', SD: 'Egyptian',

    // Muslim World League — Europe, Africa, most of world
    GB: 'MuslimWorldLeague', DE: 'MuslimWorldLeague', FR: 'MuslimWorldLeague',
    ES: 'MuslimWorldLeague', IT: 'MuslimWorldLeague', NL: 'MuslimWorldLeague',
    BE: 'MuslimWorldLeague', CH: 'MuslimWorldLeague', AT: 'MuslimWorldLeague',
    SE: 'MuslimWorldLeague', NO: 'MuslimWorldLeague', DK: 'MuslimWorldLeague',
    MA: 'MuslimWorldLeague', DZ: 'MuslimWorldLeague', TN: 'MuslimWorldLeague',
    NG: 'MuslimWorldLeague', SN: 'MuslimWorldLeague', GH: 'MuslimWorldLeague',
    ZA: 'MuslimWorldLeague', KE: 'MuslimWorldLeague', TZ: 'MuslimWorldLeague',
    ET: 'MuslimWorldLeague', SO: 'MuslimWorldLeague',

    // ISNA — North America
    US: 'NorthAmerica', CA: 'NorthAmerica',

    // Karachi — South Asia
    PK: 'Karachi', IN: 'Karachi', BD: 'Karachi', AF: 'Karachi',
    NP: 'Karachi', LK: 'Karachi',

    // Turkey
    TR: 'Turkey',

    // Kuwait
    KW: 'Kuwait',

    // Qatar
    QA: 'Qatar',

    // Singapore
    SG: 'Singapore', MY: 'Singapore', BN: 'Singapore',

    // Indonesia — uses MWL
    ID: 'MuslimWorldLeague',

    // Iran — Tehran method
    IR: 'Tehran',

    // Iraq, Jordan, Syria, Lebanon, Palestine
    IQ: 'Egyptian', JO: 'Egyptian', SY: 'Egyptian',
    LB: 'Egyptian', PS: 'Egyptian',

    // Central Asia
    UZ: 'Karachi', KZ: 'Karachi', TM: 'Karachi', TJ: 'Karachi', KG: 'Karachi',

    // Russia
    RU: 'MuslimWorldLeague',

    // China
    CN: 'MuslimWorldLeague',
  };

  // Human-readable method names for display
  const METHOD_LABELS = {
    UmmAlQura:       'Umm al-Qura (Saudi Arabia)',
    Egyptian:        'Egyptian General Authority',
    MuslimWorldLeague: 'Muslim World League',
    NorthAmerica:    'Islamic Society of North America (ISNA)',
    Karachi:         'University of Islamic Sciences, Karachi',
    Turkey:          'Turkish Presidency of Religious Affairs',
    Kuwait:          'Kuwait',
    Qatar:           'Qatar',
    Singapore:       'Majlis Ugama Islam Singapura',
    Tehran:          'Institute of Geophysics, Tehran',
    MoonsightingCommittee: 'Moonsighting Committee',
  };

  // Method name aliases (for user-typed method names)
  const METHOD_ALIASES = {
    'umm al qura': 'UmmAlQura', 'umm al-qura': 'UmmAlQura', 'uaq': 'UmmAlQura',
    'mwl': 'MuslimWorldLeague', 'muslim world league': 'MuslimWorldLeague',
    'isna': 'NorthAmerica', 'north america': 'NorthAmerica',
    'egyptian': 'Egyptian', 'egypt': 'Egyptian',
    'karachi': 'Karachi',
    'turkey': 'Turkey', 'turkish': 'Turkey', 'diyanet': 'Turkey',
    'kuwait': 'Kuwait',
    'qatar': 'Qatar',
    'singapore': 'Singapore',
    'tehran': 'Tehran', 'iran': 'Tehran',
    'moonsighting': 'MoonsightingCommittee',
  };

  /**
   * Detect calculation method from a user's text (e.g. "using MWL method")
   * Returns method key or null
   */
  function detectMethodFromText(text) {
    const lower = text.toLowerCase();
    for (const [alias, key] of Object.entries(METHOD_ALIASES)) {
      if (lower.includes(alias)) return key;
    }
    return null;
  }

  /**
   * Get Adhan.js CalculationParameters for a given method key
   */
  function getCalculationParams(methodKey) {
    const M = adhan.CalculationMethod;
    switch (methodKey) {
      case 'UmmAlQura':         return M.UmmAlQura();
      case 'Egyptian':          return M.Egyptian();
      case 'MuslimWorldLeague': return M.MuslimWorldLeague();
      case 'NorthAmerica':      return M.NorthAmerica();
      case 'Karachi':           return M.Karachi();
      case 'Turkey':            return M.Turkey();
      case 'Kuwait':            return M.Kuwait();
      case 'Qatar':             return M.Qatar();
      case 'Singapore':         return M.Singapore();
      case 'Tehran':            return M.Tehran();
      case 'MoonsightingCommittee': return M.MoonsightingCommittee();
      default:                  return M.MuslimWorldLeague();
    }
  }

  /**
   * Geocode a city name → { lat, lon, countryCode, displayName }
   * Uses OpenStreetMap Nominatim (free, no key)
   */
  async function geocodeCity(cityName) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1&addressdetails=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    if (!data || data.length === 0) throw new Error(`City not found: ${cityName}`);
    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      countryCode: result.address?.country_code?.toUpperCase() || null,
      displayName: result.display_name,
      city: result.address?.city || result.address?.town || result.address?.village || cityName,
      country: result.address?.country || '',
    };
  }

  /**
   * Reverse geocode coordinates → { countryCode, city, country }
   */
  async function reverseGeocode(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    return {
      countryCode: data.address?.country_code?.toUpperCase() || null,
      city: data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'your location',
      country: data.address?.country || '',
    };
  }

  /**
   * Format a Date object to prayer time string based on user locale
   * Uses 12h or 24h based on locale automatically
   */
  function formatTime(date, use24h) {
    if (use24h) {
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } else {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    }
  }

  /**
   * Detect if user locale prefers 24h format
   */
  function is24hLocale() {
    const testDate = new Date(2000, 0, 1, 13, 0, 0);
    const formatted = testDate.toLocaleTimeString();
    return !formatted.includes('PM') && !formatted.includes('AM') && !formatted.includes('pm') && !formatted.includes('am');
  }

  /**
   * Main function: calculate prayer times
   * @param {Object} options
   * @param {number} options.lat
   * @param {number} options.lon
   * @param {Date}   options.date       — defaults to today
   * @param {string} options.methodKey  — override method (optional)
   * @param {string} options.countryCode — for auto method detection
   * @param {string} options.timezone   — IANA timezone string (optional)
   * @returns {Object} prayer times + metadata
   */
  function calculatePrayerTimes({ lat, lon, date = new Date(), methodKey = null, countryCode = null, timezone = null }) {
    const coords = new adhan.Coordinates(lat, lon);

    // Resolve method
    const resolvedMethod = methodKey || METHOD_MAP[countryCode] || 'MuslimWorldLeague';
    const params = getCalculationParams(resolvedMethod);

    // Use local date at the location
    const calcDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const times = new adhan.PrayerTimes(coords, calcDate, params);

    const use24h = is24hLocale();

    return {
      fajr:    { time: times.fajr,    formatted: formatTime(times.fajr, use24h) },
      sunrise: { time: times.sunrise, formatted: formatTime(times.sunrise, use24h) },
      dhuhr:   { time: times.dhuhr,   formatted: formatTime(times.dhuhr, use24h) },
      asr:     { time: times.asr,     formatted: formatTime(times.asr, use24h) },
      maghrib: { time: times.maghrib, formatted: formatTime(times.maghrib, use24h) },
      isha:    { time: times.isha,    formatted: formatTime(times.isha, use24h) },
      method:  resolvedMethod,
      methodLabel: METHOD_LABELS[resolvedMethod] || resolvedMethod,
      date: calcDate,
    };
  }

  /**
   * Detect prayer time intent from user message
   * Returns true if the message is asking for prayer times
   */
  function isPrayerTimeQuery(text) {
    const lower = text.toLowerCase();
    const prayerWords = ['prayer time', 'prayer times', 'salah time', 'salat time',
      'fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'when is', 'what time is',
      'namaz time', 'namaz times'];
    const timeWords = ['today', 'tomorrow', 'tonight', 'now', 'currently', 'time'];
    const hasPrayer = prayerWords.some(w => lower.includes(w));
    const hasTime = timeWords.some(w => lower.includes(w));
    return hasPrayer || (hasPrayer && hasTime);
  }

  /**
   * Build a context string to inject into the AI prompt
   * with real calculated prayer times
   */
  function buildPrayerTimesContext({ times, locationName, date, methodLabel }) {
    const dateStr = date.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return `REAL PRAYER TIMES DATA (calculated, accurate — use these exact times in your response):
Location: ${locationName}
Date: ${dateStr}
Calculation Method: ${methodLabel}

Fajr:    ${times.fajr.formatted}
Sunrise: ${times.sunrise.formatted}
Dhuhr:   ${times.dhuhr.formatted}
Asr:     ${times.asr.formatted}
Maghrib: ${times.maghrib.formatted}
Isha:    ${times.isha.formatted}

Present these times naturally and beautifully. Mention the calculation method used. Do not add disclaimers about accuracy.`;
  }

  /**
   * Request user geolocation with a user-friendly prompt
   * Returns { lat, lon } or throws
   */
  function getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        err => reject(err),
        { timeout: 10000, maximumAge: 300000 }
      );
    });
  }

  // Public API
  return {
    isPrayerTimeQuery,
    detectMethodFromText,
    geocodeCity,
    reverseGeocode,
    calculatePrayerTimes,
    buildPrayerTimesContext,
    getUserLocation,
    METHOD_LABELS,
  };

})();
