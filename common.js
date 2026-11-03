// Shared runtime, injected right after the platform's rules file at document start.
// The platform file sets window.ReelsFreeRules = { rewrite(url), css, linkContains, cardSelector, sweep? }.
// sweep(document, helpers) runs on every DOM change; helpers = { hide(el), hideAppPrompts() }.
// All blocking decisions come from rewrite(): it returns a replacement URL for a blocked page, or null.
(function () {
  "use strict";
  var rules = window.ReelsFreeRules;
  if (!rules || window.__reelsFreeLoaded) return;
  window.__reelsFreeLoaded = true;

  function redirectFor(href) {
    try {
      var url = new URL(href, location.href);
      var next = rules.rewrite(url);
      return next && next !== url.href ? next : null;
    } catch (e) {
      return null;
    }
  }

  // If a site keeps bouncing us back to a blocked URL, stop fighting it instead of looping forever.
  function allowRedirect(target) {
    try {
      var now = Date.now();
      var log = JSON.parse(sessionStorage.getItem("__reelsFreeRedirects") || "[]").filter(function (entry) {
        return now - entry.t < 5000;
      });
      var repeats = log.filter(function (entry) { return entry.u === target; }).length;
      log.push({ u: target, t: now });
      sessionStorage.setItem("__reelsFreeRedirects", JSON.stringify(log));
      return repeats < 2;
    } catch (e) {
      return true;
    }
  }

  function go(target) {
    if (allowRedirect(target)) location.replace(target);
  }

  function enforce() {
    var next = redirectFor(location.href);
    if (next) go(next);
  }

  var style = document.createElement("style");
  style.textContent = rules.css || "";
  function attachStyle() {
    if (!style.isConnected) (document.head || document.documentElement).appendChild(style);
  }
  attachStyle();

  // Single-page-app navigation never reaches the native navigation delegate, so catch it here.
  ["pushState", "replaceState"].forEach(function (name) {
    var original = history[name];
    history[name] = function (state, title, url) {
      if (url != null) {
        var next = redirectFor(String(url));
        if (next) {
          go(next);
          return;
        }
      }
      return original.apply(this, arguments);
    };
  });
  window.addEventListener("popstate", enforce);

  document.addEventListener(
    "click",
    function (event) {
      var link = event.target && event.target.closest && event.target.closest("a[href]");
      if (!link) return;
      var next = redirectFor(link.href);
      if (next) {
        event.preventDefault();
        event.stopImmediatePropagation();
        location.assign(next);
      }
    },
    true
  );

  function hide(el) {
    el.style.setProperty("display", "none", "important");
  }

  var APP_PROMPT = /^(use the app|open app|open instagram|open x|get the app|switch to the app|open in app|uygulamayı kullan|uygulamada aç|uygulamayı aç|instagram'ı aç|uygulamayı edin)$/i;
  var CLOSE = /^(|×|✕|x|close|dismiss|not now|kapat|şimdi değil)$/i;

  function isClose(control) {
    var label = control.getAttribute("aria-label") || control.textContent;
    return CLOSE.test(label.trim());
  }

  // Widen to the surrounding banner only while it holds nothing but the prompt (and maybe a
  // close button). Site headers put an "Open app" button next to the logo and navigation,
  // and those headers must stay.
  function promptContainer(el) {
    var target = el;
    for (var node = el.parentElement, depth = 0; node && node !== document.body && depth < 8; node = node.parentElement, depth++) {
      if (node.textContent.length > 80 || node.querySelector("article, header, nav, main")) break;
      var others = Array.prototype.filter.call(node.querySelectorAll('a, button, div[role="button"]'), function (control) {
        return control !== el && !el.contains(control) && !control.contains(el) && !isClose(control);
      });
      if (others.length > 0) break;
      target = node;
    }
    return target;
  }

  // "Use the app" / "Open app" prompts. Matched on visible text because class names are
  // obfuscated and change often.
  function hideAppPrompts() {
    document.querySelectorAll('a, button, div[role="button"]').forEach(function (el) {
      var text = el.textContent;
      if (text.length > 40 || !APP_PROMPT.test(text.trim())) return;
      hide(promptContainer(el));
    });
    document.querySelectorAll('a[href*="apps.apple.com"], a[href*="itunes.apple.com"]').forEach(function (el) {
      hide(promptContainer(el));
    });
  }

  var helpers = { hide: hide, hideAppPrompts: hideAppPrompts };

  var linkSelector = (rules.linkContains || [])
    .map(function (part) { return 'a[href*="' + part + '"]'; })
    .join(",");

  function sweep() {
    attachStyle();
    if (linkSelector && rules.cardSelector) {
      document.querySelectorAll(linkSelector).forEach(function (link) {
        var card = link.closest(rules.cardSelector);
        if (card) hide(card);
      });
    }
    if (rules.sweep) {
      try {
        rules.sweep(document, helpers);
      } catch (e) {}
    }
    enforce();  // catches URL changes that bypass the history API
  }

  var scheduled = false;
  new MutationObserver(function () {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      sweep();
    });
  }).observe(document.documentElement, { childList: true, subtree: true });

  enforce();
})();
