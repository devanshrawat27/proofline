# Verification report — Proofline product demo (multi-role, music-only)

The video is built from **actual recorded interactions** with the running app. Playwright drove
the real UI as four different users and recorded each step; FFmpeg trimmed the clips, overlaid
step captions, built the music bed and encoded the MP4. No data, progress or result is
fabricated, and this cut contains **no staged error** and **no voice-over**.

## Source

| Field | Value |
| --- | --- |
| Base URL | https://proofline-inky.vercel.app |
| API | https://proofline-n9bo.onrender.com |
| Driver | Playwright (Chromium) screen recording, 1920×1080 |
| Roles recorded | procurement manager (`manager@meridian.local`), warehouse receiver (`receiver@meridian.local`), finance (`finance@meridian.local`), supplier (`supplier@brighttech.local`) |
| Raw clips | `recordings/*.webm` (see `recordings/session.json`) |
| Audio | `The Mountain` — SaaS Systems (user-supplied track, `assets/music.mp3`), −20 LUFS |

## Export QC (`node scripts/qc.mjs`)

```json
{
  "file": "out/proofline-demo.mp4",
  "durationSeconds": 128.5,
  "sizeBytes": 7489524,
  "video": {
    "codec": "h264",
    "width": 1920,
    "height": 1080,
    "fps": "30/1",
    "frames": 3855
  },
  "audio": {
    "codec": "aac",
    "sampleRate": 44100,
    "channels": 2,
    "levels": "mean -19.9 dB, max -9.1 dB"
  },
  "blackSegments": "none"
}
```

| Check | Result |
| --- | --- |
| Duration | **128.5 s** ✅ |
| Resolution / frame rate | 1920×1080 / 30 fps (`30/1`) ✅ |
| Frame count (128.5 × 30 ≈ 3855) | **3855** ✅ |
| Video codec | H.264 (`yuv420p`) ✅ |
| Audio | AAC 44.1 kHz stereo, 192 kbps ✅ |
| Loudness (`loudnorm` summary) | **−20.1 LUFS**, true peak −9.1 dBTP (no clipping) ✅ |
| Silence gaps (`silencedetect`, −38 dB / 1.2 s) | **none** ✅ |
| Blank frames (`blackdetect` d=0.4 s) | **none** ✅ |
| Error scene / voice-over | **none** ✅ |

## Real actions demonstrated (verified against the app)

1. **Procurement manager signs in** → `Welcome back, Manish`.
2. **Purchase order created and issued** — `VID-767665`, VoltEdge Supplies, 10 × ₹500 = ₹5,000.
   API later reports `status = FULLY_RECEIVED`, `totalMinor = 500000`.
3. **Warehouse receiver signs in** → `Welcome back, Ravi`; the navigation is **role-scoped**
   (Overview, Purchase Orders, Receiving, Documents, Settings — no invoices, cases or roles).
4. **Delivery recorded and submitted** — received 10, damaged 1, delivery reference `DC-VIDEO`.
5. **Finance signs in** → `Welcome back, Fatima`.
6. **Invoice created and reviewed** — `INV-VID-767665` matched to `VID-767665`, 12 × ₹600,
   `totalMinor = 720000`; API confirms `status = REVIEWED`.
7. **Discrepancy engine output** — API confirms **4 discrepancies**:
   `QUANTITY_MISMATCH` (expected 10 unit, actual 12 unit), `OVER_DELIVERY` (10 vs 12),
   `UNIT_PRICE_MISMATCH` (₹500.00 vs ₹600.00), `DAMAGED_GOODS` (0 vs 1 unit). The video shows
   them with expected/actual values.
8. **Dispute case created** — `CASE-1006`, opened from the over-delivery exception on
   `VID-767665` / `INV-VID-767665`.
9. **Case workflow** — `Open → Under Review`, credit note proposed, then **approved** by
   Manish Procurement; the timeline records `CASE OPENED`, `STATUS CHANGED`,
   `RESOLUTION PROPOSED`, `RESOLUTION APPROVED`.
10. **Finance verification** — `Verify` clicked by Fatima Finance; the resolution becomes
    `verified` and the case becomes **Resolved**. API confirms
    `CASE-1006 status = RESOLVED`, `CREDIT_NOTE status = VERIFIED`, `verifiedByName = Fatima Finance`.
11. **Supplier portal** — BrightTech (Nisha Rao) signs in with its own identity and replies
    on `CASE-1001` (`Supplier Responded`).
12. **Exceptions inbox** lists **14 real open discrepancies** before the case is created.

## Honesty / safety checks

- **No fabricated data:** every number is produced by the app; captions only describe what is
  shown. The hook (100 ordered / 94 arrived / 100 billed) comes from the seeded demo records.
- **No invented failure and no error scene:** the receipt submission is clean.
- **Time compression:** free-tier cold starts make some requests slow. Login steps are cut
  right after submit to the signed-in workspace, so `Waking the server…` is not left on screen.
- **Dwell for verification:** the resolution re-record waits for the `verified by` text before
  cutting, so the resolved state is genuinely on screen.
- **Static holds:** a few dashboards are held on their last frame for ~1 s so the caption can be
  read; no action is implied during the hold.
- **Secrets:** password fields are masked; no tokens, API keys or env values appear.
- **Session cookies:** the per-role Playwright storage states are deleted after recording and
  gitignored.
- **Demo data only:** the recording writes to the seeded demo organisation.

## Reproduce

```bash
cd proofline-product-demo
npm install
npm run build     # record → record:extra → record:resolution → captions → compose → qc
```

Note: the recording creates a new PO/receipt/invoice/case on every run, so the IDs in a fresh
run differ from the ones above. The finance-verify step needs an approved resolution, which
`record:resolution` creates before verifying.
