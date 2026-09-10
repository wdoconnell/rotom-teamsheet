import { PDF, PDFPage } from "@libpdf/core"
import { readFile, writeFile } from "node:fs/promises"
import {
  Gender,
  Nature,
  PokeApiStatNames,
  StatOptions,
  type ConsolidatedPkmn,
  type ParsedEvs,
  type PokeApiStatResponse,
  type PokemonStats,
  type PokePasteResponse,
  type ProcessedPokemonConfig,
} from "./types.js"
import {
  DIST_ABILITY_TO_ITEM,
  DIST_ALIGNMENT_TO_ABILITY,
  DIST_ITEM_TO_MOVE1,
  DIST_MOVE1_TO_MOVE2,
  DIST_MOVE2_TO_MOVE3,
  DIST_MOVE3_TO_MOVE4,
  DIST_NAME_TO_ALIGNMENT,
  DIST_TO_NEXT_STAT,
  FORM_LEFT_INDENT_X,
  FORM_RIGHT_INDENT_X,
  FORM_X_DIST_TO_STATS,
  POKEMON_START_LEFT_ONE,
  Y_DIST_TO_NEXT_POKE_PAGE_ONE,
  Y_DIST_TO_NEXT_POKE_PAGE_TWO,
} from "./constants.js"

// TODO - for local-only version, allow prompts
// for filling in the addition information
// TODO -- add tests
// TODO -- refactor
// TODO -- SEA archive for binary

const paste = process.env.POKE_PASTE
const applyNatures = (stats: PokemonStats, n: keyof typeof Nature) => {
  const modifiers = Nature[n]

  if (!modifiers) {
    return
  }

  stats[modifiers.up] = Math.floor(stats[modifiers.up] * 1.1)
  stats[modifiers.down] = Math.floor(stats[modifiers.down] * 0.9)

  return stats
}

const addEVs = (baseStats: PokemonStats, evs: ParsedEvs): PokemonStats => {
  return {
    // For HP, base + statspoints + 75
    // https://bulbapedia.bulbagarden.net/wiki/Stat_point
    HP: baseStats[StatOptions.HP] + evs.hp + 75,
    Atk: baseStats[StatOptions.Atk] + evs.atk + 20,
    Def: baseStats[StatOptions.Def] + evs.def + 20,
    SpA: baseStats[StatOptions.SpA] + evs.spatk + 20,
    SpD: baseStats[StatOptions.SpD] + evs.spdef + 20,
    Spe: baseStats[StatOptions.Spe] + evs.speed + 20,
  }
}

const parseStats = (
  responseArr: PokeApiStatResponse[],
  evs: ParsedEvs,
): PokemonStats => {
  const stats: PokemonStats = {
    HP: 0,
    Atk: 0,
    Def: 0,
    SpA: 0,
    SpD: 0,
    Spe: 0,
  }

  // Assign stats based on the API response
  responseArr.forEach((r) => {
    switch (r.stat.name) {
      case PokeApiStatNames.HP:
        stats.HP = r.base_stat
        break
      case PokeApiStatNames.Atk:
        stats.Atk = r.base_stat
        break
      case PokeApiStatNames.Def:
        stats.Def = r.base_stat
        break
      case PokeApiStatNames.SpAtk:
        stats.SpA = r.base_stat
        break
      case PokeApiStatNames.SpDef:
        stats.SpD = r.base_stat
        break
      case PokeApiStatNames.Speed:
        stats.Spe = r.base_stat
        break
      default:
        break
    }
  })

  const withEvs = addEVs(stats, evs)
  return withEvs
}

const parseMoves = (moveLineArr: string[]): string[] =>
  moveLineArr.map((l) => l.split("- ")[1].trim())

const parseGender = (
  genderString: string,
): (typeof Gender)[keyof typeof Gender] => {
  switch (genderString) {
    case "M":
      return Gender.M
    case "F":
      return Gender.F
    default:
      return Gender.None
  }
}

const parseEvs = (evString: string) => {
  const evs = evString.replace("EVs: ", "").split("/")

  const parsedEVs: ParsedEvs = {
    hp: 0,
    def: 0,
    spdef: 0,
    atk: 0,
    spatk: 0,
    speed: 0,
  }

  evs.forEach((ev) => {
    const trimmed = ev.trim()
    const split = trimmed.split(" ")
    const [value, stat] = split
    const parsedStat = parseInt(value)

    switch (stat) {
      case StatOptions.HP:
        parsedEVs.hp = parsedStat
        break
      case StatOptions.Atk:
        parsedEVs.atk = parsedStat
        break
      case StatOptions.Def:
        parsedEVs.def = parsedStat
        break
      case StatOptions.SpA:
        parsedEVs.spatk = parsedStat
        break
      case StatOptions.SpD:
        parsedEVs.spdef = parsedStat
        break
      case StatOptions.Spe:
        parsedEVs.speed = parsedStat
        break
      default:
        break
    }
  })

  return parsedEVs
}

const result = await fetch(paste)
const pasteResponse: PokePasteResponse = await result.json()
console.log(pasteResponse.paste)
const lines = pasteResponse.paste.split("\r\n")

const pkmnArr: ProcessedPokemonConfig[] = []

let count = 0
// Each config is 10 lines.
for (let i = 0; i < lines.length; i += 10) {
  if (count === 6 || lines[0] === "") {
    break
  }

  // TODO -- need to add abilities and fix gender and name
  // TODO -- could probably handle this with a class
  const pkmn: ProcessedPokemonConfig = {
    pokemonName: lines[i].split("(")[0].trim(),
    ability: lines[i + 1].split("Ability: ")[1].trim(),
    gender: parseGender(lines[i].split(/[()]/)[1]),
    item: lines[i].split("@ ")[1].trim(),
    level: parseInt(lines[i + 2].split("Level: ")[1]),
    EVs: parseEvs(lines[i + 3].trim()),
    nature: lines[i + 4].split(" ")[0].trim(),
    moves: parseMoves([lines[i + 5], lines[i + 6], lines[i + 7], lines[i + 8]]),
  }
  count++

  pkmnArr.push(pkmn)
}

let consolidatedPkmnArr: ConsolidatedPkmn[] = []

const fetchBatch: Promise<any>[] = []
pkmnArr.forEach((poke) => {
  console.log(`Fetching ${poke.pokemonName}`)

  if (
    poke.pokemonName === "Floette-Eternal" ||
    poke.pokemonName === "Basculegion"
  ) {
    return
  }

  fetchBatch.push(
    fetch(
      `https://pokeapi.co/api/v2/pokemon/${poke.pokemonName.toLowerCase()}/`,
    ),
  )
})

const result2 = await Promise.all(fetchBatch)

const jsonResults: Object[] = []

for (let r of result2) {
  const jsonResult = await r.json()
  jsonResults.push(jsonResult)
}

pkmnArr.forEach(async (poke) => {
  // Skip floette eternal and basculegion
  // TODO -- need to add some tests to resolve names
  // maybe based on test list of everything in champions
  const name = poke.pokemonName
  if (name === "Floette-Eternal" || name === "Basculegion") {
    return
  }

  const foundPoke = jsonResults.find(
    (p) => p.name.toLowerCase() === poke.pokemonName.toLowerCase(),
  )

  const stats = foundPoke.stats

  const parsedPkmnStats = parseStats(stats, poke.EVs)
  const withNatures = applyNatures(parsedPkmnStats, poke.nature)
  consolidatedPkmnArr.push({
    name: poke.pokemonName,
    alignment: poke.nature,
    ability: poke.ability,
    item: poke.item,
    move1: poke.moves[0],
    move2: poke.moves[1],
    move3: poke.moves[2],
    move4: poke.moves[3],
    stats: {
      HP: withNatures[StatOptions.HP],
      Atk: withNatures[StatOptions.Atk],
      Def: withNatures[StatOptions.Def],
      SpA: withNatures[StatOptions.SpA],
      SpD: withNatures[StatOptions.SpD],
      Spe: withNatures[StatOptions.Spe],
    },
  })

  // Load the base teamsheet
  let pdfData = await readFile("teamlist.pdf")
  const pdf = await PDF.load(pdfData)

  // Start at page one
  // TODO - should change this in the future
  // To do both pages for the same pokemon at once.
  const page0 = pdf.getPage(0)
  if (!page0) {
    throw new Error("no page 0 in pdf")
  }

  writePage(consolidatedPkmnArr, page0, true)

  const page1 = pdf.getPage(1)
  if (!page1) {
    throw new Error("no page 1 in pdf")
  }

  writePage(consolidatedPkmnArr, page1, false)

  const newPdf = await pdf.save()

  const currentDate = new Date().toDateString()

  await writeFile(`teamlist-${currentDate}.pdf`, newPdf)
})

console.log("made it past forEach")

const writePage = (
  pkmnArr: ConsolidatedPkmn[],
  page: PDFPage,
  showStats: boolean,
) => {
  // Initialize the starting positions on the teamsheet.
  let currentYPos = POKEMON_START_LEFT_ONE
  let currentXPos = FORM_LEFT_INDENT_X

  for (let i = 0; i < pkmnArr.length; i++) {
    // Decide which column to write in.
    currentXPos = i >= 3 ? FORM_RIGHT_INDENT_X : FORM_LEFT_INDENT_X

    // We reset the y-index at the third element
    // so that it can be processed in the right column.
    if (i === 3) {
      // TODO - Rename this constant
      currentYPos = POKEMON_START_LEFT_ONE
    }

    const originalYPos = currentYPos

    page?.drawText(pkmnArr[i].name, {
      x: currentXPos,
      y: currentYPos,
    })

    currentYPos -= DIST_NAME_TO_ALIGNMENT

    page?.drawText(pkmnArr[i].alignment, {
      x: currentXPos,
      y: currentYPos,
    })

    currentYPos -= DIST_ALIGNMENT_TO_ABILITY

    page?.drawText(pkmnArr[i].ability, {
      x: currentXPos,
      y: currentYPos,
    })

    currentYPos -= DIST_ABILITY_TO_ITEM

    page?.drawText(pkmnArr[i].item, {
      x: currentXPos,
      y: currentYPos,
    })

    currentYPos -= DIST_ITEM_TO_MOVE1

    page?.drawText(pkmnArr[i].move1, {
      x: currentXPos,
      y: currentYPos,
    })

    currentYPos -= DIST_MOVE1_TO_MOVE2

    page?.drawText(pkmnArr[i].move2, {
      x: currentXPos,
      y: currentYPos,
    })

    currentYPos -= DIST_MOVE2_TO_MOVE3

    page?.drawText(pkmnArr[i].move3, {
      x: currentXPos,
      y: currentYPos,
    })

    currentYPos -= DIST_MOVE3_TO_MOVE4

    page?.drawText(pkmnArr[i].move4, {
      x: currentXPos,
      y: currentYPos,
    })

    if (showStats) {
      currentXPos += FORM_X_DIST_TO_STATS
      currentYPos =
        originalYPos - DIST_NAME_TO_ALIGNMENT - DIST_ALIGNMENT_TO_ABILITY

      page?.drawText(pkmnArr[i].stats[StatOptions.HP].toString(), {
        x: currentXPos,
        y: currentYPos,
      })

      currentYPos -= DIST_TO_NEXT_STAT

      page?.drawText(pkmnArr[i].stats[StatOptions.Atk].toString(), {
        x: currentXPos,
        y: currentYPos,
      })

      currentYPos -= DIST_TO_NEXT_STAT

      page?.drawText(pkmnArr[i].stats[StatOptions.Def].toString(), {
        x: currentXPos,
        y: currentYPos,
      })

      currentYPos -= DIST_TO_NEXT_STAT

      page?.drawText(pkmnArr[i].stats[StatOptions.SpA].toString(), {
        x: currentXPos,
        y: currentYPos,
      })

      currentYPos -= DIST_TO_NEXT_STAT

      page?.drawText(pkmnArr[i].stats[StatOptions.SpD].toString(), {
        x: currentXPos,
        y: currentYPos,
      })

      currentYPos -= DIST_TO_NEXT_STAT

      page?.drawText(pkmnArr[i].stats[StatOptions.Spe].toString(), {
        x: currentXPos,
        y: currentYPos,
      })

      currentYPos -= Y_DIST_TO_NEXT_POKE_PAGE_ONE
    } else {
      currentYPos -= Y_DIST_TO_NEXT_POKE_PAGE_TWO
    }
  }
}
