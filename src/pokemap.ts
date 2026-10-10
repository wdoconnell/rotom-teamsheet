import type { Gender, ProcessedPokemonConfig } from "./types.js"

export const LongGenders = {
  Male: "Male",
  Female: "Female",
  None: "",
}

const mapGender = (
  gAbbrev: (typeof Gender)[keyof typeof Gender],
): (typeof LongGenders)[keyof typeof LongGenders] => {
  switch (gAbbrev) {
    case "M":
      return "male"
    case "F":
      return "female"
    default:
      return ""
  }
}

export const pasteNameToDexName = (
  pkmnConfig: ProcessedPokemonConfig,
): string => {
  let lowerCase = pkmnConfig.pokemonName.toLowerCase()
  const gender = mapGender(pkmnConfig.gender)

  if (pkmnConfig.pokemonName === "Basculegion") {
    lowerCase = `${lowerCase}-${gender}`
  }

  const megaIndicator = lowerCase.indexOf("-mega")
  if (megaIndicator !== -1) {
    return lowerCase.slice(0, megaIndicator)
  }

  return lowerCase
}
