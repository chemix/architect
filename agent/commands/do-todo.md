---
description: Přepracuje plánovací soubor (PLAN.md / IDEA_*.md) na praktický implementační TODO.md se stabilními TASK-XXX úkoly, kotvami, závislostmi a kritérii dokončení
argument-hint: [cesta k plánu] (výchozí PLAN.md)
---

# /do-todo

Převeď plán na `TODO.md` v rootu projektu — implementační dokument, podle kterého
může další session (člověk nebo agent) postupovat úkol po úkolu, aniž by musela
znovu procházet celý plán a codebase. Proto musí odpovídat **skutečnému stavu
codebase**, ne jen přeformulovat plán.

Zdrojový soubor je `$ARGUMENTS`, při prázdném argumentu `PLAN.md`. Dál se o něm
píše jako o „plánu“; v odkazech v `TODO.md` použij jeho skutečnou cestu.

Výstupem je jen `TODO.md`. Plán neměň, v codebase nic neimplementuj a `TODO.md`
necommituj, pokud o to uživatel nepožádá.

## Příprava

1. Přečti plán. Pokud neexistuje, zeptej se na cestu.
2. Pokud `TODO.md` už existuje a má rozpracované úkoly, zeptej se, jestli ho
   přepsat, nebo zachovat stavy a navázat na ně — jsou v něm odškrtnuté výsledky
   předchozí práce.
3. Přečti celý plán a prostuduj relevantní části codebase: architekturu,
   existující implementaci, konvence, dotčené soubory a komponenty, návaznosti
   mezi kroky a možné technické překážky. U většího plánu můžeš průzkum
   jednotlivých oblastí rozdělit mezi subagenty; závěry ale ověř a `TODO.md`
   piš sám, aby byl konzistentní.

## Struktura TODO.md

### Přehled

1. Název a stručný popis cíle.
2. Shrnutí současného stavu a plánovaného výsledku.
3. Důležité předpoklady, omezení, blokující prvky a otevřená rozhodnutí.
4. Obsah jako checklist hlavních úkolů:

```markdown
## Obsah

- [ ] [TASK-001: Zavedení databázového modelu](#task-001-zavedeni-databazoveho-modelu)
- [ ] [TASK-002: Implementace API pro správu profilů](#task-002-implementace-api-pro-spravu-profilu)
- [ ] [TASK-003: Napojení administračního formuláře](#task-003-napojeni-administracniho-formulare)
```

### Detailní úkoly

Pod obsahem úkoly v pořadí implementace, každý v této podobě:

```markdown
<a id="task-001-zavedeni-databazoveho-modelu"></a>

## [ ] TASK-001: Zavedení databázového modelu

Krátké vysvětlení cíle úkolu a jeho role v celém plánu.

**Kontext z plánu:**
Odkaz na odpovídající část [`PLAN.md`](./PLAN.md#odpovidajici-sekce).

**Současný stav:**
Co už v codebase existuje a na co lze navázat.

**Implementace:**

- [ ] Konkrétní krok
- [ ] Konkrétní krok

**Dotčené části codebase:**

- `path/to/file`

**Závislosti:**

- Vyžaduje [TASK-000: Název předchozího úkolu](#task-000-nazev-predchoziho-ukolu).
- Knihovny, migrace, konfigurace nebo externí služby.

**Blokuje:**

- [TASK-002: Implementace API pro správu profilů](#task-002-implementace-api-pro-spravu-profilu)

**Blokující prvky:**

- Problém — dopad — možný způsob odblokování.

**Ověření dokončení:**

- [ ] Konkrétní ověřitelná podmínka
- [ ] Relevantní testy procházejí

**Výsledek:**
Jednoznačný popis stavu, který po dokončení úkolu existuje.
```

Sekce, které pro daný úkol nemají obsah (např. `Blokuje` nebo `Blokující
prvky`), vynech, místo abys je vyplňoval výplní.

## Identifikátory, názvy a kotvy

`TODO.md` se bude dlouho upravovat a úkoly na sebe odkazují, takže identifikátory
a kotvy musí zůstat stabilní:

- Každý hlavní úkol má ID `TASK-001`, `TASK-002`, … a krátký konkrétní název
  popisující výsledný stav (`Implementace API pro správu profilů`, ne `Backend`,
  `Další úpravy` nebo `Dokončení`). ID i název jsou v obsahu a v detailu totožné.
- Nad každým detailním úkolem je explicitní HTML kotva `<a id="…"></a>` —
  automaticky generované kotvy se liší mezi renderery a mění se s textem nadpisu.
- Kotva: malá písmena, bez diakritiky, mezery → pomlčky, bez speciálních znaků,
  vždy začíná ID úkolu (`task-001-…`). Jednou vytvořenou kotvu neměň, pokud se
  zásadně nezmění význam úkolu.
- Odkaz na jiný úkol je vždy prokliknutelný a obsahuje ID i název. Vazba
  „vyžaduje / blokuje“ je uvedená na obou stranách.

## Stav úkolů

Stav hlavního úkolu je na dvou místech — v obsahu a v nadpisu detailu — a obě
musí vždy souhlasit (`[ ]` / `[x]`). Při každé změně stavu uprav obě.

Hlavní úkol označ `[x]` jen tehdy, když jsou hotové všechny implementační kroky,
splněná všechna kritéria z `Ověření dokončení` a potvrzuje to skutečný stav
codebase. Už při vytváření `TODO.md` označ `[x]` jen to, co codebase jednoznačně
potvrzuje; částečně hotový úkol nech `[ ]` a do `Současný stav` napiš, co už
existuje.

## Pravidla obsahu

- Úkoly jsou konkrétní, samostatně proveditelné a ověřitelné; rozsáhlé části
  plánu rozděl na menší navazující úkoly.
- Pořadí určují skutečné technické závislosti, ne pořadí v plánu.
- Používej názvy, cesty a terminologii z projektu. Soubory uváděj jen tehdy, když
  je z codebase spolehlivě znáš; nevymýšlej API, moduly ani detaily, které
  neexistují.
- Nejasnosti explicitně označ jako rozhodnutí, které je potřeba udělat, a uveď
  je i v přehledu.
- Blokující prvky odvozuj z plánu a codebase a u každého uveď dopad a možné
  odblokování.
- Zachovej odkazy na odpovídající části plánu kvůli širšímu kontextu.

## Kontrola konzistence

Po vytvoření i po každé pozdější úpravě `TODO.md` ověř — ideálně mechanicky,
např. krátkým skriptem nebo `grep` nad ID a kotvami, ne jen očima:

- každý `TASK-XXX` je v obsahu právě jednou a má právě jednu detailní sekci
  s explicitní kotvou,
- ID, název a stav `[ ]` / `[x]` souhlasí mezi obsahem a detailem,
- všechny odkazy (z obsahu i mezi úkoly) vedou na existující kotvy,
- vazby závislostí jsou na obou stranách a pořadí úkolů je respektuje.

Před dokončením navíc zkontroluj, že každý bod plánu pokrývá aspoň jeden úkol,
nechybí žádný zásadní implementační krok a každý úkol má jasná kritéria
dokončení.

## Závěr

Vypiš krátké shrnutí: počet úkolů, nalezené blokující prvky, otevřená rozhodnutí
a výsledek kontroly konzistence (případně co se nepodařilo ověřit).
