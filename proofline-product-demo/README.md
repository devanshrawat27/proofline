# Proofline — Product Demo

A two-minute demo recorded from the **live app** — the full order-to-resolution flow.

▶ **Watch:** https://youtu.be/QUia9HSccXc

[![Watch the Proofline demo](assets/demo-preview.gif)](https://youtu.be/QUia9HSccXc)

- **Spec:** 1920×1080, 30 fps, 128.5 s, H.264 + AAC stereo, background music (no voice-over)
- **File:** [`out/proofline-demo.mp4`](out/proofline-demo.mp4) · **QC:** [`verification.md`](verification.md)

## Flow

1. Procurement manager signs in and issues PO `VID-767665` (10 × ₹500).
2. Warehouse receiver signs in — receiving-only navigation — records 10 received / 1 damaged and submits.
3. Finance signs in, creates `INV-VID-767665` (12 × ₹600) and reviews it.
4. The engine flags 4 discrepancies: quantity, over-delivery, unit price, damaged goods.
5. Manager opens `CASE-1006` from the over-delivery exception.
6. Case moves to under review; a credit note is proposed.
7. Manager approves the credit note.
8. Finance verifies it — the case resolves.
9. Supplier replies from their own portal (`CASE-1001`).

## Rebuild

```bash
npm install
npm run record && npm run record:extra && npm run record:resolution
npm run captions && npm run compose && npm run qc
```

Music is `assets/music.mp3` (`The Mountain` — SaaS Systems). Remove it to fall back to a
synthesised bed. Point compose at another file with `npm run compose -- --music "C:\path\track.mp3"`.

## Notes

- Recording creates real records in the seeded demo organisation.
- No staged errors, no voice-over; login waits are cut so cold starts never linger.
- Passwords are masked; per-role session files are deleted after recording and gitignored.
