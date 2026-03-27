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

  const addPlayerBtn = document.getElementById('add-player-btn');
  const playersContainer = document.getElementById('players-container');

  if (!addPlayerBtn || !playersContainer) {
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
    router();
    
    // If no hash is set, default to home
    if (!window.location.hash) {
      window.location.hash = 'home';
    }
  });
} else {
  // DOM is already loaded
  initDarkMode();
  router();
  
  if (!window.location.hash) {
    window.location.hash = 'home';
  }
}


