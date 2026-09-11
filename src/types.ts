// This is an incomplete interface, as we
// currently only expose the needed fields
// TODO - can this be pulled automatically?
export interface PokeApiResult {
  id: number
  name: string
  stats: PokeApiStat[]
}

export interface PokeApiStatSrc {
  name: string
  url: string
}

export interface PokeApiStat {
  base_stat: number
  effort: number
  stat: PokeApiStatSrc
}

export const StatOptions = {
  HP: "HP",
  Atk: "Atk",
  Def: "Def",
  SpA: "SpA",
  SpD: "SpD",
  Spe: "Spe",
} as const

export interface PokemonStats {
  [StatOptions.HP]: number
  [StatOptions.Atk]: number
  [StatOptions.Def]: number
  [StatOptions.SpA]: number
  [StatOptions.SpD]: number
  [StatOptions.Spe]: number
}

// Records natures
export const Nature: Record<string, StatApplication> = {
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

export interface StatApplication {
  up: keyof typeof StatOptions
  down: keyof typeof StatOptions
}

export interface PokePasteResponse {
  author: string
  notes: string
  paste: string
  title: string
}

export const Gender = {
  M: "M",
  F: "F",
  None: "",
} as const

export interface ParsedEvs {
  hp: number
  def: number
  spdef: number
  atk: number
  spatk: number
  speed: number
}

export interface ProcessedPokemonConfig {
  pokemonName: string
  ability: string
  gender: (typeof Gender)[keyof typeof Gender]
  // Should probably make this strongly typed.
  item: string
  level: number
  EVs: ParsedEvs
  // Should also make this strongly typed
  nature: string
  // This could also be strongly typed.
  moves: string[]
}

export interface ConsolidatedPkmn {
  name: string
  alignment: string
  ability: string
  item: string
  move1: string
  move2: string
  move3: string
  move4: string
  stats: PokemonStats
}

export const PokeApiStatNames = {
  HP: "hp",
  Atk: "attack",
  Def: "defense",
  SpAtk: "special-attack",
  SpDef: "special-defense",
  Speed: "speed",
} as const

export interface PokeApiStat {
  name: string
  url: string
}

interface DOB {
  year: number
  month: number
  day: number
}

// Player Information
// Struct of data to be entered into the PDF. No data is stored by this program.
// It is simply input into local PDF instance.
export interface PlayerInput {
  playerName: string
  trainerName: string
  profileName: string
  division: string
  dob: DOB
  playerID: number
  supportID: string
  switchProfileName: string
  teamName: string
  url: string
}
