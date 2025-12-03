import 'dotenv/config.js';
import request from 'supertest';
import { createApp } from '../app.js';
import connectDB from '../config/dbMongo.js';
import { MovieModel } from '../models/mongo/movie.js';

describe('Pruebas de Integración - Endpoints /movies', () => {
  let app;
  let testMovieId;

  // Datos de prueba para crear una película
  const testMovieData = {
    title: 'Test Movie Integration',
    year: 2024,
    director: 'Test Director',
    duration: 120,
    rate: 8.5,
    poster: 'https://example.com/test-poster.jpg',
    genre: ['Action', 'Drama']
  };

  beforeAll(async () => {
    // Conectar a la base de datos
    await connectDB();
    // Crear la aplicación Express
    app = createApp();
  });

  afterAll(async () => {
    // Limpiar: eliminar la película de prueba si existe
    if (testMovieId) {
      await MovieModel.delete({ id: testMovieId });
    }
    // Cerrar conexión a MongoDB
    const mongoose = (await import('mongoose')).default;
    await mongoose.connection.close();
  });

  describe('GET /movies', () => {
    test('Debería responder con status 200 y retornar un array de películas', async () => {
      const response = await request(app)
        .get('/movies')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(0);
    });

    test('Debería filtrar películas por género cuando se proporciona query parameter', async () => {
      const response = await request(app)
        .get('/movies?genre=Action')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toBeInstanceOf(Array);
      // Verificar que todas las películas retornadas tienen el género Action
      response.body.forEach(movie => {
        expect(movie.genre).toContain('Action');
      });
    });
  });

  describe('GET /movies/:id', () => {
    test('Debería responder con status 404 cuando la película no existe', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // ID de MongoDB válido pero inexistente
      const response = await request(app)
        .get(`/movies/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Movie not found');
    });
  });

  describe('POST /movies', () => {
    test('Debería crear una nueva película y responder con status 201', async () => {
      const response = await request(app)
        .post('/movies')
        .send(testMovieData)
        .expect(201)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(testMovieData.title);
      expect(response.body.year).toBe(testMovieData.year);
      expect(response.body.director).toBe(testMovieData.director);
      expect(response.body.duration).toBe(testMovieData.duration);
      expect(response.body.rate).toBe(testMovieData.rate);
      expect(response.body.poster).toBe(testMovieData.poster);
      expect(response.body.genre).toEqual(testMovieData.genre);

      // Guardar el ID para limpieza posterior
      testMovieId = response.body.id;
    });

    test('Debería responder con status 400 cuando faltan campos requeridos', async () => {
      const invalidMovie = {
        title: 'Invalid Movie',
        // Faltan campos requeridos
      };

      const response = await request(app)
        .post('/movies')
        .send(invalidMovie)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('Debería responder con status 400 cuando los datos son inválidos', async () => {
      const invalidMovie = {
        title: 'Invalid Movie',
        year: 1800, // Año fuera del rango permitido
        director: 'Director',
        duration: -10, // Duración negativa
        rate: 15, // Rate fuera del rango
        poster: 'not-a-url', // URL inválida
        genre: ['InvalidGenre'] // Género no permitido
      };

      const response = await request(app)
        .post('/movies')
        .send(invalidMovie)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /movies/:id', () => {
    test('Debería actualizar una película existente y responder con status 200', async () => {
      // Primero crear una película
      const createResponse = await request(app)
        .post('/movies')
        .send(testMovieData)
        .expect(201);

      const movieId = createResponse.body.id;
      testMovieId = movieId;

      // Actualizar la película
      const updateData = {
        director: 'Updated Director',
        year: 2025
      };

      const response = await request(app)
        .patch(`/movies/${movieId}`)
        .send(updateData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.director).toBe(updateData.director);
      expect(response.body.year).toBe(updateData.year);
      expect(response.body.title).toBe(testMovieData.title); // Otros campos no deberían cambiar
    });

    test('Debería responder con status 400 cuando los datos de actualización son inválidos', async () => {
      if (!testMovieId) {
        // Si no hay película de prueba, crear una
        const createResponse = await request(app)
          .post('/movies')
          .send(testMovieData)
          .expect(201);
        testMovieId = createResponse.body.id;
      }

      const invalidUpdate = {
        year: 3000, // Año fuera del rango
        rate: 20 // Rate fuera del rango
      };

      const response = await request(app)
        .patch(`/movies/${testMovieId}`)
        .send(invalidUpdate)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /movies/:id', () => {
    test('Debería eliminar una película existente y responder con status 200', async () => {
      // Primero crear una película para eliminar
      const createResponse = await request(app)
        .post('/movies')
        .send(testMovieData)
        .expect(201);

      const movieId = createResponse.body.id;

      // Eliminar la película
      const response = await request(app)
        .delete(`/movies/${movieId}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Movie deleted');

      // Verificar que la película fue eliminada
      const getResponse = await request(app)
        .get(`/movies/${movieId}`)
        .expect(404);
    });

    test('Debería responder con status 400 cuando se intenta eliminar una película inexistente', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/movies/${fakeId}`)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Movie not found');
    });
  });

  describe('Flujo completo CRUD', () => {
    test('Debería completar un flujo completo: Crear -> Leer -> Actualizar -> Eliminar', async () => {
      // 1. CREAR
      const createResponse = await request(app)
        .post('/movies')
        .send(testMovieData)
        .expect(201);

      const movieId = createResponse.body.id;
      expect(movieId).toBeDefined();

      // 2. LEER (GET por ID)
      const getResponse = await request(app)
        .get(`/movies/${movieId}`)
        .expect(200);

      expect(getResponse.body.id).toBe(movieId);
      expect(getResponse.body.title).toBe(testMovieData.title);

      // 3. ACTUALIZAR
      const updateData = { title: 'Updated Movie Title' };
      const updateResponse = await request(app)
        .patch(`/movies/${movieId}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.title).toBe(updateData.title);

      // 4. ELIMINAR
      const deleteResponse = await request(app)
        .delete(`/movies/${movieId}`)
        .expect(200);

      expect(deleteResponse.body.message).toBe('Movie deleted');

      // Verificar que ya no existe
      await request(app)
        .get(`/movies/${movieId}`)
        .expect(404);
    });
  });
});

