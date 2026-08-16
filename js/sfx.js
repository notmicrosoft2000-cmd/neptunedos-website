(function () {
  var ctx = null;

  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === "suspended") { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  function tone(freq, dur, type, vol, when) {
    var a = ac();
    if (!a) return;
    var t0 = a.currentTime + (when || 0);
    var o = a.createOscillator();
    var g = a.createGain();
    o.type = type || "square";
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(vol || 0.05, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(a.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  window.DOSSND = {
    boot: function () {
      var seq = [[880, 0.09, 0], [0, 0.09, 0.11], [880, 0.09, 0.22], [660, 0.14, 0.34], [0, 0.1, 0.5], [440, 0.28, 0.62]];
      seq.forEach(function (s) { if (s[0]) tone(s[0], s[1], "square", 0.05, s[2]); });
    },
    key: function () { tone(2400, 0.012, "square", 0.012); },
    enter: function () { tone(520, 0.05, "square", 0.04); },
    ok: function () { tone(980, 0.06, "square", 0.04); tone(1310, 0.09, "square", 0.03, 0.07); },
    err: function () { tone(140, 0.22, "square", 0.07); },
    theme: function () { tone(660, 0.06, "square", 0.04); tone(990, 0.08, "square", 0.03, 0.06); },
    click: function () { tone(760, 0.04, "square", 0.03); }
  };

  window.SFX_CONFIG = {
    hover: { f: 2100, d: 0.016, t: "square", v: 0.01 },
    click: { f: 760, d: 0.04, t: "square", v: 0.03 }
  };

  var cfg = window.SFX_CONFIG || {};
  var on = { hover: true, click: true };

  function play(kind) {
    if (!on[kind]) return;
    var s = cfg[kind];
    if (!s) return;
    tone(s.f, s.d, s.t, s.v);
  }

  document.addEventListener("mouseover", function (e) {
    if (e.target.closest("a, button, .hl, .theme-btn, .dlitem, #termInput")) play("hover");
  }, true);
  document.addEventListener("pointerdown", function (e) {
    if (e.target.closest("a, button, .theme-btn, .dlitem")) play("click");
  }, true);
})();
