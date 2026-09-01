const paste = process.env.POKE_PASTE

interface PokePasteResponse {
  author: string
  notes: string
  paste: string
  title: string
}

const Gender = {
  M: "M",
  F: "F",
  None: "",
} as const

interface PreParsePokemonConfig {
  pokemonName: string
  gender?: string
  item?: string
  level: number
  EVs: string
  nature: string
  moves: string[]
}

interface ParsedEvs {
  hp: number
  def: number
  spdef: number
  atk: number
  spatk: number
  speed: number
}

interface ProcessedPokemonConfig {
  pokemonName: string
  gender: (typeof Gender)[keyof typeof Gender]
  // Should probably make this strongly typed.
  item?: string
  level: number
  EVs: ParsedEvs
  // Should also make this strongly typed
  nature: string
  // This could also be strongly typed.
  moves: string[]
}

// Format
// The following, followed by a space, then another mon.

// Dragonite (M) @ Dragoninite
// Ability: Inner Focus
// Level: 50
// EVs: 1 HP / 1 Def / 32 SpA / 32 Spe
// Modest Nature
// - Dragon Pulse
// - Heat Wave
// - Thunderbolt
// - Protect

interface PokemonStats {
  [StatOptions.HP]: number
  [StatOptions.Atk]: number
  [StatOptions.Def]: number
  [StatOptions.SpA]: number
  [StatOptions.SpD]: number
  [StatOptions.Spe]: number
}

const PokeApiStatNames = {
  HP: "hp",
  Atk: "attack",
  Def: "defense",
  SpAtk: "special-attack",
  SpDef: "special-defense",
  Speed: "speed",
} as const

interface PokeApiStat {
  name: string
  url: string
}

interface PokeApiStatResponse {
  base_stat: number
  effort: number
  stat: PokeApiStat
}

const applyNatures = (stats: PokemonStats, n: keyof typeof Nature) => {
  const modifiers = Nature[n]
  // console.log({ modifiers })

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

//  stat: { name: 'hp', url: 'https://pokeapi.co/api/v2/stat/1/' }
// },
// {
//   base_stat: 134,
//   effort: 3,
//   stat: { name: 'attack', url: 'https://pokeapi.co/api/v2/stat/2/' }
// },
// {
//   base_stat: 95,
//   effort: 0,
//   stat: { name: 'defense', url: 'https://pokeapi.co/api/v2/stat/3/' }
// },
// {
//   base_stat: 100,
//   effort: 0,
//   stat: {
//     name: 'special-attack',
//     url: 'https://pokeapi.co/api/v2/stat/4/'
//   }
// },
// {
//   base_stat: 100,
//   effort: 0,
//   stat: {
//     name: 'special-defense',
//     url: 'https://pokeapi.co/api/v2/stat/5/'
//   }
// },
// {
//   base_stat: 80,
//   effort: 0,
//   stat: { name: 'speed', u

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

const StatOptions = {
  HP: "HP",
  Atk: "Atk",
  Def: "Def",
  SpA: "SpA",
  SpD: "SpD",
  Spe: "Spe",
} as const

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

interface StatApplication {
  up: keyof typeof StatOptions
  down: keyof typeof StatOptions
}

const result = await fetch(paste)
const pasteResponse: PokePasteResponse = await result.json()
// console.log(pasteResponse.paste)
const lines = pasteResponse.paste.split("\r\n")

const pkmnArr: ProcessedPokemonConfig[] = []

let count = 0

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Each config is 10 lines.
// console.log("iterating over each value in result")
for (let i = 0; i < lines.length; i += 10) {
  if (count === 6 || lines[0] === "") {
    break
  }

  // TODO -- need to add abilities and fix gender and name
  // TODO -- could probably handle this with a class
  const pkmn: ProcessedPokemonConfig = {
    pokemonName: lines[i].split("(")[0].trim(),
    // Remove forcible cast
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

pkmnArr.forEach(async (poke) => {
  // const name =
  //   poke.pokemonName === "Floette-Eternal" ? "Floette" : poke.pokemonName
  const name = poke.pokemonName
  if (name === "Floette-Eternal" || name === "Basculegion") {
    return
  }

  // console.log(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}/`)
  const fetchResult = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}/`,
  )

  const json = await fetchResult.json()
  const stats = json["stats"]

  console.log({ name: poke.pokemonName })
  const parsedPkmnStats = parseStats(stats, poke.EVs)
  // console.log("after evs, before natures")
  // console.log({ parsedPkmnStats })
  const withNatures = applyNatures(parsedPkmnStats, poke.nature)
  // console.log("after natures")
  console.log({ withNatures })
})

// Records natures
const Nature: Record<string, StatApplication> = {
  Hardy: {
    up: StatOptions.Atk,
    down: StatOptions.Atk,
  },
  Lonely: {
    up: StatOptions.Atk,
    down: StatOptions.Def,
  },
  Adamant: {
    up: StatOptions.Atk,
    down: StatOptions.SpA,
  },
  Naughty: {
    up: StatOptions.Atk,
    down: StatOptions.SpD,
  },
  Brave: {
    up: StatOptions.Atk,
    down: StatOptions.Spe,
  },
  Bold: {
    up: StatOptions.Def,
    down: StatOptions.Atk,
  },
  Docile: {
    up: StatOptions.Def,
    down: StatOptions.Def,
  },
  Impish: {
    up: StatOptions.Def,
    down: StatOptions.SpA,
  },
  Lax: {
    up: StatOptions.Def,
    down: StatOptions.SpD,
  },
  Relaxed: {
    up: StatOptions.Def,
    down: StatOptions.Spe,
  },
  Modest: {
    up: StatOptions.SpA,
    down: StatOptions.Atk,
  },
  Mild: {
    up: StatOptions.SpA,
    down: StatOptions.Def,
  },
  Bashful: {
    up: StatOptions.SpA,
    down: StatOptions.SpA,
  },
  Rash: {
    up: StatOptions.SpA,
    down: StatOptions.SpD,
  },
  Quiet: {
    up: StatOptions.SpA,
    down: StatOptions.Spe,
  },
  Calm: {
    up: StatOptions.SpD,
    down: StatOptions.Atk,
  },
  Gentle: {
    up: StatOptions.SpD,
    down: StatOptions.Def,
  },
  Careful: {
    up: StatOptions.SpD,
    down: StatOptions.SpA,
  },
  Quirky: {
    up: StatOptions.SpD,
    down: StatOptions.SpD,
  },
  Sassy: {
    up: StatOptions.SpD,
    down: StatOptions.Spe,
  },
  Timid: {
    up: StatOptions.Spe,
    down: StatOptions.Atk,
  },
  Hasty: {
    up: StatOptions.Spe,
    down: StatOptions.Def,
  },
  Jolly: {
    up: StatOptions.Spe,
    down: StatOptions.SpA,
  },
  Naive: {
    up: StatOptions.Spe,
    down: StatOptions.SpD,
  },
  Serious: {
    up: StatOptions.Spe,
    down: StatOptions.Spe,
  },
}
