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
    var SPONSORED = /^(ad|sponsored|sponsorlu|reklam)$/i;
    var LIKE = 'svg[aria-label="Like"], svg[aria-label="Beğen"]';

    // The post is the first ancestor that has a like button and whose parent holds other
    // posts too. Posts are not always <article> elements on the mobile site.
    function postFor(label) {
      var article = label.closest("article");
      if (article) return article;
      for (var node = label.parentElement, depth = 0; node && node.parentElement && depth < 25; node = node.parentElement, depth++) {
        if (node.querySelector(LIKE) && node.parentElement.querySelectorAll(LIKE).length > node.querySelectorAll(LIKE).length) {
          return node;
        }
      }
      return null;
    }

    document.querySelectorAll("span, a, div").forEach(function (label) {
      if (label.childElementCount > 1 || label.textContent.length > 12) return;
      if (!SPONSORED.test(label.textContent.trim())) return;
      var post = postFor(label);
      if (post) helpers.hide(post);
    });

    helpers.hideAppPrompts();
  }
};
