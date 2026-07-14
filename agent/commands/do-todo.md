---
description: Převede idea/plan soubor (např. IDEA_*.md) na strukturované TODO.md v rootu projektu
argument-hint: <cesta k idea.md / plan.md>
---

Vezmi plánovací soubor `$ARGUMENTS` a vytvoř z něj strukturované `TODO.md` v rootu projektu.

## Postup

1. Přečti `$ARGUMENTS`. Pokud argument chybí nebo soubor neexistuje, zastav se a řekni si o cestu.
2. Pokud `TODO.md` v rootu už existuje a obsahuje rozpracované úkoly (odškrtnuté i neodškrtnuté checkboxy), **nepřepisuj ho bez ptaní** — zeptej se, zda přepsat, nebo nové úkoly připojit na konec.
3. Z plánu vytáhni jednotlivé implementační úkoly. Vodítka:
   - Sekce typu „Plán implementace“, „Fáze“, číslované kroky → to jsou úkoly. Fáze zachovej jako seskupení úkolů.
   - Sekce typu „Rizika a omezení“, „Průřezově“, „Gotchas“ → nejsou to samostatné úkoly; promítni je jako **blokace** nebo poznámky k úkolům, kterých se týkají. Průřezové povinnosti (docs, prune, migrace) přidej jako vlastní úkol, pokud nikam nepatří.
   - Úkol má být commitnutelný celek (zhruba 1 úkol = 1 commit), ne jednořádková trivialita ani celá fáze.
4. Ke každému úkolu urči:
   - **Prioritu** — `P1` (jádro / blokuje ostatní), `P2` (důležité, ale počká), `P3` (nice-to-have). Pokud plán priority naznačuje (MVP, „největší hodnota“, „volitelné“), respektuj to; jinak odhadni podle závislostí.
   - **Blokace** — závislosti na jiných úkolech (`⛔ blokováno: #N`) a externí blokace (chybějící přístup, klíč, rozhodnutí uživatele, kvóty API…). Když blokace není, neuváděj ji.
5. Zapiš `TODO.md` přesně v tomto formátu (česky):

```markdown
# TODO: <název plánu>

> Tento soubor je pracovní plán. Nejdřív je **obsah (TOC)** s checkboxy —
> odškrtávej po dokončení úkolu. Pod ním je každý úkol rozepsaný
> v samostatné sekci s prioritou, případnými blokacemi a kritériem hotovo.
> Pracuj po jednotlivých úkolech v pořadí TOC (pokud blokace neurčí jinak)
> a po dokončení úkolu commitni.

Zdroj: <cesta k plánovacímu souboru> · Vytvořeno: <YYYY-MM-DD>

## Kontext

<2–5 vět: co se buduje a proč — shrnutí motivace z plánu, ať TODO.md
funguje samostatně bez čtení zdrojového souboru.>

## Obsah

### Fáze 1 — <název fáze>
- [ ] **#1** <název úkolu> · P1
- [ ] **#2** <název úkolu> · P1 · ⛔ blokováno: #1

### Fáze 2 — <název fáze>
- [ ] **#3** <název úkolu> · P2 · ⛔ blokováno: #2, čeká na <externí blokace>

## Úkoly

### #1 <název úkolu>

**Priorita:** P1
**Blokace:** — <nebo výčet>

<Odstavec: co přesně udělat, s odkazy na konkrétní soubory/moduly
(`server/...`, `web/src/...`) a relevantní detaily ze zdrojového plánu —
schémata, API endpointy, klíče v settings. Detail sem přenes, ať se při
implementaci nemusí otvírat zdrojový soubor.>

**Hotovo když:** <ověřitelné kritérium — co jde spustit/otestovat/vidět.>
```

   Pravidla formátu:
   - Číslování `#N` je globální napříč fázemi a musí sedět mezi TOC a sekcemi.
   - Když plán žádné fáze nemá, vynech podnadpisy fází a dej úkoly do jednoho seznamu.
   - Priority a blokace piš jen v uvedeném tvaru, ať jsou greppovatelné.
6. Na závěr vypiš krátké shrnutí: počet úkolů, rozpad podle priorit, externí blokace, a nabídni commit `TODO.md` (necommituj bez vyzvání).
