---
name: redesign-webu
description: Vizuální redesign malého statického webu (jedna stránka, nginx, bez buildu) tak, aby nepůsobil jako generický „vibe-coded“ web – hravě, ale důvěryhodně, s vlastními barvami a písmy, bez externích požadavků. Použij, když uživatel chce „předělat vzhled“, „méně vibe styl“, „redesign“, „aby to nevypadalo jako od AI“ u statického webu v /var/www/*/public.
argument-hint: "[volitelně: cesta k index.html nebo požadovaný směr]"
---

# Redesign statického webu

Tento postup doplňuje skill `frontend-design:frontend-design`. Ten říká, *jak přemýšlet o designu*. Tento skill říká, *jak redesign na těchto webech provést bezpečně a ověřit ho*. Na začátku načti `frontend-design:frontend-design` a řiď se jím při návrhu.

Vzorová realizace: `/var/www/rcdomecek-com` (směr „Domeček z kostek“, viz `decisions.md` v `/home/chemix/Projects/rcdomecek-com/`).

## 1. Než začneš

1. Přečti `CLAUDE.md` projektu. Zjisti tvrdá omezení: jazyk, zákaz externích požadavků, `noindex`, zdroj faktů (např. `SOURCE_CONTENT.md`), přístupnost, oprávnění souborů.
2. Přečti nginx konfiguraci webu. Zjisti, které názvy cest nginx blokuje (typicky `docs`, `src`, `source`, `config`, `README`, `.bak`…). Nové složky pojmenuj tak, aby prošly (např. `dokumenty/`, `obrazky/`, `fonty/`).
3. Ulož zálohu: `cp public/index.html <projekt>/sources/index-before-redesign-<datum>.html`.
4. Obsah neměň. Redesign mění formu, ne fakta. Nic nevymýšlej.

## 2. Najdi, co je na současném vzhledu „vibe“

Projdi stránku a vypiš znaky generického AI vzhledu (seznam je ve `frontend-design`). Na rcdomecek to byly:

- krémové pozadí + terakotový akcent,
- popisky VELKÝMI PÍSMENY nad každým nadpisem,
- stejné zaoblené karty se stínem na všem,
- šipky „→“ za odkazy, číslování 01/02/03 u věcí, které nejsou posloupnost.

Uživateli je stručně pojmenuj – vysvětluje to, proč se mění.

## 3. Návrh směru

- **Barvy ber z identity klienta** (logo, banner, fotky), ne z hlavy. 4–6 pojmenovaných tokenů na `:root` podle významu (např. `--roof`, `--wall`, `--window`, `--grass`, `--ink`, `--paper`).
- **Písma:** jedno výrazné pro nadpisy, jedno dobře čitelné pro text. Žádné Inter/Roboto/systémové jako hlavní volba.
- **Jeden odvážný prvek** (na rcdomecek domeček v hero, jehož okna jsou navigace). Zbytek klidný.
- **Struktura podle obsahu:** rozvrh → týdenní sloupce; historie → časová osa; dokumenty → tabulka; kontakt → výrazný blok. Ne všechno do karet.
- Plán si zkontroluj proti briefu (krok „review“ z `frontend-design`) a teprve pak piš kód.

## 4. Lokální písma (žádné CDN)

Písma stáhni z npm balíčků Fontsource a ulož do `public/fonty/`:

```bash
cd <scratchpad> && npm pack @fontsource-variable/<font>@<verze>   # nebo curl z registry.npmjs.org
tar xzf *.tgz && ls package/files/   # vyber *-latin-*.woff2 a *-latin-ext-*.woff2
```

- Pro češtinu potřebuješ **latin i latin-ext**, každý jako `@font-face` s `unicode-range`.
- Přidej licenci (`OFL-<font>.txt`). Ověř, že je písmo pod OFL.
- `font-display: swap`, cesty relativní (`fonty/…`).
- **Pozor na číslice:** některá čitelná písma (Atkinson Hyperlegible) mají přeškrtnutou nulu a nejde vypnout přes OpenType. Řešení: samostatný `@font-face` (např. `"Cislice"`) z display písma s `unicode-range: U+0030-0039` a dát ho na první místo ve `font-family`.

## 5. Obrázky

- Jen lokální soubory. Ořezy/zmenšení dělej z originálů (ImageMagick), originály nech v `sources/`.
- Logo s bílým pozadím na barevném podkladu: `mix-blend-mode: multiply`.
- Uveď `width`/`height` a smysluplný `alt` (dekorativní → `alt=""`).

## 6. Kvalitní minimum (bez výjimek)

- sémantické `<section aria-labelledby>`, skip link na `#obsah`, viditelný `:focus-visible`,
- `@media (prefers-reduced-motion: reduce)`,
- žádné vodorovné přetečení na 390 px,
- kontrast textu aspoň 4.5:1,
- zachovat všechny kotvy, na které vedou odkazy (menu, patička, CLAUDE.md).

## 7. Ověření

Prohlížeč přes `agent-browser` na šířkách **390, 780 a 1280 px**:

```bash
agent-browser open "https://<web>/?v=<n>"     # ?v= obchází cache po změně
agent-browser set viewport 390 844
agent-browser eval "document.documentElement.scrollWidth"   # = šířka okna
agent-browser eval "[...document.querySelectorAll('a[href^=\"#\"]')].filter(a=>a.hash.length>1&&!document.querySelector(a.hash)).length"   # 0
agent-browser eval "[...document.querySelectorAll('[aria-labelledby]')].filter(e=>!document.getElementById(e.getAttribute('aria-labelledby'))).length"   # 0
agent-browser eval "[...document.images].filter(i=>!i.complete||!i.naturalWidth).length"   # 0
agent-browser eval "performance.getEntriesByType('resource').filter(r=>!r.name.startsWith(location.origin)).length"   # 0
agent-browser eval "[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family)"
agent-browser screenshot --full <scratchpad>/390.png
```

- Před `scrollIntoView` nastav `document.documentElement.style.scrollBehavior='auto'`, jinak screenshot zachytí rozjetý scroll.
- Screenshoty si opravdu prohlédni a kriticky zhodnoť (jeden „doplněk“ odeber).
- HTTP: stránka 200, hash odpovídá souboru, fonty `font/woff2` 200, `README.md` 403, `sudo nginx -t`.
- Oprávnění: `chemix:webdev`, adresáře `2775`, soubory `0664`.

## 8. Dokumentace a předání

- Aktualizuj `README.md`, `HANDOFF.md` (výsledky testů), `CLAUDE.md` (nové složky, tokeny, zásady směru), `decisions.md` (proč tento směr) a připiš událost do `project.log`.
- Uživateli shrň česky: odkud inspirace, co bylo „vibe“, nový směr (barvy, písma, odvážný prvek, struktura sekcí), výsledky ověření a cestu k záloze.
