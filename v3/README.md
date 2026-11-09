# Built Environment Equity - Causal Atlas

An interactive, English-language causal loop diagram about inequity in the built environment. Select any arrow or feedback loop to inspect its explanation, evidence anchors, source locations and assumptions. The interface supports search, pan, zoom and SVG, JSON and CSV exports.

## Open locally

Open `index.html` in a modern browser. Keep all files in this directory together. The model is bundled in `model.js`, so no server, API key, package installation or build step is required.

## Straight-line editor — 9 November 2026

This revision is published separately as **v3**, including straight-line routing and draggable bends. The original site and v1 remain unchanged.

Arrows now consist of straight segments. Automatic routes avoid variable cards and preserve the six thematic regions, source/target direction, polarity, evidence style and delay notation. Crossing arrows do not create an additional causal connection; only arrowheads attach relationships to variables.

1. Click **Edit lines**, then select an arrow. The highlighted handles belong to that arrow only.
2. Drag a bend to adjust its position. Drag a segment's midpoint to add a bend. Endpoints remain attached to the original source and target variables.
3. Use **Undo**, **Redo** or **Reset link** to revise an edit. The editor also supports keyboard movement of a focused handle and deletion of a bend.
4. Edits are saved for this browser profile and page location when local storage is available. Use **Save layout** to keep a portable JSON copy, and **Load layout** to restore it. The full system and each isolated loop keep separate layouts.
5. Leave editing mode to inspect the evidence as usual. **Export view** and **Export > Full system as SVG** include the adjusted lines with a tight crop, English labels and notation legend, without editing handles. SVG is a vector format suitable for further figure preparation.

Layout files contain presentation coordinates only. They do not modify `model.json`, variable meanings, link polarity or loop membership. If a manually adjusted route crosses a variable card, the editor flags it for correction before export.

## GitHub Pages: version v3

Current version: https://ttang-lang.github.io/built-environment-equity-cld/v3/

Earlier versions remain available:
- Original: https://ttang-lang.github.io/built-environment-equity-cld/
- v1: https://ttang-lang.github.io/built-environment-equity-cld/v1/

The repository publishes `main` from its root. This release is a self-contained snapshot under `v3/`, with relative asset, download and review links. Update only `v3/` files to change this version. Keep all earlier versions and repository-root website files unchanged.

No API key, build step, package installation or additional GitHub Pages configuration is required. Browser-saved line edits are stored locally; transfer a custom layout with **Save layout** and **Load layout**.

## Model and provenance

The atlas contains **35 variables**, **77 signed relationships**, and **10 highlighted feedback loops**: **5 reinforcing** and **5 balancing**. It draws on the six corrected papers identified in the supplied *Automated CLD input parameters* presentation. Earlier local papers are superseded. Bibliographic records, DOI links, source locations, evidence anchors and modelling assumptions are included in the application and data exports.

The diagram is a literature-informed conceptual synthesis, not an estimated causal model or numerical simulation. Associations, synthesis assumptions, conditional policy responses, proposed indicator relationships and algebraic definitions are explicitly distinguished. Loop cards identify source-described, adapted, policy-design, exploratory and context-dependent mechanisms. Structural validation confirms closed signed loops and internal references; it does not establish causal effects, feedback strength or loop dominance. The highlighted loops are selected mechanisms, not an exhaustive list of every possible cycle.

The supplied brief announces six human-needs categories but enumerates five. The atlas follows the five enumerated categories and records this discrepancy in its interpretation notes.

## Scientific review — 3 November 2026

Open [CLD_REVIEW.html](CLD_REVIEW.html) for the variable, relationship and loop audit. [cld_review.json](cld_review.json) records before/after changes and retired relationships. This AI-assisted methodological review does not replace independent expert, stakeholder or empirical validation. The revised model retains 35 variables and 10 selected loops; three unsupported or unspecified shortcuts were retired and two explicitly algebraic income-to-burden links added. Proposed prevalence-gap definitions require local threshold and population decisions.

## Study population and terminology

The model uses **Residents facing disadvantage** for residents facing barriers to adequate housing, accessible transport, safe public spaces or essential services. Possible populations include low-income renters facing housing-cost pressure and residents facing mobility barriers; these examples do not establish one universal population. Define local inclusion criteria and a suitable **reference group** before empirical use, then follow the same groups over time, including movers.

The method panel and both gap-variable panels explain these definitions. A gap is the outcome percentage among the study group minus the percentage in the reference group; a zero gap does not establish adequate conditions for either group.

Version `2026-11-03.2` clarifies population terminology and explanations. [terminology_revision.json](terminology_revision.json) records the changes from `2026-11-03.1`. The earlier [scientific-review ledger](cld_review.json) is retained as a historical record; its before/after values use the terminology of that review version.

## Diagram presentation

The local page opens with the original six thematic regions and a compact explorer. Adjacent region boundaries use a consistent 96-unit gutter, vertically between the five main bands and horizontally beside the outcomes column. The region order and node order within each region are retained; the outcomes and work-participation nodes align in the right column. **Full screen** (or **F**) gives the map the full display; **Esc** restores the previous panels. **Explore** and **Details** independently show the navigation and evidence panels. **Fit view** / **0** frames the diagram, and **100%** restores its original text size. Drag to pan; use the wheel or touch pinch to zoom.

Selecting a feedback loop highlights its path in the original thematic map. **Isolate loop** explicitly opens the optional separate cycle; **Show in full system** restores the thematic map. **Full system** clears the loop selection. The arrow buttons browse all ten loops even with the explorer hidden. Individual variables and relationships remain clickable for definitions, assumptions and evidence.

**Export view** downloads the current diagram, including an isolated loop when selected. **Export > Full system as SVG** always downloads all 35 variables and 77 relationships. Both SVGs contain the sign, line-style and delay legend plus the model version. The original thematic regions are preserved, with the same evenly spaced presentation layout used on screen and in the SVG. Source coordinates in the model data remain unchanged. Straight-segment routing does not change the causal model in `model.json`; full-system SVG exports include all six region backgrounds and headings.

SVG exports are cropped to the rendered diagram, including its labels, with a compact title and notation legend. They do not inherit the screen viewport, pan position or zoom level. Arrowheads, strokes and outlines scale together; the final short segment of each arrow is continuous so dashed and dotted relationships meet their arrowheads cleanly. The rest of each line retains its evidence-style notation. Each arrow has an aligned final approach, and polarity/delay badges avoid all arrowheads. The shaft ends inside its triangular head, so its rounded cap cannot protrude past the tip, including when hovered or selected. Arrow tips sit 0.8 diagram units from their target cards. Visible lines take precedence over overlapping invisible click areas. The earlier curved version is recorded in `qa/presentation_validation.json` and `qa/svg_rendering_validation.json`. Current straight-line editing and export checks are recorded in `qa/line_editor_validation.json`; `qa/straight_full_system.svg` is the new full-system export.

The page needs `graph_geometry.js`, `presentation.css`, `line_editor.js` and `line_editor.css` alongside the original assets. It works directly from `index.html` without an API, server or build step. This presentation is published separately as version `v3`; the original root website and v1 are preserved.

## Validation

The validation reports record checks run before publication. Their historical publication flags describe that test run; this README identifies the current hosted release.

The straight-line revision passed 57 browser checks and 30 data-integrity checks. The geometry audit checks all 115 routes across the full system and ten isolated loops, all 77 manual-route round trips, and preservation of the model and automatic-route cache. These tests validate drawing and interaction, not empirical causal effects.

See `qa/check_line_editor.py`, `qa/check_model_data_integrity.py` and `qa/check_straight_geometry.js` for reproducible checks.

## Files

| File | Purpose |
| --- | --- |
| `index.html`, `app.css`, `presentation.css`, `app.js`, `graph_geometry.js`, `line_editor.js`, `line_editor.css` | Static interactive application and diagram presentation |
| `model.js` | Browser-ready model for local and hosted use |
| `model.json` | Complete model, bibliography and provenance |
| `variables.csv`, `causal_links.csv`, `feedback_loops.csv` | Variables, signed links and named loops |
| `sources.csv`, `evidence_anchors.csv` | Bibliographic records and traceable evidence locations |
| `validation.json`, `browser_validation.json` | Structural and browser validation records for this version |
| `.nojekyll` | Serves the package as plain static files on GitHub Pages |

Source article PDFs, the original presentation, credentials and hosting-service configuration are not included. Follow the cited publishers' or repositories' links to consult the original sources.
