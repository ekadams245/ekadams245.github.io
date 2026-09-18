# Emma K. Adams

Source for [ekadams245.github.io](https://ekadams245.github.io/), my personal site.

I'm a finance and accounting student at Emory University's Goizueta Business School
(BBA 2027). I work in equity research from two directions: fundamental analysis of
individual companies, and quantitative research into the systematic factors that drive
returns across asset classes.

- [LinkedIn](https://www.linkedin.com/in/emma-k-adams/)
- [ekadams245@gmail.com](mailto:ekadams245@gmail.com)

## Research

The files for each project can be downloaded individually from the
[Research page](https://ekadams245.github.io/research.html).

- **Sally Beauty Holdings (NYSE: SBH), short.** A team pitch for the MBP Capital, LSE and
  Citadel 2026 Global Stock Pitch Competition. The thesis argues that margins are
  structurally fragile as the sales mix shifts toward e-commerce. It uses state-level
  foot traffic across 2,564 stores, and a DCF at a 7.88% WACC implies $6.65 a share.
- **Style factors in cryptocurrencies.** Individual research for the Blockchain at Emory
  Review. It tests whether crypto returns decompose into systematic factors, using nine
  factor series across twelve tokens and regressions on Bitcoin, Ethereum and Solana.

## Experience

- Arch Capital Management: Quantitative Research Intern (beginning September 2026)
- J.P. Morgan Global Private Bank: Investment Solutions Intern, Dynamic Multi-Asset Strategies (2026)
- Morgan Stanley, Parametric: Investment Strategy Analyst, commodity factor research (2025)

The full résumé is on the [Résumé page](https://ekadams245.github.io/resume.html) and
available as a PDF.

## About the site

Plain HTML, CSS and JavaScript served by GitHub Pages, with no build step or
dependencies beyond the Archivo web font. `.nojekyll` makes Pages serve the files as-is.

| File | Purpose |
| --- | --- |
| `index.html`, `research.html`, `resume.html` | The three pages |
| `styles.css`, `site.js` | Shared styles, background animation and scroll effects |
| `og-image.png` | Link preview image for LinkedIn and other social sites |
| `sitemap.xml`, `robots.txt` | Search engine indexing |
| `materials/<project>/` | The research files linked from `research.html` |
| `google73b0b4f383307c8e.html` | Google Search Console ownership check (keep this file) |

### Preview locally

```bash
python -m http.server 8770
```

Then open http://localhost:8770.

### Add a research file

1. Put the file in `materials/<project>/`, for example `materials/sbh-short/`.
2. In `research.html`, find that project's `<div class="dls">` and copy one of its links:

   ```html
   <a class="dl dl--sm" href="materials/sbh-short/Adams_SBH_Model.xlsx" download>
     <i class="dl__sq" aria-hidden="true"></i>Model
     <span class="dl__meta">Excel, 1.2 MB</span>
   </a>
   ```

3. Change the `href`, the label and the file type and size. Links sit side by side and
   wrap onto a new line when they run out of room.

Keep file names free of spaces so the links stay simple. Publish PDFs, not Word files:
PDFs are easier for visitors to open, search engines index them better, and they don't
carry editing history. `.docx` files are ignored by git, so a Word source can sit next
to its PDF in `materials/` without being published.

When you change `styles.css` or `site.js`, bump the `?v=` query string on every page so
browsers fetch the new version.
