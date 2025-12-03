import 'dotenv/config.js'
import connectDB from './config/dbMongo.js' 
import  {createApp} from './app.js'
import { MovieModel } from './models/mongo/movie.js'

connectDB()
createApp()