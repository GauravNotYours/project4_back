import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { log } from 'console'
dotenv.config()
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
  },
  { timestamps: true }
);
const Sh = mongoose.model('Sh', ShSchema)

const app = express()
const port = process.env.PORT || 3000

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))


const createSh = async (req, res) => {
  try {
    await connectDb()
    const doc = await Sh.create(req.body)
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


if (!process.env.VERCEL) {
  connectDb()
    .then(() => {
      app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
      })
    })
    .catch((err) => {
      console.error('Failed to start server:', err)
      process.exit(1)
    })
}

export default app
