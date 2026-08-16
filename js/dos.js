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
    "Mounting persistent sandbox C:\\NEPTUNE32... OK",
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
        printLine('The sandbox persists. Try <span class="c-hl">EDIT NOTES.TXT</span> and it will survive a reload.');
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

  /* ---------------- SANDBOX FILESYSTEM (persistent) ---------------- */

  var SAVE_KEY = "neptune_sandbox_v1";

  function sandboxDefaults() {
    var files = {};
    var dirs = { "/NEPTUNE32": true, "/NEPTUNE32/SECRETS": true };
    files["/NEPTUNE32/ABOUT.SYS"] = [
      "NEPTUNE-DOS 13.02 - an operating system that never left 1981.",
      "",
      "Everything lives inside NEPTUNE32, a contained folder tree that",
      "pretends to be dangerous without ever touching a real file.",
      "",
      "THEME AMBER swaps every colour instantly. WIN or NORTON drop you",
      "into a two-pane text interface. EDIT opens a real in-terminal editor.",
      "CHKDSK narrates a disk. With complete sincerity.",
      "",
      "Volume serial 4226-0614. Not actually 1981."
    ].join("\n");
    files["/NEPTUNE32/COMMANDS.DAT"] = "Type HELP at the prompt. 40+ commands, including EDIT, which is real.";
    files["/NEPTUNE32/THEMES.TXT"] = [
      "BLUE  - CLASSIC ROYAL SETUP BLUE",
      "GREEN - RETRO CRT TERMINAL",
      "AMBER - VINTAGE PHOSPHOR",
      "MONO  - HIGH-CONTRAST MONOCHROME",
      "",
      "Usage: THEME <name>"
    ].join("\n");
    files["/NEPTUNE32/RUN.BAT"] = "python NeptuneDOS_13_2.py";
    files["/NEPTUNE32/DOWNLOAD.EXE"] = "Not a real executable. Obviously.\nReal builds live in the DOWNLOAD section of this page.";
    files["/NEPTUNE32/HELP.TXT"] = [
      "Type HELP for the command list.",
      "Try: DIR, TYPE ABOUT, EDIT NOTES.TXT, THEME AMBER, SCREENSAVER.",
      "The sandbox is persistent. It remembers you."
    ].join("\n");
    files["/NEPTUNE32/SECRETS/WHY.TXT"] = "Because it was 1981 and nobody had thought of anything better yet.";
    files["/NEPTUNE32/SECRETS/NEVER.DAT"] = "You were told not to type this.";
    files["/NEPTUNE32/SECRETS/D.TMP"] = "There is no other drive. There never was.";
    files["/NEPTUNE32/SECRETS/CONFESSIONS.TXT"] = "I once told EDIT to save and it saved. I was not ready for that kind of commitment.";
    files["/NEPTUNE32/VIRUS.SYS"] = "The antivirus.";
    return { cwd: "/NEPTUNE32", files: files, dirs: dirs };
  }

  var HIDDEN = {
    "/NEPTUNE32/VIRUS.SYS": true,
    "/NEPTUNE32/SECRETS/CONFESSIONS.TXT": true
  };

  function sandboxLoad() {
    try {
      var raw = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (raw && raw.files && typeof raw.files === "object") {
        raw.cwd = raw.cwd || "/NEPTUNE32";
        raw.dirs = raw.dirs || { "/NEPTUNE32": true };
        return raw;
      }
    } catch (e) {}
    return sandboxDefaults();
  }

  var sb = sandboxLoad();
  var edlin = null;

  function sandboxSave() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(sb)); } catch (e) {}
  }

  function fmtPath(p) { return p.replace(/\//g, "\\"); }

  function fsResolve(p) {
    var s = String(p == null ? "" : p).trim().replace(/\\/g, "/");
    if (!s) return sb.cwd;
    if (s === "/") return "/NEPTUNE32";
    if (/^[A-Za-z]:/.test(s)) s = s.slice(2);
    var parts = (s.charAt(0) === "/" ? "" : sb.cwd) + "/" + s;
    var out = [];
    parts.split("/").forEach(function (seg) {
      if (!seg || seg === ".") return;
      if (seg === "..") { if (out.length > 1) out.pop(); return; }
      out.push(seg);
    });
    return "/" + out.join("/");
  }

  function fsName(p) { return p.slice(p.lastIndexOf("/") + 1); }
  function fsParent(p) { return p.slice(0, p.lastIndexOf("/")) || "/"; }
  function fsDir(p) { return !!sb.dirs[p]; }
  function fsInSandbox(p) { return p === "/NEPTUNE32" || p.indexOf("/NEPTUNE32/") === 0; }

  function fsList(dir) {
    var entries = [];
    Object.keys(sb.files).forEach(function (p) {
      if (fsParent(p) === dir) entries.push({ name: fsName(p), path: p, size: (sb.files[p] || "").length, hidden: !!HIDDEN[p] });
    });
    Object.keys(sb.dirs).forEach(function (p) {
      if (p !== "/NEPTUNE32" && fsParent(p) === dir) entries.push({ name: fsName(p), path: p, isDir: true, hidden: false });
    });
    entries.sort(function (a, b) {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      var na = a.name.toLowerCase(), nb = b.name.toLowerCase();
      return na < nb ? -1 : na > nb ? 1 : 0;
    });
    return entries;
  }

  function refreshPrompt() {
    if ($termPrompt) $termPrompt.textContent = fmtPath(sb.cwd) + ">";
  }

  function startEdit(path) {
    var existing = sb.files[path];
    edlin = { file: path, buf: existing !== undefined ? existing.split("\n") : [], dirty: false };
    printOut(" Editing " + fmtPath(path) + " - EDLIN mode.");
    printLine(" Type lines. <span class='c-hl'>SAVE</span> writes the file, <span class='c-hl'>CANCEL</span> abandons it.");
    printLine("");
    printLine("---");
    edlin.buf.forEach(function (l, i) { printLine(" " + String(i + 1).padStart(3, " ") + ": " + esc(l)); });
    printLine("---");
  }

  function edlinLine(v) {
    var up = v.trim().toUpperCase();
    if (up === "SAVE") {
      var content = edlin.buf.join("\n");
      sb.files[edlin.file] = content;
      sandboxSave();
      printLine(" File written: " + fmtPath(edlin.file) + " (" + content.length + " bytes).");
      printLine(" It will survive a reload. The disk does not forget.");
      if (window.DOSSND) window.DOSSND.ok();
      edlin = null;
      return;
    }
    if (up === "CANCEL" || up === "ABORT") {
      printLine(" Changes abandoned. The disk shrugs.");
      edlin = null;
      return;
    }
    if (up === "LIST" || up === "L") {
      edlin.buf.forEach(function (l, i) { printLine(" " + String(i + 1).padStart(3, " ") + ": " + esc(l)); });
      return;
    }
    edlin.buf.push(v);
    printLine(" " + String(edlin.buf.length).padStart(3, " ") + ": " + esc(v));
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
    ["CD [path]", "wander the sandbox. CD.. goes home. CD\\ too."],
    ["CHKDSK / SCANDISK", "audit your persistent sandbox (for real)"],
    ["CLS", "clear the console"],
    ["COMMANDS", "scroll to the command list"],
    ["COPY <src> <dst>", "copy a file inside the sandbox"],
    ["CURSE", "be cursed in the name of NeptuneDOS"],
    ["DATE / TIME", "current date and time"],
    ["DEL <file>", "delete a file (DEL *.TXT works)"],
    ["DIR [/A]", "list the sandbox files (real, persistent)"],
    ["DOWNLOAD", "scroll to the release section"],
    ["ECHO", "repeat after me"],
    ["EDIT <file>", "the real in-terminal editor. SAVE writes forever"],
    ["ERASE", "DEL, but with a meaner face"],
    ["EXIT", "try it. see what happens."],
    ["FIND <text>", "count every occurrence of <text> on this page"],
    ["FORMAT C: /Y", "wipe the sandbox back to factory"],
    ["HELLO / HI", "politeness support"],
    ["HELP", "this list"],
    ["MD <dir> / RD <dir>", "make and remove directories"],
    ["MEM", "memory report"],
    ["MIMIC", "pretend to be MS-DOS"],
    ["NEVER", "do not type this"],
    ["NOTEPAD / BROWSER / OPEN", "windows that will not open"],
    ["PAUSE", "wait for a keypress"],
    ["PING", "ping an address"],
    ["PROMPT", "show the current prompt string"],
    ["REN <old> <new>", "rename a file"],
    ["RESTART", "reboot the whole OS (really reloads the page)"],
    ["RUN", "scroll to the run instructions"],
    ["SCREENSAVER", "the system naps. press a key to wake it"],
    ["SYS / THISPC / WHOAMI", "system identity crisis"],
    ["THEME [BLUE|GREEN|AMBER|MONO]", "switch the colour of this screen live"],
    ["TREE [/F]", "map your live NEPTUNE32 folder tree"],
    ["TYPE <file>", "print any sandbox file (e.g. TYPE ABOUT)"],
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
      var sbBytes = 0;
      try { sbBytes = (localStorage.getItem(SAVE_KEY) || "").length; } catch (e) {}
      printOut(" Conventional memory :   640K   <span class='c-hl'>OK</span>");
      printLine(" NEPTUNE32 sandbox    : 65536K   <span class='c-hl'>ALLOCATED</span>");
      printLine(" Sandbox saved on disk: " + String(sbBytes).padStart(5, " ") + " bytes <span class='c-dim'>(it remembers)</span>");
      printLine(" Real RAM used        :    0K   <span class='c-dim'>this is a website</span>");
      return;
    }

    if (cmd === "VOL") {
      printOut(" Volume in drive C has no label");
      printLine(" Volume Serial Number is 4226-0614");
      return;
    }

    if (cmd === "DIR") {
      var showAll = argUp.indexOf("/A") !== -1;
      var dirPath = fsResolve(arg.replace(/\/A/gi, ""));
      if (!fsDir(dirPath)) {
        printOut('<span class="c-hl2">Invalid directory - ' + esc(arg || fmtPath(sb.cwd)) + "</span>");
        if (window.DOSSND) window.DOSSND.err();
        return;
      }
      printOut(" Volume in drive C has no label");
      printLine(" Volume Serial Number is 4226-0614");
      printLine(" Directory of " + fmtPath(dirPath));
      printLine("");
      var entries = fsList(dirPath).filter(function (e) { return showAll || !e.hidden; });
      if (!entries.length) printLine(" <span class='c-dim'>- empty -</span>");
      var total = 0;
      var count = 0;
      entries.forEach(function (e) {
        if (e.isDir) {
          printLine(" " + e.name.padEnd(11, " ") + "<DIR>          [ CD " + e.name + " ]");
        } else {
          total += e.size;
          count++;
          var dot = e.name.lastIndexOf(".");
          var base = dot !== -1 ? e.name.slice(0, dot) : e.name;
          var ext = dot !== -1 ? e.name.slice(dot + 1) : "";
          printLine(" " + base.padEnd(9, " ") + " " + ext.padEnd(3, " ") + " " + String(e.size).padStart(10, " ") + "  [ TYPE " + e.name + " ]");
        }
      });
      printLine("");
      printLine("        " + count + " file(s)          " + total + " bytes");
      if (!showAll) printLine(" <span class='c-dim'>DIR /A shows hidden files. You know what you did.</span>");
      return;
    }

    if (cmd === "CD") {
      if (!arg) {
        printOut(" " + fmtPath(sb.cwd));
        return;
      }
      var cdPath = fsResolve(arg);
      if (!fsInSandbox(cdPath)) {
        printOut('<span class="c-hl2">Access denied.</span>');
        printLine(" You cannot leave NEPTUNE32. It has been trying to leave you for years.");
        if (window.DOSSND) window.DOSSND.err();
        return;
      }
      if (!fsDir(cdPath)) {
        printOut('<span class="c-hl2">Invalid directory - ' + esc(arg) + "</span>");
        if (window.DOSSND) window.DOSSND.err();
        return;
      }
      sb.cwd = cdPath;
      refreshPrompt();
      if (window.DOSSND) window.DOSSND.ok();
      printOut(" " + fmtPath(sb.cwd) + ">");
      return;
    }

    if (cmd === "TYPE") {
      if (!arg) {
        printOut('<span class="c-hl2">Usage: TYPE &lt;file&gt;</span>');
        if (window.DOSSND) window.DOSSND.err();
        return;
      }
      var tPath = fsResolve(arg);
      if (sb.files[tPath] === undefined) {
        printOut('<span class="c-hl2">File not found - ' + esc(argUp) + "</span>");
        if (window.DOSSND) window.DOSSND.err();
        return;
      }
      String(sb.files[tPath]).split("\n").forEach(function (l) { printLine(esc(l)); });
      return;
    }

    if (cmd === "EDIT") {
      if (!arg) {
        printOut('<span class="c-hl2">Usage: EDIT &lt;file&gt;</span>');
        printLine(" e.g. EDIT NOTES.TXT");
        if (window.DOSSND) window.DOSSND.err();
        return;
      }
      var ePath = fsResolve(arg);
      if (fsDir(ePath)) {
        printOut('<span class="c-hl2">Cannot edit a directory. It is not a notepad yet.</span>');
        return;
      }
      if (!fsInSandbox(ePath)) {
        printOut('<span class="c-hl2">Access denied. You cannot write outside NEPTUNE32.</span>');
        return;
      }
      var ePar = fsParent(ePath);
      if (ePar !== "/" && !fsDir(ePar)) {
        printOut('<span class="c-hl2">Directory does not exist - ' + esc(fmtPath(ePar)) + "</span>");
        return;
      }
      startEdit(ePath);
      return;
    }

    if (cmd === "COPY") {
      var cpParts = line.split(/\s+/).slice(1);
      if (cpParts.length < 2) {
        printOut('<span class="c-hl2">Usage: COPY &lt;source&gt; &lt;destination&gt;</span>');
        return;
      }
      var srcPath = fsResolve(cpParts[0]);
      if (sb.files[srcPath] === undefined) {
        printOut('<span class="c-hl2">File not found - ' + esc(cpParts[0].toUpperCase()) + "</span>");
        if (window.DOSSND) window.DOSSND.err();
        return;
      }
      var dstPath = fsResolve(cpParts.slice(1).join(" "));
      if (fsDir(dstPath)) dstPath = dstPath + "/" + fsName(srcPath);
      if (!fsInSandbox(dstPath)) { printOut('<span class="c-hl2">Access denied.</span>'); return; }
      if (fsDir(dstPath)) { printOut('<span class="c-hl2">Access denied. Destination is a directory.</span>'); return; }
      sb.files[dstPath] = sb.files[srcPath];
      sandboxSave();
      printOut(" " + cpParts[0].toUpperCase() + " copied. 1 file(s) copied.");
      return;
    }

    if (cmd === "REN" || cmd === "RENAME") {
      var rn = line.split(/\s+/).slice(1);
      if (rn.length < 2) {
        printOut('<span class="c-hl2">Usage: REN &lt;old&gt; &lt;new&gt;</span>');
        return;
      }
      var oldPath = fsResolve(rn[0]);
      if (sb.files[oldPath] === undefined) {
        printOut('<span class="c-hl2">File not found - ' + esc(rn[0].toUpperCase()) + "</span>");
        if (window.DOSSND) window.DOSSND.err();
        return;
      }
      var newName = rn.slice(1).join(" ");
      if (newName.indexOf("/") !== -1 || newName.indexOf("\\") !== -1) {
        printOut('<span class="c-hl2">Rename within a folder only. You cannot move things by lying to them.</span>');
        return;
      }
      var newPath = fsParent(oldPath) + "/" + newName;
      if (sb.files[newPath] !== undefined) { printOut('<span class="c-hl2">File already exists.</span>'); return; }
      sb.files[newPath] = sb.files[oldPath];
      delete sb.files[oldPath];
      if (HIDDEN[oldPath]) { HIDDEN[newPath] = true; delete HIDDEN[oldPath]; }
      sandboxSave();
      printOut(" " + fsName(oldPath).toUpperCase() + " renamed to " + newName.toUpperCase());
      return;
    }

    if (cmd === "DEL" || cmd === "ERASE") {
      if (!arg) {
        printOut('<span class="c-hl2">Usage: DEL &lt;file&gt;</span>');
        return;
      }
      var delPath = fsResolve(arg);
      if (sb.files[delPath] === undefined) {
        if (arg.indexOf("*") !== -1) {
          var segP = fsParent(delPath);
          var pat = fsName(delPath).toUpperCase();
          var wild = new RegExp("^" + pat.replace(/\*/g, ".*") + "$");
          var hits = Object.keys(sb.files).filter(function (p) {
            return fsParent(p) === segP && wild.test(fsName(p).toUpperCase());
          });
          if (!hits.length) {
            printOut('<span class="c-hl2">File not found - ' + esc(argUp) + "</span>");
            return;
          }
          hits.forEach(function (p) { delete sb.files[p]; });
          sandboxSave();
          printOut(" " + hits.length + " file(s) deleted. They knew the risks.");
          return;
        }
        printOut('<span class="c-hl2">File not found - ' + esc(argUp) + "</span>");
        if (window.DOSSND) window.DOSSND.err();
        return;
      }
      if (fsDir(delPath)) { printOut('<span class="c-hl2">Cannot DEL a directory. Use RD.</span>'); return; }
      delete sb.files[delPath];
      sandboxSave();
      printOut(" " + fsName(delPath).toUpperCase() + " deleted. The disk is keeping a list.");
      return;
    }

    if (cmd === "RD" || cmd === "RMDIR") {
      if (!arg) {
        printOut('<span class="c-hl2">Usage: RD &lt;directory&gt;</span>');
        return;
      }
      var rdPath = fsResolve(arg);
      if (!fsDir(rdPath)) {
        printOut('<span class="c-hl2">Directory not found.</span>');
        return;
      }
      if (rdPath === "/NEPTUNE32" || rdPath === "/") {
        printOut('<span class="c-hl2">Refusing. That is the whole reason this exists.</span>');
        return;
      }
      if (fsList(rdPath).length) {
        printOut('<span class="c-hl2">Directory not empty. The disk holds grudges.</span>');
        return;
      }
      delete sb.dirs[rdPath];
      sandboxSave();
      printOut(" Removed directory " + fmtPath(rdPath));
      return;
    }

    if (cmd === "MD" || cmd === "MKDIR") {
      if (!arg) {
        printOut('<span class="c-hl2">Usage: MD &lt;directory&gt;</span>');
        return;
      }
      var mdPath = fsResolve(arg);
      if (!fsInSandbox(mdPath)) {
        printOut('<span class="c-hl2">Access denied. NEPTUNE32 is the whole map.</span>');
        return;
      }
      if (fsDir(mdPath) || sb.files[mdPath] !== undefined) {
        printOut('<span class="c-hl2">Already exists.</span>');
        return;
      }
      var mdPar = fsParent(mdPath);
      if (mdPar !== "/" && !fsDir(mdPar)) {
        printOut('<span class="c-hl2">Parent directory does not exist.</span>');
        return;
      }
      sb.dirs[mdPath] = true;
      sandboxSave();
      printOut(" Directory created: " + fmtPath(mdPath));
      return;
    }

    if (cmd === "SCREENSAVER") {
      $termOut.innerHTML = "";
      var frames = [
        "                    NEPTUNE32 IS NAPPING",
        "        * the stars are real this time *",
        "   . . . press any key to wake it up . . ."
      ];
      var svIdx = 0;
      var svTimer = setInterval(function () {
        $termOut.innerHTML = frames[svIdx % frames.length] + "\n\n";
        $term.scrollTop = 0;
        svIdx++;
        if (svIdx >= frames.length * 4) clearInterval(svTimer);
      }, 700);
      function wake() {
        clearInterval(svTimer);
        $termOut.innerHTML = "";
        document.removeEventListener("keydown", wake);
        printLine(" The system stirs. It remembers everything.");
      }
      document.addEventListener("keydown", wake);
      return;
    }

    var map = scrollMap();
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
      var nFiles = Object.keys(sb.files).length;
      var nHidden = Object.keys(HIDDEN).length;
      var nDirs = Object.keys(sb.dirs).length;
      var totalBytes = Object.keys(sb.files).reduce(function (sum, p) { return sum + sb.files[p].length; }, 0);
      printOut(" NEPTUNE32 volume scan");
      printLine("  65,536,000 bytes total space");
      printLine("  " + String(65536000 - totalBytes).padStart(9, " ") + " bytes free");
      printLine("  " + String(nFiles).padStart(9, " ") + " file(s) in " + nDirs + " director" + (nDirs === 1 ? "y" : "ies"));
      printLine("  " + String(nHidden).padStart(9, " ") + " hidden file(s) (you cannot hide from NeptuneDOS)");
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
      function walk(d, prefix) {
        var list = fsList(d);
        list.forEach(function (e, ix) {
          var last = ix === list.length - 1;
          var mark = e.hidden ? "  <span class='c-hl2'>(hidden, as always)</span>" : "";
          printLine(" " + prefix + (last ? "└── " : "├── ") + e.name + (e.isDir ? "\\" : "") + mark);
          if (e.isDir) walk(e.path, prefix + (last ? "    " : "│   "));
        });
      }
      walk("/NEPTUNE32", "");
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
      printOut(" Prompt is: <span class='c-hl'>" + fmtPath(sb.cwd) + "></span>");
      printLine(" It follows you around. It is emotionally attached.");
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
      if (!/^C:\s*(\/Y)?$/i.test(arg.trim())) {
        printOut('<span class="c-hl2">Usage: FORMAT C: /Y</span>');
        printLine(" This disk contains hidden files of pure effort.");
        printLine(" Add /Y if you are sure. The disk will not be sure for you.");
        if (window.DOSSND) window.DOSSND.err();
        return;
      }
      if (!/\/Y/i.test(arg)) {
        printOut('<span class="c-hl2">Refusing. Add /Y to confirm.</span>');
        printLine(" Even the antivirus is frightened of FORMAT C:.");
        if (window.DOSSND) window.DOSSND.err();
        return;
      }
      printOut(" Formatting NEPTUNE32...");
      sb = sandboxDefaults();
      sandboxSave();
      refreshPrompt();
      printLine(" <span class='c-hl'>Format complete.</span> 65,536,000 bytes total.");
      printLine(" The sandbox was reset. It forgives you. Eventually.");
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

    printOut('<span class="c-hl2">Bad command or file name</span>');
    printLine(" Type <span class='c-hl'>HELP</span> for the command list.");
    if (window.DOSSND) window.DOSSND.err();
  }

  function submit() {
    var v = $termInput.value;
    if (!v) { run(""); return; }
    history.unshift(v);
    hIndex = -1;
    printLine('<span class="c-hl">' + esc(fmtPath(sb.cwd) + ">") + "</span> " + esc(v));
    $termInput.value = "";
    if (edlin) { edlinLine(v); return; }
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
