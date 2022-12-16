const Discord = require("discord.js")
require("dotenv").config()
const axios = require("axios")

const TOKEN = "MTA1MzI3MzM3NDM1MDExODkzMg.GxAaqN.H_ah9wk58nRJdUL8aAxVCrSakOOihMyFfycbdw"
const WEBSITE_URL = "https://brenek.art"

const client = new Discord.Client({
  intents: [
    "GUILDS",
    "GUILD_MESSAGES"
  ]
})

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`)
  checkWebsite()
  setInterval(checkWebsite, 60000) // check every minute
})

let lastContentHash = null

async function checkWebsite() {
  try {
    const { data } = await axios.get(WEBSITE_URL)
    const currentContentHash = hash(data)
    if (currentContentHash !== lastContentHash) {
      lastContentHash = currentContentHash
      client.guilds.cache.forEach(guild => {
        guild.channels.cache.forEach(channel => {
          if (channel.type === "text") {
            channel.send(`Právě jsem přidal nový blog post na moje webovky! ${WEBSITE_URL}`)
          }
        })
      })
    }
  } catch (error) {
    console.error(error)
  }
}

function hash(str) {
  let hash = 0
  if (str.length === 0) return hash
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}

client.login(TOKEN)
