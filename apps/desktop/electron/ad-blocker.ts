/**
 * ad-blocker.ts
 *
 * Kino+ Network-Level Ad Blocker for Electron
 * ─────────────────────────────────────────────
 * Uses Electron's session.webRequest API to intercept and block ad/tracker
 * network requests before they reach the iframe or any other content.
 *
 * Blocked categories:
 *  • Display ad networks (DoubleClick, AdSense, AppNexus, etc.)
 *  • Video ad networks (IMA SDK, Springserve, SpotX, Magnite, etc.)
 *  • Fingerprinting & analytics trackers
 *  • Telemetry & data broker domains
 *  • Common ad CDNs used by embed video providers
 *
 * Strategy: domain-level wildcard blocking — lightweight, no parsing needed.
 */

import { session } from "electron";

// ──────────────────────────────────────────────────────────
// Block-list: known ad/tracker/fingerprint domains
// ──────────────────────────────────────────────────────────
const BLOCKED_DOMAIN_PATTERNS: string[] = [
  // Google Ad Infrastructure
  "*://pagead2.googlesyndication.com/*",
  "*://tpc.googlesyndication.com/*",
  "*://adservice.google.com/*",
  "*://adservice.google.com.au/*",
  "*://adservice.google.co.uk/*",
  "*://googleads.g.doubleclick.net/*",
  "*://*.doubleclick.net/*",
  "*://cm.doubleclick.net/*",
  "*://stats.g.doubleclick.net/*",
  "*://securepubads.g.doubleclick.net/*",
  "*://pubads.g.doubleclick.net/*",

  // Google IMA / Video Ads SDK
  "*://imasdk.googleapis.com/*",
  "*://googleads4.g.doubleclick.net/*",
  "*://ad.doubleclick.net/*",

  // AppNexus / Xandr
  "*://*.adnxs.com/*",
  "*://secure.adnxs.com/*",
  "*://ib.adnxs.com/*",
  "*://cdn.adnxs.com/*",

  // Magnite / Rubicon Project / SpotX
  "*://*.rubiconproject.com/*",
  "*://*.springserve.com/*",
  "*://*.spotx.tv/*",
  "*://*.spotxchange.com/*",
  "*://*.magnite.com/*",
  "*://*.sgsnssdk.com/*",

  // OpenX
  "*://*.openx.net/*",
  "*://*.openx.com/*",
  "*://us-east-2.openx.com/*",

  // PubMatic
  "*://*.pubmatic.com/*",
  "*://ads.pubmatic.com/*",
  "*://simage2.pubmatic.com/*",

  // IndexExchange / Casale Media
  "*://*.casalemedia.com/*",
  "*://*.indexww.com/*",
  "*://js-sec.indexww.com/*",

  // Criteo
  "*://*.criteo.com/*",
  "*://*.criteo.net/*",
  "*://bidder.criteo.com/*",

  // Amazon / A9 Ads
  "*://aax.amazon-adsystem.com/*",
  "*://c.amazon-adsystem.com/*",
  "*://z-na.amazon-adsystem.com/*",

  // Outbrain / Taboola
  "*://*.outbrain.com/*",
  "*://*.taboola.com/*",
  "*://*.taboolasyndication.com/*",

  // Facebook Ads
  "*://*.facebook.com/tr/*",
  "*://connect.facebook.net/*/fbevents.js",
  "*://an.facebook.com/*",
  "*://audiencenetwork.com/*",

  // Oath / Verizon Media Ads
  "*://*.adtechus.com/*",
  "*://ads.yahoosynd.com/*",

  // Advertising.com / AOL Ads
  "*://*.advertising.com/*",

  // Sovrn / Lijit
  "*://*.lijit.com/*",
  "*://*.sovrn.com/*",

  // TripleLift
  "*://*.triplelift.com/*",
  "*://*.3lift.com/*",

  // Sharethrough
  "*://*.sharethrough.com/*",

  // Teads
  "*://*.teads.tv/*",
  "*://*.teads.com/*",

  // Undertone / Perion
  "*://*.undertone.com/*",

  // Conversant / Epsilon
  "*://*.conversantmedia.com/*",
  "*://*.epsilon.com/*",

  // The Trade Desk
  "*://*.adsrvr.org/*",

  // MediaMath
  "*://*.mathtag.com/*",
  "*://*.mxptint.net/*",

  // LiveRamp / Acxiom
  "*://*.liveramp.com/*",
  "*://*.acxiom.com/*",

  // Nielsen / comScore
  "*://secure-dc.imrworldwide.com/*",
  "*://bam.nr-data.net/*",
  "*://*.comscore.com/*",
  "*://*.scorecardresearch.com/*",

  // Hotjar / FullStory / Smartlook (session replay trackers)
  "*://*.hotjar.com/*",
  "*://*.fullstory.com/*",
  "*://*.smartlook.com/*",

  // Segment / Mixpanel / Amplitude (behavioral analytics)
  "*://api.segment.io/*",
  "*://cdn.segment.com/*",
  "*://*.mixpanel.com/*",
  "*://*.amplitude.com/*",

  // Quantcast
  "*://*.quantserve.com/*",
  "*://*.quantcount.com/*",

  // Lotame
  "*://*.crwdcntrl.net/*",
  "*://*.lotame.com/*",

  // ID5 / LiveIntent / Prebid ID partners
  "*://*.id5-sync.com/*",
  "*://*.liveintent.com/*",
  "*://cm.liveintent.com/*",

  // Common generic ad endpoints
  "*://ads.stickyadstv.com/*",
  "*://ad.turn.com/*",
  "*://*.bidr.io/*",
  "*://*.bidswitch.net/*",
  "*://*.btrll.com/*",
  "*://*.buzzoola.com/*",
  "*://*.contextweb.com/*",
  "*://*.emxdgt.com/*",
  "*://*.freewheel.tv/*",
  "*://*.smartadserver.com/*",
  "*://*.smaato.net/*",
  "*://*.nativo.com/*",
  "*://*.yieldmo.com/*",
  "*://*.adform.net/*",
  "*://*.adhese.com/*",
  "*://*.admixer.net/*",
  "*://*.adcolony.com/*",
  "*://*.adtrue.com/*",
  "*://*.adroll.com/*",

  // Fingerprinting libraries sometimes used by embed sites
  "*://c.betrad.com/*",
  "*://cdn.adsafeprotected.com/*",
  "*://pixel.adsafeprotected.com/*",
  "*://jssdks.mparticle.com/*",
  "*://*.branch.io/*",
  "*://*.appsflyer.com/*",

  // Fraud detection / HUMAN (PerimeterX)
  "*://*.perimeterx.net/*",
  "*://*.px-cdn.net/*",
  "*://*.px-cloud.net/*",
];

// ──────────────────────────────────────────────────────────
// URL-fragment block-list: block specific paths/resources
// (for domains we can't fully wildcard-block)
// ──────────────────────────────────────────────────────────
const BLOCKED_URL_FRAGMENTS: string[] = [
  "/ads/",
  "/adserver/",
  "/adscript/",
  "/adsystem/",
  "/banner_ad",
  "googletag.js",
  "gpt.js",
  "prebid.js",
  "prebid.min.js",
  "/ima/",
  "ima3.js",
  "ima3_debug.js",
  "/freewheel/",
  "fw_ads",
  "springserve",
  "/adbreak",
  "adbreak.js",
];

let isAdBlockerInstalled = false;

/**
 * Install the ad blocker on Electron's default session.
 * Call this once before `createWindow()` inside `app.whenReady()`.
 */
export function installAdBlocker(): void {
  if (isAdBlockerInstalled) return;
  isAdBlockerInstalled = true;

  const defaultSession = session.defaultSession;

  // ── 1. Block by domain pattern (most efficient — kernel-level URL matching)
  defaultSession.webRequest.onBeforeRequest(
    { urls: BLOCKED_DOMAIN_PATTERNS },
    (_details, callback) => {
      // Always cancel requests matching our blocklist
      callback({ cancel: true });
    }
  );

  // ── 2. Block by URL fragments (catches ad scripts not covered by domain list)
  defaultSession.webRequest.onBeforeRequest(
    { urls: ["*://*/*"] },
    (details, callback) => {
      const url = details.url.toLowerCase();

      // Skip our own app and the streaming providers themselves
      const isOwnContent =
        url.startsWith("devtools://") ||
        url.includes("localhost") ||
        url.includes("127.0.0.1") ||
        url.includes("tmdb.org") ||
        url.includes("image.tmdb.org");

      if (isOwnContent) {
        callback({ cancel: false });
        return;
      }

      // Check URL against fragment blocklist
      const shouldBlock = BLOCKED_URL_FRAGMENTS.some((fragment) =>
        url.includes(fragment.toLowerCase())
      );

      callback({ cancel: shouldBlock });
    }
  );

  // ── 3. Strip ad-related response headers that embed sites may set
  //    (prevents tracking via redirects and cookie syncing)
  defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...(details.responseHeaders || {}) };

    // Remove known ad/tracking cookie headers from third-party ad domains
    const isAdDomain = BLOCKED_DOMAIN_PATTERNS.some((pattern) => {
      const domain = pattern.replace("*://", "").replace("/*", "").replace("*.", "");
      return details.url.includes(domain);
    });

    if (isAdDomain) {
      delete responseHeaders["set-cookie"];
      delete responseHeaders["Set-Cookie"];
    }

    callback({ responseHeaders });
  });

  console.log(
    `[Kino+] Ad blocker active — blocking ${BLOCKED_DOMAIN_PATTERNS.length} domain patterns + ${BLOCKED_URL_FRAGMENTS.length} URL fragment rules`
  );
}
