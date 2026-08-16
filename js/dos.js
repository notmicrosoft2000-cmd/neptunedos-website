(function () {
  "use strict";

  var $boot = document.getElementById("boot");
  var $bootOut = document.getElementById("bootOut");
  var $screen = document.getElementById("screen");
  var $term = document.getElementById("term");
  var $termOut = document.getElementById("termOut");
  var $termInput = document.getElementById("termInput");
  var $termPrompt = document.getElementById("termPrompt");

  var PROMPT = "C:\\NEPTUNE32>";
  var VER = "NEPTUNE-DOS version 13.02";

  var history = [];
  var hIndex = -1;

  var THEMES = {
    blue: "CLASSIC ROYAL SETUP BLUE",
    green: "RETRO CRT TERMINAL",
    amber: "VINTAGE PHOSPHOR",
    mono: "HIGH-CONTRAST MONOCHROME"
  };

  /* ---------------- BOOT ---------------- */

  var bootLines = [
    "AMIBIOS (C) 1996 Neptune Systems",
    "NEPTUNE32 BIOS v2.4 - Copyright (C) Neptune Productions",
    "CPU : 80486DX2 @ 66MHz             Memory Test : 65536K OK",
    "",
    "Detecting IDE drives... C: 4096 MB [NEPTUNE32]",
    "",
    "Starting MS-DOS...",
    "",
    "Microsoft(R) MS-DOS(R) Version 6.22",
    "        (C)Copyright Microsoft Corp 1981-1994",
    "",
    PROMPT + "neptunedos",
    "Loading NEPTUNE-DOS 13.02... OK",
    "Mounting sandbox C:\\NEPTUNE32... OK",
    "Enabling theme engine... OK"
  ];

  function revealScreen() {
    if (window.DOSSND) window.DOSSND.boot();
    $boot.classList.add("fadeout");
    setTimeout(function () {
      $boot.remove();
      $screen.classList.remove("hidden");
      $termInput.focus();
      setTimeout(function () {
        $screen.scrollIntoView({ behavior: "smooth", block: "start" });
        printLine("Welcome to NEPTUNE-DOS 13.02. This whole site is the OS.");
        printLine('Type <span class="c-hl">HELP</span> for commands. Try <span class="c-hl">THEME AMBER</span>.');
        printLine("");
      }, 250);
    }, 480);
  }

  var bootDone = false;
  function runBoot() {
    var i = 0;
    function next() {
      if (bootDone) return;
      if (i >= bootLines.length) { bootDone = true; revealScreen(); return; }
      $bootOut.textContent += bootLines[i] + "\n";
      i++;
      setTimeout(next, 130);
    }
    next();
  }
  function skipBoot() {
    if (bootDone) return;
    bootDone = true;
    $bootOut.textContent = bootLines.join("\n") + "\n";
    revealScreen();
  }
  document.addEventListener("pointerdown", function (e) { if (!bootDone) skipBoot(); });
  document.addEventListener("keydown", function (e) { if (!bootDone) skipBoot(); });

  /* ---------------- TERMINAL ---------------- */

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function printLine(html) {
    $termOut.innerHTML += html + "\n";
    $term.scrollTop = $term.scrollHeight;
  }
  function printOut() {
    var args = Array.prototype.slice.call(arguments);
    for (var i = 0; i < args.length; i++) printLine(args[i]);
  }

  function goSection(id) {
    var el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      $termInput.focus();
    }
  }

  function doTheme(name) {
    var n = String(name || "").toLowerCase();
    if (!n) {
      printOut(" Current theme: " + document.body.getAttribute("data-theme").toUpperCase());
      printLine(" Usage: THEME BLUE | GREEN | AMBER | MONO");
      return;
    }
    if (!THEMES[n]) {
      printOut('<span class="c-hl2">Invalid theme "' + esc(name) + '".</span>');
      printLine(" Valid themes: BLUE, GREEN, AMBER, MONO");
      if (window.DOSSND) window.DOSSND.err();
      return;
    }
    document.body.setAttribute("data-theme", n);
    printOut('Theme set to <span class="c-hl2">' + n.toUpperCase() + "</span> - " + THEMES[n]);
    printLine("The whole screen just repainted. That's the theme engine.");
    if (window.DOSSND) window.DOSSND.theme();
  }

  function scrollMap() {
    return {
      about: "about", commands: "commands", themes: "themes", run: "run",
      download: "download", releases: "download", helpsec: "commands"
    };
  }

  var COMMANDS = [
    ["ABOUT", "scroll to the ABOUT screen (site file ABOUT.SYS)"],
    ["ATTRIB <file>", "file attributes. files have feelings."],
    ["CALC <expr>", "compute arithmetic (e.g. CALC 2+2)"],
    ["CHKDSK / SCANDISK", "narrate a disk that isn't real"],
    ["CLS", "clear the console"],
    ["COMMANDS", "scroll to the command list"],
    ["CURSE", "be cursed in the name of NeptuneDOS"],
    ["DATE / TIME", "current date and time"],
    ["DIR", "list the site files"],
    ["DOWNLOAD", "scroll to the release section"],
    ["ECHO", "repeat after me"],
    ["EXIT", "try it. see what happens."],
    ["FIND <text>", "count every occurrence of <text> on this page"],
    ["FORMAT C:", "attempt a very bad idea"],
    ["HELLO / HI", "politeness support"],
    ["HELP", "this list"],
    ["MEM", "memory report"],
    ["MIMIC", "pretend to be MS-DOS"],
    ["NEVER", "do not type this"],
    ["NOTEPAD / BROWSER / OPEN", "windows that will not open"],
    ["PAUSE", "wait for a keypress"],
    ["PING", "ping an address"],
    ["PROMPT", "show the current prompt string"],
    ["RESTART", "reboot the whole OS (really reloads the page)"],
    ["RUN", "scroll to the run instructions"],
    ["SYS / THISPC / WHOAMI", "system identity crisis"],
    ["THEME [BLUE|GREEN|AMBER|MONO]", "switch the colour of this screen live"],
    ["TREE [/F]", "map the NEPTUNE32 folder tree"],
    ["TYPE <file>", "open a site file (e.g. TYPE ABOUT)"],
    ["VER", "version"],
    ["VIRUS", "a scan with an opinion"],
    ["VOL", "volume info"],
    ["WHY", "the big question"],
    ["WIN / NORTON", "the TUI file manager (not available here)"]
  ];

  function run(cmdRaw) {
    var line = cmdRaw.trim();
    var up = line.toUpperCase();
    var parts = line.split(/\s+/);
    var cmd = (parts[0] || "").toUpperCase();
    var arg = parts.slice(1).join(" ");
    var argUp = arg.toUpperCase();
    if (window.DOSSND) window.DOSSND.enter();

    if (!line) { printOut(""); return; }

    if (cmd === "HELP") {
      printOut("<span class='c-hl'>NeptuneDOS 13.02 - console help</span>");
      printLine("");
      COMMANDS.forEach(function (c) {
        printLine('<span class="c-hl">' + c[0] + "</span>".padEnd(34, " ") + c[1]);
      });
      return;
    }

    if (cmd === "CLS" || cmd === "CLEAR") {
      $termOut.innerHTML = "";
      return;
    }

    if (cmd === "VER") {
      printOut(" " + VER);
      printLine(" (C) Neptune Productions Corp. Sandbox file system inside.");
      return;
    }

    if (cmd === "THEME") { doTheme(arg); return; }

    if (cmd === "ECHO") { printOut(esc(line.slice(5))); return; }

    if (cmd === "DATE") { printOut(" Current date: " + new Date().toDateString().toUpperCase()); return; }
    if (cmd === "TIME") {
      printOut(" Current time: " + new Date().toTimeString().slice(0, 8) + "." + String(new Date().getMilliseconds()).padStart(3, "0"));
      return;
    }

    if (cmd === "MEM") {
      printOut(" Conventional memory :   640K   <span class='c-hl'>OK</span>");
      printLine(" NEPTUNE32 sandbox    : 65536K   <span class='c-hl'>ALLOCATED</span>");
      printLine(" Real RAM used        :    0K   <span class='c-dim'>this is a website</span>");
      return;
    }

    if (cmd === "VOL") {
      printOut(" Volume in drive C has no label");
      printLine(" Volume Serial Number is 4226-0614");
      return;
    }

    if (cmd === "DIR") {
      printOut(" Volume in drive C has no label");
      printLine(" Volume Serial Number is 4226-0614");
      printLine(" Directory of C:\\NEPTUNE32");
      printLine("");
      [
        ["ABOUT", "SYS", "TYPE ABOUT"],
        ["COMMANDS", "DAT", "TYPE COMMANDS"],
        ["THEMES", "TXT", "TYPE THEMES"],
        ["RUN", "BAT", "TYPE RUN"],
        ["DOWNLOAD", "EXE", "TYPE DOWNLOAD"],
        ["HELP", "TXT", "TYPE HELP"]
      ].forEach(function (f) {
        printLine(" " + f[0].padEnd(10, " ") + f[1].padEnd(4, " ") + "  [ " + f[2] + " ]");
      });
      printLine("");
      printLine("        6 file(s)          1981 bytes");
      return;
    }

    var map = scrollMap();
    if (cmd === "TYPE" || (cmd === "CD" && argUp)) {
      var target = (argUp || cmd).toLowerCase();
      if (target === "ABOUT") {
        printOut(" Opening ABOUT.SYS...");
        goSection("about");
      } else if (target === "COMMANDS") {
        printOut(" Opening COMMANDS.DAT...");
        goSection("commands");
      } else if (target === "THEMES") {
        printOut(" Opening THEMES.TXT...");
        goSection("themes");
      } else if (target === "RUN") {
        printOut(" Opening RUN.BAT...");
        goSection("run");
      } else if (target === "DOWNLOAD") {
        printOut(" Opening DOWNLOAD.EXE...");
        goSection("download");
      } else {
        printOut('<span class="c-hl2">File not found - ' + esc(argUp) + "</span>");
        if (window.DOSSND) window.DOSSND.err();
      }
      return;
    }

    if (map[cmd.toLowerCase()]) {
      printOut(" Opening " + cmd + " section...");
      goSection(map[cmd.toLowerCase()]);
      return;
    }

    if (cmd === "CHKDSK" || cmd === "SCANDISK") {
      printOut(" NEPTUNE32 volume scan");
      printLine("  65,536,000 bytes total space");
      printLine("  59,972,000 bytes free");
      printLine("  3,412 bytes in 14 hidden files (you cannot hide from NeptuneDOS)");
      printLine(" Checking cross-linked files... <span class='c-hl'>NONE</span>");
      printLine(" Checking for lost clusters... <span class='c-hl'>NONE</span>");
      printLine(" Volume is <span class='c-hl'>OK</span>. It was always going to be.");
      return;
    }

    if (cmd === "PING") {
      var host = esc(arg || "neptunedos.local");
      printOut(" Pinging " + host + " with 32 bytes of data:");
      printLine(" Reply from " + host + ": bytes=32 time=1ms TTL=1981");
      printLine(" Reply from " + host + ": bytes=32 time=1ms TTL=1981");
      printLine(" Reply from " + host + ": bytes=32 time=1ms TTL=1981");
      printLine(" Reply from " + host + ": bytes=32 time=1ms TTL=1981");
      printLine(" Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),");
      printLine(" Round Trip: minimum = 0ms, maximum = 1ms, average = 0ms");
      return;
    }

    if (cmd === "CURSE") {
      printOut("<span class='c-hl2'>[+] You have been cursed in the name of NeptuneDOS.</span>");
      printLine(" The curse: every blue screen you ever saw, in hindsight, was blue by choice.");
      if (window.DOSSND) window.DOSSND.err();
      return;
    }

    if (cmd === "VIRUS") {
      printOut(" Scanning 65,536,000 bytes of NEPTUNE32...");
      printLine(" Found 1 virus: <span class='c-hl2'>the antivirus</span>");
      printLine(" Removing... <span class='c-hl'>Done.</span> You're welcome.");
      if (window.DOSSND) window.DOSSND.ok();
      return;
    }

    if (cmd === "MIMIC") {
      printOut(" Mimicking MS-DOS...");
      printLine(" Actually, we already were. This is embarrassing.");
      printLine(" It's OK. Nobody noticed.");
      return;
    }

    if (cmd === "RESTART" || cmd === "REBOOT") {
      printOut(" Rebooting NEPTUNE-DOS 13.02...");
      if (window.DOSSND) window.DOSSND.err();
      setTimeout(function () { location.reload(); }, 900);
      return;
    }

    if (cmd === "EXIT") {
      printOut("<span class='c-hl2'>You cannot leave. This is a website.</span>");
      printLine(" But you can scroll. That's freedom. Use it.");
      if (window.DOSSND) window.DOSSND.err();
      return;
    }

    if (cmd === "WIN" || cmd === "NORTON") {
      printOut(" The TUI file manager only opens inside the real shell.");
      printLine(" Here, scroll down to the COMMANDS section instead.");
      goSection("commands");
      return;
    }

    if (cmd === "TREE") {
      printOut(" Folder PATH listing for volume NEPTUNE32");
      printLine(" Volume serial number is 4226-0614");
      printLine(" C:\\NEPTUNE32");
      printLine(" ├── ABOUT.SYS");
      printLine(" ├── COMMANDS.DAT");
      printLine(" ├── THEMES.TXT");
      printLine(" ├── RUN.BAT");
      printLine(" ├── DOWNLOAD.EXE");
      printLine(" ├── SECRETS");
      printLine(" │   ├── WHY.TXT");
      printLine(" │   ├── NEVER.DAT");
      printLine(" │   └── D.TMP");
      printLine(" └── VIRUS.SYS  <span class='c-hl2'>(hidden, as always)</span>");
      return;
    }

    if (cmd === "CALC") {
      var expr = arg.replace(/[^0-9+\-*/().\s]/g, "");
      if (!expr) {
        printOut('<span class="c-hl2">Usage: CALC &lt;expression&gt;</span>');
        printLine(" e.g. CALC (6*7)-2");
        if (window.DOSSND) window.DOSSND.err();
        return;
      }
      try {
        var res = Function("return (" + expr.replace(/\^/g, "**") + ")")();
        if (typeof res === "number" && isFinite(res)) {
          printOut(" " + expr.replace(/\^/g, "^") + " = <span class='c-hl'>" + Math.round(res * 10000) / 10000 + "</span>");
        } else {
          throw new Error("nan");
        }
      } catch (e) {
        printOut('<span class="c-hl2">Syntax error. This is a 66 MHz CPU, not a calculator.</span>');
        if (window.DOSSND) window.DOSSND.err();
      }
      return;
    }

    if (cmd === "SYS" || cmd === "THISPC" || cmd === "WHOAMI") {
      printOut(" System: NEPTUNE-DOS 13.02 (a website)");
      printLine(" Hostname: NEPTUNE32");
      printLine(" Processor: 80486DX2 @ 66 MHz (pretend)");
      printLine(" RAM: 65,536K (65536K of which is imaginary)");
      printLine(" User: <span class='c-hl'>root of all problems</span>");
      printLine(" Graphics: CGA 640x480, 16 colours, 16 regrets");
      return;
    }

    if (cmd === "PROMPT") {
      printOut(" Prompt is: <span class='c-hl'>" + PROMPT + "</span>");
      printLine(" It will not change. It is emotionally attached.");
      return;
    }

    if (cmd === "PAUSE") {
      printOut(" Press any key to continue...");
      var donePause = function () {
        document.removeEventListener("keydown", donePause);
        printLine(" <span class='c-dim'>thank you. the system is calm again.</span>");
      };
      document.addEventListener("keydown", donePause);
      return;
    }

    if (cmd === "FORMAT") {
      printOut('<span class="c-hl2">Refusing to format C:.</span>');
      printLine(" This disk contains 3,412 hidden files of pure effort.");
      printLine(" Try <span class='c-hl'>CURSE</span> instead. It hurts less.");
      if (window.DOSSND) window.DOSSND.err();
      return;
    }

    if (cmd === "ATTRIB") {
      printOut(" Attributes for " + (esc(arg || "NEPTUNE32")) + ":");
      printLine("  Archive  = ON");
      printLine("  Read-Only= OFF");
      printLine("  System   = ALWAYS (the whole OS is a system file)");
      printLine("  Hidden   = <span class='c-hl'>you are the hidden file</span>");
      return;
    }

    if (cmd === "FIND") {
      var needle = arg.toLowerCase();
      if (!needle) {
        printOut('<span class="c-hl2">Usage: FIND &lt;text&gt;</span>');
        return;
      }
      var hay = (document.body ? document.body.innerText : "").toLowerCase();
      var n = hay.split(needle).length - 1;
      printOut(" Searching this page for \"" + esc(arg) + "\"...");
      printLine(" Found <span class='c-hl'>" + n + "</span> occurrence(s). It's all <span class='c-dim'>somewhere</span>.");
      return;
    }

    if (cmd === "NOTEPAD" || cmd === "BROWSER" || cmd === "OPEN" || cmd === "WEB" || cmd === "CONTROL" || cmd === "RUN") {
      printOut(" Opening " + cmd + "...");
      printLine(" <span class='c-dim'>Nothing happened. This is a text interface. The window refused.</span>");
      printLine(" Try scrolling. The whole page is your window.");
      return;
    }

    if (cmd === "D" || cmd === "C:") {
      printOut(" You switched to drive " + esc(cmd) + ".");
      printLine(" There is no other drive. There never was.");
      printLine(" The drive is inside you.");
      return;
    }

    if (cmd === "HELLO" || cmd === "HI") {
      printOut(" Hello. You typed \"" + esc(cmd) + "\" to an operating system.");
      printLine(" It is politely ignoring the existential weight of that.");
      return;
    }

    if (cmd === "WHY") {
      printOut(" Because it was 1981 and nobody had thought of anything better yet.");
      printLine(" <span class='c-dim'>(this is not actually why. this is a website from 2026 pretending.)</span>");
      return;
    }

    if (cmd === "NEVER") {
      printOut(" You were told not to type this.");
      printLine(" The good news: nothing happened. That's the point. It never does.");
      return;
    }

    if (cmd === "ABOUT" || cmd === "HELP" || cmd === "CD" || cmd === "DIR") {
      printOut(" Bad command or file name");
      if (window.DOSSND) window.DOSSND.err();
      return;
    }

    printOut('<span class="c-hl2">Bad command or file name</span>');
    printLine(" Type <span class='c-hl'>HELP</span> for the command list.");
    if (window.DOSSND) window.DOSSND.err();
  }

  function submit() {
    var v = $termInput.value;
    if (!v) { run(""); return; }
    history.unshift(v);
    hIndex = -1;
    printLine('<span class="c-hl">' + esc(PROMPT) + "</span> " + esc(v));
    $termInput.value = "";
    run(v);
  }

  $termInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length) {
        hIndex = Math.min(hIndex + 1, history.length - 1);
        $termInput.value = history[hIndex];
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      hIndex = Math.max(hIndex - 1, -1);
      $termInput.value = hIndex >= 0 ? history[hIndex] : "";
      return;
    }
    if (e.key.length === 1 && window.DOSSND) window.DOSSND.key();
  });

  $term.addEventListener("pointerdown", function () {
    $termInput.focus();
  });

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".theme-btn");
    if (btn) doTheme(btn.getAttribute("data-theme"));
  });

  document.addEventListener("pointerdown", function (e) {
    var l = e.target.closest("[data-nav]");
    if (l && window.DOSSND) window.DOSSND.click();
  });

  if (window.SFX_CONFIG) {
    window.SFX_CONFIG = { hover: { f: 2100, d: 0.016, t: "square", v: 0.01 }, click: { f: 760, d: 0.04, t: "square", v: 0.03 } };
  }

  /* ---------------- LIVE CLOCK + TICKER + REVEAL ---------------- */

  var dosClock = document.getElementById("dosClock");
  if (dosClock) {
    function tickClock() {
      var d = new Date();
      dosClock.textContent =
        String(d.getHours()).padStart(2, "0") + ":" +
        String(d.getMinutes()).padStart(2, "0") + ":" +
        String(d.getSeconds()).padStart(2, "0");
    }
    tickClock();
    setInterval(tickClock, 1000);
  }

  var dosTicker = document.getElementById("dosTicker");
  if (dosTicker) {
    var TICKER = [
      "checking for a reason to exist...",
      "cpu: pretending at 66 MHz",
      "ram: 65536K of imagination",
      "BIOS: still looking for the good one",
      "disk C: holding. barely.",
      "theme engine: idling, judging you",
      "neptune32: always watching",
      "volume serial 4226-0614",
      "you are the hidden file"
    ];
    var ti = 0;
    setInterval(function () {
      ti = (ti + 1) % TICKER.length;
      dosTicker.textContent = TICKER[ti];
    }, 4600);
  }

  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        revealIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(function (el, i) {
    el.style.setProperty("--d", String((i % 4) * 0.08) + "s");
    revealIO.observe(el);
  });

  runBoot();
})();
