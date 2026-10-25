// Composes the multi-role recordings into the final demo:
// trims, caption overlays, music bed, concat, H.264/AAC.
//
// Music: if assets/music.(mp3|m4a|wav) exists it is looped; otherwise a
// royalty-free ambient bed is synthesised with FFmpeg oscillators.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REC = path.join(ROOT, "recordings");
const CAP = path.join(ROOT, "captions");
const ASSETS = path.join(ROOT, "assets");
const TMP = path.join(ROOT, "out", "clips");
const OUT = path.join(ROOT, "out");

// start/dur in seconds against the recorded clips.
const SEGMENTS = [
  { src: "hook", dur: 6.2, caption: null },
  { src: "01-landing.webm", start: 1.5, dur: 4.8, caption: "01" },
  { src: "02-manager-login.webm", start: 0.4, dur: 3.0, caption: "02" },
  { src: "03-manager-overview.webm", start: 0, dur: 3.4, caption: "03" },
  { src: "04-manager-po.webm", start: 0, dur: 11.7, caption: "04" },
  { src: "05-receiver-login.webm", start: 0.4, dur: 3.0, caption: "05" },
  { src: "05-receiver-login.webm", start: 9.2, dur: 2.6, caption: "05" },
  { src: "06-receiver-receiving.webm", start: 1.0, dur: 13.0, caption: "06" },
  { src: "07-finance-login.webm", start: 0.4, dur: 3.0, caption: "07" },
  { src: "07-finance-login.webm", start: 12.3, dur: 2.6, caption: "07" },
  { src: "08-finance-invoice.webm", start: 2.0, dur: 10.6, caption: "08" },
  { src: "05b-invoice-reviewed.webm", start: 3.0, dur: 8.5, caption: "09" },
  { src: "09-manager-case.webm", start: 3.0, dur: 9.8, caption: "10" },
  { src: "09-manager-case.webm", start: 14.6, dur: 10.0, caption: "11" },
  { src: "09-manager-case.webm", start: 25.6, dur: 11.0, caption: "12" },
  { src: "10-finance-verify.webm", start: 2.6, dur: 9.5, caption: "13" },
  { src: "11-supplier.webm", start: 8.0, dur: 8.5, caption: "14" },
  { src: "end", dur: 7.2, caption: null },
];

const FPS = 30;

// Soft e-piano bed: Am7 → Fmaj7 → Cmaj7 → G7, 80 BPM, one bar = 3 s.
const PROGRESSION = [
  { notes: [220.0, 261.63, 329.63, 392.0], bass: 110.0 },   // Am7
  { notes: [174.61, 220.0, 261.63, 329.63], bass: 87.31 },  // Fmaj7
  { notes: [261.63, 329.63, 392.0, 493.88], bass: 130.81 }, // Cmaj7
  { notes: [196.0, 246.94, 293.66, 349.23], bass: 98.0 },   // G7
];
const BAR_SECONDS = 3.0;
const BEAT = BAR_SECONDS / 4;
const ARPEGGIO = [0, 2, 1, 3];
const VELOCITY = [1.0, 0.74, 0.88, 0.68];

function run(args) {
  execFileSync(ffmpegPath, args, { stdio: ["ignore", "ignore", "inherit"] });
}

const durations = new Map();
function sourceDuration(file) {
  if (durations.has(file)) return durations.get(file);
  const out = execFileSync(
    ffprobeStatic.path,
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { encoding: "utf8" },
  );
  const value = Number(out.trim());
  durations.set(file, value);
  return value;
}

function externalMusic() {
  const cliIndex = process.argv.indexOf("--music");
  const cli = cliIndex > -1 ? process.argv[cliIndex + 1] : process.env.DEMO_MUSIC;
  if (cli) {
    const resolved = path.resolve(cli);
    if (!existsSync(resolved)) throw new Error(`Music file not found: ${resolved}`);
    return resolved;
  }
  for (const name of ["music.mp3", "music.m4a", "music.wav"]) {
    const file = path.join(ASSETS, name);
    if (existsSync(file)) return file;
  }
  return null;
}

// Soft e-piano tone: gentle attack, decaying harmonics — reads like a piano, not a drone.
function tone(frequency, decay, amplitude) {
  const f = frequency.toFixed(3);
  return (
    `(sin(2*PI*${f}*t)+0.50*sin(4*PI*${f}*t)+0.22*sin(6*PI*${f}*t)+0.08*sin(8*PI*${f}*t))` +
    `*exp(-${decay}*t)*${amplitude}`
  );
}

function buildBar(chord, index) {
  const bar = path.join(TMP, `bar-${index}.wav`);
  const args = ["-y"];
  const parts = [];

  // Bass note rings under the bar.
  args.push("-f", "lavfi", "-i", `aevalsrc=${tone(chord.bass, 0.85, 0.24)}:d=2.8:s=44100`);
  parts.push({ input: parts.length, at: 0, chain: "afade=t=in:st=0:d=0.04" });

  // Quarter-note arpeggio; notes ring into each other so there is no gap.
  for (const [step, noteIndex] of ARPEGGIO.entries()) {
    const freq = chord.notes[noteIndex];
    args.push(
      "-f", "lavfi", "-i",
      `aevalsrc=${tone(freq, 1.15, 0.17 * VELOCITY[step])}:d=2.8:s=44100`,
    );
    parts.push({ input: parts.length, at: step * BEAT, chain: "afade=t=in:st=0:d=0.03" });
  }

  const delays = parts
    .map(({ input, at, chain }) => {
      const ms = Math.round(at * 1000);
      return `[${input}:a]${chain},adelay=${ms}|${ms}[n${input}]`;
    })
    .join(";");
  const mix = parts.map(({ input }) => `[n${input}]`).join("");
  const filter =
    `${delays};${mix}amix=inputs=${parts.length}:normalize=0,` +
    `lowpass=f=7000,highpass=f=55,atrim=0:${BAR_SECONDS},afade=t=out:st=${BAR_SECONDS - 0.06}:d=0.06[a]`;

  args.push("-filter_complex", filter, "-map", "[a]", "-ar", "44100", "-ac", "1", bar);
  run(args);
  return bar;
}

async function buildMusic(total) {
  const music = path.join(TMP, "music.wav");
  const external = externalMusic();

  if (external) {
    const source = sourceDuration(external);
    const loop = source < total ? ["-stream_loop", "-1"] : [];
    run([
      "-y",
      ...loop,
      "-i", external,
      "-t", String(total),
      "-af",
      `afade=t=in:st=0:d=1.2,afade=t=out:st=${(total - 4).toFixed(2)}:d=4,` +
        "loudnorm=I=-20:TP=-2:LRA=9",
      "-ar", "44100", "-ac", "2", music,
    ]);
    console.log(
      `music: ${path.basename(external)} (${source.toFixed(1)}s` +
        `${source < total ? ", looped" : ", trimmed"})`,
    );
    return music;
  }

  const bars = PROGRESSION.map((chord, index) => buildBar(chord, index));
  const count = Math.ceil(total / BAR_SECONDS) + 1;
  const sequence = Array.from({ length: count }, (_, i) => bars[i % bars.length]);
  const listFile = path.join(TMP, "bars.txt");
  await writeFile(listFile, sequence.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n"), "utf8");

  const track = path.join(TMP, "track.wav");
  run(["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", track]);

  run([
    "-y",
    "-i", track,
    "-t", String(total),
    "-af",
    `afade=t=in:st=0:d=1.6,afade=t=out:st=${(total - 4).toFixed(2)}:d=4,` +
      "loudnorm=I=-22:TP=-3:LRA=6",
    "-ar", "44100", "-ac", "2", music,
  ]);
  console.log(`music: e-piano bed (${PROGRESSION.length} chords, ${count} bars)`);
  return music;
}

async function main() {
  await mkdir(TMP, { recursive: true });
  await mkdir(OUT, { recursive: true });

  const clipFiles = [];
  let total = 0;

  for (const [i, seg] of SEGMENTS.entries()) {
    const index = String(i).padStart(2, "0");
    const out = path.join(TMP, `clip-${index}.mp4`);
    await rm(out, { force: true }).catch(() => {});
    total += seg.dur;

    const args = ["-y"];
    if (seg.src === "hook" || seg.src === "end") {
      args.push("-loop", "1", "-t", String(seg.dur), "-i", path.join(CAP, `${seg.src}.png`));
      args.push("-vf", `scale=1920:1080,fps=${FPS},format=yuv420p`);
    } else {
      const source = path.join(REC, seg.src);
      args.push("-ss", String(seg.start), "-t", String(seg.dur), "-i", source);
      args.push("-i", path.join(CAP, `${seg.caption}.png`));
      const available = Math.min(seg.dur, Math.max(0, sourceDuration(source) - seg.start));
      const pad = Math.max(0, seg.dur - available);
      const padFilter = pad > 0.02 ? `,tpad=stop_mode=clone:stop_duration=${pad.toFixed(3)}` : "";
      args.push(
        "-filter_complex",
        `[0:v]scale=1920:1080,fps=${FPS},format=rgba[base];` +
          `[base][1:v]overlay=0:0:format=auto${padFilter},format=yuv420p[v]`,
        "-map", "[v]",
      );
    }
    args.push(
      "-an",
      "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-pix_fmt", "yuv420p",
      out,
    );
    run(args);
    clipFiles.push(out);
    console.log(`clip ${index} (${seg.caption ?? seg.src}) ${seg.dur}s`);
  }

  const listFile = path.join(TMP, "list.txt");
  await writeFile(listFile, clipFiles.map((file) => `file '${file.replace(/\\/g, "/")}'`).join("\n"), "utf8");
  const concat = path.join(TMP, "concat.mp4");
  run(["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", concat]);

  const music = await buildMusic(total);

  const final = path.join(OUT, "proofline-demo.mp4");
  await rm(final, { force: true }).catch(() => {});
  run([
    "-y",
    "-i", concat,
    "-i", music,
    "-map", "0:v", "-map", "1:a",
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "192k",
    "-movflags", "+faststart",
    final,
  ]);

  console.log(`\nWrote ${final}  (target ${total.toFixed(1)}s)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
