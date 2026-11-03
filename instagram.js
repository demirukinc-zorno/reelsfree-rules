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

    // The post is the first ancestor holding exactly one like button whose parent holds other
    // posts too. Posts are not always <article> elements on the mobile site. Anything with
    // more than one like button is part of the feed itself and must never be hidden.
    function postFor(label) {
      var article = label.closest("article");
      if (article) return article;
      for (var node = label.parentElement, depth = 0; node && node.parentElement && depth < 25; node = node.parentElement, depth++) {
        var likes = node.querySelectorAll(LIKE).length;
        if (likes > 1) return null;
        if (likes === 1 && node.parentElement.querySelectorAll(LIKE).length > 1) return node;
      }
      return null;
    }

    // Only leaf elements: reading textContent of containers on a long feed is what made
    // scrolling stall.
    document.querySelectorAll("span, a").forEach(function (label) {
      if (label.firstElementChild) return;
      if (label.textContent.length > 12 || !SPONSORED.test(label.textContent.trim())) return;
      var post = postFor(label);
      if (post) helpers.hide(post);
    });

    helpers.hideAppPrompts();
  }
};
