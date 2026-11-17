/* =========================================
   1. DATA
   ========================================= */

// The name used to save our movies in the browser
const STORAGE_KEY = "flickdiaryMovies";

// Sample movies shown the first time the website is opened
const sampleMovies = [
  { id: 1, title: "Spirited Away", year: 2001, genre: "Animation", poster: "", status: "watched", rating: 5 },
  { id: 2, title: "La La Land", year: 2016, genre: "Romance", poster: "", status: "watched", rating: 4 },
  { id: 3, title: "Inception", year: 2010, genre: "Sci-Fi", poster: "", status: "want", rating: 0 },
  { id: 4, title: "Coco", year: 2017, genre: "Animation", poster: "", status: "want", rating: 0 }
];

// This list holds all our movies while the page is open
let movies = [];

/* =========================================
   2. FIND ELEMENTS FROM THE HTML
   ========================================= */
const movieGrid = document.getElementById("movieGrid");
const emptyMessage = document.getElementById("emptyMessage");
const totalMoviesEl = document.getElementById("totalMovies");
const watchedMoviesEl = document.getElementById("watchedMovies");
const wantMoviesEl = document.getElementById("wantMovies");
const averageRatingEl = document.getElementById("averageRating");

// Modal and form elements
const addMovieBtn = document.getElementById("addMovieBtn");
const movieModal = document.getElementById("movieModal");
const modalTitle = document.getElementById("modalTitle");
const movieForm = document.getElementById("movieForm");
const cancelBtn = document.getElementById("cancelBtn");

const titleInput = document.getElementById("titleInput");
const yearInput = document.getElementById("yearInput");
const genreInput = document.getElementById("genreInput");
const posterInput = document.getElementById("posterInput");
const statusInput = document.getElementById("statusInput");
const stars = document.querySelectorAll("#starRating .star");

const titleError = document.getElementById("titleError");
const yearError = document.getElementById("yearError");
const genreError = document.getElementById("genreError");

// Remembers the rating chosen in the form (0 = no rating)
let selectedRating = 0;

// Remembers which movie is being edited (null = adding a new movie)
let editingId = null;

// Search and filter elements
const searchInput = document.getElementById("searchInput");
const genreFilter = document.getElementById("genreFilter");
const filterButtons = document.querySelectorAll(".filter-btn");

// Remember the current search and filter choices
let searchText = "";
let selectedGenre = "all";
let selectedStatus = "all";

// Sidebar navigation elements
const navLinks = document.querySelectorAll(".nav-link");
const statsSection = document.getElementById("statsSection");
const statusFilters = document.querySelector(".status-filters");

// Remember which page we are on: "dashboard", "collection" or "watchlist"
let currentView = "dashboard";

/* =========================================
   3. LOCAL STORAGE (SAVE AND LOAD)
   ========================================= */

// Save the movies list into the browser
function saveMovies() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
}

// Load the movies list from the browser
function loadMovies() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    // We already saved movies before, so use them
    movies = JSON.parse(saved);
  } else {
    // First time opening: use the sample movies
    movies = sampleMovies;
    saveMovies();
  }
}

/* =========================================
   4. HELPER FUNCTIONS
   ========================================= */

// Stops weird characters in a title from breaking our HTML
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Turns a rating number (e.g. 4) into clickable stars
function getStarsHTML(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars += '<span class="card-star" data-value="' + i + '">★</span>';
    } else {
      stars += '<span class="card-star empty" data-value="' + i + '">★</span>';
    }
  }
  return stars;
}

/* =========================================
   5. SHOW MOVIE CARDS
   ========================================= */
// Returns only the movies that match the search and filters
function getFilteredMovies() {
  return movies.filter(function (movie) {
    const matchesSearch = movie.title.toLowerCase().includes(searchText.toLowerCase());
    const matchesGenre = selectedGenre === "all" || movie.genre === selectedGenre;

    let matchesStatus;
    if (currentView === "watchlist") {
      // The Watchlist page only shows movies we want to watch
      matchesStatus = movie.status === "want";
    } else {
      matchesStatus = selectedStatus === "all" || movie.status === selectedStatus;
    }

    // The movie must pass ALL the rules
    return matchesSearch && matchesGenre && matchesStatus;
  });
}

function renderMovies() {
  // Clear the grid first, so we don't get duplicate cards
  movieGrid.innerHTML = "";

  // Only use the movies that match the search and filters
  const visibleMovies = getFilteredMovies();

  // Show the "no movies" message if the list is empty
  emptyMessage.hidden = getFilteredMovies().length > 0;

  // Make one card for each movie
  visibleMovies.forEach(function (movie) {

    // If there is a poster URL use it, otherwise use the pink placeholder
    let posterHTML;
    if (movie.poster) {
      posterHTML = '<img class="movie-poster" src="' + escapeHTML(movie.poster) + '" alt="Poster of ' + escapeHTML(movie.title) + '">';
    } else {
      posterHTML = '<div class="movie-poster poster-placeholder">🎬</div>';
    }

    // Choose the badge text and colour
    let badgeClass = "badge-want";
    let badgeText = "Want to Watch";
    if (movie.status === "watched") {
      badgeClass = "badge-watched";
      badgeText = "Watched";
    }

    // Build the card
    const card = document.createElement("article");
    card.className = "movie-card";
    card.dataset.id = movie.id;
    card.innerHTML =
      posterHTML +
      '<div class="movie-info">' +
        '<h3 class="movie-title">' + escapeHTML(movie.title) + '</h3>' +
        '<p class="movie-meta">' + movie.year + ' • ' + escapeHTML(movie.genre) + '</p>' +
        '<span class="badge ' + badgeClass + '">' + badgeText + '</span>' +
        '<div class="card-stars">' + getStarsHTML(movie.rating) + '</div>' +
        '<div class="card-actions">' +
          '<button class="edit-btn" data-id="' + movie.id + '">Edit</button>' +
          '<button class="delete-btn"data-id="' + movie.id + '">Delete</button>' +
        '</div>' +
      '</div>';

    // Put the card inside the grid
    movieGrid.appendChild(card);
  });
}

/* =========================================
   6. UPDATE DASHBOARD STATISTICS
   ========================================= */
function updateStats() {
  const total = movies.length;

  // filter() keeps only the movies that match the rule
  const watched = movies.filter(function (movie) {
    return movie.status === "watched";
  }).length;

  const want = movies.filter(function (movie) {
    return movie.status === "want";
  }).length;

  // Average rating: only count movies that have a rating
  const ratedMovies = movies.filter(function (movie) {
    return movie.rating > 0;
  });

  let average = 0;
  if (ratedMovies.length > 0) {
    let sum = 0;
    ratedMovies.forEach(function (movie) {
      sum += movie.rating;
    });
    average = sum / ratedMovies.length;
  }

  // Show the numbers on the page
  totalMoviesEl.textContent = total;
  watchedMoviesEl.textContent = watched;
  wantMoviesEl.textContent = want;
  averageRatingEl.textContent = average.toFixed(1);
}

/* =========================================
   7. MODAL (OPEN AND CLOSE)
   ========================================= */

function openModal(movie) {
  // Reset the form so it is clean every time
  movieForm.reset();
  selectedRating = 0;
  clearErrors();

  if (movie) {
    // EDIT mode: fill the form with the movie's details
    editingId = movie.id;
    modalTitle.textContent = "Edit Movie";
    titleInput.value = movie.title;
    yearInput.value = movie.year;
    genreInput.value = movie.genre;
    posterInput.value = movie.poster;
    statusInput.value = movie.status;
    selectedRating = movie.rating;
  } else {
    // ADD mode: empty form
    editingId = null;
    modalTitle.textContent = "Add Movie";
  }

  updateStarDisplay();
  movieModal.hidden = false;
  titleInput.focus();
}

function closeModal() {
  movieModal.hidden = true;
}

addMovieBtn.addEventListener("click", function () {
    openModal();
} );
cancelBtn.addEventListener("click", closeModal);

// Close the modal when clicking the dark area outside the form
movieModal.addEventListener("click", function (event) {
  if (event.target === movieModal) {
    closeModal();
  }
});

/* =========================================
   8. STAR RATING IN THE FORM
   ========================================= */

// Colour the stars up to the selected rating
function updateStarDisplay() {
  stars.forEach(function (star) {
    const value = Number(star.dataset.value);
    if (value <= selectedRating) {
      star.classList.add("active");
    } else {
      star.classList.remove("active");
    }
  });
}

stars.forEach(function (star) {
  star.addEventListener("click", function () {
    const value = Number(star.dataset.value);

    // Clicking the same star again removes the rating
    if (selectedRating === value) {
      selectedRating = 0;
    } else {
      selectedRating = value;
    }
    updateStarDisplay();
  });
});

/* =========================================
   9. FORM VALIDATION
   ========================================= */

function clearErrors() {
  titleError.textContent = "";
  yearError.textContent = "";
  genreError.textContent = "";
}

// Returns true if everything is filled in correctly
function validateForm() {
  clearErrors();
  let isValid = true;

  if (titleInput.value.trim() === "") {
    titleError.textContent = "Please enter a movie title.";
    isValid = false;
  }

  const year = Number(yearInput.value);
  const currentYear = new Date().getFullYear();
  if (yearInput.value === "") {
    yearError.textContent = "Please enter the release year.";
    isValid = false;
  } else if (year < 1888 || year > currentYear + 5) {
    yearError.textContent = "Please enter a year between 1888 and " + (currentYear + 5) + ".";
    isValid = false;
  }

  if (genreInput.value === "") {
    genreError.textContent = "Please choose a genre.";
    isValid = false;
  }

  return isValid;
}

/* =========================================
   10. SAVE A NEW MOVIE
   ========================================= */

movieForm.addEventListener("submit", function (event) {
  // Stop the page from refreshing
  event.preventDefault();

  // Stop here if the form has mistakes
  if (!validateForm()) {
    return;
  }

    if (editingId !== null) {
    // EDIT: find the movie and update its details
    const movie = movies.find(function (m) {
      return m.id === editingId;
    });
    movie.title = titleInput.value.trim();
    movie.year = Number(yearInput.value);
    movie.genre = genreInput.value;
    movie.poster = posterInput.value.trim();
    movie.status = statusInput.value;
    movie.rating = selectedRating;
  } else {
    // ADD: make a new movie object
    const newMovie = {
      id: Date.now(), // current time in milliseconds = a unique number
      title: titleInput.value.trim(),
      year: Number(yearInput.value),
      genre: genreInput.value,
      poster: posterInput.value.trim(),
      status: statusInput.value,
      rating: selectedRating
    };
    movies.push(newMovie);
  }

  // Save and update the page
  saveMovies();
  renderMovies();
  updateStats();
  closeModal();
});

/* =========================================
   SEARCH AND FILTERS
   ========================================= */

// Search: runs every time you type a letter
searchInput.addEventListener("input", function () {
  searchText = searchInput.value.trim();
  renderMovies();
});

// Genre dropdown
genreFilter.addEventListener("change", function () {
  selectedGenre = genreFilter.value;
  renderMovies();
});

// Status buttons (All / Watched / Want to Watch)
filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    selectedStatus = button.dataset.status;

    // Move the pink "active" highlight to the clicked button
    filterButtons.forEach(function (btn) {
      btn.classList.remove("active");
    });
    button.classList.add("active");

    renderMovies();
  });
});

/* =========================================
   SIDEBAR NAVIGATION
   ========================================= */

function showView(view) {
  currentView = view;

  // Show the statistics only on the Dashboard
  statsSection.hidden = view !== "dashboard";

  // Hide the status buttons on the Watchlist (it only shows "Want to Watch")
  statusFilters.hidden = view === "watchlist";

  // Move the lavender "active" highlight to the chosen link
  navLinks.forEach(function (link) {
    if (link.dataset.view === view) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  renderMovies();
}

navLinks.forEach(function (link) {
  link.addEventListener("click", function (event) {
    // Stop the link from jumping to the top of the page
    event.preventDefault();
    showView(link.dataset.view);
  });
});

/* =========================================
   11. START THE APP
   ========================================= */

/* =========================================
   EDIT, DELETE AND RATING ON CARDS
   ========================================= */

// One listener on the whole grid handles every button and star
movieGrid.addEventListener("click", function (event) {
  const clicked = event.target;

  // --- Edit button ---
  if (clicked.classList.contains("edit-btn")) {
    const id = Number(clicked.dataset.id);
    const movie = movies.find(function (m) {
      return m.id === id;
    });
    openModal(movie);
  }

  // --- Delete button ---
  if (clicked.classList.contains("delete-btn")) {
    const id = Number(clicked.dataset.id);
    const movie = movies.find(function (m) {
      return m.id === id;
    });

    if (confirm('Are you sure you want to delete "' + movie.title + '"?')) {
      // Keep every movie EXCEPT the one we are deleting
      movies = movies.filter(function (m) {
        return m.id !== id;
      });
      saveMovies();
      renderMovies();
      updateStats();
    }
  }

  // --- Click a star on the card to change the rating ---
  if (clicked.classList.contains("card-star")) {
    const card = clicked.closest(".movie-card");
    const id = Number(card.dataset.id);
    const value = Number(clicked.dataset.value);

    const movie = movies.find(function (m) {
      return m.id === id;
    });

    // Clicking the same rating again removes it
    if (movie.rating === value) {
      movie.rating = 0;
    } else {
      movie.rating = value;
    }

    saveMovies();
    renderMovies();
    updateStats();
  }
});

loadMovies();
renderMovies();
updateStats();