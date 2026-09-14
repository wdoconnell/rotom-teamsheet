// For this program to work, we need to translate EVs into actual pokemon stats
// This fetches that data from PokeAPI, but one could (in theory) use another source
// if the parser in this program were modified.
export const POKEDEX_API_SOURCE_URL = "https://pokeapi.co/api/v2/pokemon/"

// Player Header Indents, in Pixels
export const PLAYER_NAME_AREA_INDENT_X = 150
export const PLAYER_NAME_AREA_START_Y = 705

// Form indents
export const FORM_LEFT_INDENT_X = 95
export const FORM_RIGHT_INDENT_X = 385
export const POKEMON_START_LEFT_ONE = 610
export const DIST_NAME_TO_ALIGNMENT = 26
export const DIST_ALIGNMENT_TO_ABILITY = 24
export const DIST_ABILITY_TO_ITEM = 25
export const DIST_ITEM_TO_MOVE1 = 22
export const DIST_MOVE1_TO_MOVE2 = 23
export const DIST_MOVE2_TO_MOVE3 = 23
export const DIST_MOVE3_TO_MOVE4 = 23
export const FORM_X_DIST_TO_STATS = 175
export const DIST_TO_NEXT_STAT = 22
export const Y_DIST_TO_NEXT_POKE_PAGE_ONE = 41
export const Y_DIST_TO_NEXT_POKE_PAGE_TWO = 34

export const HP_STAT_ADJUST_CONSTANT = 75
export const NONHP_STAT_ADJUST_CONSTANT = 20
