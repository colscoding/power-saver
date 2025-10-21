/**
 * Theme Management Module
 * Handles theme switching and persistence
 */

// Available themes configuration
const THEMES = {
    dark: {
        name: 'Dark Elegance',
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
        name: 'Clean Light',
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
    },
    blue: {
        name: 'Ocean Blue',
        icon: '🌊',
        colors: {
            '--bg-primary': 'linear-gradient(135deg, #0a1929 0%, #132f4c 50%, #0a1929 100%)',
            '--bg-secondary': 'linear-gradient(135deg, #1a2c42 0%, #253c54 100%)',
            '--bg-card': 'linear-gradient(135deg, #1e3a52 0%, #2a4a62 100%)',
            '--bg-additional-card': 'linear-gradient(135deg, #1a3448 0%, #253f56 100%)',
            '--text-primary': '#e3f2fd',
            '--text-secondary': '#90caf9',
            '--border-color': 'rgba(144, 202, 249, 0.2)',
            '--shadow-color': 'rgba(0, 0, 0, 0.5)',
            '--accent-power': '#ffa726',
            '--accent-hr': '#ef5350',
            '--accent-cadence': '#42a5f5',
            '--accent-speed': '#66bb6a'
        }
    },
    purple: {
        name: 'Purple Haze',
        icon: '💜',
        colors: {
            '--bg-primary': 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%)',
            '--bg-secondary': 'linear-gradient(135deg, #2d1b4e 0%, #3d2863 100%)',
            '--bg-card': 'linear-gradient(135deg, #3d2863 0%, #4d3673 100%)',
            '--bg-additional-card': 'linear-gradient(135deg, #331f56 0%, #432a66 100%)',
            '--text-primary': '#f3e5f5',
            '--text-secondary': '#ce93d8',
            '--border-color': 'rgba(206, 147, 216, 0.2)',
            '--shadow-color': 'rgba(0, 0, 0, 0.5)',
            '--accent-power': '#ffb74d',
            '--accent-hr': '#e57373',
            '--accent-cadence': '#64b5f6',
            '--accent-speed': '#81c784'
        }
    },
    neon: {
        name: 'Neon Nights',
        icon: '⚡',
        colors: {
            '--bg-primary': 'linear-gradient(135deg, #000000 0%, #1a0033 50%, #000000 100%)',
            '--bg-secondary': 'linear-gradient(135deg, #1a0033 0%, #2d004d 100%)',
            '--bg-card': 'linear-gradient(135deg, #2d004d 0%, #3d0066 100%)',
            '--bg-additional-card': 'linear-gradient(135deg, #240040 0%, #330055 100%)',
            '--text-primary': '#00ff9f',
            '--text-secondary': '#00ccff',
            '--border-color': 'rgba(0, 255, 159, 0.3)',
            '--shadow-color': 'rgba(0, 255, 159, 0.2)',
            '--accent-power': '#00ff9f',
            '--accent-hr': '#ff006e',
            '--accent-cadence': '#00ccff',
            '--accent-speed': '#ffbe0b'
        }
    },
    forest: {
        name: 'Forest Green',
        icon: '🌲',
        colors: {
            '--bg-primary': 'linear-gradient(135deg, #0d1b0d 0%, #1a2f1a 50%, #0d1b0d 100%)',
            '--bg-secondary': 'linear-gradient(135deg, #1a2f1a 0%, #254025 100%)',
            '--bg-card': 'linear-gradient(135deg, #254025 0%, #305030 100%)',
            '--bg-additional-card': 'linear-gradient(135deg, #1f3a1f 0%, #2a452a 100%)',
            '--text-primary': '#e8f5e9',
            '--text-secondary': '#a5d6a7',
            '--border-color': 'rgba(165, 214, 167, 0.2)',
            '--shadow-color': 'rgba(0, 0, 0, 0.5)',
            '--accent-power': '#ffa726',
            '--accent-hr': '#ef5350',
            '--accent-cadence': '#42a5f5',
            '--accent-speed': '#66bb6a'
        }
    },
    sunset: {
        name: 'Sunset Glow',
        icon: '🌅',
        colors: {
            '--bg-primary': 'linear-gradient(135deg, #1a0f0a 0%, #2d1510 50%, #1a0f0a 100%)',
            '--bg-secondary': 'linear-gradient(135deg, #3d241a 0%, #4d2f22 100%)',
            '--bg-card': 'linear-gradient(135deg, #4d2f22 0%, #5d3a28 100%)',
            '--bg-additional-card': 'linear-gradient(135deg, #432820 0%, #533326 100%)',
            '--text-primary': '#fff3e0',
            '--text-secondary': '#ffcc80',
            '--border-color': 'rgba(255, 204, 128, 0.2)',
            '--shadow-color': 'rgba(0, 0, 0, 0.5)',
            '--accent-power': '#ff9800',
            '--accent-hr': '#f44336',
            '--accent-cadence': '#ff5722',
            '--accent-speed': '#ffc107'
        }
    },
    mint: {
        name: 'Mint Fresh',
        icon: '🌿',
        colors: {
            '--bg-primary': 'linear-gradient(135deg, #e8f5f1 0%, #d4ebe3 50%, #e8f5f1 100%)',
            '--bg-secondary': 'linear-gradient(135deg, #ffffff 0%, #f0faf7 100%)',
            '--bg-card': 'linear-gradient(135deg, #f9fdfb 0%, #f0faf7 100%)',
            '--bg-additional-card': 'linear-gradient(135deg, #f5fcf9 0%, #ecf8f3 100%)',
            '--text-primary': '#1a3a2e',
            '--text-secondary': '#4a7c6a',
            '--border-color': 'rgba(26, 58, 46, 0.1)',
            '--shadow-color': 'rgba(0, 0, 0, 0.08)',
            '--accent-power': '#f39c12',
            '--accent-hr': '#e74c3c',
            '--accent-cadence': '#3498db',
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
