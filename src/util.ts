import type { PDFPage } from "@libpdf/core"
import {
  Gender,
  Nature,
  PokeApiStatNames,
  StatOptions,
  type ConsolidatedPkmn,
  type ParsedEvs,
  type PokeApiResult,
  type PokeApiStat,
  type PokemonStats,
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

export const handleCaps = (pkmn: ConsolidatedPkmn[]): ConsolidatedPkmn[] => {
  // Capitalize the first letter, and first letter after a hyphen.
  pkmn.forEach((p) => {
    // Always capitalize the first letter.
    let name: string = p.name[0].toUpperCase()

    // Capitalize the first letter after any hyphen or space
    for (let i = 1; i < p.name.length; i++) {
      if ((p.name[i] === "-" || p.name[i] === " ") && p.name[i + 1]) {
        name += `-${p.name[i + 1].toUpperCase()}`
        i++
      } else {
        name += p.name[i]
      }
    }

    p.name = name
  })

  return pkmn
}

export const writePage = (
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
  responseArr: PokeApiStat[],
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

export const parsePokemonConfigs = (
  lines: string[],
): ProcessedPokemonConfig[] => {
  let count = 0

  let consolidatedPkmnArr: ProcessedPokemonConfig[] = []

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
      moves: parseMoves([
        lines[i + 5],
        lines[i + 6],
        lines[i + 7],
        lines[i + 8],
      ]),
    }
    count++

    consolidatedPkmnArr.push(pkmn)
  }

  return consolidatedPkmnArr
}

export const generatePokemonStats = (
  pkmnArr: ProcessedPokemonConfig[],
  dexResults: PokeApiResult[],
): ConsolidatedPkmn[] => {
  const consolidatedPkmnArr: ConsolidatedPkmn[] = []

  console.log({ pkmnArr })
  console.log({ dexResults })

  pkmnArr.forEach(async (poke) => {
    const foundPoke: PokeApiResult | undefined = dexResults.find(
      (p) => p.name.toLowerCase() === poke.pokemonName.toLowerCase(),
    )

    if (!foundPoke) {
      throw new Error(`Error: Could not find stats for ${poke.pokemonName}`)
    }

    const { stats } = foundPoke

    const parsedPkmnStats = parseStats(stats, poke.EVs)
    const withNatures: PokemonStats | undefined = applyNatures(
      parsedPkmnStats,
      poke.nature,
    )

    if (!withNatures) {
      throw new Error(`Error: Unable to apply natures for ${poke.pokemonName}`)
    }

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
  })

  return consolidatedPkmnArr
}
