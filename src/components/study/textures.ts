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
    g.addColorStop(0, "#1b1530");
    g.addColorStop(0.55, "#3a1a2c");
    g.addColorStop(1, "#7a1b2a");
    c.fillStyle = g;
    c.fillRect(0, 0, 1024, 590);
    // a faint magic circle as wallpaper
    c.strokeStyle = "rgba(255,210,170,0.18)";
    c.lineWidth = 2;
    for (const r of [190, 160, 70]) {
      c.beginPath();
      c.arc(640, 295, r, 0, Math.PI * 2);
      c.stroke();
    }
    for (let k = 0; k < 2; k++) {
      c.beginPath();
      for (let i = 0; i <= 3; i++) {
        const a = -Math.PI / 2 + k * Math.PI + (i * 2 * Math.PI) / 3;
        c.lineTo(640 + 160 * Math.cos(a), 295 + 160 * Math.sin(a));
      }
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
      c.fillStyle = i === 0 ? "#e0313c" : "rgba(255,255,255,0.14)";
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
    c.fillText(dates, 180, 425);
    if (!active) {
      c.save();
      c.translate(180, 372);
      c.rotate(-0.12);
      c.strokeStyle = "rgba(160,20,30,0.75)";
      c.lineWidth = 4;
      c.strokeRect(-62, -22, 124, 40);
      c.fillStyle = "rgba(160,20,30,0.75)";
      c.font = `700 22px ${SANS}`;
      c.fillText("CLEARED", 0, 6);
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
    c.fillText("Journey before destination", 400, 98);
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
