import express from 'express'
import { Telegraf } from 'telegraf'
import mongoose from 'mongoose'
import cors from 'cors'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { log } from 'console'
dotenv.config()

const isVercel = Boolean(process.env.VERCEL)
const botToken = process.env.BOT_TOKEN
const webhookUrl = process.env.WEBHOOK_URL
const allowedUsername = String(
  process.env.ALLOWED_USERNAME || 'GAURAVNOTYOURS'
).toUpperCase()
const allowedUserId = process.env.ALLOWED_USER_ID
const shouldStartBot = !isVercel && Boolean(botToken)
const shouldUseWebhook = isVercel && Boolean(botToken) && Boolean(webhookUrl)
let bot
let isServerStopped = false
let httpServer
const isHttpServerListening = () => Boolean(httpServer?.listening)

if (botToken) {
  bot = new Telegraf(botToken)
  bot.use(async (ctx, next) => {
    const username = String(ctx.chat?.username || '').toUpperCase()
    const userId = String(ctx.from?.id || '')
    const isAllowed =
      (allowedUsername && username === allowedUsername) ||
      (allowedUserId && userId === String(allowedUserId))

    if (!isAllowed) {
      const msg =
        'Not authorized.\n' +
        `Username: ${ctx.chat?.username || 'none'}\n` +
        `User ID: ${ctx.from?.id || 'unknown'}`
      await ctx.reply(msg)
      return
    }

    await next()
  })
  bot.catch((err, ctx) => {
    console.error('Telegraf error:', err, ctx.update)
  })
}




const __dirname = dirname(fileURLToPath(import.meta.url));

let connPromise
async function connectDb() {
  if (!connPromise) {
    connPromise = mongoose.connect(process.env.CONSTR)
  }
  return connPromise
}

const ShSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    yourDob: { type: Date, required: true },
    phone: { type: Number, required: true },
    email: { type: String, required: true },
    city: { type: String, required: true },
    familyStatus: { type: String, required: true },
    partner: { type: String, required: true },
    partnerDob: { type: Date, required: true },
    partnerPhone: { type: Number, required: true },
    partnerEmail: { type: String, required: true },
    partnerCity: { type: String, required: true },
    partnerFamilyStatus: { type: String, required: true },
    preferredDate: { type: Date, required: true },
    budget: { type: String, required: true },
    details: { type: String, required: true },
    honeymoon: { type: Boolean, required: true },
    seen: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const Sh = mongoose.model('Sh', ShSchema)

const app = express()
const port = process.env.PORT || 3000

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use((req, res, next) => {
  if (isServerStopped && req.path !== '/telegram-webhook') {
    return res
      .status(503)
      .json({ error: 'Server stopped.' })
  }
  next()
})


const createSh = async (req, res) => {
  try {
    await connectDb()
    const doc = await Sh.create({ ...req.body, seen: false })
    res.status(201).json(doc)
  } catch (err) {
    console.error('Failed to create Sh:', err)
    res.status(400).json({ error: err.message })
  }
}

app.options('/gg', cors())
app.options('/api/gg', cors())
app.post('/gg', createSh)
app.post('/api/gg', createSh)

if (bot) {
  bot.use(async (ctx, next) => {
    const text = String(ctx.message?.text || '')
    const isStartCommand = text.startsWith('/start4')
    const isStopCommand = text.startsWith('/stop4')

    if (isServerStopped && !isStartCommand && !isStopCommand && !isStartMessage) {
      await ctx.reply('Server is stopped. Use /start4 to start it again.')
      return
    }
    await next()
  })

  bot.command('logreq', tele)
  bot.command('stop4', async (ctx) => {
    if (isServerStopped) {
      await ctx.reply('Server is already stopped.')
      return
    }

    isServerStopped = true
    await ctx.reply('Server stopped. Use /start4 to resume.')
    console.log("server stoped by telegram bot command");

    if (httpServer) {
      httpServer.close((err) => {
        if (err) {
          console.error('Error while stopping HTTP server:', err)
          return
        }
        console.log('HTTP server stopped by /stop command')
        httpServer = undefined
      })
    }
  })

  bot.command('start4', async (ctx) => {
    if (!isServerStopped && isHttpServerListening()) {
      await ctx.reply('Server is already running.')
      return
    }

    isServerStopped = false

    if (!isHttpServerListening() && !process.env.VERCEL) {
      httpServer = app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
      })
    }

    await ctx.reply('Server started.')
    console.log('server started by telegram bot command')
  })

  bot.command('status4', async (ctx) => {
    const running = !isServerStopped && (isVercel || isHttpServerListening())
    const statusText = running ? 'running' : 'stopped'
    await ctx.reply(`Server is ${statusText}.`)
  })
}

if (shouldUseWebhook) {
  const webhookPath = '/telegram-webhook'
  const webhookFullUrl = `${webhookUrl.replace(/\/$/, '')}${webhookPath}`

  bot.telegram.setWebhook(webhookFullUrl).catch((err) => {
    console.error('Failed to set Telegram webhook:', err)
  })

  app.post(webhookPath, (req, res) => {
    bot.handleUpdate(req.body, res).catch((err) => {
      console.error('Failed to handle Telegram update:', err)
      if (!res.headersSent) {
        res.sendStatus(500)
      }
    })
  })
}


if (!process.env.VERCEL) {
  connectDb()
    .then(() => {
      httpServer = app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
      })
    })
    .catch((err) => {
      console.error('Failed to start server:', err)
      process.exit(1)
    })
}

export default app

async function tele(ctx) {
  await connectDb()
  const req = await Sh.find({ seen: false })
  // console.log(req.length);

  if (req.length === 0) {
    await ctx.reply('Does not have pending request')
    return
  }

  for (let l = 0; l < req.length; l++) {
    const element = req[l];
    
    const msg =
      `Name: <b>${element.name}</b>\n` +
      `Your DOB: <b>${element.yourDob}</b>\n` +
      `Phone: <b>${element.phone}</b>\n` +
      `Email: <b>${element.email}</b>\n` +
      `City: <b>${element.city}</b>\n` +
      `Family Status: <b>${element.familyStatus}</b>\n` +
      `Partner: <b>${element.partner}</b>\n` +
      `Partner DOB: <b>${element.partnerDob}</b>\n` +
      `Partner Phone: <b>${element.partnerPhone}</b>\n` +
      `Partner Email: <b>${element.partnerEmail}</b>\n` +
      `Partner City: <b>${element.partnerCity}</b>\n` +
      `Partner Family Status: <b>${element.partnerFamilyStatus}</b>\n` +
      `Preferred Date: <b>${element.preferredDate}</b>\n` +
      `Budget: <b>${element.budget}</b>\n` +
      `Details: <b>${element.details}</b>\n` +
      `Honeymoon: <b>${element.honeymoon}</b>\n` +
      `Seen: <b>${element.seen}</b>\n`;
    await ctx.reply(msg, { parse_mode: 'HTML' })
  }

  await Sh.updateMany({ seen: false }, { $set: { seen: true } })

  console.log("server get logreq request");
  

}

if (shouldStartBot) {
  bot.launch()
  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'))
  process.once('SIGTERM', () => bot.stop('SIGTERM'))
}
