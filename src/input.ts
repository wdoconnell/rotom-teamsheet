import * as readline from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"
import type { PlayerInput } from "./types.js"

const DIVISIONS = ["Juniors", "Seniors", "Masters"]

export async function handleInput(): Promise<PlayerInput> {
  const rl = readline.createInterface({ input, output })

  const url = await rl.question("Paste the URL of the poke paste to fetch\n")

  const playerName = await rl.question("Enter your player name.\n")
  const trainerName = await rl.question("Enter your trainer name.\n")
  const profileName = await rl.question("Enter your Switch profile name.\n")

  let division = ""
  while (!DIVISIONS.includes(division)) {
    division = await rl.question(
      "Enter your division (Juniors, Seniors, Masters).\n",
    )
  }

  const year = await rl.question("Enter your year of birth.\n")
  const month = await rl.question("Enter your month of birth.\n")
  const day = await rl.question("Enter your day of birth.\n")
  const playerID = await rl.question("Enter your player ID number.\n")
  const supportID = await rl.question(
    "Enter your Pokemon Champions Support ID.\n",
  )
  const switchProfileName = await rl.question(
    "Enter your Switch profile name.\n",
  )
  const teamName = await rl.question("Enter your team's name.\n")

  rl.close()

  return {
    url,
    playerName,
    trainerName,
    profileName,
    division,
    dob: {
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
    },
    playerID: parseInt(playerID),
    supportID,
    switchProfileName,
    teamName,
  }
}
