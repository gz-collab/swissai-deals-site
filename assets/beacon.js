/* Privacy-friendly beacon: no cookies, no localStorage, nothing stored client-side.
   Sends {s: slug, e: event, p?: pct, src?, v?, l?: page language de|en} as text/plain JSON to the Worker /event. Disabled when beacon_endpoint is empty.
   src = mail id from ?e=E1|E2|E3, v = subject-test variant from ?v=A|B|C (both come from the link in the email).
   Events: view (page_view), engaged (first scroll/click/key/touch: separates people from mail scanners), details_view, click_assess*,
   video_play, video_pct (25/50/75/100 via Bunny's player.js protocol). */
(function () {
  var cfg = window.__LANDING__ || {};
  if (!cfg.beacon) return;
  var qs = new URLSearchParams(location.search);
  var src = (qs.get("e") || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 8);
  var variant = (qs.get("v") || "").replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase();
  function send(ev, pct) {
    var o = { s: cfg.slug, e: ev, t: Math.floor(Date.now() / 60000), src: src, v: variant, l: cfg.lang || "" };
    if (pct) o.p = pct;
    var body = JSON.stringify(o);
    try {
      if (navigator.sendBeacon) navigator.sendBeacon(cfg.beacon, new Blob([body], { type: "text/plain" }));
      else fetch(cfg.beacon, { method: "POST", body: body, keepalive: true, mode: "cors", headers: { "Content-Type": "text/plain" } });
    } catch (e) {}
  }
  send(cfg.first || "view");
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-beacon]");
    if (el) send(el.getAttribute("data-beacon"));
  });
  window.__beacon = send;

  // "engaged": one event on the first sign of a human (pointer, scroll, key, touch). Mail scanners that render the page never do this.
  var engaged = false;
  function engage() {
    if (engaged) return;
    engaged = true;
    ["pointerdown", "mousemove", "scroll", "keydown", "touchstart", "wheel"].forEach(function (n) { window.removeEventListener(n, engage, true); });
    send("engaged");
  }
  ["pointerdown", "mousemove", "scroll", "keydown", "touchstart", "wheel"].forEach(function (n) { window.addEventListener(n, engage, { capture: true, passive: true }); });

  // Video events from the Bunny iframe (player.js protocol). Each milestone is sent once per page load.
  var frame = document.getElementById("player");
  if (frame) {
    var played = false, seen = {};
    function listen(name) {
      try { frame.contentWindow.postMessage(JSON.stringify({ context: "player.js", version: "0.0.11", method: "addEventListener", value: name }), "*"); } catch (e) {}
    }
    function subscribe() { ["play", "timeupdate", "ended"].forEach(listen); }
    frame.addEventListener("load", subscribe);
    window.addEventListener("message", function (m) {
      if (!frame.contentWindow || m.source !== frame.contentWindow) return;
      var d = m.data;
      if (typeof d === "string") { try { d = JSON.parse(d); } catch (e) { return; } }
      if (!d || d.context !== "player.js") return;
      if (d.event === "ready") return subscribe();
      if (d.event === "play" && !played) { played = true; send("video_play"); }
      if (d.event === "ended" && !seen[100]) { seen[100] = 1; send("video_pct", 100); }
      if (d.event === "timeupdate" && d.value && d.value.duration > 0) {
        var pct = (d.value.seconds / d.value.duration) * 100;
        [25, 50, 75].forEach(function (p) { if (pct >= p && !seen[p]) { seen[p] = 1; send("video_pct", p); } });
      }
    });
  }
})();
