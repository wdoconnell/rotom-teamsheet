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
  HP: number
  Atk: number
  Def: number
  SpAtk: number
  SpDef: number
  Speed: number
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

const parseStats = (responseArr: PokeApiStatResponse[]): PokemonStats => {
  const stats: PokemonStats = {
    HP: 0,
    Atk: 0,
    Def: 0,
    SpAtk: 0,
    SpDef: 0,
    Speed: 0,
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
        stats.SpAtk = r.base_stat
        break
      case PokeApiStatNames.SpDef:
        stats.SpDef = r.base_stat
        break
      case PokeApiStatNames.Speed:
        stats.Speed = r.base_stat
        break
      default:
        break
    }
  })

  return stats
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

const EVOptions = {
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
      case EVOptions.HP:
        parsedEVs.hp = parsedStat
        break
      case EVOptions.Atk:
        parsedEVs.atk = parsedStat
        break
      case EVOptions.Def:
        parsedEVs.def = parsedStat
        break
      case EVOptions.SpA:
        parsedEVs.spatk = parsedStat
        break
      case EVOptions.SpD:
        parsedEVs.spdef = parsedStat
        break
      case EVOptions.Spe:
        parsedEVs.speed = parsedStat
        break
      default:
        break
    }
  })

  return parsedEVs
}

console.log("Fetching poke paste")
const result = await fetch(paste)
const pasteResponse: PokePasteResponse = await result.json()
// console.log(pasteResponse.paste)
const lines = pasteResponse.paste.split("\r\n")

const pkmnArr: ProcessedPokemonConfig[] = []

let count = 0

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Each config is 10 lines.
console.log("iterating over each value in result")
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

  console.log(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}/`)
  const fetchResult = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}/`,
  )

  const json = await fetchResult.json()

  const parsedPkmnStats = parseStats(json["stats"])
  console.log({ name: poke.pokemonName })
  console.log({ parsedPkmnStats })
})
