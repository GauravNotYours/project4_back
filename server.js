import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
dotenv.config()
const __dirname = dirname(fileURLToPath(import.meta.url));

let connPromise
async function connectDb() {
  if (!connPromise) {
    connPromise = mongoose.connect(process.env.CONSTR)
  }
  return connPromise
}

const ShSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});
const Sh = mongoose.model('Sh', ShSchema)

const app = express()
const port = process.env.PORT || 3000

app.use(cors());

app.get('/', async (req, res) => {
  await connectDb()
  await Sh.create({ name: "hhello" })
  const cards = await Sh.find({})
  res.json(cards)
})

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
