/* Handles both forms: simple lead form (data-form=simple -> Worker /lead) and extensive discovery form
   (data-form=details -> Worker /details, token read from ?t= in the URL). No cookies / storage.
   The Worker counts form_submit / details_submit itself, so no client beacon is sent here. */
(function () {
  var f = document.querySelector("form[data-form]");
  if (!f) return;
  var kind = f.getAttribute("data-form");
  var st = document.getElementById("form-status");
  if (kind === "details") {
    var tok = new URLSearchParams(location.search).get("t") || "";
    document.getElementById("f-token").value = tok;
    if (!tok) document.getElementById("token-note").hidden = false;
  }
  if (kind !== "details") { // subject-test variant from the email link (?v=A|B|C) travels with the lead for attribution
    var v = (new URLSearchParams(location.search).get("v") || "").replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase();
    if (v) { var hv = document.createElement("input"); hv.type = "hidden"; hv.name = "variant"; hv.value = v; f.appendChild(hv); }
  }
  var LAND = window.__LANDING__ || {}, M = LAND.msg || {};
  function m(key, fallback) { return M[key] || fallback; } // texts come from the page (German or English); English fallbacks keep old pages working
  function fail(msg) { st.className = "err"; st.textContent = msg; }
  f.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var ep = f.getAttribute("action") || "";
    if (!/^https?:\/\//.test(ep)) return fail(m("not_connected", "The form is not connected yet (test build)."));
    if (f.querySelector('[name="website"]').value) return; // honeypot
    var btn = f.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    st.className = ""; st.textContent = m("sending", "Sending...");
    fetch(ep, { method: "POST", body: new FormData(f), headers: { Accept: "application/json" } })
      .then(function (r) {
        if (r.ok) {
          f.reset(); st.className = "ok";
          st.textContent = kind === "details"
            ? m("ok_details", "Thank you. We have received your answers and just sent you an email with a link to book your free call.")
            : m("ok_simple", "Thank you. Please check your inbox: we have sent you a link to a short questionnaire.");
          return;
        }
        if (btn) btn.disabled = false;
        if (r.status === 429) return fail(m("429", "Too many attempts. Please try again in a while or email gregor@swiss.ai."));
        if (r.status === 401 || r.status === 403) {
          return fail(kind === "details"
            ? m("401_details", "This link is invalid or has expired. Please request a new one on your page, or email gregor@swiss.ai.")
            : m("401_simple", "Sorry, this request was not accepted. Please email gregor@swiss.ai."));
        }
        if (r.status === 400 || r.status === 422) return fail(m("400", "Please check the required fields and the consent box."));
        fail(m("fail", "Sorry, sending failed. Please email gregor@swiss.ai."));
      })
      .catch(function () { if (btn) btn.disabled = false; fail(m("fail", "Sorry, sending failed. Please email gregor@swiss.ai.")); });
  });
})();
