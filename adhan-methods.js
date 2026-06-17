/* adhan-methods.js — v2
   AdhanLive — single source of truth for prayer-time calculation methods.

   Keyed by ISO 3166-1 alpha-2 country code.
   Requires adhan.js to be loaded first (global `adhan`).

   Usage:
     const params = AdhanMethods.paramsFor('MY');
     const pt     = new adhan.PrayerTimes(coords, date, params);
     const label  = AdhanMethods.labelFor('MY');  // 'JAKIM, Malaysia'

   High-latitude handling:
     AdhanMethods.paramsFor() automatically applies the correct
     HighLatitudeRule for countries above ~51°N. The rule is baked
     into the returned params object — no extra code needed on city pages.

   verified: true = checked against official authority source.
*/
(function (global) {
  'use strict';

  if (typeof adhan === 'undefined') {
    console.error('[AdhanMethods] adhan.js must load before adhan-methods.js');
    return;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  // Custom angle-based params.
  // CRITICAL: first arg is the METHOD NAME ('Other'), NOT the fajr angle.
  // Passing a number there silently drops ishaAngle to 0.
  function angles(fajr, isha, madhab) {
    var p = new adhan.CalculationParameters('Other', fajr, isha);
    if (madhab) p.madhab = madhab;
    return p;
  }

  // ── High-latitude rule ───────────────────────────────────────────────────
  //
  // Problem: above ~48°N in summer, the sun never drops far enough below the
  // horizon for true astronomical twilight. Pure angle math either gives
  // impossibly early/late times or collapses Fajr and Isha to the same value.
  //
  // Solution: TwilightAngle rule — adhan.js uses the twilight angle itself
  // to estimate Fajr/Isha proportionally. Empirically tested against:
  //   - London Unified Timetable (ICC / East London Mosque / London Central)
  //   - Jun 17 2026: our Fajr 02:30 vs London Unified 02:39 (9 min gap)
  //   - Sep 15 2026: our Fajr 04:39 vs London Unified 04:40 (1 min gap)
  //
  // Affected cities (latitude > ~51°N, tested June peak):
  //   London (51.5°N), Amsterdam (52.4°N), Berlin (52.5°N), Stockholm (59.3°N)
  //
  // NOT affected (angle calculation works fine year-round):
  //   Paris (48.9°N), Toronto (43.7°N), New York (40.7°N), Istanbul (41.0°N)
  //   All cities below 42°N (Makkah, Cairo, Dubai, KL, Jakarta, etc.)
  //
  // Countries flagged for TwilightAngle rule:
  var HIGH_LAT_TWILIGHT = {
    GB: true,  // United Kingdom   — 51.5°N, London Unified closest match
    NL: true,  // Netherlands      — 52.4°N Amsterdam, same issue
    DE: true,  // Germany          — 52.5°N Berlin
    SE: true,  // Sweden           — 59.3°N Stockholm
    NO: true,  // Norway           — 59.9°N Oslo
    DK: true,  // Denmark          — 55.7°N Copenhagen
    FI: true,  // Finland          — 60.2°N Helsinki
    BE: true,  // Belgium          — 50.8°N Brussels (borderline, safer with rule)
    IE: true,  // Ireland          — 53.3°N Dublin
    IS: true,  // Iceland          — 64.1°N Reykjavik
    CA: true,  // Canada           — varies; Toronto fine, but rule safe for all
  };

  function applyHighLatRule(params, cc) {
    if (HIGH_LAT_TWILIGHT[cc]) {
      params.highLatitudeRule = adhan.HighLatitudeRule.TwilightAngle;
    }
    return params;
  }

  // ── Registry ─────────────────────────────────────────────────────────────

  var REGISTRY = {

    // ── Verified against official source ──
    SA: {
      label: 'Umm al-Qura University, Makkah',
      verified: true,
      build: function () { return adhan.CalculationMethod.UmmAlQura(); }
    },

    MY: {
      label: 'JAKIM, Malaysia',
      verified: true,
      // Fajr 18° / Isha 18° — confirmed vs e-Solat, 17 Jun 2026
      // Malaysia moved from 20° to 18° Fajr in 2021 fatwa
      build: function () { return angles(18, 18, adhan.Madhab.Shafi); }
    },

    GB: {
      label: 'London Unified Timetable (MWL + TwilightAngle)',
      verified: true,
      // TwilightAngle is empirically closest to London Unified / ICC timetable.
      // Jun 17: our 02:30 Fajr vs London Unified 02:39 (9 min gap).
      // SeventhOfNight was 1hr off. MiddleOfNight collapsed in summer.
      build: function () {
        var p = adhan.CalculationMethod.MuslimWorldLeague();
        p.highLatitudeRule = adhan.HighLatitudeRule.TwilightAngle;
        return p;
      }
    },

    // ── Not yet verified against official source ──

    SG: {
      label: 'MUIS, Singapore',
      verified: false,
      // MUIS uses Fajr 20° — different from Malaysia's 18°
      build: function () { return angles(20, 18, adhan.Madhab.Shafi); }
    },

    ID: {
      label: 'Kemenag, Indonesia',
      verified: false,
      // Kemenag ~Fajr 20° / Isha 18° — verify vs bimasislam.kemenag.go.id
      build: function () { return angles(20, 18, adhan.Madhab.Shafi); }
    },

    EG: {
      label: 'Egyptian General Authority of Survey',
      verified: false,
      build: function () { return adhan.CalculationMethod.Egyptian(); }
    },

    TR: {
      label: 'Diyanet, Türkiye',
      verified: false,
      build: function () { return adhan.CalculationMethod.Turkey(); }
    },

    AE: {
      label: 'UAE General Authority of Islamic Affairs',
      verified: false,
      build: function () { return adhan.CalculationMethod.Dubai(); }
    },

    PK: {
      label: 'University of Karachi',
      verified: false,
      build: function () { return adhan.CalculationMethod.Karachi(); }
    },

    BD: {
      label: 'University of Karachi',
      verified: false,
      build: function () { return adhan.CalculationMethod.Karachi(); }
    },

    US: {
      label: 'ISNA, North America',
      verified: false,
      build: function () { return adhan.CalculationMethod.NorthAmerica(); }
    },

    FR: {
      label: 'Union of Islamic Organisations of France (UOIF)',
      verified: false,
      // Paris 48.9°N — angle calculation works year-round, no high-lat rule
      build: function () { return angles(12, 12); }
    },

    // ── Extensions from country/method notes ──
    LY: { label: 'Egyptian General Authority of Survey', verified: false,
          build: function () { return adhan.CalculationMethod.Egyptian(); } },
    SO: { label: 'Egyptian General Authority of Survey', verified: false,
          build: function () { return adhan.CalculationMethod.Egyptian(); } },
    NP: { label: 'University of Karachi', verified: false,
          build: function () { return adhan.CalculationMethod.Karachi(); } },
    LK: { label: 'University of Karachi', verified: false,
          build: function () { return adhan.CalculationMethod.Karachi(); } },
    PL: { label: 'Muslim World League', verified: false,
          build: function () { return adhan.CalculationMethod.MuslimWorldLeague(); } },

    // High-lat European countries — MWL + TwilightAngle
    NL: { label: 'Muslim World League', verified: false,
          build: function () { var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    DE: { label: 'Muslim World League', verified: false,
          build: function () { var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    SE: { label: 'Muslim World League', verified: false,
          build: function () { var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    NO: { label: 'Muslim World League', verified: false,
          build: function () { var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    DK: { label: 'Muslim World League', verified: false,
          build: function () { var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    FI: { label: 'Muslim World League', verified: false,
          build: function () { var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    BE: { label: 'Muslim World League', verified: false,
          build: function () { var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    IE: { label: 'Muslim World League', verified: false,
          build: function () { var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    IS: { label: 'Muslim World League', verified: false,
          build: function () { var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    CA: { label: 'ISNA, North America', verified: false,
          build: function () { var p=adhan.CalculationMethod.NorthAmerica(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
  };

  // Fallback for any country not yet in the registry
  var DEFAULT = {
    label: 'Muslim World League',
    verified: false,
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
