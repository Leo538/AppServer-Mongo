
import {Movie} from '../../schemas/mongo/movie.js'

// Función helper para transformar _id a id
const transformMovie = (movie) => {
  if (!movie) return null
  const movieObj = movie.toObject ? movie.toObject() : movie
  const { _id, ...rest } = movieObj
  return { id: _id.toString(), ...rest }
}

export class MovieModel {
    static async getAll ({ genre }) {
  let movies
  if (genre) {
    movies = await Movie.find({
      genre: { $in: [new RegExp(genre, 'i')] }
    })
  } else {
    movies = await Movie.find()
  }
  return movies.map(transformMovie)
}


    static async getById({id}){
        const movie = await Movie.findById(id)
        return transformMovie(movie)
    }

    static async create({ input })
    {
        const newMovie = new Movie(input)
        const saved = await newMovie.save()
        return transformMovie(saved)
    }

    static async delete({id}){
        const movieDeleted = await Movie.findByIdAndDelete(id)
        return movieDeleted !== null
    }

    static async update({id, input}){
        const updateMovie = await Movie.findByIdAndUpdate(id, input, 
            {new: true, runValidators:true})
        return transformMovie(updateMovie)
    }
}