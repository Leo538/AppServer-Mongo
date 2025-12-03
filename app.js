
import express, { json } from 'express'
import { corsMiddleware } from './middlewares/cors.js'
import { movieRouter } from './routes/movie.js'

export const createApp = () => {

  const app = express()

  app.use(express.json())
  app.disable('x-powered-by')
  app.use(corsMiddleware())


  app.use('/movies', movieRouter)

  return app
}
