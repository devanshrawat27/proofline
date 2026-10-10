# Proofline — Premium Landing Page Polish Brief

> **Use this file as the implementation prompt for the coding agent.**
> Goal: elevate the existing Proofline landing page from a generic AI-looking prototype into a refined, premium, smooth, credible B2B SaaS product website.
> Scope: polish the current landing page and its visuals. Do not rebuild the product from scratch or change working business logic.

---

## 1. Context: What currently feels wrong

Inspect the current landing page and the provided screenshots before editing. The overall forest-green / off-white theme is good and should remain. The main weakness is not the palette; it is the execution and visual storytelling.

Current issues to address:
- The hero's parcel looks like a simple low-detail 3D placeholder inside a large rounded panel. It feels generic and a little toy-like, rather than a premium product visual.
- Purchase Order, Receiving Record, Supplier Invoice, and mismatch cards feel like separate floating UI tiles. The relationship between the three records is not visually clear enough.
- The scanning/reconciliation moment does not feel convincing. The viewer should immediately understand: **three records enter → Proofline compares them → a mismatch is found with evidence**.
- Decorative dashed lines, small floating shapes, and broad glow effects can feel like default AI-generated landing-page decoration. Use motion only when it communicates the workflow.
- The hero composition lacks depth hierarchy: the parcel, cards, light effects, and background compete instead of forming one deliberate focal point.
- The workflow section currently has small illustrations. Enlarge and balance these visuals so the Receive → Verify → Resolve stages read instantly.
- The dashboard showcase is useful, but should feel like a real product preview rather than a flat screenshot floating beside marketing copy.
- The dark AI section feels like a simple row of cards and a brain icon connected by arrows. Give it a more purposeful visual narrative and refined lighting.
- Ensure the Proofline brand mark is crisp. Avoid blurry/rasterized logos or any leftover “Goodsignal” branding.
- The full page should feel like one designed system, with consistent spacing, typography, card radius, border color, shadows, icon weight, and animation language.

Do not “solve” this by adding more gradients, more glow, more floating cards, more random particles, or oversized rounded containers. The goal is restraint, craft, and a clear visual idea.

---

## 2. Design direction

### Brand character
Proofline is a trustworthy operations product for distributors, wholesalers, manufacturers, and procurement teams. It should feel:
- Precise, calm, credible, engineered, and quietly premium.
- More like a mature B2B software product than an AI startup template.
- Visual-first, but still clear and usable for real operators.

### Keep the existing brand palette
- Warm off-white / pale neutral backgrounds.
- Deep forest / evergreen for primary actions and dark sections.
- Restrained lime/chartreuse accents for scan activity, detected exceptions, and focus moments.
- Dark near-black green for the AI section.
- Muted green-gray for supporting text and hairline borders.

Use lime as a signal, not a decoration. Keep sufficient contrast and do not rely on color alone to communicate state.

### Typography and layout
- Inspect existing fonts first; reuse the best current choice if it works. Otherwise use a polished, readable modern sans-serif.
- Keep the H1 assertive but controlled. Avoid awkward word wrapping, overly tight line height, or a headline that consumes the entire first fold.
- Use consistent content max-width, rhythm, gutters, and responsive spacing.
- Give sections breathing room, but avoid excessive empty space that makes the page feel unfinished.
- Maintain clear hierarchy between kicker, heading, body copy, CTA, and visual.
- Make buttons, navigation links, status chips, and focus states feel deliberate and consistent.

---

## 3. Hero: highest priority

Redesign the hero visual as a single composed **reconciliation scene**, not a static product-card collage.

### Core story
The scene must communicate the following sequence without requiring explanatory paragraphs:
1. A physical delivery / carton is received.
2. Three digital records appear around it: Purchase Order, Receiving Record, and Supplier Invoice.
3. A restrained scan passes through the records and carton; matching fields briefly align.
4. A discrepancy is highlighted with evidence (e.g. ordered 100, received 94, 2 damaged, invoice billed 100).
5. The result settles into a clean “Needs review” / mismatch summary.

The AI should be shown as **assisting extraction and comparison**, not magically deciding the dispute.

### Composition rules
- Make one strong hero composition, with the text column and visual column balanced at desktop widths.
- Let the parcel and document cards feel part of the same spatial scene. Use deliberate overlap, consistent perspective, and connectors that terminate on meaningful points in the UI.
- The carton should have realistic proportions/material and refined lighting. Avoid an overly plain low-poly box, oversized tape stripe, or a box that looks like a default 3D primitive.
- The three document panels must be distinguishable by role. They need enough detail to read as PO / receipt / invoice at a glance, but not so much tiny text that they become noise.
- Highlight only the data fields that matter: PO quantity, received quantity, damaged quantity, and billed quantity. Use the lime accent sparingly to show the active scan/match.
- The mismatch card should be the visual payoff, positioned with clear hierarchy and not covering the key 3D subject.
- Remove random decorative diamonds / arbitrary orbit shapes unless they meaningfully support the scan or connection story.
- Avoid putting the entire scene inside a large empty rounded rectangle. The scene should breathe into the page background with a subtle, intentional ground/shadow treatment.
- Use depth of field only very gently, if at all. The product UI must remain legible.

### Motion specification
Animation should be smooth, subtle, and purposeful—not a looping gimmick.
- Idle state: extremely subtle parallax/float, around 2–4 px with a slow 6–10 second cycle. Different layers can move at slightly different rates.
- Scan cycle: after the page is ready, a scan highlight travels through PO → receipt → invoice once, pauses at a mismatch, and settles. Cycle no more frequently than approximately every 7–10 seconds; also support a static state.
- Matching fields may briefly illuminate when connected. Use opacity/transform rather than expensive layout animation.
- The mismatch panel appears with a small, controlled reveal (opacity + 6–10 px translate), not a dramatic pop.
- Avoid constant fast orbiting, spinning boxes, bouncing cards, continuous glowing pulses, or long intro animations that delay understanding.
- Use `prefers-reduced-motion: reduce` to disable parallax, scan loops, and nonessential motion. Show a polished static composition in that mode.
- Ensure the initial hero is visually complete immediately; no blank canvas while WebGL loads.

### Implementation approach
- First inspect the current implementation, dependencies, and asset folder. Reuse existing visual assets where suitable, including the supplied workflow illustrations.
- If the repository already uses Three.js / React Three Fiber, improve the existing scene rather than layering in another renderer.
- If a genuine, controllable 3D implementation is not practical, use a carefully composed transparent PNG/optimized illustration plus DOM-based motion. Do not add a heavy 3D dependency just to claim “3D”.
- If using WebGL, implement loading and error fallbacks, responsive sizing, reduced-motion behavior, and reasonable GPU usage. Avoid a huge bundle for a single hero.
- Prefer reusable components and keep the visual state deterministic. The hero must not depend on fabricated live AI results.
- Keep text, CTAs, and status details accessible as real HTML; do not bake essential text into an image.

### Hero copy and CTAs
Keep the current meaning, but refine copy only when it makes the proposition clearer. The main CTA must work. The secondary CTA should scroll to the workflow or open an actual demo—not be dead. Avoid unsupported performance claims or fake customer logos.

---

## 4. Header and brand polish

- Ensure every place uses **Proofline** exactly: navbar, page title, metadata, footer, demo panel, and accessibility labels.
- Use a crisp brand mark. Do not display a low-resolution or glowing 3D logo in the navbar. For header/favicons, use the clean SVG mark if present; ensure the icon remains legible at 20–32 px.
- Keep the header quiet and lightweight. Align logo, nav, sign-in, and primary CTA vertically; balance horizontal gaps and hit areas.
- Use a restrained sticky/scrolled header behavior only if it improves navigation. No large backdrop blur that reduces text clarity.
- Mobile: collapse navigation cleanly and keep the main CTA accessible without overflow.

---

## 5. Workflow section: Receive → Verify → Resolve

The current illustrations are too small and disconnected. Make this section read as a visual sequence.

### Layout
- Keep three numbered stages, but give each illustration enough scale and breathing room to be recognized without zooming.
- Each stage should have one clear visual, one short title, and a short description.
- Use a horizontal progression on wide screens and a clean vertical/stacked progression on mobile.
- Use arrows/connectors that establish direction between stages but do not dominate the art.
- Align artwork baselines and card/text blocks consistently; don't let asset dimensions make the columns feel uneven.

### Assets
Use the provided workflow assets when available:
- `01-receive-box-scanner.png` — carton plus scanner beam.
- `02-verify-three-way-match.png` — PO, receiving record, and invoice connected.
- `03-resolve-supplier-case.png` — supplier-resolution workspace.

Recommended public assets path: `public/images/workflow/`.
- Preserve transparency; use `object-fit: contain`, not `cover`.
- Crop excess transparent padding only if it can be done safely without cutting shadows or the subject.
- Avoid stretching images or forcing a single aspect ratio that makes one illustration tiny.
- Add restrained hover/scroll reveals, not spinning or bouncing animations.

### Meaning
- **Receive:** record quantities and damage evidence, with a barcode scan visual.
- **Verify:** compare PO, receipt, and invoice. Show the three-way relationship unmistakably.
- **Resolve:** supplier response, approved replacement/credit, verified closure.

---

## 6. Product dashboard showcase

Improve the existing dashboard showcase without turning it into a second hero.
- Make the UI large enough to inspect at a glance and keep it consistent with the real app styles.
- Use a purposeful frame and slight perspective/overlap only if subtle. Avoid excessive tilt that makes data unreadable.
- Ensure text in the mock dashboard is crisp enough, and table columns/status pills line up. Prefer real HTML UI for key portions where practical instead of embedding unreadable fake text in an image.
- Keep the accompanying copy concise and connected to the visible dashboard features.
- If demo data is shown, label it clearly as **Example data**. Never present fabricated metrics, customer names/logos, percentages, or financial results as real customer proof.
- Keep table and dashboard screenshots responsive; on small screens, use a deliberate crop/stacking or hide secondary details, not accidental overflow.

---

## 7. Dark AI feature section

Current dark section is too close to a generic “documents → brain → result” template. Refine it into a coherent evidence-to-insight sequence.

- Retain the near-black evergreen background with subtle grid/ambient gradient; keep the grid low contrast.
- Use the PO, receipt, and invoice as the source objects. Connect them to a compact “Field extraction & matching” stage, then to a discrepancy summary showing evidence references.
- Prefer field-level comparison (100 ordered / 94 received / 100 billed) over a generic glowing AI brain icon.
- Visual emphasis should be on provenance and traceability: show that each highlighted value links to a document/receipt source.
- Use small, elegant lime highlights only where a field is matched or a mismatch is found.
- Refine spacing and alignment between text and visual. Avoid making the section a long empty horizontal strip.
- CTA must go to a real explanation/demo destination.
- In mobile, stack text and illustration and prevent sideways overflow.

---

## 8. Trust strip and credibility

- If logos do not represent real customers, do not show them as trusted-by brands. Replace the fake-logo row with truthful audience/benefit labels (e.g. Distributors, Wholesalers, Manufacturers, Procurement teams) or clearly labelled “Built for…” text.
- Keep the trust strip visually quieter than the hero. Do not invent claims such as “94% faster” or “100% audit-ready” without measured evidence.
- If metrics are illustrative, label them “Illustrative example” or remove them from the public landing page.

---

## 9. Interaction, accessibility, and responsive behavior

- Test at minimum 1440 px desktop, 1024 px tablet, and 390 px mobile widths.
- On mobile, place the headline and CTA first; the hero scene should fit the viewport without making the first screen feel endless.
- The document cards must not overlap the headline or cover key mismatch details at any breakpoint.
- Include accessible names for icons/buttons, visible keyboard focus, sufficient text contrast, semantic heading hierarchy, and meaningful image alt text.
- Add scroll-triggered reveals only if they do not hide content before JS loads. Prefer Intersection Observer / the existing animation library.
- Avoid layout shift: reserve image/scene space with a stable aspect ratio and dimensions.
- Respect reduced-motion settings and avoid animation that can trigger discomfort.
- All buttons and links must work. Do not leave dead “Watch demo”, “Explore product”, “See how it works”, or footer links.

---

## 10. Performance and code quality

- Inspect existing project architecture before editing and reuse current patterns and dependencies.
- Optimize image formats/sizes where possible, lazy-load below-the-fold artwork, but prioritize-loading the hero visual.
- Avoid adding multiple animation libraries. Use the existing stack first.
- Do not run an always-on render loop if the 3D scene does not need it. Prefer demand-based rendering/low frame rate where appropriate.
- Clean up animation listeners, observers, and rendering resources on unmount.
- Prevent hydration warnings and avoid reading `window`/WebGL state during server rendering without safe client boundaries.
- Keep console clean; no missing-asset 404s, React key warnings, or animation errors.
- Preserve working routes, authentication, API calls, and existing product behavior.

---

## 11. Required implementation sequence

### Pass 1 — Audit
1. Inspect the current landing-page components and CSS, available assets, current animation library, and package dependencies.
2. Identify why the existing hero scene looks generic and which parts are fake/static.
3. Return a brief plan and list exact files to modify before coding.

### Pass 2 — Hero composition
1. Build the hero scene first.
2. Balance headline/CTA against the visual; refine parcel proportions, panel perspective, light, shadow, and depth hierarchy.
3. Implement the scan → compare → mismatch motion with reduced-motion and static fallbacks.
4. Verify the hero at desktop and mobile sizes before moving on.

### Pass 3 — Workflow and remaining sections
1. Improve the three workflow illustrations using the supplied assets.
2. Polish the dashboard product showcase.
3. Improve the dark AI section's visual story.
4. Fix header/logo sharpness, typography rhythm, section spacing, responsive behavior, and CTA destinations.

### Pass 4 — Verification
Run the project's available commands for lint, typecheck, tests, and production build. Open the page at desktop/tablet/mobile widths and inspect the result. Fix issues found; do not just list them.

---

## 12. Acceptance checklist

The work is complete only when all applicable items pass:
- [ ] The hero feels intentionally art-directed and premium, not like a default AI landing-page template.
- [ ] The visual tells a clear receive → compare → mismatch story in a few seconds.
- [ ] PO, receipt, invoice, parcel, and mismatch details feel spatially connected rather than like unrelated floating cards.
- [ ] Scan/match animation is smooth, restrained, and not distracting.
- [ ] A good static fallback exists and respects `prefers-reduced-motion`.
- [ ] Header logo is crisp and every brand reference says Proofline.
- [ ] Workflow illustrations are prominent, consistently aligned, and not stretched/cropped.
- [ ] Dashboard preview is legible and labels demo data honestly.
- [ ] Dark AI section communicates source-grounded extraction and matching rather than generic AI.
- [ ] No invented customer logos, performance metrics, or unsupported claims are shown as real.
- [ ] Desktop, tablet, and mobile have no unintended overflow, overlapping elements, or layout shift.
- [ ] All CTAs/links work; no dead buttons.
- [ ] Reduced motion, accessibility, and keyboard focus are considered.
- [ ] Lint/typecheck/tests/build results are reported accurately; remaining gaps are listed.

---

## Final instruction to the coding agent

Act as a senior product designer and senior frontend engineer. Make the current Proofline page feel custom-designed, credible, smooth, and production-minded. **Polish the existing direction rather than replacing it blindly.** Spend the most effort on the hero's visual composition and purposeful scanning animation, then bring the workflow, dashboard showcase, and dark AI section up to the same design standard. Do not claim completion until the page has been visually checked at desktop and mobile widths and all available checks have been run.
