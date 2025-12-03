
import express, { json } from 'express'
import { corsMiddleware } from './middlewares/cors.js'
import { movieRouter } from './routes/movie.js'

export const createApp = () => {

  const app = express()

  app.use(express.json())
  app.disable('x-powered-by')
  app.use(corsMiddleware())


  app.use('/movies', movieRouter)

  const PORT = process.env.PORT ?? 3500
  app.listen(PORT, () => {
    console.log(`Server listening in port http://localhost:${PORT}`)
  })
}
