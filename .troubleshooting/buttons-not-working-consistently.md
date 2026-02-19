# Issue: Social proof & lead magnet section buttons not working consistently

**Status:** Resolved
**Opened:** 2026-02-18
**Resolved:** 2026-02-18

## Info
- **Symptom:** Buttons in the social proof section (Google Reviews link) and lead magnet section (Get the Free Playbook CTA) don't work consistently — clicking produces no response (no navigation, no visual feedback). Popup was never opened during testing. Desktop browser.
- **Affected area:** `index.html`, `playbook-optin.html`

## Experiments

### H1: Popup overlay `transition: all` blocks clicks after popup close
- **Verdict:** Ruled Out (popup was never opened; fix applied as defensive measure)

### H2: Delegated `a[href*="#"]` handler intercepting button clicks
- **Verdict:** Ruled Out (neither button's href contains `#`)

### H3: CSS stacking/z-index preventing clicks
- **Verdict:** Ruled Out (all overlays have `pointer-events: none`, content z-indices correct)

### H4: GoHighLevel `form_embed.js` creating invisible overlays that block clicks
- **Rationale:** Script creates `ep-overlay` elements with `z-index: 10000; position: fixed; top/bottom/left/right: 0`. Page's highest z-index is 2000.
- **Experiment:** Comment out `<script src="https://links.1584design.com/js/form_embed.js">` and test buttons.
- **Result:** Buttons work immediately after removing the script.
- **Verdict:** Confirmed

## Resolution

- **Root cause:** GoHighLevel's `form_embed.js` creates full-viewport fixed overlays at z-index 10000 on page load, blocking all pointer events on underlying content.
- **Fix:** Lazy-load `form_embed.js` only when the popup opens (`openSurveyPopup()` in `navigation.js`), so the script never runs on page load and its overlays don't block clicks.
- **Files changed:**
  - `js/navigation.js` — added `loadFormEmbed()` helper, called from `openSurveyPopup()`
  - `index.html` — removed static `<script>` tag, applied `pointer-events` fix to `.popup-overlay`
  - `playbook-optin.html` — removed static `<script>` tag, applied `pointer-events` fix to `.popup-overlay`
- **Lessons:** Third-party embed scripts (GoHighLevel, HubSpot, etc.) can silently create high-z-index overlays that block clicks across the entire page. Always lazy-load them rather than including at page level. When buttons "don't work," use DevTools element picker to check what's actually receiving the click.
