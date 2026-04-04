// Dark Mode Toggle
function initDarkMode() {
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('theme') || 'light';
  
  // Set initial theme
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '☀️';
  } else {
    document.body.classList.remove('dark-mode');
    themeToggle.textContent = '🌙';
  }
  
  // Toggle theme on button click
  themeToggle.addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Update button text
    themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
  });
}

function initHomeWidgets() {
  return;
}

const REGISTRATION_STORAGE_KEY = 'eventportal_registrations';

function getStoredRegistrations() {
  try {
    return JSON.parse(localStorage.getItem(REGISTRATION_STORAGE_KEY) || '[]');
  } catch (error) {
    return [];
  }
}

function setStoredRegistrations(entries) {
  localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(entries));
}

function formatSavedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderSavedRegistrations() {
  const meta = document.getElementById('saved-registrations-meta');
  const body = document.getElementById('saved-registrations-body');

  if (!meta || !body) {
    return;
  }

  const entries = getStoredRegistrations();
  const visibleEntries = entries.slice(-10).reverse();

  meta.textContent = entries.length
    ? `Showing latest ${visibleEntries.length} of ${entries.length} saved entries.`
    : 'No saved registrations yet.';

  body.innerHTML = visibleEntries.map((entry) => {
    const displayName = entry.type === 'sports' ? entry.captainName : entry.name;
    const displayEmail = entry.type === 'sports' ? entry.captainEmail : entry.email;
    const eventName = entry.type === 'sports' ? entry.sport : entry.event;
    const players = Array.isArray(entry.players) ? entry.players.join(', ') : '';

    return `
      <tr>
        <td>${escapeHtml(entry.typeLabel || entry.type || '')}</td>
        <td>${escapeHtml(displayName || '')}</td>
        <td>${escapeHtml(displayEmail || '')}</td>
        <td>${escapeHtml(entry.department || '')}</td>
        <td>${escapeHtml(eventName || '')}</td>
        <td>${escapeHtml(players)}</td>
        <td>${escapeHtml(formatSavedAt(entry.savedAt))}</td>
      </tr>
    `;
  }).join('');

  if (!visibleEntries.length) {
    body.innerHTML = `
      <tr>
        <td colspan="7" class="saved-registrations-empty">No registrations have been saved yet.</td>
      </tr>
    `;
  }
}

function exportRegistrationsToExcel() {
  const entries = getStoredRegistrations();

  if (!entries.length) {
    window.alert('No saved registrations to download.');
    return;
  }

  const headers = ['Type', 'Name', 'Email', 'Department', 'Event / Sport', 'Players', 'Saved At'];
  const rows = entries.map((entry) => {
    const displayName = entry.type === 'sports' ? entry.captainName : entry.name;
    const displayEmail = entry.type === 'sports' ? entry.captainEmail : entry.email;
    const eventName = entry.type === 'sports' ? entry.sport : entry.event;
    const players = Array.isArray(entry.players) ? entry.players.join(', ') : '';

    return [
      entry.typeLabel || entry.type || '',
      displayName || '',
      displayEmail || '',
      entry.department || '',
      eventName || '',
      players,
      formatSavedAt(entry.savedAt),
    ];
  });

  const tableRows = [headers, ...rows].map((row) => {
    const cells = row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const workbook = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Registrations</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
        <table border="1">${tableRows}</table>
      </body>
    </html>`;

  const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'registrations.xls';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getRegistrationTypeLabel(formId) {
  if (formId === 'technical-form') {
    return 'Technical';
  }

  if (formId === 'nontechnical-form') {
    return 'Non-Technical';
  }

  if (formId === 'sports-form') {
    return 'Sports';
  }

  return formId;
}

function handleRegistrationSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const formId = form.id;
  const typeLabel = getRegistrationTypeLabel(formId);
  const savedAt = new Date().toISOString();
  const entries = getStoredRegistrations();
  const baseRecord = {
    id: `${savedAt}-${Math.random().toString(36).slice(2, 8)}`,
    type: formId.replace('-form', ''),
    typeLabel,
    savedAt,
  };

  if (formId === 'sports-form') {
    const players = formData.getAll('playerName[]')
      .map((value) => String(value).trim())
      .filter(Boolean);

    entries.push({
      ...baseRecord,
      captainName: String(formData.get('captainName') || '').trim(),
      captainEmail: String(formData.get('captainEmail') || '').trim(),
      department: String(formData.get('department') || '').trim(),
      sport: String(formData.get('sport') || '').trim(),
      players,
    });

    form.reset();
    const playersContainer = document.getElementById('players-container');
    if (playersContainer) {
      playersContainer.innerHTML = `
        <div class="player-row">
          <input type="text" name="playerName[]" placeholder="Player 1 Name" required>
          <button type="button" class="remove-player-btn" disabled>Remove</button>
        </div>
      `;
    }
  } else {
    entries.push({
      ...baseRecord,
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      department: String(formData.get('department') || '').trim(),
      year: String(formData.get('year') || '').trim(),
      event: String(formData.get('event') || '').trim(),
    });

    form.reset();
  }

  setStoredRegistrations(entries);
  renderSavedRegistrations();
  window.alert('Registration saved locally.');
}

function closeMobileNav() {
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const navLinks = document.querySelector('.navbar-links');
  const navTheme = document.querySelector('.navbar-theme');

  if (menuToggle) {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.textContent = '☰';
  }
  if (navLinks) {
    navLinks.classList.remove('mobile-open');
  }
  if (navTheme) {
    navTheme.classList.remove('mobile-open');
  }
}

function initMobileNav() {
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const navLinks = document.querySelector('.navbar-links');
  const navTheme = document.querySelector('.navbar-theme');

  if (!menuToggle || !navLinks || !navTheme || menuToggle.dataset.initialized === 'true') {
    return;
  }

  const setMenuState = (open) => {
    navLinks.classList.toggle('mobile-open', open);
    navTheme.classList.toggle('mobile-open', open);
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuToggle.textContent = open ? '✕' : '☰';
  };

  menuToggle.addEventListener('click', function () {
    const shouldOpen = !navLinks.classList.contains('mobile-open');
    setMenuState(shouldOpen);
  });

  navLinks.addEventListener('click', function (event) {
    const target = event.target;
    if (target.classList.contains('nav-link')) {
      setMenuState(false);
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) {
      closeMobileNav();
    }
  });

  menuToggle.dataset.initialized = 'true';
}

function initRegisterWidgets() {
  if (!document.body.classList.contains('route-register')) {
    return;
  }

  const tabButtons = document.querySelectorAll('.register-tab-btn');
  const tabPages = document.querySelectorAll('.register-page');

  if (tabButtons.length && tabPages.length) {
    tabButtons.forEach((button) => {
      button.addEventListener('click', function () {
        const targetId = this.dataset.target;
        tabButtons.forEach((btn) => btn.classList.remove('active'));
        tabPages.forEach((page) => page.classList.remove('active'));

        this.classList.add('active');
        const targetPage = document.getElementById(targetId);
        if (targetPage) {
          targetPage.classList.add('active');
        }
      });
    });
  }

  const registrationForms = document.querySelectorAll('.registration-form');
  registrationForms.forEach((form) => {
    form.addEventListener('submit', handleRegistrationSubmit);
  });

  const exportButton = document.getElementById('export-registrations-btn');
  if (exportButton && exportButton.dataset.initialized !== 'true') {
    exportButton.addEventListener('click', exportRegistrationsToExcel);
    exportButton.dataset.initialized = 'true';
  }

  const addPlayerBtn = document.getElementById('add-player-btn');
  const playersContainer = document.getElementById('players-container');

  if (!addPlayerBtn || !playersContainer) {
    renderSavedRegistrations();
    return;
  }

  const updateRemoveButtons = () => {
    const rows = playersContainer.querySelectorAll('.player-row');
    rows.forEach((row, index) => {
      const removeBtn = row.querySelector('.remove-player-btn');
      const input = row.querySelector('input[name="playerName[]"]');
      if (input) {
        input.placeholder = `Player ${index + 1} Name`;
      }
      if (removeBtn) {
        removeBtn.disabled = rows.length === 1;
      }
    });
  };

  addPlayerBtn.addEventListener('click', function () {
    const row = document.createElement('div');
    row.className = 'player-row';
    row.innerHTML = `
      <input type="text" name="playerName[]" placeholder="Player Name" required>
      <button type="button" class="remove-player-btn">Remove</button>
    `;
    playersContainer.appendChild(row);
    updateRemoveButtons();
  });

  playersContainer.addEventListener('click', function (event) {
    const target = event.target;
    if (target.classList.contains('remove-player-btn') && !target.disabled) {
      const row = target.closest('.player-row');
      if (row) {
        row.remove();
        updateRemoveButtons();
      }
    }
  });

  updateRemoveButtons();
}

// Routing function with dynamic content loading
function router() {
  const hash = window.location.hash.slice(1) || 'home';
  const contentContainer = document.getElementById('content');

  closeMobileNav();
  
  // Valid pages
  const validPages = ['home', 'events', 'schedule', 'register'];
  
  if (validPages.includes(hash)) {
    document.body.classList.remove('route-home', 'route-events', 'route-schedule', 'route-register');
    document.body.classList.add(`route-${hash}`);

    // Load content from the respective HTML file
    fetch(`${hash}.html`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Page not found');
        }
        return response.text();
      })
      .then(html => {
        if (contentContainer) {
          contentContainer.innerHTML = html;
          initHomeWidgets();
          initRegisterWidgets();
        }
      })
      .catch(error => {
        console.error('Error:', error);
        if (contentContainer) {
          contentContainer.innerHTML = '<h2>Error loading page</h2><p>Sorry, the page could not be loaded. Please make sure you are running this on a local server.</p>';
        }
      });
  } else {
    // If invalid hash, redirect to home
    window.location.hash = 'home';
  }
}

// Listen for hash changes
window.addEventListener('hashchange', router);

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    initDarkMode();
    initMobileNav();
    router();
    
    // If no hash is set, default to home
    if (!window.location.hash) {
      window.location.hash = 'home';
    }
  });
} else {
  // DOM is already loaded
  initDarkMode();
  initMobileNav();
  router();
  
  if (!window.location.hash) {
    window.location.hash = 'home';
  }
}


