
import { randomUUID } from 'node:crypto'
import { readJSON } from '../../utils.js'


const movies = readJSON('./movies.json')

export class MovieModel {
  static async getAll({ genre }) {
    if (genre) {
      const filtered = movies.filter(movie =>
        movie.genre?.some(g => g.toLowerCase() === genre.toLowerCase())
      )
      return filtered
    }
    return movies
  }

  static async getById({ id }) {
    return movies.find(m => m.id === id)
  }

  static async create({ input }) {
    const newMovie = {
      id: randomUUID(),
      ...input
    }
    movies.push(newMovie)
    return newMovie
  }

  static async delete({ id }) {
    const movieIndex = movies.findIndex(movie => movie.id === id)
    if (movieIndex === -1) return false
    movies.splice(movieIndex, 1)
    return true
  }

  static async update({ id, input }) {
    const movieIndex = movies.findIndex(movie => movie.id === id)
    if (movieIndex === -1) return false

    const updatedMovie = {
      ...movies[movieIndex],
      ...input
    }

    movies[movieIndex] = updatedMovie
    return updatedMovie
  }
}
