import * as readline from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"
import type { JSONConfig, PlayerInput } from "./types.js"
import { readFileSync } from "node:fs"

const PLAYER_CONFIG_FILE =
  process.env.PLAYER_CONFIG_FILE ?? ".playerconfig.json"

const DIVISIONS = ["Juniors", "Seniors", "Masters"]

export async function handlePaste(): Promise<string> {
  const rl = readline.createInterface({ input, output })

  const url = await rl.question("Paste the URL of the poke paste to fetch\n")

  rl.close()

  return url
}

export async function handlePlayer(): Promise<PlayerInput> {
  if (PLAYER_CONFIG_FILE) {
    const rl = readline.createInterface({ input, output })

    // TODO -- Add validation
    try {
      const data = readFileSync(PLAYER_CONFIG_FILE).toString()
      const jsonData: JSONConfig = JSON.parse(data)

      const teamName = await rl.question(
        "Enter your team's name, as it appears in game.\n",
      )

      rl.close()

      const {
        playerName,
        trainerName,
        division,
        playerID,
        supportID,
        switchProfileName,
        dob,
      } = jsonData

      const dobArr = dob.split("-").map((e) => parseInt(e))

      return {
        playerName,
        trainerName,
        division,
        playerID,
        supportID,
        switchProfileName,
        dob: {
          month: dobArr[0],
          day: dobArr[1],
          year: dobArr[2],
        },
        teamName,
      }
    } catch (err) {
      console.log(
        `No existing playerconfiguration found at ${PLAYER_CONFIG_FILE}. Prompting for answers.`,
      )
    }
  }

  const rl = readline.createInterface({ input, output })

  const playerName = await rl.question("Enter your player name (full name).\n")
  const trainerName = await rl.question("Enter your trainer name (in game).\n")
  const switchProfileName = await rl.question(
    "Enter your Switch profile name.\n",
  )

  let division = ""
  while (!DIVISIONS.includes(division)) {
    division = await rl.question(
      "Enter your division (Juniors, Seniors, Masters).\n",
    )
  }

  const year = await rl.question(
    "Enter the number of your year of birth (e.g., 1995).\n",
  )
  const month = await rl.question("Enter your month of birth (e.g., 01).\n")
  const day = await rl.question("Enter your day of birth (e.g., 07).\n")
  const playerID = await rl.question("Enter your player ID number.\n")
  const supportID = await rl.question(
    "Enter your Pokemon Champions Support ID.\n",
  )
  const teamName = await rl.question(
    "Enter your team's name, as it appears in game.\n",
  )

  rl.close()

  return {
    playerName,
    trainerName,
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
