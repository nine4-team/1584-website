# 1584 Design Website Redesign

## Working agreement

The redesign is being developed in `/redesign/` so the current homepage and live service pages remain untouched. The staging pages are intentionally excluded from the main navigation and sitemap until cutover is approved.

## Page architecture

### Entry and service pages

- `/redesign/` - audience-selection landing page
- `/redesign/vacation-rental.html` - vacation rental owner service page
- `/redesign/vacation-home.html` - vacation home owner service page

### Projects

- `/redesign/projects/` - future project index
- `/redesign/projects/{project-name}.html` - dedicated case study pages

The service-page project cards link to dedicated pages. Project details will not be hidden in accordions because permanent pages offer stronger storytelling, sharing, accessibility, and search value.

## Confirmed positioning

The umbrella specialty is full-service interior design for vacation homes.

- Vacation rental path: the property is primarily rented to paying guests and expected to perform as an investment.
- Second home path: the property is primarily used by the owner, family, and friends, even if it is occasionally rented.
- Shared promise: 1584 Design plans, procures, installs, and styles the entire property.

## Page sequence

### Landing page

1. Umbrella specialty
2. Primary-use question
3. Two visual audience choices
4. Compact proof line

### Vacation rental page

1. Two-column hero
2. Proof bar
3. Investor recognition and outcome
4. Three featured projects
5. Three Performance Stages
6. Full-service process
7. Relevant review
8. Fit criteria and FAQ
9. Project-assessment CTA and STR Playbook

### Second home page

1. Two-column hero
2. Proof bar
3. Owner recognition and emotional outcome
4. Three featured projects
5. Intentional Home principles
6. Full-service process
7. Relevant review
8. Fit criteria and FAQ
9. Project-assessment CTA and Second Home Guide

## Project-page template

1. Hero image, title, and one-sentence project summary
2. Quick facts: location, type, size, bedrooms, guest capacity when relevant, completion year, and scope
3. Client goal or project challenge
4. Design strategy
5. Editorial gallery
6. Three to five explained design decisions
7. Outcome and client quote
8. Related projects
9. CTA to the relevant service

Vacation rental outcome modules may include verified occupancy, ADR, review, booking, guest-capacity, or launch data. Second home outcome modules emphasize how the home is used and how it feels to the owners. Unsupported performance claims will not be presented as case-study facts.

## Initial project lineup

### Vacation rentals

- Hyer - confirmed as the first prototype
- Cindy - pending photography and project facts
- Hal - pending photography and project facts
- Sandra - reserve unless the photography supports the site standard

### Second homes

- Stoddard - existing website image library is available
- Bradshaw - pending confirmation of primary use and photography review
- Brimhall - existing portfolio library is available; project facts still needed

Public project titles will be property-led rather than surname-led unless a client has explicitly approved public use of their name.

## Image handling

- Preserve original files unchanged.
- Store selected site derivatives under `/redesign/assets/images/` during staging.
- Export WebP or AVIF at responsive widths appropriate to the layout.
- Use `<picture>` or `srcset` so mobile devices do not download desktop-size assets.
- Record useful, project-specific filenames and alt text.
- Load the lead image eagerly and gallery images lazily.
- Confirm focal points at desktop and mobile breakpoints.

### Existing website image inventory

- 64 original Hyer Martinique photographs are stored locally and are suitable for a complete project gallery.
- 6 named Stoddard originals are stored locally, plus a much larger Stoddard set represented in the portfolio manifests and optimized library.
- Brimhall photography is represented throughout the current portfolio manifests and optimized library.
- 964 optimized portfolio derivatives are already present. These are responsive-size versions, not 964 unique photographs.
- 9 portfolio-category originals, 44 community images, 12 hero derivatives, and review/property-review screenshots are also available.
- No clearly identified Cindy, Hal, Sandra, or Bradshaw finished-project photo directory was found in the current website image folders.

## Cutover plan

1. Complete and review all staging pages locally.
2. Confirm project names, facts, testimonials, and image rights.
3. Validate responsive layout, accessibility, metadata, schema, and links.
4. Copy the approved staging landing page to the root homepage.
5. Replace the two existing service pages while preserving their current public URLs.
6. Add project pages and update navigation, sitemap, canonical links, and internal links.
7. Redirect or evolve `/portfolio` into the project index without losing existing traffic.
8. Deploy only after explicit approval.

## Open decisions

- Confirm whether Bradshaw is primarily personal-use or rental-use.
- Confirm the final three projects for each audience.
- Provide or locate Cindy, Hal, Bradshaw, and Brimhall photography.
- Gather project facts and permission-safe client quotes.
- Decide final public-facing project names.
- Confirm whether project budget ranges should be public.
