# Built Environment Equity - Causal Atlas

An interactive, English-language causal loop diagram about inequity in the built environment. Select any arrow or feedback loop to inspect its explanation, evidence anchors, source locations and assumptions. The interface supports search, pan, zoom and SVG, JSON and CSV exports.

## Open locally

Open `index.html` in a modern browser. Keep all files in this directory together. The model is bundled in `model.js`, so no server, API key, package installation or build step is required.

## Publish with GitHub Pages

1. Create a public GitHub repository and upload the contents of this directory to its root, including the hidden `.nojekyll` file.
2. Open the repository's **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select **main** and **/ (root)**, then save.
5. When deployment completes, open `https://YOUR_GITHUB_USERNAME.github.io/REPOSITORY_NAME/`.

All application assets use relative paths and work under a GitHub Pages project subdirectory. No GitHub Actions workflow is required. Publishing the repository makes its files, model and evidence metadata publicly accessible.

## Model and provenance

The atlas contains **35 variables**, **78 signed relationships**, and **10 highlighted feedback loops**: **5 reinforcing** and **5 balancing**. It draws on the six corrected papers identified in the supplied *Automated CLD input parameters* presentation. Earlier local papers are superseded. Bibliographic records, DOI links, source locations, evidence anchors and modelling assumptions are included in the application and data exports.

The diagram is a literature-informed conceptual synthesis, not an estimated causal model or numerical simulation. Associations, synthesis assumptions, conditional policy responses and indicator relationships are explicitly distinguished. Structural validation confirms closed signed loops and internal references; it does not establish causal effects, feedback strength or loop dominance. The highlighted loops are selected mechanisms, not an exhaustive list of every possible cycle.

The supplied brief announces six human-needs categories but enumerates five. The atlas follows the five enumerated categories and records this discrepancy in its interpretation notes.

## Files

| File | Purpose |
| --- | --- |
| `index.html`, `app.css`, `app.js` | Static interactive application |
| `model.js` | Browser-ready model for local and hosted use |
| `model.json` | Complete model, bibliography and provenance |
| `variables.csv`, `causal_links.csv`, `feedback_loops.csv` | Variables, signed links and named loops |
| `sources.csv`, `evidence_anchors.csv` | Bibliographic records and traceable evidence locations |
| `validation.json`, `browser_validation.json` | Structural and browser validation records for this version |
| `.nojekyll` | Serves the package as plain static files on GitHub Pages |

Source article PDFs, the original presentation, credentials and hosting-service configuration are not included. Follow the cited publishers' or repositories' links to consult the original sources.
