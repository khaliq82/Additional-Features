/* adhan-methods.js
   AdhanLive — single source of truth for prayer-time calculation methods.

   Keyed by ISO 3166-1 alpha-2 country code (MY, SA, EG ...).
   Requires adhan.js to be loaded FIRST (global `adhan`).

   Usage on any page:
     const params = AdhanMethods.paramsFor(CITY.cc);     // e.g. 'MY'
     const pt     = new adhan.PrayerTimes(coords, date, params);
     const label  = AdhanMethods.labelFor(CITY.cc);       // 'JAKIM, Malaysia'

   `verified: true`  = checked against that country's official authority using the
                       empirical method (compute today's times, compare to the
                       official table). Anything `false` still needs that check
                       before it goes live.
*/
(function (global) {
  'use strict';

  if (typeof adhan === 'undefined') {
    console.error('[AdhanMethods] adhan.js must load before adhan-methods.js');
    return;
  }

  // Custom angle-based params. First arg is the METHOD NAME ('Other'), NOT the
  // Fajr angle — passing a number there silently drops the Isha angle to 0,
  // which is the exact bug that put Isha before Maghrib on the KL page.
  function angles(fajr, isha, madhab) {
    var p = new adhan.CalculationParameters('Other', fajr, isha);
    if (madhab) p.madhab = madhab;
    return p;
  }

  // Each entry's build() returns a FRESH params object every call.
  // Never share one mutable object across cities.
  var REGISTRY = {
    // --- verified ---
    SA: { label: 'Umm al-Qura, Saudi Arabia', verified: true,
          build: function () { return adhan.CalculationMethod.UmmAlQura(); } },

    MY: { label: 'JAKIM, Malaysia', verified: true, // confirmed vs e-Solat, 17 Jun 2026 (Fajr 18 / Isha 18)
          build: function () { return angles(18, 18, adhan.Madhab.Shafi); } },

    // --- need the official-source check before going live ---
    SG: { label: 'MUIS, Singapore', verified: false, // MUIS genuinely uses Fajr 20 (unlike MY)
          build: function () { return angles(20, 18, adhan.Madhab.Shafi); } },

    ID: { label: 'Kemenag, Indonesia', verified: false, // Kemenag ~ Fajr 20 / Isha 18 — verify vs bimasislam
          build: function () { return angles(20, 18, adhan.Madhab.Shafi); } },

    EG: { label: 'Egyptian General Authority of Survey', verified: false,
          build: function () { return adhan.CalculationMethod.Egyptian(); } },

    TR: { label: 'Diyanet, Türkiye', verified: false,
          build: function () { return adhan.CalculationMethod.Turkey(); } },

    AE: { label: 'GCAA, United Arab Emirates', verified: false,
          build: function () { return adhan.CalculationMethod.Dubai(); } },

    PK: { label: 'University of Karachi', verified: false,
          build: function () { return adhan.CalculationMethod.Karachi(); } },

    BD: { label: 'University of Karachi', verified: false, // Bangladesh follows Karachi (18/18)
          build: function () { return adhan.CalculationMethod.Karachi(); } },

    GB: { label: 'Muslim World League', verified: false,
          build: function () { return adhan.CalculationMethod.MuslimWorldLeague(); } },

    US: { label: 'ISNA, North America', verified: false,
          build: function () { return adhan.CalculationMethod.NorthAmerica(); } },

    // --- extensions from your country/method notes ---
    LY: { label: 'Egyptian General Authority of Survey', verified: false,
          build: function () { return adhan.CalculationMethod.Egyptian(); } },
    SO: { label: 'Egyptian General Authority of Survey', verified: false,
          build: function () { return adhan.CalculationMethod.Egyptian(); } },
    NP: { label: 'University of Karachi', verified: false,
          build: function () { return adhan.CalculationMethod.Karachi(); } },
    LK: { label: 'University of Karachi', verified: false,
          build: function () { return adhan.CalculationMethod.Karachi(); } },
    PL: { label: 'Muslim World League', verified: false,
          build: function () { return adhan.CalculationMethod.MuslimWorldLeague(); } }
  };

  // Fallback for any country not yet listed.
  var DEFAULT = {
    label: 'Muslim World League', verified: false,
    build: function () { return adhan.CalculationMethod.MuslimWorldLeague(); }
  };

  function entry(cc) {
    return REGISTRY[String(cc || '').toUpperCase()] || DEFAULT;
  }

  global.AdhanMethods = {
    paramsFor:  function (cc) { return entry(cc).build(); },
    labelFor:   function (cc) { return entry(cc).label; },
    isVerified: function (cc) { return entry(cc).verified === true; },
    has:        function (cc) { return Object.prototype.hasOwnProperty.call(REGISTRY, String(cc || '').toUpperCase()); },
    registry:   REGISTRY
  };

})(typeof window !== 'undefined' ? window : this);
