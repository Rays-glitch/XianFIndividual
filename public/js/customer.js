document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('sidebar-collapsed');
    });
  }

  const settingsToggle = document.getElementById('settingsToggle');
  const settingsPanel = document.getElementById('settingsPanel');
  const highContrast = document.getElementById('highContrast');
  const textEnlargement = document.getElementById('textEnlargement');
  const textEnlargementValue = document.getElementById('textEnlargementValue');
  const settingsKey = 'japz-accessibility-settings';

  if (settingsToggle && settingsPanel && highContrast && textEnlargement && textEnlargementValue) {
    const applySettings = (contrastEnabled, enlargement) => {
      const boundedEnlargement = Math.min(100, Math.max(0, Number(enlargement) || 0));
      document.documentElement.classList.toggle('high-contrast', contrastEnabled);
      document.documentElement.style.setProperty('--text-scale', String(1 + boundedEnlargement / 100));
      highContrast.checked = contrastEnabled;
      textEnlargement.value = String(boundedEnlargement);
      textEnlargementValue.value = `${boundedEnlargement}%`;
      textEnlargementValue.textContent = `${boundedEnlargement}%`;
    };

    try {
      const savedSettings = JSON.parse(localStorage.getItem(settingsKey) || '{}');
      applySettings(Boolean(savedSettings.highContrast), savedSettings.textEnlargement);
    } catch {
      applySettings(false, 0);
    }

    const saveSettings = () => {
      applySettings(highContrast.checked, textEnlargement.value);
      try {
        localStorage.setItem(settingsKey, JSON.stringify({
          highContrast: highContrast.checked,
          textEnlargement: Number(textEnlargement.value)
        }));
      } catch {
      }
    };

    settingsToggle.addEventListener('click', () => {
      const isExpanded = settingsToggle.getAttribute('aria-expanded') === 'true';
      settingsToggle.setAttribute('aria-expanded', String(!isExpanded));
      settingsPanel.hidden = isExpanded;
    });

    highContrast.addEventListener('change', saveSettings);
    textEnlargement.addEventListener('input', saveSettings);

    document.addEventListener('click', (event) => {
      if (!settingsPanel.hidden && !event.target.closest('.settings-menu')) {
        settingsPanel.hidden = true;
        settingsToggle.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !settingsPanel.hidden) {
        settingsPanel.hidden = true;
        settingsToggle.setAttribute('aria-expanded', 'false');
        settingsToggle.focus();
      }
    });
  }

  document.querySelectorAll('form[data-confirm]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      const label = form.dataset.confirm || 'this action';
      if (!window.confirm(`Are you sure you want to ${label}?`)) {
        event.preventDefault();
      }
    });
  });
});
