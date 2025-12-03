import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MovieService } from './services/movie.service';
import { Movie } from './models/movie.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  movies: Movie[] = [];
  loading = true;

  constructor(private movieService: MovieService) {}

  ngOnInit(): void {
    this.loadMovies();
  }

  loadMovies(): void {
    this.loading = true;
    this.movieService.getAllMovies().subscribe({
      next: (movies) => {
        this.movies = movies;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading movies:', error);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar las películas.', 'error');
      }
    });
  }

  deleteMovie(movie: Movie): void {
    Swal.fire({
      title: '¿Estás seguro?',
      html: `<b>${movie.title}</b> será eliminado permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#fff',
      color: '#333',
      reverseButtons: true,
      focusCancel: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.movieService.deleteMovie(movie.id).subscribe({
          next: () => {
            this.movies = this.movies.filter(m => m.id !== movie.id);
            Swal.fire({
              title: 'Eliminado',
              text: `"${movie.title}" se eliminó correctamente.`,
              icon: 'success',
              confirmButtonColor: '#3085d6',
              background: '#fff',
              color: '#333'
            });
          },
          error: (error) => {
            console.error('Error deleting movie:', error);
            Swal.fire('Error', 'No se pudo eliminar la película.', 'error');
          }
        });
      }
    });
  }

  openCreateMovieModal(): void {
    const genres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Crime', 'Fantasy', 'Horror', 'Thriller', 'Sci-Fi'];
    
    Swal.fire({
      title: '🎬 Crear Nueva Película',
      html: `
        <div style="text-align: left;">
          <input id="swal-title" class="swal2-input" placeholder="Título de la película" required>
          <input id="swal-year" class="swal2-input" type="number" placeholder="Año (1900-2025)" min="1900" max="2025" required>
          <input id="swal-director" class="swal2-input" placeholder="Director" required>
          <input id="swal-duration" class="swal2-input" type="number" placeholder="Duración en minutos" min="1" required>
          <input id="swal-rate" class="swal2-input" type="number" placeholder="Calificación (0-10)" min="0" max="10" step="0.1" value="5">
          <input id="swal-poster" class="swal2-input" type="url" placeholder="URL del Poster (https://...)" required>
          <div style="margin-top: 1rem;">
            <label style="display: block; margin-bottom: 0.8rem; font-weight: 600; color: #2c3e50; font-size: 1rem;">🎭 Géneros:</label>
            <div class="genre-checkbox-container">
              ${genres.map(genre => `
                <label class="genre-checkbox-label">
                  <input type="checkbox" class="swal-genre" value="${genre}">
                  <span>${genre}</span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>
      `,
      width: '600px',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '✨ Crear Película',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#667eea',
      cancelButtonColor: '#6c757d',
      background: '#fff',
      color: '#333',
      customClass: {
        popup: 'custom-swal-popup'
      },
      preConfirm: () => {
        const title = (document.getElementById('swal-title') as HTMLInputElement)?.value.trim();
        const year = parseInt((document.getElementById('swal-year') as HTMLInputElement)?.value || '0');
        const director = (document.getElementById('swal-director') as HTMLInputElement)?.value.trim();
        const duration = parseInt((document.getElementById('swal-duration') as HTMLInputElement)?.value || '0');
        const rate = parseFloat((document.getElementById('swal-rate') as HTMLInputElement)?.value || '5');
        const poster = (document.getElementById('swal-poster') as HTMLInputElement)?.value.trim();
        const genreCheckboxes = document.querySelectorAll('.swal-genre:checked') as NodeListOf<HTMLInputElement>;
        const genre = Array.from(genreCheckboxes).map(cb => cb.value);

        if (!title) {
          Swal.showValidationMessage('El título es requerido');
          return false;
        }
        if (year < 1900 || year > 2025) {
          Swal.showValidationMessage('El año debe estar entre 1900 y 2025');
          return false;
        }
        if (!director) {
          Swal.showValidationMessage('El director es requerido');
          return false;
        }
        if (duration < 1) {
          Swal.showValidationMessage('La duración debe ser mayor a 0');
          return false;
        }
        if (!poster) {
          Swal.showValidationMessage('La URL del poster es requerida');
          return false;
        }
        if (genre.length === 0) {
          Swal.showValidationMessage('Selecciona al menos un género');
          return false;
        }

        return {
          title,
          year,
          director,
          duration,
          rate: rate || 5,
          poster,
          genre
        };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.createMovie(result.value);
      }
    });
  }

  createMovie(movieData: Partial<Movie>): void {
    this.movieService.createMovie(movieData).subscribe({
      next: (newMovie) => {
        this.movies.push(newMovie);
        Swal.fire({
          title: '¡Éxito!',
          text: `"${newMovie.title}" se creó correctamente.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          background: '#fff',
          color: '#333'
        });
      },
      error: (error) => {
        console.error('Error creating movie:', error);
        let errorMessage = 'No se pudo crear la película.';
        if (error.error?.error) {
          errorMessage = `Error: ${JSON.stringify(error.error.error)}`;
        }
        Swal.fire('Error', errorMessage, 'error');
      }
    });
  }
}

