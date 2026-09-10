import { PDF } from "@libpdf/core"
import { readFile, writeFile } from "node:fs/promises"
import { type PokePasteResponse, type ProcessedPokemonConfig } from "./types.js"
import { POKEDEX_API_SOURCE_URL, POKES_TO_SKIP } from "./constants.js"
import { generatePokemonStats, writePage } from "./util.js"

const paste = process.env.POKE_PASTE

async function main() {
  // Until CLI is completed, there must be a poke paste provided.
  if (!paste) {
    return
  }

  // Fetch the poke paste.
  const result = await fetch(paste)

  // Parse JSON from the poke paste.
  const pasteResponse: PokePasteResponse = await result.json()

  // Use carriage return +n as line delimeter.
  const lines = pasteResponse.paste.split("\r\n")

  // We will generate an array of strongly typed pkmn configurations.
  const pkmnArr: ProcessedPokemonConfig[] = []

  // Batch fetches for efficiency.
  const fetchBatch: Promise<any>[] = []
  pkmnArr.forEach((poke) => {
    console.log(`Fetching ${poke.pokemonName}`)

    // Skip some until we resolve name/gender inconsistencies
    if (POKES_TO_SKIP.includes(poke.pokemonName)) {
      return
    }

    fetchBatch.push(
      fetch(`${POKEDEX_API_SOURCE_URL}${poke.pokemonName.toLowerCase()}/`),
    )
  })

  const fetchResults = await Promise.all(fetchBatch)

  const dexResults: Object[] = []

  for (let r of fetchResults) {
    const jsonResult = await r.json()
    dexResults.push(jsonResult)
  }

  const consolidatedPkmnArr = generatePokemonStats(pkmnArr, dexResults)

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
  writePage(consolidatedPkmnArr, page0, true)

  // Check if there is a second page.
  const page1 = pdf.getPage(1)
  if (!page1) {
    throw new Error("no page 1 in pdf")
  }

  // If so, write it.
  writePage(consolidatedPkmnArr, page1, false)

  // Save new PDF with today's date.
  const newPdf = await pdf.save()
  const currentDate = new Date().toDateString()
  await writeFile(`teamlist-${currentDate}.pdf`, newPdf)
}

main()
