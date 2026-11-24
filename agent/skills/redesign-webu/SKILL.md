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
2. Projdi `deny` pravidla v nginx konfiguraci a ověř proti nim každou cestu, na kterou stránka odkazuje (i ty stávající). Nové složky pojmenuj česky (`dokumenty/`, `obrazky/`, `fonty/`), anglická jména jako `docs` bývají blokovaná.
3. Ulož zálohu původní stránky **mimo `public/`** (např. `<projekt>/sources/index-before-redesign-<datum>.html`). Uživatel se k ní chce umět vrátit a záloha ve web rootu by byla veřejně dostupná. Tohle se snadno vynechá, protože to nikdo nekontroluje – udělej to jako první krok.

## 2. Fakta vs. výplňové texty

Redesign mění formu, ne fakta. Adresy, časy, ceny, jména a kontakty přeber beze změny a nic nového nevymýšlej.

Šablonové weby ale kromě faktů obsahují i **výplňové texty**, které nejsou v podkladech (`SOURCE_CONTENT.md`): slogany v hero („Objevte kouzlo společných chvil“, „Kde se sny stávají skutečností“), řádky statistik („10+ let · 500 rodin · 3 obory“), vatu typu „s láskou od roku…“. Jsou stejně generické jako krémová paleta – patří k tomu, co dělá web „vibe-coded“. Proto:

- Porovnej každý nadpis a slogan s podklady. Co tam není, je výplň.
- Když uživatel řekl „obsah nech“ / „texty neměň“: výplň ponech, ale **ve shrnutí ji vyjmenuj** a navrhni náhradu postavenou jen z faktů (např. „Kroužky a poradna pro rodiče s dětmi v Třebechovicích“).
- Jinak výplň nahraď věcným nadpisem z faktů (kdo, co, kde) a ve shrnutí uveď, co jsi nahradil a proč.
- Řádek „velké číslo + malý popisek“ v hero je šablonový prvek, ne obsah. Nepřenášej ho jen proto, že tam byl; pokud čísla nesou informaci, dej je do textu nebo do sekce, kam patří.

Klient tak dostane web, který mluví jeho fakty, a rozhodnutí o vlastních sloganech zůstane na něm.

## 3. Najdi, co je na současném vzhledu „vibe“

Projdi stránku a vypiš znaky generického AI vzhledu (seznam je ve `frontend-design`). Na rcdomecek to byly:

- krémové pozadí + terakotový akcent,
- popisky VELKÝMI PÍSMENY nad každým nadpisem,
- stejné zaoblené karty se stínem na všem,
- šipky „→“ za odkazy, číslování 01/02/03 u věcí, které nejsou posloupnost.

Další časté: meta řádky s tečkami („Spolek · Praha · od 2010“), jedno slovo nadpisu zvýrazněné barvou/kurzívou, monospace popisky, fade-up animace každé sekce (AOS apod.), hero se statistikami. Do nového návrhu je nepřenášej ani v jemnější podobě (eyebrow malými písmeny je pořád eyebrow, „→“ v `aria-hidden` je pořád šipka).

Uživateli je stručně pojmenuj – vysvětluje to, proč se mění.

## 4. Návrh směru

- **Barvy ber z identity klienta** (logo, dres, banner, fotky), ne z hlavy. Když klient žádnou identitu nemá, odvoď paletu z předmětu a místa (materiál, prostředí, řemeslo) a ve shrnutí ji výslovně označ jako návrh k potvrzení. 4–6 pojmenovaných tokenů na `:root` podle významu (např. `--roof`, `--wall`, `--window`, `--grass`, `--ink`, `--paper`).
- **Písma:** jedno výrazné pro nadpisy, jedno dobře čitelné pro text. Žádné Inter/Roboto/systémové jako hlavní volba.
- **Jeden odvážný prvek** (na rcdomecek domeček v hero, jehož okna jsou navigace). Zbytek klidný.
- **Struktura podle obsahu:** rozvrh → týdenní sloupce; historie → časová osa; dokumenty → tabulka; kontakt → výrazný blok. Ne všechno do karet.
- Plán si zkontroluj proti briefu (krok „review“ z `frontend-design`) a teprve pak piš kód.

## 5. Lokální písma (žádné CDN)

Písma stáhni z npm balíčků Fontsource a ulož do `public/fonty/`:

```bash
cd <scratchpad> && npm pack @fontsource-variable/<font>@<verze>   # nebo curl z registry.npmjs.org
tar xzf *.tgz && ls package/files/   # vyber *-latin-*.woff2 a *-latin-ext-*.woff2
```

- Pro češtinu potřebuješ **latin i latin-ext**, každý jako `@font-face` s `unicode-range`.
- Přidej licenci (`OFL-<font>.txt`). Ověř, že je písmo pod OFL.
- `font-display: swap`, cesty relativní (`fonty/…`).
- **Pozor na číslice:** některá čitelná písma (Atkinson Hyperlegible) mají přeškrtnutou nulu a nejde vypnout přes OpenType. Řešení: samostatný `@font-face` (např. `"Cislice"`) z display písma s `unicode-range: U+0030-0039` a dát ho na první místo ve `font-family`.

## 6. Obrázky

- Jen lokální soubory. Ořezy/zmenšení dělej z originálů (ImageMagick), originály nech v `sources/`.
- Logo s bílým pozadím na barevném podkladu: `mix-blend-mode: multiply`.
- Uveď `width`/`height` a smysluplný `alt` (dekorativní → `alt=""`).
- Externí vložené prvky (iframe mapy, ikonové fonty z CDN, hotlinkované fotky) jsou taky externí požadavky. Mapu nahraď odkazem na mapu, ikony inline SVG, cizí fotky odstraň.

## 7. Kvalitní minimum (bez výjimek)

- sémantické `<section aria-labelledby>`, skip link na `#obsah`, viditelný `:focus-visible`,
- `@media (prefers-reduced-motion: reduce)`,
- žádné vodorovné přetečení na 390 px,
- kontrast textu aspoň 4.5:1,
- zachovat všechny kotvy, na které vedou odkazy (menu, patička, CLAUDE.md).

## 8. Ověření

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

## 9. Dokumentace a předání

- Aktualizuj `README.md`, `HANDOFF.md` (výsledky testů), `CLAUDE.md` (nové složky, tokeny, zásady směru), `decisions.md` (proč tento směr) a připiš událost do `project.log`.
- Uživateli shrň česky: co bylo „vibe“, nový směr (barvy, písma, odvážný prvek, struktura sekcí), **výplňové texty k rozhodnutí** (krok 2), co je potřeba dodat (chybějící fotky, prázdné dokumenty), výsledky ověření a cestu k záloze.
