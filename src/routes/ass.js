import { buildAssFromText, saveAss } from '../utils/ass.js';

const PRESETS = [
  { id:'clean-bottom', name:'Clean Bottom', font:'Montserrat', size:44, color:'&H00FFFFFF', outline:2, shadow:2, align:2, marginV:40 },
  { id:'bold-center',  name:'Bold Center',  font:'Poppins SemiBold', size:48, color:'&H0000FFFF', outline:3, shadow:3, align:5, marginV:20 },
  { id:'pop-top',      name:'Pop Top',      font:'Inter Black', size:50, color:'&H0000FF00', outline:4, shadow:3, align:8, marginV:36 }
];

export function assRoutes(app, storageDir) {
  app.get('/v1/subtitles/ass_presets', async ()=> ({ items: PRESETS }));

  app.post('/v1/subtitles/ass_from_text', async (req, reply)=> {
    const b = req.body ?? {};
    const presetId = b.presetId ?? 'clean-bottom';
    const preset = PRESETS.find(p => p.id===presetId) ?? PRESETS[0];
    const text = b.text ?? 'hello trendmaker';
    const wpm = Number(b.wpm ?? 160);
    const bpm = b.bpm ? Number(b.bpm) : undefined;
    const content = buildAssFromText(text, preset, wpm, bpm);
    const file = saveAss(storageDir, content);
    return { assPath: file, preset };
  });
}
