---
description: Přepracuje plánovací soubor (PLAN.md / IDEA_*.md) na praktický implementační TODO.md se stabilními TASK-XXX úkoly, kotvami, závislostmi a kritérii dokončení
argument-hint: [cesta k plan.md] (výchozí PLAN.md)
---

Přepracuj plánovací soubor na nový soubor `TODO.md` v rootu projektu.

Zdrojový soubor je `$ARGUMENTS`. Pokud je argument prázdný, použij `PLAN.md`.
V dalším textu se na zdrojový soubor odkazuje jako na `PLAN.md` — pokud je
předán jiný soubor, dosaď všude jeho skutečnou cestu (i do odkazů v `TODO.md`).

## Příprava

1. Přečti zdrojový soubor. Pokud neexistuje, zastav se a řekni si o cestu.
2. Pokud `TODO.md` v rootu už existuje a obsahuje rozpracované úkoly
   (odškrtnuté i neodškrtnuté checkboxy), **nepřepisuj ho bez ptaní** — zeptej
   se, zda přepsat, nebo stavy zachovat.
3. Nejdříve prostuduj **celý** `PLAN.md` a relevantní části codebase, abys pochopil:
   - současnou architekturu projektu,
   - existující implementaci,
   - použité konvence a návrhové vzory,
   - soubory a komponenty, kterých se plán týká,
   - návaznosti mezi jednotlivými kroky,
   - možné technické překážky, závislosti a blokující podmínky.

Nevytvářej pouze obecný přepis plánu. `TODO.md` musí být praktický implementační
dokument odpovídající **skutečnému stavu codebase**.

## Požadovaná struktura

Dokument rozděl do dvou úrovní.

### 1. Přehled

Na začátku `TODO.md` vytvoř:

1. název a stručný popis cíle,
2. summary současného stavu a plánovaného výsledku,
3. důležité předpoklady, omezení a nalezené blokující prvky,
4. obsah ve formě checklistu.

Příklad obsahu:

```markdown
## Obsah

- [ ] [TASK-001: Příprava datového modelu](#task-001-priprava-datoveho-modelu)
- [ ] [TASK-002: Implementace backendové logiky](#task-002-implementace-backendove-logiky)
- [ ] [TASK-003: Napojení uživatelského rozhraní](#task-003-napojeni-uzivatelskeho-rozhrani)
- [ ] [TASK-004: Testování a dokončení](#task-004-testovani-a-dokonceni)
```

Každý hlavní úkol musí mít:

- stabilní identifikátor ve formátu `TASK-001`, `TASK-002`, `TASK-003` atd.,
- krátký a jednoznačný název,
- stejný identifikátor a název v obsahu i v detailní sekci,
- explicitně definovanou Markdown kotvu.

Nepoléhej pouze na automatické generování kotev Markdown rendererem. Nad každý
detailní úkol vlož **explicitní HTML kotvu**, aby odkazy fungovaly stabilně i po
úpravách textu:

```markdown
<a id="task-001-priprava-datoveho-modelu"></a>

## [ ] TASK-001: Příprava datového modelu
```

Odkaz v obsahu musí používat přesně tuto kotvu:

```markdown
- [ ] [TASK-001: Příprava datového modelu](#task-001-priprava-datoveho-modelu)
```

Kotvy vytvářej podle těchto pravidel:

- používej pouze malá písmena,
- nepoužívej diakritiku,
- mezery nahrazuj pomlčkami,
- nepoužívej speciální znaky,
- identifikátor úkolu (`task-001`) musí být vždy součástí kotvy,
- jednou vytvořenou kotvu později neměň, pokud se zásadně nezmění význam úkolu.

### 2. Detailní úkoly

Pod obsahem rozepiš jednotlivé úkoly v pořadí, v jakém mají být implementovány.
Každý úkol musí mít tuto strukturu:

```markdown
<a id="task-001-priprava-datoveho-modelu"></a>

## [ ] TASK-001: Příprava datového modelu

Krátké vysvětlení cíle úkolu a jeho významu v rámci celého plánu.

**Kontext z plánu:**
Odkaz na odpovídající sekci nebo část [`PLAN.md`](./PLAN.md#odpovidajici-sekce).

**Současný stav:**
Co již v codebase existuje a na co lze navázat.

**Implementace:**

- [ ] Konkrétní implementační krok
- [ ] Konkrétní implementační krok
- [ ] Konkrétní implementační krok

**Dotčené části codebase:**

- `path/to/file`
- `path/to/component`

**Závislosti:**

- [TASK-000: Název předchozího úkolu](#task-000-nazev-predchoziho-ukolu)
- knihovny, migrace, konfigurace nebo externí služby.

**Blokující prvky:**

- nejasnosti nebo chybějící rozhodnutí,
- nekompatibilita se současnou architekturou,
- chybějící API, data, oprávnění nebo infrastruktura,
- technický dluh, který může implementaci zkomplikovat.

**Ověření dokončení:**

- [ ] Konkrétní ověřitelná podmínka
- [ ] Relevantní testy procházejí
- [ ] Funkce odpovídá požadavkům z `PLAN.md`

**Výsledek:**
Jednoznačný popis stavu, který musí po dokončení úkolu existovat.
```

## Pojmenovávání a propojování úkolů

Názvy úkolů musí být:

- stručné a konkrétní,
- zaměřené na výsledný stav,
- snadno rozlišitelné od ostatních úkolů,
- stabilní pro pozdější odkazy,
- formulované stejným způsobem v obsahu i v detailu.

Preferuj názvy jako:

- `TASK-001: Zavedení databázového modelu`
- `TASK-002: Implementace API pro správu profilů`
- `TASK-003: Napojení administračního formuláře`

Vyhýbej se obecným názvům jako `Backend`, `Frontend`, `Další úpravy`,
`Dokončení`, `Implementace`.

Při odkazu na jiný úkol vždy používej prokliknutelný odkaz obsahující jeho
identifikátor a název:

```markdown
[TASK-002: Implementace API pro správu profilů](#task-002-implementace-api-pro-spravu-profilu)
```

Stejný způsob odkazování používej v sekcích `Závislosti`, `Blokující prvky`,
`Související úkoly` i v popisech implementačního pořadí.

Pokud úkol blokuje jiný úkol, uveď tuto vazbu **na obou stranách**:

```markdown
**Závislosti:**

- Vyžaduje dokončení [TASK-001: Zavedení databázového modelu](#task-001-zavedeni-databazoveho-modelu).
```

```markdown
**Blokuje:**

- [TASK-002: Implementace API pro správu profilů](#task-002-implementace-api-pro-spravu-profilu)
```

## Synchronizace stavů úkolů

Každý hlavní úkol má svůj stav uvedený na dvou místech:

1. v checklistu v obsahu,
2. v nadpisu detailně rozepsaného úkolu.

Nedokončený úkol:

```markdown
- [ ] [TASK-001: Příprava datového modelu](#task-001-priprava-datoveho-modelu)
```

```markdown
## [ ] TASK-001: Příprava datového modelu
```

Dokončený úkol:

```markdown
- [x] [TASK-001: Příprava datového modelu](#task-001-priprava-datoveho-modelu)
```

```markdown
## [x] TASK-001: Příprava datového modelu
```

Při každé pozdější změně stavu hlavního úkolu vždy aktualizuj **oba** checkboxy
současně. Nesmí vzniknout stav, kdy je úkol v obsahu označen jako dokončený, ale
v detailu zůstává nedokončený (nebo naopak).

Po každé aktualizaci `TODO.md` proveď kontrolu konzistence:

- každý `TASK-XXX` je v obsahu uveden právě jednou,
- každý `TASK-XXX` má právě jednu detailní sekci,
- stav `[ ]` / `[x]` je na obou místech shodný,
- název úkolu je na obou místech shodný,
- odkaz z obsahu vede na správnou kotvu,
- odkazy mezi úkoly vedou na existující kotvy.

Hlavní úkol označ jako `[x]` pouze tehdy, pokud:

- jsou dokončeny všechny jeho implementační kroky,
- jsou splněna všechna kritéria v části `Ověření dokončení`,
- výsledek lze potvrdit podle skutečného stavu codebase.

Nestačí pouze změnit checkbox v detailních podúkolech.

## Pravidla zpracování

- Úkoly musí být konkrétní, samostatně proveditelné a ověřitelné.
- Rozděl příliš rozsáhlé části plánu na menší navazující úkoly.
- Seřaď úkoly podle skutečných technických závislostí, ne pouze podle pořadí v `PLAN.md`.
- Využij názvy, cesty, komponenty a terminologii skutečně používanou v projektu.
- Uváděj konkrétní soubory pouze tehdy, pokud je lze spolehlivě určit z codebase.
- Nevymýšlej neexistující API, moduly ani implementační detaily.
- Nejasnosti explicitně označ jako rozhodnutí, které je nutné udělat.
- Přidej blokující prvky, které lze rozumně odvodit z `PLAN.md` nebo codebase.
- U každého blokujícího prvku popiš jeho dopad a případný způsob odblokování.
- Zachovej odkazy na původní části `PLAN.md`, aby bylo možné snadno dohledat širší kontext.
- Již dokončené části označ `[x]` pouze tehdy, pokud jejich dokončení jednoznačně potvrzuje codebase.
- Pokud je implementace pouze částečná, ponech hlavní úkol jako `[ ]` a popiš, co již existuje.
- **Neměň obsah `PLAN.md`.**
- **Neimplementuj samotné změny v codebase. Výstupem této práce je pouze propracovaný `TODO.md`.**

## Závěrečná kontrola

Před dokončením práce ověř, že:

- každý bod z `PLAN.md` je pokryt alespoň jedním úkolem,
- žádný zásadní implementační krok nechybí,
- pořadí úkolů respektuje jejich závislosti,
- každý hlavní úkol má unikátní identifikátor,
- každý hlavní úkol má stabilní explicitní kotvu,
- všechny odkazy z obsahu fungují,
- všechny odkazy mezi úkoly fungují,
- checklist v obsahu odpovídá detailním úkolům,
- stav checkboxů je na obou místech synchronizovaný,
- názvy úkolů jsou v obsahu a detailu totožné,
- jednotlivé úkoly mají jasná kritéria dokončení,
- blokující prvky jsou propojené s úkoly, kterých se týkají.

Na závěr vypiš krátké shrnutí: počet úkolů, nalezené blokující prvky a otevřená
rozhodnutí. `TODO.md` necommituj bez vyzvání.
