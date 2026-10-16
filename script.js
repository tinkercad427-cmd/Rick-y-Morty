
const API = "https://rickandmortyapi.com/api/character";

const grid = document.getElementById("characterGrid");
const pagination = document.getElementById("pagination");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const statusFilter = document.getElementById("statusFilter");
const speciesFilter = document.getElementById("speciesFilter");
const genderFilter = document.getElementById("genderFilter");
const clearFilters = document.getElementById("clearFilters");
const totalCount = document.getElementById("totalCount");
const resultsText = document.getElementById("resultsText");

let currentPage = 1;
let totalPages = 1;
let requestNumber = 0;
let currentCharacters = [];

const statusNames = {
  Alive: "Vivo",
  Dead: "Muerto",
  unknown: "Desconocido"
};

const genderNames = {
  Female: "Femenino",
  Male: "Masculino",
  Genderless: "Sin género",
  unknown: "Desconocido"
};

const speciesNames = {
  Human: "Humano",
  Alien: "Alienígena",
  Humanoid: "Humanoide",
  Robot: "Robot",
  Animal: "Animal",
  "Mythological Creature": "Criatura mitológica",
  "Poopybutthole": "Poopybutthole"
};

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function translate(value, dictionary) {
  return dictionary[value] || value || "Desconocido";
}

function getFilters() {
  return {
    name: searchInput.value.trim(),
    status: statusFilter.value,
    species: speciesFilter.value,
    gender: genderFilter.value
  };
}

async function loadCharacters(page = 1) {
  const thisRequest = ++requestNumber;
  currentPage = page;

  grid.innerHTML = `
    <div class="loading-state">
      <div class="empty-icon">🛸</div>
      RECIBIENDO DATOS INTERDIMENSIONALES...
    </div>`;

  pagination.innerHTML = "";
  resultsText.textContent = "Consultando la base de datos...";
  totalCount.textContent = "CARGANDO...";

  const params = new URLSearchParams({
    page: String(page)
  });

  const filters = getFilters();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  try {
    const response = await fetch(`${API}/?${params.toString()}`);

    if (thisRequest !== requestNumber) return;

    if (!response.ok) {
      if (response.status === 404) {
        showEmpty();
        totalCount.textContent = "0 RESULTADOS";
        return;
      }

      throw new Error("No se pudo conectar con la API.");
    }

    const data = await response.json();

    if (thisRequest !== requestNumber) return;

    currentCharacters = data.results;
    totalPages = data.info.pages;
    currentPage = page;

    totalCount.textContent =
      `${data.info.count.toLocaleString("es-AR")} PERSONAJES`;

    resultsText.textContent =
      `Página ${currentPage} de ${totalPages} · ${data.results.length} personajes mostrados`;

    renderCharacters(data.results);
    renderPagination();
  } catch (error) {
    if (thisRequest !== requestNumber) return;

    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Error de conexión</h3>
        <p>No pudimos cargar los personajes.</p>
        <p>Comprueba tu conexión e inténtalo otra vez.</p>
        <button class="clear-btn" id="retryBtn">Reintentar</button>
      </div>`;

    document.getElementById("retryBtn").addEventListener("click", () => {
      loadCharacters(currentPage);
    });

    totalCount.textContent = "SIN CONEXIÓN";
    resultsText.textContent = "No se pudieron recuperar los datos.";
  }
}

function renderCharacters(characters) {
  if (!characters || characters.length === 0) {
    showEmpty();
    return;
  }

  grid.innerHTML = characters.map((character, index) => {
    const statusClass = {
      Alive: "alive",
      Dead: "dead",
      unknown: "unknown"
    }[character.status] || "unknown";

    return `
      <article class="character-card"
        style="animation-delay:${Math.min(index * 35, 350)}ms">

        <div class="image-wrap">
          <img
            src="${escapeHTML(character.image)}"
            alt="Imagen de ${escapeHTML(character.name)}"
            loading="${index < 4 ? "eager" : "lazy"}"
            onerror="this.onerror=null;this.src='https://placehold.co/300x300/172338/b7f34a?text=Sin+imagen'">

          <span class="character-id">
            ID #${character.id}
          </span>
        </div>

        <div class="card-body">
          <h3 class="character-name">
            ${escapeHTML(character.name)}
          </h3>

          <div class="status-line">
            <span class="status-dot ${statusClass}"></span>
            ${escapeHTML(translate(character.status, statusNames))}
            · ${escapeHTML(translate(character.species, speciesNames))}
          </div>

          <div class="card-info">
            <div class="info-row">
              <span class="info-label">PLANETA / ORIGEN</span>
              <span class="info-value">
                ${escapeHTML(character.origin?.name || "Desconocido")}
              </span>
            </div>

            <div class="info-row">
              <span class="info-label">ÚLTIMA UBICACIÓN</span>
              <span class="info-value">
                ${escapeHTML(character.location?.name || "Desconocido")}
              </span>
            </div>

            <div class="info-row">
              <span class="info-label">GÉNERO</span>
              <span class="info-value">
                ${escapeHTML(translate(character.gender, genderNames))}
              </span>
            </div>

            <div class="info-row">
              <span class="info-label">EPISODIOS</span>
              <span class="info-value">
                ${character.episode.length} apariciones
              </span>
            </div>
          </div>

          <button class="episode-btn"
            data-id="${character.id}"
            aria-expanded="false">
            ▸ Ver episodios
          </button>

          <div class="episode-list" id="episodes-${character.id}" hidden>
            Cargando episodios...
          </div>
        </div>
      </article>`;
  }).join("");

  grid.querySelectorAll(".episode-btn").forEach(button => {
    button.addEventListener("click", () => {
      toggleEpisodes(Number(button.dataset.id), button);
    });
  });
}

async function toggleEpisodes(id, button) {
  const panel = document.getElementById(`episodes-${id}`);

  if (!panel.hidden) {
    panel.hidden = true;
    button.textContent = "▸ Ver episodios";
    button.setAttribute("aria-expanded", "false");
    return;
  }

  panel.hidden = false;
  button.textContent = "▾ Ocultar episodios";
  button.setAttribute("aria-expanded", "true");

  if (panel.dataset.loaded === "true") return;

  const character = currentCharacters.find(item => item.id === id);

  if (!character) {
    panel.textContent = "No se encontraron datos.";
    return;
  }

  try {
    // La API devuelve las URL de los episodios.
    // Consultamos los episodios en grupos para no saturar la API.
    const urls = character.episode;
    const episodes = [];

    for (let i = 0; i < urls.length; i += 10) {
      const batch = urls.slice(i, i + 10);
      const responses = await Promise.all(
        batch.map(url => fetch(url))
      );

      if (responses.some(response => !response.ok)) {
        throw new Error("Error al consultar episodios.");
      }

      const data = await Promise.all(
        responses.map(response => response.json())
      );

      episodes.push(...data);
    }

    panel.innerHTML = episodes.map(episode => `
      <div>
        <strong>${escapeHTML(episode.episode)}</strong>
        — ${escapeHTML(episode.name)}
      </div>
    `).join("");

    panel.dataset.loaded = "true";
  } catch {
    panel.textContent = "No se pudieron cargar los episodios.";
  }
}

function showEmpty() {
  grid.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">🌀</div>
      <h3>No encontramos personajes</h3>
      <p>Prueba con otro nombre o modifica los filtros.</p>
    </div>`;

  pagination.innerHTML = "";
  resultsText.textContent = "No hay resultados para esta búsqueda.";
}

function renderPagination() {
  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  const pages = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1
  ]);

  const visiblePages = [...pages]
    .filter(page => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  let html = `
    <button class="page-btn" data-page="${currentPage - 1}"
      ${currentPage === 1 ? "disabled" : ""}
      aria-label="Página anterior">←</button>`;

  let previous = 0;

  visiblePages.forEach(page => {
    if (page - previous > 1) {
      html += `<span class="page-dots">…</span>`;
    }

    html += `
      <button class="page-btn ${page === currentPage ? "active" : ""}"
        data-page="${page}"
        ${page === currentPage ? 'aria-current="page"' : ""}>
        ${page}
      </button>`;

    previous = page;
  });

  html += `
    <button class="page-btn" data-page="${currentPage + 1}"
      ${currentPage === totalPages ? "disabled" : ""}
      aria-label="Página siguiente">→</button>`;

  pagination.innerHTML = html;

  pagination.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      const page = Number(button.dataset.page);

      if (page >= 1 && page <= totalPages && page !== currentPage) {
        loadCharacters(page);
        document.querySelector(".database").scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });
  });
}

function applyFilters() {
  loadCharacters(1);
}

searchBtn.addEventListener("click", applyFilters);

searchInput.addEventListener("keydown", event => {
  if (event.key === "Enter") applyFilters();
});

let searchTimeout;

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(applyFilters, 450);
});

[statusFilter, speciesFilter, genderFilter].forEach(filter => {
  filter.addEventListener("change", applyFilters);
});

clearFilters.addEventListener("click", () => {
  searchInput.value = "";
  statusFilter.value = "";
  speciesFilter.value = "";
  genderFilter.value = "";
  loadCharacters(1);
});

document.querySelectorAll(".quick-btn").forEach(button => {
  button.addEventListener("click", () => {
    searchInput.value = button.dataset.name;
    loadCharacters(1);
  });
});

// Iniciar la aplicación
loadCharacters();
