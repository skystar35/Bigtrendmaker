import fs from 'fs';
import path from 'path';

export function assHeader(p) {
  return `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${p.font},${p.size},${p.color},&H000000FF,&H00000000,&H96000000,0,0,0,0,100,100,0,0,1,${p.outline},${p.shadow},${p.align},30,30,${p.marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
}

function msToAssTime(ms) {
  const s = Math.floor(ms/1000);
  const msr = ms % 1000;
  const hh = String(Math.floor(s/3600)).padStart(2,'0');
  const mm = String(Math.floor((s%3600)/60)).padStart(2,'0');
  const ss = String(s%60).padStart(2,'0');
  return `${hh}:${mm}:${ss}.${String(msr).padStart(3,'0')}`;
}

function karaokeLine(text, startMs, endMs, bpm) {
  const words = text.split(/\s+/).filter(Boolean);
  const totalMs = Math.max(200, endMs - startMs);
  const per = Math.floor(totalMs / Math.max(1, words.length));
  const kf = bpm ? Math.max(1, Math.floor((60000/bpm)/10)) : Math.max(1, Math.floor(per/10));
  const withTags = words.map(w => `{\\kf${kf}}${w}`).join(' ');
  return `Dialogue: 0,${msToAssTime(startMs)},${msToAssTime(endMs)},Default,,0,0,0,,${withTags}`;
}

export function buildAssFromText(text, preset, wpm=160, bpm) {
  const header = assHeader(preset);
  const words = text.split(/\s+/).filter(Boolean);
  const msPerWord = Math.max(200, Math.floor(60000 / wpm));
  let t = 0;
  const lines = [];
  let buf = [];
  const wordsPerLine = 6;
  for (let i=0;i<words.length;i++) {
    buf.push(words[i]);
    if (buf.length === wordsPerLine || i === words.length-1) {
      const start = t;
      const end = t + msPerWord * buf.length;
      lines.push(karaokeLine(buf.join(' '), start, end, bpm));
      t = end + 100;
      buf = [];
    }
  }
  return header + lines.join('\\n') + '\\n';
}

export function saveAss(dir, content) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `karaoke_${Date.now()}.ass`);
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}
