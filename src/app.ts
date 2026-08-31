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
//
//

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

const result = await fetch("https://pokepast.es/e036b69f24be2220/json")
const pasteResponse: PokePasteResponse = await result.json()
// console.log(pasteResponse.paste)
const lines = pasteResponse.paste.split("\r\n")

const pkmnArr: PreParsePokemonConfig[] = []

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
    // Remove forcible cast
    gender: parseGender(lines[i].split(/[()]/)[1]),
    item: lines[i].split("@ ")[1].trim(),
    level: parseInt(lines[i + 2].split("Level: ")[1]),
    EVs: parseEvs(lines[i + 3].trim()),
    nature: lines[i + 4].split(" ")[0].trim(),
    moves: parseMoves([lines[i + 5], lines[i + 6], lines[i + 7], lines[i + 8]]),
  }
  count++

  console.log({ pkmn })
}
