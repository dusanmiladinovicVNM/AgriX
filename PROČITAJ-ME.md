# AgriX — nova početna + otkup + gazdinstvo (sa videom i Analytics)

Sve tri stranice su **jučerašnji dizajn iz projekta**, dopunjen sa:
- Google Analytics (gtag `G-XH29X0DRCG`)
- video sekcija (klik na ▶ → animacija toka)
- kanonska imena u linkovima (`index.html`, `otkup.html`, `gazdinstvo.html`)

NIJE live dizajn — ovo je tvoja radna verzija od juče.

Svi fajlovi idu u **koren repo-a `dusanmiladinovicVNM/AgriX`** (branch `main`).
Slike već postoje u `img/` — ne diraš ih. `style.css` i `otkup.css` se NE menjaju.

## Fajlovi

**Menjaju se (prepiši postojeće):**
- `index.html` — jučerašnji split-path dizajn + Analytics
- `otkup.html` — jučerašnji dizajn (citat klijenta, GRATIS cross-sell) + Analytics + video
- `gazdinstvo.html` — jučerašnji dizajn („Pametna knjiga polja…") + Analytics + video

**Novi (dodaju se):**
- `style/mgmt-dashboard.css`  ← VAŽNO: ide u podfolder `style/` (za dashboard na početnoj)
- `otkup-video.html`
- `gazdinstvo-video.html`
- `animations.jsx`
- `video-common.jsx`
- `screens-otkup.html`
- `screens-koop.html`

## Upload (bez Git-a, kroz GitHub web)

1. https://github.com/dusanmiladinovicVNM/AgriX → **Add file → Upload files**
2. Prevuci sve fajlove. Za `style/mgmt-dashboard.css` prevuci ceo `style/` folder
   (ili otkucaj putanju `style/mgmt-dashboard.css` pri uploadu).
3. Commit poruka npr. „Novi dizajn + video + analytics" → **Commit changes**
4. GitHub Pages objavljuje za 1–2 minuta:
   - https://agrix.rs/  ·  https://agrix.rs/otkup.html  ·  https://agrix.rs/gazdinstvo.html

## Video — provera

Skroluj do sekcije **„Video"** (ispod „Kako funkcioniše"). Klik na ▶ → animacija preko celog okvira.

## Zvuk (kasnije)

Zvuk je pripremljen ali još nem. Kad budeš imao MP3: dodaj ga u repo (npr. `audio/bed.mp3`)
i u `otkup-video.html` / `gazdinstvo-video.html` u `cfg` dopiši: `audio: 'audio/bed.mp3'`.
