import 'dotenv/config.js'
import connectDB from './config/dbMongo.js' 
import  {createApp} from './app.js'
import { MovieModel } from './models/mongo/movie.js'

connectDB()
const app = createApp()
const PORT = process.env.PORT ?? 3500
app.listen(PORT, () => {
  console.log(`Server listening in port http://localhost:${PORT}`)
})