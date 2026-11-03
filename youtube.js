// YouTube (m.youtube.com) rules. When YouTube changes its site, this is the file to fix.
window.ReelsFreeRules = {
  rewrite: function (url) {
    var path = url.pathname;

    // A Short opens as a normal video page, which has no swipe-to-next.
    var short = path.match(/^\/shorts\/([\w-]{6,})/);
    if (short) return url.origin + "/watch?v=" + short[1];

    if (/^\/(?:feed\/)?shorts\/?$/.test(path)) return url.origin + "/";

    // Playables (YouTube's built-in games).
    if (/^\/(?:feed\/)?playables(?:\/|$)/.test(path)) return url.origin + "/";

    // A channel's Shorts tab: go to the channel's home tab.
    var channelShorts = path.match(/^\/(@[^\/]+|channel\/[^\/]+|c\/[^\/]+|user\/[^\/]+)\/shorts\/?$/);
    if (channelShorts) return url.origin + "/" + channelShorts[1];

    return null;
  },

  css: [
    "ytm-reel-shelf-renderer",
    "ytm-shorts-lockup-view-model",
    "ytm-shorts-lockup-view-model-v2",
    "ytm-rich-section-renderer:has(ytm-shorts-lockup-view-model)",
    "ytm-rich-section-renderer:has(ytm-shorts-lockup-view-model-v2)",
    "ytm-rich-section-renderer:has(ytm-reel-shelf-renderer)",
    "grid-shelf-view-model:has(ytm-shorts-lockup-view-model)",
    "grid-shelf-view-model:has(ytm-shorts-lockup-view-model-v2)",
    "ytm-item-section-renderer:has(ytm-reel-shelf-renderer)",
    "ytm-pivot-bar-item-renderer:has(.pivot-shorts)",
    'ytm-pivot-bar-item-renderer:has(a[href^="/shorts"])',
    'ytm-rich-section-renderer:has(a[href*="/playables"])',
    'grid-shelf-view-model:has(a[href*="/playables"])',
    'ytm-item-section-renderer:has(a[href*="/playables"])',
    'ytm-compact-link-renderer:has(a[href*="/playables"])',
    'ytm-pivot-bar-item-renderer:has(a[href*="/playables"])'
  ].join(",\n") + " { display: none !important; }",

  // Any remaining card that links to a Short or a game is hidden as a whole.
  linkContains: ["/shorts/", "/playables"],
  cardSelector: [
    "ytm-rich-item-renderer",
    "ytm-video-with-context-renderer",
    "ytm-compact-video-renderer",
    "ytm-reel-item-renderer",
    "ytm-shorts-lockup-view-model",
    "ytm-shorts-lockup-view-model-v2"
  ].join(",")
};
