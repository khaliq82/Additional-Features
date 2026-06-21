/* adhan-methods.js — v3
   AdhanLive — single source of truth for prayer-time calculation methods.

   Keyed by ISO 3166-1 alpha-2 country code.
   Requires adhan.js to be loaded first (global `adhan`).

   Usage on city pages:
     const params = AdhanMethods.paramsFor('MY');

   Usage on hub page (region-aware):
     const params = AdhanMethods.paramsForRegion('IN', 'Tamil Nadu');
     const label  = AdhanMethods.labelFor('IN');

   v3 additions:
   - paramsForRegion(cc, state) — sub-national madhab overrides
   - South India Shafi states (Tamil Nadu, Kerala, Karnataka, Goa,
     Andhra Pradesh, Telangana, Lakshadweep)
   - latitude-based high-lat auto-detection for hub page
*/
(function (global) {
  'use strict';

  if (typeof adhan === 'undefined') {
    console.error('[AdhanMethods] adhan.js must load before adhan-methods.js');
    return;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  function angles(fajr, isha, madhab) {
    var p = new adhan.CalculationParameters('Other', fajr, isha);
    if (madhab) p.madhab = madhab;
    return p;
  }

  // ── High-latitude countries ───────────────────────────────────────────────
  var HIGH_LAT_TWILIGHT = {
    GB:true, NL:true, DE:true, SE:true, NO:true,
    DK:true, FI:true, BE:true, IE:true, IS:true, CA:true,
  };

  // ── Sub-national region overrides ─────────────────────────────────────────
  // Keyed by CC, value is a function(stateName) → params | null
  // Return null to fall through to country default.
  //
  // State names are as returned by Nominatim's 'state' field.
  // We normalise to lowercase for matching.

  var REGION_OVERRIDES = {

    // India — South Indian states follow Shafi madhab for Asr
    // All other Indian states follow Hanafi (country default)
    'IN': function(state) {
      var s = (state||'').toLowerCase();
      var SHAFI_STATES = [
        'tamil nadu', 'kerala', 'karnataka', 'goa',
        'andhra pradesh', 'telangana', 'lakshadweep',
        'puducherry', 'pondicherry'
      ];
      for (var i=0; i<SHAFI_STATES.length; i++) {
        if (s.indexOf(SHAFI_STATES[i]) !== -1) {
          return angles(18, 18, adhan.Madhab.Shafi);
        }
      }
      return null; // fall through to Hanafi default
    },

    // Indonesia — Kemenag is national, but Aceh province uses slightly
    // stricter local times; fall through for now, flag for future data
    'ID': function(state) {
      return null; // all provinces use Kemenag national method
    },

    // Malaysia — all states use JAKIM; no regional variation needed
    'MY': function(state) {
      return null;
    },

  };

  // ── Registry ─────────────────────────────────────────────────────────────

  var REGISTRY = {

    SA: { label:'Umm al-Qura University, Makkah', verified:true,
          build: function(){ return adhan.CalculationMethod.UmmAlQura(); } },

    MY: { label:'JAKIM, Malaysia', verified:true,
          build: function(){ return angles(18, 18, adhan.Madhab.Shafi); } },

    GB: { label:'Muslim World League + TwilightAngle (closest to London Unified)', verified:true,
          build: function(){
            var p=adhan.CalculationMethod.MuslimWorldLeague();
            p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle;
            return p;
          }},

    SG: { label:'MUIS, Singapore', verified:false,
          build: function(){ return angles(20, 18, adhan.Madhab.Shafi); } },

    ID: { label:'Kemenag, Indonesia', verified:false,
          build: function(){ return angles(20, 18, adhan.Madhab.Shafi); } },

    EG: { label:'Egyptian General Authority of Survey', verified:false,
          build: function(){ return adhan.CalculationMethod.Egyptian(); } },

    TR: { label:'Diyanet, Türkiye', verified:false,
          build: function(){ return adhan.CalculationMethod.Turkey(); } },

    AE: { label:'UAE General Authority of Islamic Affairs', verified:false,
          build: function(){ return adhan.CalculationMethod.Dubai(); } },

    PK: { label:'University of Karachi (Hanafi)', verified:false,
          build: function(){ var p=adhan.CalculationMethod.Karachi(); p.madhab=adhan.Madhab.Hanafi; return p; } },

    BD: { label:'University of Karachi (Hanafi)', verified:false,
          build: function(){ var p=adhan.CalculationMethod.Karachi(); p.madhab=adhan.Madhab.Hanafi; return p; } },

    IN: { label:'University of Karachi (Hanafi — North/Central India)', verified:false,
          build: function(){ var p=adhan.CalculationMethod.Karachi(); p.madhab=adhan.Madhab.Hanafi; return p; } },

    US: { label:'ISNA, North America', verified:false,
          build: function(){ return adhan.CalculationMethod.NorthAmerica(); } },

    FR: { label:'Union of Islamic Organisations of France (UOIF)', verified:false,
          build: function(){ return angles(12, 12); } },

    // Subcontinent + nearby
    NP: { label:'University of Karachi', verified:false,
          build: function(){ var p=adhan.CalculationMethod.Karachi(); p.madhab=adhan.Madhab.Hanafi; return p; } },
    LK: { label:'University of Karachi', verified:false,
          build: function(){ return adhan.CalculationMethod.Karachi(); } },
    AF: { label:'University of Karachi (Hanafi)', verified:false,
          build: function(){ var p=adhan.CalculationMethod.Karachi(); p.madhab=adhan.Madhab.Hanafi; return p; } },

    // North Africa / Middle East
    LY: { label:'Egyptian General Authority of Survey', verified:false,
          build: function(){ return adhan.CalculationMethod.Egyptian(); } },
    SO: { label:'Egyptian General Authority of Survey', verified:false,
          build: function(){ return adhan.CalculationMethod.Egyptian(); } },
    SD: { label:'Egyptian General Authority of Survey', verified:false,
          build: function(){ return adhan.CalculationMethod.Egyptian(); } },
    TN: { label:'Egyptian General Authority of Survey', verified:false,
          build: function(){ return adhan.CalculationMethod.Egyptian(); } },
    DZ: { label:'Muslim World League', verified:false,
          build: function(){ return adhan.CalculationMethod.MuslimWorldLeague(); } },
    MA: { label:'Muslim World League', verified:false,
          build: function(){ return adhan.CalculationMethod.MuslimWorldLeague(); } },
    IQ: { label:'Umm al-Qura University, Makkah', verified:false,
          build: function(){ return adhan.CalculationMethod.UmmAlQura(); } },
    KW: { label:'Umm al-Qura University, Makkah', verified:false,
          build: function(){ return adhan.CalculationMethod.UmmAlQura(); } },
    BH: { label:'Umm al-Qura University, Makkah', verified:false,
          build: function(){ return adhan.CalculationMethod.UmmAlQura(); } },
    QA: { label:'Umm al-Qura University, Makkah', verified:false,
          build: function(){ return adhan.CalculationMethod.UmmAlQura(); } },
    OM: { label:'Umm al-Qura University, Makkah', verified:false,
          build: function(){ return adhan.CalculationMethod.UmmAlQura(); } },
    YE: { label:'Umm al-Qura University, Makkah', verified:false,
          build: function(){ return adhan.CalculationMethod.UmmAlQura(); } },
    JO: { label:'Umm al-Qura University, Makkah', verified:false,
          build: function(){ return adhan.CalculationMethod.UmmAlQura(); } },
    SY: { label:'Umm al-Qura University, Makkah', verified:false,
          build: function(){ return adhan.CalculationMethod.UmmAlQura(); } },
    LB: { label:'Umm al-Qura University, Makkah', verified:false,
          build: function(){ return adhan.CalculationMethod.UmmAlQura(); } },
    PS: { label:'Umm al-Qura University, Makkah', verified:false,
          build: function(){ return adhan.CalculationMethod.UmmAlQura(); } },
    IR: { label:'University of Tehran', verified:false,
          build: function(){ return adhan.CalculationMethod.Tehran(); } },

    // Southeast Asia
    PH: { label:'Muslim World League', verified:false,
          build: function(){ return adhan.CalculationMethod.MuslimWorldLeague(); } },
    TH: { label:'Muslim World League', verified:false,
          build: function(){ return adhan.CalculationMethod.MuslimWorldLeague(); } },
    MM: { label:'Muslim World League', verified:false,
          build: function(){ return adhan.CalculationMethod.MuslimWorldLeague(); } },
    BN: { label:'MUIS, Singapore', verified:false,
          build: function(){ return angles(20, 18, adhan.Madhab.Shafi); } },

    // Sub-Saharan Africa
    NG: { label:'Muslim World League', verified:false,
          build: function(){ return adhan.CalculationMethod.MuslimWorldLeague(); } },
    ET: { label:'Muslim World League', verified:false,
          build: function(){ return adhan.CalculationMethod.MuslimWorldLeague(); } },
    GH: { label:'Muslim World League', verified:false,
          build: function(){ return adhan.CalculationMethod.MuslimWorldLeague(); } },
    SN: { label:'Muslim World League', verified:false,
          build: function(){ return adhan.CalculationMethod.MuslimWorldLeague(); } },
    TZ: { label:'Muslim World League', verified:false,
          build: function(){ return adhan.CalculationMethod.MuslimWorldLeague(); } },
    KE: { label:'Muslim World League', verified:false,
          build: function(){ return adhan.CalculationMethod.MuslimWorldLeague(); } },

    // North America
    MX: { label:'Muslim World League', verified:false,
          build: function(){ return adhan.CalculationMethod.MuslimWorldLeague(); } },
    AU: { label:'Muslim World League', verified:false,
          build: function(){ return adhan.CalculationMethod.MuslimWorldLeague(); } },

    // Europe
    PL: { label:'Muslim World League', verified:false,
          build: function(){ return adhan.CalculationMethod.MuslimWorldLeague(); } },
    RU: { label:'Muslim World League', verified:false,
          build: function(){ return adhan.CalculationMethod.MuslimWorldLeague(); } },
    ES: { label:'Muslim World League', verified:false,
          build: function(){ return adhan.CalculationMethod.MuslimWorldLeague(); } },
    IT: { label:'Muslim World League', verified:false,
          build: function(){ return adhan.CalculationMethod.MuslimWorldLeague(); } },

    // Central Europe — needs TwilightAngle from ~48°N upward
    CZ: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    SK: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    AT: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    HU: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    CH: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    FR: { label:'Union of Islamic Organisations of France (UOIF)', verified:false,
          build: function(){ var p=angles(12,12); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    ES: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    IT: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    PT: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    LU: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    HR: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    SI: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    BA: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    RS: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    ME: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    MK: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    AL: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    XK: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    RO: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    BG: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    GR: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    UA: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    BY: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    MD: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    NL: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    DE: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    SE: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    NO: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    DK: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    FI: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    BE: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    IE: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    IS: { label:'Muslim World League', verified:false,
          build: function(){ var p=adhan.CalculationMethod.MuslimWorldLeague(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
    CA: { label:'ISNA, North America', verified:false,
          build: function(){ var p=adhan.CalculationMethod.NorthAmerica(); p.highLatitudeRule=adhan.HighLatitudeRule.TwilightAngle; return p; } },
  };

  var DEFAULT = {
    label: 'Muslim World League',
    verified: false,
    build: function () { return adhan.CalculationMethod.MuslimWorldLeague(); }
  };

  function entry(cc) {
    return REGISTRY[String(cc || '').toUpperCase()] || DEFAULT;
  }

  // ── Latitude-based high-lat auto-detection ────────────────────────────────
  // For hub page: if country isn't explicitly registered but latitude > 48°,
  // automatically apply TwilightAngle rule.
  function applyLatRule(params, lat) {
    if (lat && Math.abs(lat) > 48) {
      if (!params.highLatitudeRule ||
          params.highLatitudeRule === adhan.HighLatitudeRule.MiddleOfTheNight) {
        params.highLatitudeRule = adhan.HighLatitudeRule.TwilightAngle;
      }
    }
    return params;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  global.AdhanMethods = {

    // City pages — country-level only
    paramsFor: function (cc) {
      return entry(cc).build();
    },

    // Hub page — region-aware, with latitude fallback for high-lat
    paramsForRegion: function (cc, state, lat) {
      var ccUp = String(cc || '').toUpperCase();
      var override = REGION_OVERRIDES[ccUp];
      var params = null;

      // Try region override first
      if (override) {
        params = override(state || '');
      }

      // Fall through to country default
      if (!params) {
        params = entry(ccUp).build();
      }

      // Auto high-lat rule from latitude if not already set
      if (lat !== undefined) {
        applyLatRule(params, lat);
      }

      return params;
    },

    // Label — shows region info when available
    labelFor: function (cc, state) {
      var ccUp = String(cc || '').toUpperCase();
      var base = entry(ccUp).label;
      // For India, annotate with madhab when we know the state
      if (ccUp === 'IN' && state) {
        var s = (state||'').toLowerCase();
        var SHAFI = ['tamil nadu','kerala','karnataka','goa','andhra pradesh','telangana','lakshadweep','puducherry','pondicherry'];
        for (var i=0; i<SHAFI.length; i++) {
          if (s.indexOf(SHAFI[i]) !== -1) {
            return 'University of Karachi (Shafi — South India)';
          }
        }
      }
      return base;
    },

    isVerified: function (cc) { return entry(cc).verified === true; },
    has:        function (cc) { return Object.prototype.hasOwnProperty.call(REGISTRY, String(cc||'').toUpperCase()); },
    registry:   REGISTRY
  };

})(typeof window !== 'undefined' ? window : this);
