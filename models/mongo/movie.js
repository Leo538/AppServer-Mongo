
import {Movie} from '../../schemas/mongo/movie.js'

export class MovieModel {
    static async getAll ({ genre }) {
  if (genre) {
    return await Movie.find({
      genre: { $in: [new RegExp(genre, 'i')] }
    })
  }
  return await Movie.find() 
}


    static async getById({id}){
        return Movie.findById(id)
    }

    static async create({ input })
    {
        const newMovie = new Movie(input)
        return await newMovie.save()
    }

    static async delete({id}){
        const movieDeleted = await Movie.findByIdAndDelete(id)
        return movieDeleted !== null
    }

    static async update({id, input}){
        const updateMovie = await Movie.findByIdAndUpdate(id, input, 
            {new: true, runValidators:true})
        return updateMovie
    }
}