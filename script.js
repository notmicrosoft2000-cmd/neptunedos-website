// ===================================================================
// NEPTUNEDOS site interactions
// ===================================================================

/* ---------- 1. Hero boot sequence ---------- */
const bootLines = [
  "NEPTUNE-DOS version 13.02",
  "(C) 1981-2026 Neptune Productions Corporation. All Rights Reserved.",
  "",
  "Checking system integrity..............................  OK",
  "Mounting NEPTUNE32 core................................  OK",
  "Loading CONFIG.SYS......................................  OK",
  "Loading AUTOEXEC.BAT....................................  OK",
  "Initializing theme profile: BLUE........................  OK",
  "",
  "C:\\NEPTUNE32> _"
];

const heroOutput = document.getElementById("hero-terminal-output");
const heroCursor = document.getElementById("hero-cursor");
let bootTimeoutId = null;

function typeBootSequence() {
  if (!heroOutput) return;
  clearTimeout(bootTimeoutId);
  heroOutput.textContent = "";
  heroCursor.style.display = "none";

  let lineIndex = 0;
  let charIndex = 0;

  function typeNextChar() {
    if (lineIndex >= bootLines.length) {
      heroCursor.style.display = "inline";
      return;
    }
    const line = bootLines[lineIndex];

    if (charIndex < line.length) {
      heroOutput.textContent += line[charIndex];
      charIndex++;
      bootTimeoutId = setTimeout(typeNextChar, line.startsWith("C:\\") ? 45 : 8);
    } else {
      heroOutput.textContent += "\n";
      lineIndex++;
      charIndex = 0;
      bootTimeoutId = setTimeout(typeNextChar, 150);
    }
  }
  typeNextChar();
}

document.addEventListener("DOMContentLoaded", typeBootSequence);
document.getElementById("replay-boot")?.addEventListener("click", typeBootSequence);

/* ---------- 2. Command showcase ---------- */
const commands = [
  {
    label: "DIR",
    output:
`Directory track summary list of: C:\\NEPTUNE32

SYSTEM         <DIR>        06-15-2026
DRIVERS        <DIR>        06-15-2026
TEMP           <DIR>        06-15-2026
LOGS           <DIR>        06-15-2026
USERS          <DIR>        06-15-2026`
  },
  {
    label: "TREE",
    output:
`Folder PATH structure Map Tree Design Layout:
C:.
├── SYSTEM
├── DRIVERS
├── TEMP
├── LOGS
└── USERS`
  },
  {
    label: "THEME AMBER",
    output:
`[+] Display profile updated: AMBER
[+] Vintage phosphor palette now active across console.`
  },
  {
    label: "CHKDSK",
    output:
`Volume Serial Number is 4226-0614

  65,536,000 bytes total space.
  59,972,000 bytes free.`
  },
  {
    label: "MIMIC hello",
    output: `hElLo`
  },
  {
    label: "ABOUT",
    output:
`======================= ABOUT NEPTUNE PRODUCTIONS =======================
 NeptuneDOS Emulated Console Subsystem Track Platform Core Build v13.02
 (C) 1981-2026 Neptune Productions Corporation. All Rights Reserved.`
  }
];

const commandList = document.getElementById("command-list");
const commandOutput = document.getElementById("command-output");

function renderCommandList() {
  if (!commandList) return;
  commands.forEach((cmd, i) => {
    const btn = document.createElement("button");
    btn.className = "command-btn" + (i === 0 ? " active" : "");
    btn.type = "button";
    btn.setAttribute("role", "tab");
    btn.textContent = cmd.label;
    btn.addEventListener("click", () => selectCommand(i));
    commandList.appendChild(btn);
  });
  selectCommand(0, false);
}

function selectCommand(index, animate = true) {
  const buttons = commandList.querySelectorAll(".command-btn");
  buttons.forEach((b, i) => b.classList.toggle("active", i === index));

  const cmd = commands[index];
  const prefix = `C:\\NEPTUNE32>${cmd.label}\n\n`;

  if (!animate) {
    commandOutput.textContent = prefix + cmd.output;
    return;
  }

  commandOutput.textContent = "";
  const full = prefix + cmd.output;
  let i = 0;
  const step = () => {
    if (i < full.length) {
      commandOutput.textContent += full[i];
      i++;
      requestAnimationFrame(() => setTimeout(step, 3));
    }
  };
  step();
}

renderCommandList();

/* ---------- 3. Theme swatches — repaint accent colour ---------- */
const themeAccents = {
  blue:  { accent: "#1C3FFD", accentDark: "#0B1C8C" },
  green: { accent: "#2BD46A", accentDark: "#12A34C" },
  amber: { accent: "#FFB000", accentDark: "#C97E00" },
  mono:  { accent: "#2B2B2E", accentDark: "#000000" }
};

document.querySelectorAll(".swatch").forEach(swatch => {
  swatch.addEventListener("click", () => {
    const theme = swatch.dataset.theme;
    const colors = themeAccents[theme];
    if (!colors) return;
    document.documentElement.style.setProperty("--royal", colors.accent);
    document.documentElement.style.setProperty("--royal-dark", colors.accentDark);

    document.querySelectorAll(".swatch").forEach(s => s.style.outline = "none");
    swatch.style.outline = `2px solid ${colors.accent}`;
  });
});

/* ---------- 4. Copy install command ---------- */
const copyBtn = document.getElementById("copy-btn");
copyBtn?.addEventListener("click", async () => {
  const text = document.getElementById("install-snippet").textContent;
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "Copied";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1600);
  } catch {
    copyBtn.textContent = "Select & copy";
  }
});
