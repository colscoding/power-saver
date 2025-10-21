/**
 * Theme Management Module
 * Handles theme switching and persistence
 */

// Available themes configuration
const THEMES = {
    dark: {
        name: 'Dark Theme',
        icon: '🌙',
        colors: {
            '--bg-primary': 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 50%, #0c0c0c 100%)',
            '--bg-secondary': 'linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)',
            '--bg-card': 'linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)',
            '--bg-additional-card': 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
            '--text-primary': '#ffffff',
            '--text-secondary': '#999999',
            '--border-color': 'rgba(255, 255, 255, 0.1)',
            '--shadow-color': 'rgba(0, 0, 0, 0.4)',
            '--accent-power': '#f39c12',
            '--accent-hr': '#e74c3c',
            '--accent-cadence': '#3498db',
            '--accent-speed': '#2ecc71'
        }
    },
    light: {
        name: 'Light Theme',
        icon: '☀️',
        colors: {
            '--bg-primary': 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 50%, #f5f5f5 100%)',
            '--bg-secondary': 'linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)',
            '--bg-card': 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
            '--bg-additional-card': 'linear-gradient(135deg, #fefefe 0%, #f5f5f5 100%)',
            '--text-primary': '#1a1a1a',
            '--text-secondary': '#666666',
            '--border-color': 'rgba(0, 0, 0, 0.1)',
            '--shadow-color': 'rgba(0, 0, 0, 0.1)',
            '--accent-power': '#e67e22',
            '--accent-hr': '#c0392b',
            '--accent-cadence': '#2980b9',
            '--accent-speed': '#27ae60'
        }
    }
};

const STORAGE_KEY = 'powerSaverTheme';

/**
 * Apply a theme to the document
 * @param {string} themeName - Name of the theme to apply
 */
export function applyTheme(themeName) {
    const theme = THEMES[themeName];
    if (!theme) {
        console.warn(`Theme "${themeName}" not found, using default dark theme`);
        themeName = 'dark';
    }

    const root = document.documentElement;
    const themeColors = THEMES[themeName].colors;

    // Apply all CSS custom properties
    for (const [property, value] of Object.entries(themeColors)) {
        root.style.setProperty(property, value);
    }

    // Store the current theme
    localStorage.setItem(STORAGE_KEY, themeName);

    // Update theme selector UI if it exists
    updateThemeSelectorUI(themeName);

    // Add theme class to body for additional styling if needed
    document.body.className = `theme-${themeName}`;
}

/**
 * Get the current theme name
 * @returns {string} Current theme name
 */
export function getCurrentTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'dark';
}

/**
 * Get all available themes
 * @returns {Object} All themes configuration
 */
export function getAllThemes() {
    return THEMES;
}

/**
 * Initialize theme system
 */
export function initializeTheme() {
    const savedTheme = getCurrentTheme();
    applyTheme(savedTheme);
}

/**
 * Update theme selector UI to reflect current theme
 * @param {string} currentTheme - Currently active theme
 */
function updateThemeSelectorUI(currentTheme) {
    // Update all theme option elements
    document.querySelectorAll('.theme-option').forEach(option => {
        const themeName = option.dataset.theme;
        if (themeName === currentTheme) {
            option.classList.add('active');
            option.setAttribute('aria-pressed', 'true');
        } else {
            option.classList.remove('active');
            option.setAttribute('aria-pressed', 'false');
        }
    });
}

/**
 * Create theme selector modal
 * @returns {HTMLElement} Modal element
 */
export function createThemeSelectorModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    const modal = document.createElement('div');
    modal.className = 'modal theme-selector-modal';

    const currentTheme = getCurrentTheme();

    let themesHTML = '';
    for (const [key, theme] of Object.entries(THEMES)) {
        const isActive = key === currentTheme;
        themesHTML += `
      <button class="theme-option ${isActive ? 'active' : ''}" 
              data-theme="${key}"
              role="button"
              aria-pressed="${isActive}"
              title="Switch to ${theme.name}">
        <span class="theme-icon">${theme.icon}</span>
        <span class="theme-name">${theme.name}</span>
        <div class="theme-preview">
          <div class="preview-color" style="background: ${theme.colors['--accent-power']}"></div>
          <div class="preview-color" style="background: ${theme.colors['--accent-hr']}"></div>
          <div class="preview-color" style="background: ${theme.colors['--accent-cadence']}"></div>
          <div class="preview-color" style="background: ${theme.colors['--accent-speed']}"></div>
        </div>
      </button>
    `;
    }

    modal.innerHTML = `
    <h3>🎨 Choose Your Theme</h3>
    <p class="theme-description">Select a look that matches your style</p>
    <div class="theme-options-grid">
      ${themesHTML}
    </div>
    <button class="modal-button secondary close-theme-modal">Close</button>
  `;

    backdrop.appendChild(modal);

    // Add event listeners
    modal.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', () => {
            const themeName = option.dataset.theme;
            applyTheme(themeName);
        });
    });

    modal.querySelector('.close-theme-modal').addEventListener('click', () => {
        document.body.removeChild(backdrop);
    });

    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
            document.body.removeChild(backdrop);
        }
    });

    return backdrop;
}

/**
 * Show theme selector modal
 */
export function showThemeSelector() {
    const modal = createThemeSelectorModal();
    document.body.appendChild(modal);
}
