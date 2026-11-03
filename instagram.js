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

  linkContains: [],
  cardSelector: null,

  // Sponsored posts. Matches on the visible label because Instagram's class names are
  // obfuscated and change often.
  sweep: function (document, helpers) {
    var SPONSORED = /^(sponsored|sponsorlu|reklam)$/i;

    document.querySelectorAll("article").forEach(function (post) {
      var labels = post.querySelectorAll("span, a");
      for (var i = 0; i < labels.length; i++) {
        if (SPONSORED.test(labels[i].textContent.trim())) {
          helpers.hide(post);
          return;
        }
      }
    });

    helpers.hideAppPrompts();
  }
};
