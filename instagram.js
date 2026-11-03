// Instagram rules. When Instagram changes its site, this is the file to fix.
window.ReelsFreeRules = {
  rewrite: function (url) {
    var path = url.pathname;
    var home = url.origin + "/";

    // Reels tab and audio pages are endless feeds.
    if (/^\/reels\/?$/.test(path) || /^\/reels\/audio\//.test(path)) return home;

    // /reels/<code>/ is the swipeable feed starting at one reel; /reel/<code>/ is that single reel.
    // A reel someone sent you therefore opens on its own, with no "next" to swipe to.
    var swipe = path.match(/^\/(?:[\w.]+\/)?reels\/([\w-]+)\/?$/);
    if (swipe) return url.origin + "/reel/" + swipe[1] + "/";

    // A profile's Reels tab: go to the profile's normal grid.
    var profileReels = path.match(/^\/([\w.]+)\/reels\/?$/);
    if (profileReels) return url.origin + "/" + profileReels[1] + "/";

    // The explore grid is an algorithmic feed; keep search.
    if (/^\/explore\/?$/.test(path)) return url.origin + "/explore/search/";

    return null;
  },

  css: [
    'a[href="/reels/"]',
    'a[href$="/reels/"][role="tab"]'
  ].join(",\n") + " { display: none !important; }",

  // A reel someone sent you may be watched, but swiping moves the URL on to the next reel
  // without a tap. common.js sends you back (to the chat) when that happens.
  blockSwipe: function (from, to) {
    var reel = /^\/(?:[\w.]+\/)?reels?\/([\w-]+)\/?$/;
    var a = from.pathname.match(reel);
    var b = to.pathname.match(reel);
    return !!(a && b && a[1] !== b[1]);
  },

  linkContains: [],
  cardSelector: null,

  // Ad hiding was removed: the feed went grey while scrolling.
  sweep: function (document, helpers) {
    helpers.hideAppPrompts();

    // A reel opened from a DM plays in a vertical scroll-snap viewer where swiping moves on
    // without changing the URL. Lock that viewer's scrolling so only the opened reel plays.
    // Limited to reel and DM pages so the home feed can never be locked.
    if (!/^\/(?:reels?|direct)\//.test(location.pathname)) return;
    document.querySelectorAll("video").forEach(function (video) {
      for (var node = video.parentElement, depth = 0; node && node !== document.body && depth < 20; node = node.parentElement, depth++) {
        if (node.hasAttribute("data-rf-locked")) return;
        var style = getComputedStyle(node);
        if (/\b(y|block|both)\b/.test(style.scrollSnapType) && /auto|scroll/.test(style.overflowY)) {
          node.setAttribute("data-rf-locked", "");
          node.style.setProperty("overflow-y", "hidden", "important");
          node.style.setProperty("touch-action", "pan-x pinch-zoom", "important");
          return;
        }
      }
    });
  }
};
