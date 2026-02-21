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

### H7 (Round 3): Prefetch resource hints causing form_embed.js to execute on load
- **Rationale:** Added `<link rel="prefetch" href="form_embed.js" as="script">` and `<link rel="preconnect">` to all 3 pages, plus idle-time prefetch of survey iframe URL. User reports hover and text selection broken immediately after these changes.
- **Experiment:** Check if prefetch hints can trigger script execution; inspect for any other elements blocking pointer events.
- **Result:** Per spec, `prefetch` should not execute scripts. However, GoHighLevel's infra may have side effects on connection (tracking, service worker). Unclear if prefetch was the cause or if this was the pre-existing regression from Round 2.
- **Verdict:** Inconclusive — reverted prefetch approach entirely as precaution.

### H8 (Round 3): Eager load with MutationObserver overlay removal
- **Rationale:** Load form_embed.js eagerly, use MutationObserver to remove z-index:10000 overlays.
- **Result:** Still broken. User hard-refreshed, hovered once, all buttons stopped working. MutationObserver misses overlays — likely because GHL sets styles after node insertion (observer fires before styles are applied) or creates overlays in response to mouse events.
- **Verdict:** Ruled Out — MutationObserver can't reliably catch GHL's overlay creation.

### H9 (Round 3): Preload iframe only, keep form_embed.js strictly lazy
- **Rationale:** The iframe is cross-origin and cannot modify the parent page's DOM — safe to preload.
- **Result:** Page works on load. But after opening and closing the popup once, buttons break again. Confirms H6 — overlays persist after close. The iframe preload itself is fine.
- **Verdict:** Partial success — preload works, but cleanup is the real problem.

### H10 (Round 3): closeSurveyPopup() cleanup using computed styles
- **Result:** Still broken. No rogue fixed-position elements found by computed style scan.
- **Verdict:** Ruled Out — the blocking element is not a z-index overlay.

### H11 (Round 3): DOM inspection reveals iframe is the blocker
- **Rationale:** Capture-phase click listener on document didn't fire when clicking broken buttons, but GoHighLevel scripts (BYJKNDmj.js, BVaLSSAM.js) did fire. This means clicks go into a cross-origin iframe, not the parent page.
- **Experiment:** `document.querySelectorAll('iframe')` with computed styles after popup close.
- **Result:** iframe shows `pos:static z:auto pe:auto vis:visible 792x520`. The iframe has `visibility: visible` and `pointer-events: auto` even though parent `.popup-overlay` has `visibility: hidden; pointer-events: none`. GoHighLevel's `form_embed.js` explicitly sets these on the iframe, overriding inherited values. CSS spec allows children to override inherited `visibility: hidden` with explicit `visibility: visible`.
- **Verdict:** Confirmed — iframe is the root blocker.

### H12 (Round 3): CSS rule to force iframe inert when popup is not active
- **Rationale:** Since form_embed.js forces `visibility: visible; pointer-events: auto` on the iframe, the parent's inherited styles aren't enough. A CSS rule with `!important` on the iframe directly will override form_embed.js's inline styles.
- **Implementation:** Added to all 3 pages: `.popup-overlay:not(.active) iframe { pointer-events: none !important; visibility: hidden !important; }`
- **Experiment:** User to open popup, close it, test hover/text-select/button clicks.
- **Result:** _pending user verification_
- **Verdict:** _pending_

## Resolution
_Do not fill this section until the fix is verified._
