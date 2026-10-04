// Procedurally drawn textures so the room ships with zero image assets.
import * as THREE from "three";

const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = '"Inter Variable", system-ui, sans-serif';

function make(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d")!);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function monitorTexture() {
  return make(1024, 590, (c) => {
    const g = c.createLinearGradient(0, 0, 1024, 590);
    g.addColorStop(0, "#0b1226");
    g.addColorStop(0.55, "#16264d");
    g.addColorStop(1, "#2c4478");
    c.fillStyle = g;
    c.fillRect(0, 0, 1024, 590);
    // faint rune rings as wallpaper
    c.strokeStyle = "rgba(226,189,98,0.22)";
    c.lineWidth = 2;
    for (const r of [190, 160, 70]) {
      c.beginPath();
      c.arc(640, 295, r, 0, Math.PI * 2);
      c.stroke();
    }
    // tick marks around the outer ring
    for (let i = 0; i < 48; i++) {
      const ang = (i / 48) * Math.PI * 2;
      const r1 = 190, r2 = i % 4 ? 182 : 172;
      c.beginPath();
      c.moveTo(640 + r1 * Math.cos(ang), 295 + r1 * Math.sin(ang));
      c.lineTo(640 + r2 * Math.cos(ang), 295 + r2 * Math.sin(ang));
      c.stroke();
    }
    c.fillStyle = "#fff";
    c.font = `600 64px ${SERIF}`;
    c.fillText("MusOS", 60, 120);
    c.font = `400 22px ${SANS}`;
    c.fillStyle = "rgba(255,255,255,0.7)";
    c.fillText("click to log in", 62, 156);
    const icons = ["Projects", "Achievements", "Anime", "Games", "resume.pdf"];
    icons.forEach((name, i) => {
      const y = 210 + i * 70;
      c.fillStyle = i === 0 ? "#c9a24a" : "rgba(244,234,208,0.14)";
      c.beginPath();
      c.roundRect(60, y, 46, 46, 10);
      c.fill();
      c.fillStyle = "rgba(255,255,255,0.88)";
      c.font = `500 22px ${SANS}`;
      c.fillText(name, 124, y + 31);
    });
  });
}

export function windowTexture(night: boolean) {
  return make(512, 440, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 440);
    if (night) {
      g.addColorStop(0, "#0b1030");
      g.addColorStop(0.65, "#2a2350");
      g.addColorStop(1, "#6b3448");
    } else {
      g.addColorStop(0, "#7fb2e8");
      g.addColorStop(0.7, "#f3c9a0");
      g.addColorStop(1, "#f6a77a");
    }
    c.fillStyle = g;
    c.fillRect(0, 0, 512, 440);
    if (night) {
      c.fillStyle = "#fff";
      for (let i = 0; i < 70; i++) {
        const x = (i * 97) % 512;
        const y = (i * 53) % 230;
        c.globalAlpha = 0.3 + ((i * 7) % 10) / 14;
        c.fillRect(x, y, 2, 2);
      }
      c.globalAlpha = 1;
      c.fillStyle = "#f4ead0";
      c.beginPath();
      c.arc(400, 90, 28, 0, Math.PI * 2);
      c.fill();
    } else {
      c.fillStyle = "rgba(255,250,235,0.95)";
      c.beginPath();
      c.arc(390, 260, 34, 0, Math.PI * 2);
      c.fill();
    }
    // Toronto skyline: towers plus the CN Tower
    const sky = night ? "#120f22" : "#5a6487";
    c.fillStyle = sky;
    let x = 0;
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    while (x < 512) {
      const w = 22 + rnd() * 34;
      const h = 60 + rnd() * 120;
      c.fillRect(x, 440 - h, w, h);
      if (night) {
        c.fillStyle = "rgba(255,200,120,0.75)";
        for (let wy = 440 - h + 8; wy < 432; wy += 12)
          for (let wx = x + 5; wx < x + w - 5; wx += 9) if (rnd() > 0.62) c.fillRect(wx, wy, 3, 4);
        c.fillStyle = sky;
      }
      x += w + 3;
    }
    const cx = 170;
    c.fillRect(cx - 4, 70, 8, 370);
    c.fillRect(cx - 10, 200, 20, 240);
    c.beginPath();
    c.ellipse(cx, 185, 22, 12, 0, 0, Math.PI * 2);
    c.fill();
    c.fillRect(cx - 1, 20, 2, 60);
    if (night) {
      c.fillStyle = "#ff3344";
      c.fillRect(cx - 2, 18, 4, 4);
    }
  });
}

export function noteTexture(rank: string, company: string, role: string, dates: string, active: boolean) {
  return make(360, 460, (c) => {
    c.fillStyle = "#efe2c0";
    c.fillRect(0, 0, 360, 460);
    // aged edges
    const v = c.createRadialGradient(180, 230, 120, 180, 230, 300);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(120,80,30,0.35)");
    c.fillStyle = v;
    c.fillRect(0, 0, 360, 460);
    c.textAlign = "center";
    c.fillStyle = "#4a3320";
    c.font = `600 26px ${SERIF}`;
    c.fillText(active ? "— ACTIVE QUEST —" : "— QUEST —", 180, 60);
    c.fillStyle = active ? "#b3121f" : "#6b4a2a";
    c.font = `700 120px ${SERIF}`;
    c.fillText(rank, 180, 190);
    c.fillStyle = "#2b1d12";
    c.font = `700 40px ${SERIF}`;
    c.fillText(company, 180, 260);
    c.font = `500 25px ${SERIF}`;
    wrap(c, role, 180, 300, 300, 30);
    c.font = `500 20px ${SANS}`;
    c.fillStyle = "#6b4a2a";
    c.fillText(dates, active ? 180 : 140, 425);
    if (!active) {
      // red wax seal, stamped "MC"
      c.save();
      c.translate(292, 392);
      c.fillStyle = "#9b1b22";
      c.beginPath();
      for (let k = 0; k <= 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        const r = 40 + (k % 2 ? 3 : -2);
        c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      c.fill();
      c.strokeStyle = "rgba(255,200,190,0.35)";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, 28, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = "rgba(255,215,205,0.85)";
      c.font = `italic 700 30px ${SERIF}`;
      c.fillText("MC", 0, 10);
      c.restore();
    }
  });
}

export function plaqueTexture() {
  return make(800, 120, (c) => {
    c.fillStyle = "#3a2516";
    c.fillRect(0, 0, 800, 120);
    c.strokeStyle = "#b58b4c";
    c.lineWidth = 4;
    c.strokeRect(8, 8, 784, 104);
    c.textAlign = "center";
    c.fillStyle = "#e8c98a";
    c.font = `600 50px ${SERIF}`;
    c.fillText("ADVENTURER'S QUEST BOARD", 400, 64);
    c.font = `italic 500 28px ${SERIF}`;
    c.fillText("Wait and hope.", 400, 98);
  });
}

export function diplomaTexture() {
  return make(500, 380, (c) => {
    c.fillStyle = "#f8f3e6";
    c.fillRect(0, 0, 500, 380);
    c.strokeStyle = "#1e3765";
    c.lineWidth = 3;
    c.strokeRect(16, 16, 468, 348);
    c.textAlign = "center";
    c.fillStyle = "#1e3765";
    c.font = `600 36px ${SERIF}`;
    c.fillText("University of Toronto", 250, 90);
    c.fillStyle = "#333";
    c.font = `italic 500 22px ${SERIF}`;
    c.fillText("confers upon", 250, 140);
    c.font = `600 32px ${SERIF}`;
    c.fillText("Mustafa Abdulrahman", 250, 190);
    c.font = `500 20px ${SERIF}`;
    c.fillText("Bachelor of Applied Science", 250, 240);
    c.fillText("Computer Engineering · 2026", 250, 268);
    c.fillStyle = "#b8902f";
    c.beginPath();
    c.arc(250, 322, 22, 0, Math.PI * 2);
    c.fill();
  });
}

function wrap(c: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number) {
  let line = "";
  for (const word of text.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (c.measureText(test).width > max && line) {
      c.fillText(line, x, y);
      line = word;
      y += lh;
    } else line = test;
  }
  c.fillText(line, x, y);
}

export function chateauTexture() {
  return make(512, 440, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 440);
    g.addColorStop(0, "#0a1230");
    g.addColorStop(0.55, "#23305a");
    g.addColorStop(1, "#0d1a33");
    c.fillStyle = g;
    c.fillRect(0, 0, 512, 440);
    c.fillStyle = "#fff";
    for (let i = 0; i < 60; i++) {
      c.globalAlpha = 0.25 + ((i * 7) % 10) / 14;
      c.fillRect((i * 89) % 512, (i * 41) % 200, 2, 2);
    }
    c.globalAlpha = 1;
    // moon + its path on the water
    c.fillStyle = "#f4ead0";
    c.beginPath();
    c.arc(380, 85, 30, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#16264a";
    c.fillRect(0, 290, 512, 150);
    c.fillStyle = "rgba(244,234,208,0.35)";
    for (let y = 300; y < 440; y += 9) c.fillRect(380 - (y - 290) * 0.4 + ((y * 13) % 17), y, 30 + (y - 290) * 0.5, 2);
    // the rock and the fortress of If
    c.fillStyle = "#0b0f1c";
    c.beginPath();
    c.moveTo(90, 300);
    c.lineTo(130, 262);
    c.lineTo(300, 258);
    c.lineTo(340, 300);
    c.fill();
    c.fillRect(150, 196, 130, 66); // curtain wall
    c.fillRect(160, 150, 46, 50); // towers
    c.fillRect(232, 158, 40, 42);
    c.fillRect(196, 172, 40, 30);
    for (let x = 150; x < 280; x += 12) c.fillRect(x, 190, 7, 7); // crenellations
    for (const [x, w] of [[160, 46], [232, 40]]) for (let k = x; k < x + w; k += 10) c.fillRect(k, 144, 6, 7);
    c.fillStyle = "rgba(255,190,110,0.85)";
    c.fillRect(178, 168, 4, 7);
    c.fillRect(250, 176, 4, 6);
    c.fillStyle = "rgba(244,234,208,0.8)";
    c.font = `italic 600 22px ${SERIF}`;
    c.textAlign = "center";
    c.fillText("Château d'If", 256, 420);
  });
}

// Jump-touch tape: a strip of feet/inch marks running up the wall (1 px = 1/256 m of a 2.65 m strip).
// 10 ft (3.05 m) is above the 2.7 m ceiling, so the top just points up at it.
export function jumpTapeTexture() {
  const H = 1024;
  const mPerPx = 2.65 / H;
  return make(96, H, (c) => {
    c.fillStyle = "#f1ece0";
    c.fillRect(0, 0, 96, H);
    c.fillStyle = "#1b1b22";
    c.textAlign = "left";
    for (let inch = 0; inch <= 104; inch++) {
      const y = H - (inch * 0.0254) / mPerPx;
      const foot = inch % 12 === 0;
      c.fillRect(0, y - (foot ? 2 : 1), foot ? 44 : inch % 6 === 0 ? 28 : 16, foot ? 4 : 2);
      if (foot && inch > 0) {
        c.font = `800 26px ${SANS}`;
        c.fillText(`${inch / 12}'`, 50, y + 9);
      }
    }
    // the goal, above the ceiling
    c.fillStyle = "#c9a24a";
    c.fillRect(0, 0, 96, 70);
    c.fillStyle = "#101a33";
    c.font = `900 22px ${SANS}`;
    c.textAlign = "center";
    c.fillText("10 FT", 48, 34);
    c.beginPath();
    c.moveTo(48, 40);
    c.lineTo(36, 58);
    c.lineTo(60, 58);
    c.fill();
  });
}

// Basketball and volleyball skins.
export function basketballTexture() {
  return make(256, 128, (c) => {
    c.fillStyle = "#d8641e";
    c.fillRect(0, 0, 256, 128);
    c.strokeStyle = "#2a1408";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(0, 64); c.lineTo(256, 64);
    c.moveTo(64, 0); c.lineTo(64, 128);
    c.moveTo(192, 0); c.lineTo(192, 128);
    c.stroke();
    c.beginPath();
    c.ellipse(128, 64, 40, 64, 0, 0, Math.PI * 2);
    c.stroke();
  });
}

export function volleyballTexture() {
  return make(256, 128, (c) => {
    const bands = ["#f5f2ea", "#f2c230", "#2b5fb4"];
    for (let i = 0; i < 9; i++) {
      c.fillStyle = bands[i % 3];
      c.fillRect((i * 256) / 9, 0, 256 / 9 + 1, 128);
    }
    c.strokeStyle = "rgba(0,0,0,0.25)";
    c.lineWidth = 1.5;
    for (let i = 0; i <= 9; i++) {
      c.beginPath();
      c.moveTo((i * 256) / 9, 0);
      c.lineTo((i * 256) / 9, 128);
      c.stroke();
    }
  });
}

// Chest print for a U of T hoodie (plain lettering, not the official crest).
export function uoftPrintTexture() {
  return make(512, 256, (c) => {
    c.clearRect(0, 0, 512, 256);
    c.textAlign = "center";
    c.fillStyle = "#ffffff";
    c.font = `800 38px ${SANS}`;
    c.fillText("U N I V E R S I T Y   O F", 256, 52);
    c.font = `900 92px ${SERIF}`;
    c.fillText("TORONTO", 256, 152);
    c.font = `700 30px ${SANS}`;
    c.fillText("E N G I N E E R I N G", 256, 214);
  });
}

// Blanket: deep red with a navy and gold tartan check.
export function blanketTexture() {
  return make(256, 256, (c) => {
    c.fillStyle = "#7a1f24";
    c.fillRect(0, 0, 256, 256);
    const band = (pos: number, w: number, color: string, alpha: number) => {
      c.globalAlpha = alpha;
      c.fillStyle = color;
      c.fillRect(pos, 0, w, 256);
      c.fillRect(0, pos, 256, w);
    };
    for (const p of [0, 128]) {
      band(p + 36, 34, "#101a33", 0.45);
      band(p + 58, 8, "#c9a24a", 0.9);
      band(p + 100, 6, "#e9c76f", 0.55);
    }
    c.globalAlpha = 1;
  });
}

// A sealed envelope seen from the front: cream paper, flap lines, a stamp.
export function envelopeTexture() {
  return make(320, 220, (c) => {
    c.fillStyle = "#f6eedb";
    c.fillRect(0, 0, 320, 220);
    c.strokeStyle = "rgba(120,90,50,0.45)";
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(4, 4);
    c.lineTo(160, 120);
    c.lineTo(316, 4);
    c.stroke();
    c.strokeRect(2, 2, 316, 216);
    c.fillStyle = "#c9a24a";
    c.fillRect(250, 150, 50, 56);
    c.strokeStyle = "#f6eedb";
    c.setLineDash([4, 4]);
    c.strokeRect(254, 154, 42, 48);
    c.setLineDash([]);
    c.fillStyle = "rgba(60,40,30,0.7)";
    c.font = `italic 600 26px ${SERIF}`;
    c.fillText("Mustafa A.", 40, 185);
  });
}

// Red stars for a Dragon Ball (n = 1–7), drawn on a transparent disc.
export function dragonStarsTexture(n: number) {
  return make(128, 128, (c) => {
    c.clearRect(0, 0, 128, 128);
    const layouts: Record<number, [number, number][]> = {
      1: [[64, 64]],
      2: [[46, 64], [82, 64]],
      3: [[64, 44], [44, 78], [84, 78]],
      4: [[44, 44], [84, 44], [44, 84], [84, 84]],
      5: [[64, 36], [36, 60], [92, 60], [46, 92], [82, 92]],
      6: [[42, 40], [86, 40], [30, 70], [98, 70], [50, 98], [78, 98]],
      7: [[64, 64], [64, 30], [94, 48], [94, 82], [64, 98], [34, 82], [34, 48]],
    };
    const r = n <= 2 ? 18 : n <= 4 ? 15 : 12;
    c.fillStyle = "#d61f1f";
    for (const [x, y] of layouts[n]) {
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 ? r * 0.42 : r;
        c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      c.closePath();
      c.fill();
    }
  });
}

// Engraved Hidden Leaf symbol on a brushed metal plate.
export function leafPlateTexture() {
  return make(256, 128, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, "#e9ecf1");
    g.addColorStop(0.5, "#b9bfca");
    g.addColorStop(1, "#dfe3ea");
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 128);
    c.strokeStyle = "rgba(255,255,255,0.35)";
    c.lineWidth = 1;
    for (let y = 4; y < 128; y += 5) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(256, y);
      c.stroke();
    }
    c.strokeStyle = "#3a3f4a";
    c.lineWidth = 6;
    c.lineCap = "round";
    // spiral
    c.beginPath();
    for (let t = 0; t < Math.PI * 3.2; t += 0.1) {
      const r = 4 + t * 7.5;
      c.lineTo(128 + Math.cos(t) * r * 0.9, 70 + Math.sin(t) * r * 0.75);
    }
    c.stroke();
    // the leaf's point, up and to the left
    c.beginPath();
    c.moveTo(166, 52);
    c.lineTo(92, 14);
    c.lineTo(104, 46);
    c.stroke();
    // screws
    c.fillStyle = "#7d8592";
    for (const x of [16, 240]) for (const y of [16, 112]) {
      c.beginPath();
      c.arc(x, y, 5, 0, Math.PI * 2);
      c.fill();
    }
  });
}
