interface PokePasteResponse {
  author: string
  notes: string
  paste: string
  title: string
}

type Gender = "M" | "F"

interface PreParsePokemonConfig {
  pokemonName: string
  gender?: Gender
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
  gender?: Gender
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

const result = await fetch("https://pokepast.es/e036b69f24be2220/json")
const pasteResponse: PokePasteResponse = await result.json()
console.log(pasteResponse.paste)
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
  const pkmn: PreParsePokemonConfig = {
    pokemonName: lines[i].split("(")[0],
    // Remove forcible cast
    gender: lines[i].split(/[()]/)[i + 1] as Gender,
    item: lines[i].split("@ ")[1],
    level: parseInt(lines[i + 2].split("Level: ")[1]),
    EVs: lines[i + 3],
    nature: lines[i + 4].split(" ")[0],
    moves: [],
  }
  count++

  console.log({ pkmn })
}
