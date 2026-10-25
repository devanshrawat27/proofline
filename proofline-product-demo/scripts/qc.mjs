// Verifies the exported MP4: duration, fps, frame count, streams, audio levels
// and blank-frame detection.
// Usage: node scripts/qc.mjs
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MP4 = path.join(ROOT, "out", "proofline-demo.mp4");

function capture(file, args) {
  return execFileSync(file, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function ffmpegText(args) {
  const result = spawnSync(ffmpegPath, args, { encoding: "utf8" });
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

const probe = JSON.parse(
  capture(ffprobeStatic.path, [
    "-v", "error",
    "-count_frames",
    "-show_entries", "format=duration,size,bit_rate",
    "-show_entries", "stream=index,codec_type,codec_name,width,height,r_frame_rate,avg_frame_rate,nb_read_frames,sample_rate,channels",
    "-of", "json",
    MP4,
  ]),
);

const video = probe.streams.find((s) => s.codec_type === "video");
const audio = probe.streams.find((s) => s.codec_type === "audio");

let black = "none";
{
  const output = ffmpegText(["-i", MP4, "-vf", "blackdetect=d=0.4:pix_th=0.10", "-an", "-f", "null", "-"]);
  const matches = output.match(/black_start:[\d.]+/g);
  if (matches) black = matches.join(", ");
}

let levels = "unavailable";
{
  const output = ffmpegText(["-i", MP4, "-af", "volumedetect", "-vn", "-f", "null", "-"]);
  const mean = output.match(/mean_volume:\s*(-?[\d.]+) dB/);
  const max = output.match(/max_volume:\s*(-?[\d.]+) dB/);
  levels = `mean ${mean?.[1] ?? "?"} dB, max ${max?.[1] ?? "?"} dB`;
}

const report = {
  file: "out/proofline-demo.mp4",
  durationSeconds: Number(probe.format.duration),
  sizeBytes: Number(probe.format.size),
  video: {
    codec: video?.codec_name,
    width: video?.width,
    height: video?.height,
    fps: video?.avg_frame_rate,
    frames: Number(video?.nb_read_frames),
  },
  audio: {
    codec: audio?.codec_name,
    sampleRate: Number(audio?.sample_rate),
    channels: audio?.channels,
    levels,
  },
  blackSegments: black,
};

console.log(JSON.stringify(report, null, 2));
