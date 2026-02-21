# Issue: Social proof & lead magnet section buttons not working consistently

**Status:** Active
**Opened:** 2026-02-18
**Resolved:** _pending_

## Info
- **Symptom:** Buttons in the social proof section (Google Reviews link) and lead magnet section (Get the Free Playbook CTA) don't work consistently — clicking produces no response (no navigation, no visual feedback). Popup was never opened during testing. Desktop browser.
- **Affected area:** `index.html`, `playbook-optin.html`

### Previous Resolution (2026-02-18)
Root cause was GoHighLevel's `form_embed.js` creating full-viewport fixed overlays at z-index 10000. Fix: lazy-load the script only in `openSurveyPopup()`.

### Regression (2026-02-20)
User reports buttons broken again after changes to index.html (new Request a Call CTA section, lead magnet grid refactor) and navigation.js updates.

**Confirmed still in place:**
- No static `<script src="form_embed.js">` tags in any active HTML file
- Lazy-load function in navigation.js (line 391-400) intact
- Popup overlay has `pointer-events: none` when inactive

**Suspected new vector:**
- The survey iframe `src="https://links.1584design.com/widget/survey/..."` is hardcoded in the popup HTML — loads immediately on page load even though popup is hidden
- GoHighLevel widget may trigger overlay creation via iframe communication or script injection
- After popup open/close cycle, `form_embed.js` overlays persist (no cleanup in `closeSurveyPopup()`)

## Experiments

### H1 (Round 1): Popup overlay `transition: all` blocks clicks after popup close
- **Verdict:** Ruled Out (popup was never opened; fix applied as defensive measure)

### H2 (Round 1): Delegated `a[href*="#"]` handler intercepting button clicks
- **Verdict:** Ruled Out (neither button's href contains `#`)

### H3 (Round 1): CSS stacking/z-index preventing clicks
- **Verdict:** Ruled Out (all overlays have `pointer-events: none`, content z-indices correct)

### H4 (Round 1): GoHighLevel `form_embed.js` creating invisible overlays that block clicks
- **Rationale:** Script creates `ep-overlay` elements with `z-index: 10000; position: fixed; top/bottom/left/right: 0`. Page's highest z-index is 2000.
- **Experiment:** Comment out `<script src="https://links.1584design.com/js/form_embed.js">` and test buttons.
- **Result:** Buttons work immediately after removing the script.
- **Verdict:** Confirmed

### H5 (Round 2): Iframe loads GoHighLevel widget immediately, triggering overlay creation
- **Rationale:** `<iframe src="https://links.1584design.com/widget/survey/...">` is in the DOM with src hardcoded. Widget page may signal parent or trigger overlay creation even without form_embed.js loaded statically.
- **Experiment:** Defer iframe src (use data-src, set in openSurveyPopup) and test.
- **Result:** _pending user verification_
- **Verdict:** _pending_

### H6 (Round 2): form_embed.js overlays persist after popup close
- **Rationale:** `closeSurveyPopup()` removes `.active` class but never cleans up `ep-overlay` elements created by `form_embed.js` during popup open.
- **Experiment:** Add overlay cleanup in `closeSurveyPopup()`.
- **Result:** _pending user verification_
- **Verdict:** _pending_

## Resolution
_Do not fill this section until the fix is verified._
