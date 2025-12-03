import { jest } from '@jest/globals';

const mockFind = jest.fn();
const mockFindById = jest.fn();
const mockFindByIdAndDelete = jest.fn();
const mockFindByIdAndUpdate = jest.fn();

const MockMovie = jest.fn(function(data) {
  this._id = '507f1f77bcf86cd799439011';
  this.title = data?.title;
  this.year = data?.year;
  this.director = data?.director;
  this.duration = data?.duration;
  this.rate = data?.rate;
  this.poster = data?.poster;
  this.genre = data?.genre;
  this.toObject = jest.fn(function() {
    return {
      _id: this._id,
      title: this.title,
      year: this.year,
      director: this.director,
      duration: this.duration,
      rate: this.rate,
      poster: this.poster,
      genre: this.genre,
    };
  });
  this.save = jest.fn().mockResolvedValue(this);
});

MockMovie.find = mockFind;
MockMovie.findById = mockFindById;
MockMovie.findByIdAndDelete = mockFindByIdAndDelete;
MockMovie.findByIdAndUpdate = mockFindByIdAndUpdate;

await jest.unstable_mockModule('../schemas/mongo/movie.js', () => ({
  Movie: MockMovie,
}));

const { MovieModel } = await import('../models/mongo/movie.js');

describe('Pruebas Unitarias - MovieModel CRUD', () => {
  const mockMovieData = {
    title: 'Test Movie',
    year: 2024,
    director: 'Test Director',
    duration: 120,
    rate: 8.5,
    poster: 'https://example.com/poster.jpg',
    genre: ['Action', 'Drama']
  };

  const mockMovieDoc = {
    _id: '507f1f77bcf86cd799439011',
    ...mockMovieData,
    toObject: jest.fn(() => ({
      _id: '507f1f77bcf86cd799439011',
      ...mockMovieData
    }))
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    test('Debería retornar todas las películas cuando no se proporciona género', async () => {
      const mockMovies = [
        mockMovieDoc, 
        { 
          ...mockMovieDoc, 
          _id: '507f1f77bcf86cd799439012', 
          title: 'Movie 2',
          toObject: jest.fn(() => ({
            _id: '507f1f77bcf86cd799439012',
            ...mockMovieData,
            title: 'Movie 2'
          }))
        }
      ];
      
      mockFind.mockResolvedValue(mockMovies);

      const result = await MovieModel.getAll({});

      expect(mockFind).toHaveBeenCalledWith();
      expect(mockFind).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).not.toHaveProperty('_id');
      expect(result[0].title).toBe(mockMovieData.title);
    });

    test('Debería filtrar películas por género cuando se proporciona', async () => {
      const mockMovies = [mockMovieDoc];
      
      mockFind.mockResolvedValue(mockMovies);

      const result = await MovieModel.getAll({ genre: 'Action' });

      expect(mockFind).toHaveBeenCalledWith({
        genre: { $in: [new RegExp('Action', 'i')] }
      });
      expect(result).toHaveLength(1);
      expect(result[0].genre).toContain('Action');
    });

    test('Debería retornar un array vacío cuando no hay películas', async () => {
      mockFind.mockResolvedValue([]);

      const result = await MovieModel.getAll({});

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getById', () => {
    test('Debería retornar una película cuando existe', async () => {
      mockFindById.mockResolvedValue(mockMovieDoc);

      const result = await MovieModel.getById({ id: '507f1f77bcf86cd799439011' });

      expect(mockFindById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('id', '507f1f77bcf86cd799439011');
      expect(result).not.toHaveProperty('_id');
      expect(result.title).toBe(mockMovieData.title);
      expect(result.director).toBe(mockMovieData.director);
    });

    test('Debería retornar null cuando la película no existe', async () => {
      mockFindById.mockResolvedValue(null);

      const result = await MovieModel.getById({ id: '507f1f77bcf86cd799439999' });

      expect(mockFindById).toHaveBeenCalledWith('507f1f77bcf86cd799439999');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    test('Debería crear una nueva película y retornarla con id', async () => {
      const movieId = '507f1f77bcf86cd799439013';
      const newMovieInstance = {
        _id: movieId,
        ...mockMovieData,
        save: jest.fn().mockResolvedValue({
          _id: movieId,
          ...mockMovieData,
          toObject: jest.fn(() => ({
            _id: movieId,
            ...mockMovieData
          }))
        }),
        toObject: jest.fn(() => ({
          _id: movieId,
          ...mockMovieData
        }))
      };

      MockMovie.mockImplementation(() => newMovieInstance);

      const result = await MovieModel.create({ input: mockMovieData });

      expect(newMovieInstance.save).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('id', movieId);
      expect(result).not.toHaveProperty('_id');
      expect(result.title).toBe(mockMovieData.title);
      expect(result.year).toBe(mockMovieData.year);
      expect(result.director).toBe(mockMovieData.director);
    });

    test('Debería manejar errores de validación de Mongoose', async () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      
      const newMovieInstance = {
        ...mockMovieData,
        save: jest.fn().mockRejectedValue(validationError),
        toObject: jest.fn(() => ({
          _id: '507f1f77bcf86cd799439011',
          ...mockMovieData
        }))
      };

      MockMovie.mockImplementation(() => newMovieInstance);

      await expect(MovieModel.create({ input: mockMovieData })).rejects.toThrow('Validation failed');
      expect(newMovieInstance.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    test('Debería actualizar una película existente y retornarla', async () => {
      const updateData = {
        director: 'Updated Director',
        year: 2025
      };
      
      const updatedMovieDoc = {
        ...mockMovieDoc,
        director: 'Updated Director',
        year: 2025,
        toObject: jest.fn(() => ({
          _id: '507f1f77bcf86cd799439011',
          ...mockMovieData,
          ...updateData
        }))
      };

      mockFindByIdAndUpdate.mockResolvedValue(updatedMovieDoc);

      const result = await MovieModel.update({
        id: '507f1f77bcf86cd799439011',
        input: updateData
      });

      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateData,
        { new: true, runValidators: true }
      );
      expect(result).toHaveProperty('id', '507f1f77bcf86cd799439011');
      expect(result.director).toBe('Updated Director');
      expect(result.year).toBe(2025);
      expect(result.title).toBe(mockMovieData.title);
    });

    test('Debería retornar null cuando la película a actualizar no existe', async () => {
      mockFindByIdAndUpdate.mockResolvedValue(null);

      const result = await MovieModel.update({
        id: '507f1f77bcf86cd799439999',
        input: { title: 'Updated Title' }
      });

      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439999',
        { title: 'Updated Title' },
        { new: true, runValidators: true }
      );
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    test('Debería eliminar una película existente y retornar true', async () => {
      mockFindByIdAndDelete.mockResolvedValue(mockMovieDoc);

      const result = await MovieModel.delete({ id: '507f1f77bcf86cd799439011' });

      expect(mockFindByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toBe(true);
    });

    test('Debería retornar false cuando la película a eliminar no existe', async () => {
      mockFindByIdAndDelete.mockResolvedValue(null);

      const result = await MovieModel.delete({ id: '507f1f77bcf86cd799439999' });

      expect(mockFindByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439999');
      expect(result).toBe(false);
    });
  });
});
