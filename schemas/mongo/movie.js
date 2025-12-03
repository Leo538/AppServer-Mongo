import mongoose from 'mongoose'
import { trim } from 'zod'
import { required } from 'zod/mini'

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Movie title is required'],
        trim: true
    },
    year: {
        type: Number,
        required: [true, 'Movie year is required'],
        min: [1900, 'Year cannot be before 1900'],
        max: [2025, 'Year cannot be after 2025']
    },    
    director: {
        type: String,
        required: [true, 'Movie director is required'],
        trim: true
    },    
    duration: {
        type: Number,
        required: [true, 'Movie duration is required'],
        min: [1, 'Duration mus be a positive number']
    },    
    rate: {
        type: Number,
        default: 5,
        required: [true, 'Movie duration is required'],
        min: 0,
        max: 10
    },        
    poster: {
        type: String,
        required: [true, 'Movie poster is required'],
        match: [/^https?:\/\/.+\..+/, 'Movie poster must be a valid URL']
    },      
    genre:[{
        type: String,
        required: true,
        enum: {
            values: ['Action', 'Adventure', 'Comedy', 'Drama', 'Crime', 'Fantasy', 'Horror', 'Thriller', 'Sci-Fi'],
            message: 'Genre must be one of the allowed values'
        }
    }] 
}, {
    timestamps: true
})

export const Movie = mongoose.model('Movie', movieSchema)