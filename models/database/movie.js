
import { randomUUID } from 'node:crypto'
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',  
  database: 'movies',      
  port: 3306
})

export class MovieModel {
  static async getAll() {
  const [rows] = await pool.query('SELECT * FROM peliculas')
  return rows.map(r => ({ ...r, genre: JSON.parse(r.genre) }))
}


  static async getById({ id }) {
    const [rows] = await pool.query('SELECT * FROM peliculas WHERE id = ?', [id])
    if (rows.length === 0) return null
    const movie = rows[0]
    return { ...movie, genre: JSON.parse(movie.genre) }
  }

  static async create({ input }) {
    const id = randomUUID()
    const { title, year, director, duration, poster, genre, rate } = input
    await pool.query(
      `INSERT INTO peliculas (id, title, year, director, duration, poster, genre, rate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, year, director, duration, poster, JSON.stringify(genre), rate]
    )
    return { id, ...input }
  }

  static async update({ id, input }) {
    const fields = []
    const values = []
    for (const [key, value] of Object.entries(input)) {
      if (key === 'genre') {
        fields.push(`${key} = ?`)
        values.push(JSON.stringify(value))
      } else {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    }
    values.push(id)
    const query = `UPDATE peliculas SET ${fields.join(', ')} WHERE id = ?`
    await pool.query(query, values)
    return this.getById({ id })
  }

  static async delete({ id }) {
    const [result] = await pool.query('DELETE FROM peliculas WHERE id = ?', [id])
    return result.affectedRows > 0
  }
}
