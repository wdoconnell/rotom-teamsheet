import { PDF } from "@libpdf/core"
import { readFile, writeFile } from "node:fs/promises"
import {
  type PokeApiResult,
  type PokePasteResponse,
  type ProcessedPokemonConfig,
} from "./types.js"
import { POKEDEX_API_SOURCE_URL } from "./constants.js"
import {
  generatePokemonStats,
  handleCaps,
  parsePokemonConfigs,
  writePage,
} from "./util.js"
import { pasteNameToDexName } from "./pokemap.js"

const paste = process.env.POKE_PASTE

async function main() {
  // Until CLI is completed, there must be a poke paste provided.
  if (!paste) {
    throw new Error("No pokemon paste provided. You must set a POKE_PASTE env.")
  }

  // Fetch the poke paste.
  const result = await fetch(paste)

  // Parse JSON from the poke paste.
  const pasteResponse: PokePasteResponse = await result.json()

  // Use carriage return +n as line delimeter.
  const lines = pasteResponse.paste.split("\r\n")

  // We will generate an array of strongly typed pkmn configurations.
  const pkmnArr: ProcessedPokemonConfig[] = parsePokemonConfigs(lines)

  // Batch fetches.
  const fetchBatch: Promise<any>[] = []
  pkmnArr.forEach((poke) => {
    poke.pokemonName = pasteNameToDexName(poke)

    fetchBatch.push(fetch(`${POKEDEX_API_SOURCE_URL}${poke.pokemonName}/`))
  })

  const fetchResults = await Promise.all(fetchBatch)

  const dexResults: PokeApiResult[] = []

  for (let r of fetchResults) {
    const jsonResult = await r.json()
    dexResults.push(jsonResult)
  }

  const consolidatedPkmnArr = generatePokemonStats(pkmnArr, dexResults)

  const namedPkmnArr = handleCaps(consolidatedPkmnArr)

  console.log({ namedPkmnArr })

  // Load the base teamsheet
  let pdfData = await readFile("teamlist.pdf")
  const pdf = await PDF.load(pdfData)

  // TODO - Could consider writing both at once.
  // Check if there is a first page.
  const page0 = pdf.getPage(0)
  if (!page0) {
    throw new Error("no page 0 in pdf")
  }

  // If so, write it.
  writePage(namedPkmnArr, page0, true)

  // Check if there is a second page.
  const page1 = pdf.getPage(1)
  if (!page1) {
    throw new Error("no page 1 in pdf")
  }

  // If so, write it.
  writePage(namedPkmnArr, page1, false)

  // Save new PDF with today's date.
  const newPdf = await pdf.save()
  const currentDate = new Date().toDateString()
  await writeFile(`teamlist-${currentDate}.pdf`, newPdf)
}

main()
