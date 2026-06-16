/* Coffee Portal & Diary Logic Engine */

// Global State
let allResources = [];
let diaryLogs = [];
let editingLogId = null;
let currentRating = 4; // Default rating for new logs

// Constants
const LOCAL_STORAGE_KEY = 'pourover_diary_logs';
const RESOURCE_FILE_URL = '/my-first-project-kaggle-day1/pour_over_resources.md';

// Angles for the 5-axis Radar Chart (Sweet, Acid, Bitter, Body, Finish)
const angles = Array.from({ length: 5 }, (_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5);

// DOM Elements
const elements = {
  navResources: document.getElementById('nav-btn-resources'),
  navDiary: document.getElementById('nav-btn-diary'),
  panelResources: document.getElementById('resources-tab-panel'),
  panelDiary: document.getElementById('diary-tab-panel'),
  
  // News Search & Filters
  newsSearch: document.getElementById('news-search'),
  clearSearch: document.getElementById('clear-search-btn'),
  langFilter: document.getElementById('lang-filter'),
  typeFilter: document.getElementById('type-filter'),
  appSort: document.getElementById('applicability-sort'),
  resourcesGrid: document.getElementById('resources-grid'),
  resourcesLoading: document.getElementById('resources-loading'),
  resourcesError: document.getElementById('resources-error'),
  resourcesErrorMsg: document.getElementById('resources-error-msg'),
  resourcesRetry: document.getElementById('resources-retry-btn'),
  
  // Diary elements
  diaryStatsTotal: document.getElementById('stat-val-total'),
  diaryStatsDevice: document.getElementById('stat-val-device'),
  diaryStatsRating: document.getElementById('stat-val-rating'),
  diaryEmptyView: document.getElementById('diary-empty-view'),
  diaryGrid: document.getElementById('diary-grid'),
  addLogBtn: document.getElementById('add-log-btn'),
  emptyAddBtn: document.getElementById('diary-empty-add-btn'),
  exportBtn: document.getElementById('export-btn'),
  importBtn: document.getElementById('import-btn'),
  importFileInput: document.getElementById('import-file-input'),
  
  // Modals
  brewDialog: document.getElementById('brew-dialog'),
  brewForm: document.getElementById('brew-form'),
  dialogTitle: document.getElementById('dialog-title'),
  dialogClose: document.getElementById('brew-dialog-close'),
  brewCancel: document.getElementById('brew-cancel-btn'),
  deleteDialog: document.getElementById('delete-confirm-dialog'),
  deleteConfirmYes: document.getElementById('delete-confirm-yes'),
  deleteConfirmNo: document.getElementById('delete-confirm-no'),
  
  // Form input elements
  inputBean: document.getElementById('brew-bean'),
  inputRoaster: document.getElementById('brew-roaster'),
  inputDevice: document.getElementById('brew-device'),
  inputCoffeeWeight: document.getElementById('brew-coffee-weight'),
  inputWaterWeight: document.getElementById('brew-water-weight'),
  ratioCalc: document.getElementById('brew-ratio-calc'),
  inputGrind: document.getElementById('brew-grind'),
  inputTemp: document.getElementById('brew-temp'),
  tempValueBubble: document.getElementById('brew-temp-val'),
  inputTime: document.getElementById('brew-time'),
  inputRating: document.getElementById('brew-rating'),
  inputComments: document.getElementById('brew-comments'),
  
  // Sensory Sliders & Values
  sliderSweet: document.getElementById('slider-sweet'),
  sliderAcid: document.getElementById('slider-acid'),
  sliderBitter: document.getElementById('slider-bitter'),
  sliderBody: document.getElementById('slider-body'),
  sliderFinish: document.getElementById('slider-finish'),
  valSweet: document.getElementById('val-sweet'),
  valAcid: document.getElementById('val-acid'),
  valBitter: document.getElementById('val-bitter'),
  valBody: document.getElementById('val-body'),
  valFinish: document.getElementById('val-finish'),
  
  // Toast container
  toastContainer: document.getElementById('toast-container')
};

// ==========================================
// 1. Initializer & Navigation
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  setupNavigation();
  setupEventListeners();
  setupStarRating();
  loadDiaryLogs();
  fetchResources();
}

function setupNavigation() {
  const switchTab = (activeBtn, inactiveBtn, showPanel, hidePanel) => {
    activeBtn.classList.add('active');
    activeBtn.setAttribute('aria-selected', 'true');
    inactiveBtn.classList.remove('active');
    inactiveBtn.setAttribute('aria-selected', 'false');
    
    showPanel.style.display = 'block';
    showPanel.classList.add('active');
    hidePanel.style.display = 'none';
    hidePanel.classList.remove('active');
  };

  elements.navResources.addEventListener('click', () => {
    switchTab(elements.navResources, elements.navDiary, elements.panelResources, elements.panelDiary);
  });

  elements.navDiary.addEventListener('click', () => {
    switchTab(elements.navDiary, elements.navResources, elements.panelDiary, elements.panelResources);
  });
}

// ==========================================
// 2. Event Listeners Setup
// ==========================================
function setupEventListeners() {
  // News Search / Filter events
  elements.newsSearch.addEventListener('input', debounce(() => {
    const query = elements.newsSearch.value.trim();
    elements.clearSearch.style.display = query ? 'block' : 'none';
    renderResources();
  }, 150));

  elements.clearSearch.addEventListener('click', () => {
    elements.newsSearch.value = '';
    elements.clearSearch.style.display = 'none';
    renderResources();
  });

  elements.langFilter.addEventListener('change', renderResources);
  elements.typeFilter.addEventListener('change', renderResources);
  elements.appSort.addEventListener('change', renderResources);
  elements.resourcesRetry.addEventListener('click', fetchResources);

  // Diary Actions
  elements.addLogBtn.addEventListener('click', () => openBrewDialog());
  elements.emptyAddBtn.addEventListener('click', () => openBrewDialog());
  elements.brewCancel.addEventListener('click', () => closeBrewDialog());
  elements.dialogClose.addEventListener('click', () => closeBrewDialog());
  
  // Form submission
  elements.brewForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveBrewLog();
  });

  // Numeric weights changes update ratio
  elements.inputCoffeeWeight.addEventListener('input', updateFormRatio);
  elements.inputWaterWeight.addEventListener('input', updateFormRatio);

  // Slider bubble updates
  elements.inputTemp.addEventListener('input', (e) => {
    elements.tempValueBubble.textContent = e.target.value;
  });

  const bindSensorySlider = (slider, bubble) => {
    slider.addEventListener('input', (e) => {
      bubble.textContent = parseFloat(e.target.value).toFixed(1);
    });
  };
  bindSensorySlider(elements.sliderSweet, elements.valSweet);
  bindSensorySlider(elements.sliderAcid, elements.valAcid);
  bindSensorySlider(elements.sliderBitter, elements.valBitter);
  bindSensorySlider(elements.sliderBody, elements.valBody);
  bindSensorySlider(elements.sliderFinish, elements.valFinish);

  // Export / Import buttons
  elements.exportBtn.addEventListener('click', exportLogsJSON);
  elements.importBtn.addEventListener('click', () => elements.importFileInput.click());
  elements.importFileInput.addEventListener('change', importLogsJSON);

  // Click outside dialog to close
  window.addEventListener('click', (e) => {
    if (e.target === elements.brewDialog) {
      closeBrewDialog();
    }
    if (e.target === elements.deleteDialog) {
      closeDeleteConfirmDialog();
    }
  });
}

// ==========================================
// 3. Star Rating Widget Implementation
// ==========================================
function setupStarRating() {
  const stars = document.querySelectorAll('.star-btn');
  
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.getAttribute('data-value'));
      setRatingValue(val);
    });

    star.addEventListener('mouseover', () => {
      const val = parseInt(star.getAttribute('data-value'));
      highlightStars(val);
    });

    star.addEventListener('mouseout', () => {
      highlightStars(currentRating);
    });
  });
}

function setRatingValue(val) {
  currentRating = val;
  elements.inputRating.value = val;
  highlightStars(val);
}

function highlightStars(count) {
  const stars = document.querySelectorAll('.star-btn');
  stars.forEach((star, index) => {
    if (index < count) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

// ==========================================
// 4. Markdown Resource Fetcher & Parser
// ==========================================
async function fetchResources() {
  elements.resourcesLoading.style.display = 'grid';
  elements.resourcesGrid.style.display = 'none';
  elements.resourcesError.style.display = 'none';
  
  try {
    const response = await fetch(RESOURCE_FILE_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch markdown file: Status ${response.status}`);
    }
    const markdown = await response.text();
    allResources = parseMarkdown(markdown);
    
    elements.resourcesLoading.style.display = 'none';
    elements.resourcesGrid.style.display = 'grid';
    renderResources();
  } catch (error) {
    console.error('Error fetching/parsing resources:', error);
    elements.resourcesLoading.style.display = 'none';
    elements.resourcesErrorMsg.textContent = `Error loading resources: ${error.message}`;
    elements.resourcesError.style.display = 'flex';
  }
}

function parseMarkdown(mdText) {
  const lines = mdText.split('\n');
  const resources = [];
  let currentLanguage = 'English';
  let currentCategory = '';
  let currentResource = null;

  for (let line of lines) {
    line = line.trim();

    // Check for language header: e.g., "## 1. English Resources" or "## 2. Japanese Resources (日本語)"
    if (line.startsWith('## ')) {
      if (line.toLowerCase().includes('english')) {
        currentLanguage = 'English';
      } else if (line.includes('日本語') || line.toLowerCase().includes('japanese')) {
        currentLanguage = 'Japanese';
      } else if (line.includes('中文') || line.toLowerCase().includes('chinese')) {
        currentLanguage = 'Chinese';
      }
      continue;
    }

    // Check for category header: e.g., "### Communities & Discussion"
    if (line.startsWith('### ')) {
      currentCategory = line.replace('###', '').trim();
      continue;
    }

    // Check for resource item: e.g., "#### [Reddit -- r/pourover/](https://www.reddit.com/r/pourover/)"
    if (line.startsWith('#### ')) {
      if (currentResource) {
        resources.push(currentResource);
      }
      const itemMatch = line.match(/####\s+\[(.*?)\]\((.*?)\)/);
      if (itemMatch) {
        currentResource = {
          name: itemMatch[1].trim(),
          url: itemMatch[2].trim(),
          language: currentLanguage,
          category: currentCategory,
          type: 'Resource',
          applicability: 'Medium',
          description: ''
        };
      } else {
        currentResource = null;
      }
      continue;
    }

    // Parse resource bullet points
    if (currentResource && line.startsWith('* ')) {
      if (line.includes('**Type:**')) {
        currentResource.type = line.replace(/\*\s+\*\*Type:\*\*\s*/, '').trim();
      } else if (line.includes('**Home Applicability:**')) {
        // Look for High, Medium, Low
        const appLine = line.replace(/\*\s+\*\*Home Applicability:\*\*\s*/, '');
        if (/high/i.test(appLine)) {
          currentResource.applicability = 'High';
        } else if (/medium/i.test(appLine)) {
          currentResource.applicability = 'Medium';
        } else if (/low/i.test(appLine)) {
          currentResource.applicability = 'Low';
        }
      } else if (line.includes('**Description:**')) {
        currentResource.description = line.replace(/\*\s+\*\*Description:\*\*\s*/, '').trim();
      }
    }
  }

  // Push final item
  if (currentResource) {
    resources.push(currentResource);
  }

  return resources;
}

// ==========================================
// 5. Render Resources Grid
// ==========================================
function renderResources() {
  const searchQuery = elements.newsSearch.value.toLowerCase();
  const langFilter = elements.langFilter.value;
  const typeFilter = elements.typeFilter.value;
  const appSort = elements.appSort.value;

  const filtered = allResources.filter(item => {
    // 1. Search Query Match
    const matchesSearch = !searchQuery || 
                          item.name.toLowerCase().includes(searchQuery) || 
                          item.description.toLowerCase().includes(searchQuery) ||
                          item.type.toLowerCase().includes(searchQuery) ||
                          item.category.toLowerCase().includes(searchQuery);

    // 2. Language Match
    const matchesLang = langFilter === 'all' || item.language === langFilter;

    // 3. Resource Type Match
    const matchesType = typeFilter === 'all' || item.type === typeFilter;

    // 4. Applicability Match
    let matchesApp = true;
    if (appSort === 'High') {
      matchesApp = item.applicability === 'High';
    } else if (appSort === 'Medium') {
      matchesApp = item.applicability === 'High' || item.applicability === 'Medium';
    }

    return matchesSearch && matchesLang && matchesType && matchesApp;
  });

  elements.resourcesGrid.innerHTML = '';

  if (filtered.length === 0) {
    elements.resourcesGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; margin-top: 0;">
        <span class="empty-emoji">🔍</span>
        <h3>No Resources Found</h3>
        <p>No results match your search filters. Try adjusting your query or resetting filters.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(res => {
    const card = document.createElement('article');
    card.className = 'resource-card';
    
    // Set border accent color based on applicability
    if (res.applicability === 'High') {
      card.style.setProperty('--accent-color', 'var(--accent-green)');
    } else {
      card.style.setProperty('--accent-color', 'var(--accent-roast)');
    }

    const appBadgeClass = res.applicability.toLowerCase();
    
    card.innerHTML = `
      <div class="card-header-meta">
        <span class="badge badge-lang">${res.language}</span>
        <span class="badge badge-type">${res.type}</span>
      </div>
      <div>
        <h3 class="card-title">
          <a href="${res.url}" target="_blank" rel="noopener noreferrer">${res.name}</a>
        </h3>
        <span style="font-size:0.75rem; color:var(--text-muted); font-weight: 500;">Category: ${res.category}</span>
      </div>
      <p class="card-description">${res.description || 'No description available.'}</p>
      <div class="card-footer">
        <span class="badge badge-applicability ${appBadgeClass}">
          <span class="bullet" style="color: ${res.applicability === 'High' ? 'var(--accent-green)' : 'var(--accent-gold)'}">●</span>
          ${res.applicability} Applicability
        </span>
        <a href="${res.url}" class="visit-link" target="_blank" rel="noopener noreferrer">
          Visit
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
        </a>
      </div>
    `;
    elements.resourcesGrid.appendChild(card);
  });
}

// ==========================================
// 6. Coffee Diary State Management
// ==========================================
function loadDiaryLogs() {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      diaryLogs = JSON.parse(stored);
      // Sort chronologically (newest first)
      diaryLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (e) {
      console.error('Failed to parse logs from localStorage:', e);
      diaryLogs = [];
    }
  } else {
    diaryLogs = [];
  }
  
  updateDiaryDashboard();
  renderDiaryLogs();
}

function saveDiaryLogs() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(diaryLogs));
  updateDiaryDashboard();
  renderDiaryLogs();
}

function updateDiaryDashboard() {
  elements.diaryStatsTotal.textContent = diaryLogs.length;

  if (diaryLogs.length === 0) {
    elements.diaryStatsDevice.textContent = '—';
    elements.diaryStatsRating.textContent = '—';
    return;
  }

  // Calculate Average Rating
  const totalRating = diaryLogs.reduce((sum, item) => sum + (parseFloat(item.rating) || 0), 0);
  const avgRating = (totalRating / diaryLogs.length).toFixed(1);
  elements.diaryStatsRating.textContent = `${avgRating} ★`;

  // Calculate Favorite Brewing Device
  const counts = {};
  diaryLogs.forEach(item => {
    counts[item.device] = (counts[item.device] || 0) + 1;
  });
  
  let favDevice = '—';
  let maxCount = 0;
  for (const [device, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      favDevice = device;
    }
  }
  elements.diaryStatsDevice.textContent = favDevice;
}

// ==========================================
// 7. Render Diary Logs Grid
// ==========================================
function renderDiaryLogs() {
  elements.diaryGrid.innerHTML = '';
  
  if (diaryLogs.length === 0) {
    elements.diaryEmptyView.style.display = 'flex';
    elements.diaryGrid.style.display = 'none';
    return;
  }

  elements.diaryEmptyView.style.display = 'none';
  elements.diaryGrid.style.display = 'grid';

  diaryLogs.forEach(log => {
    const card = document.createElement('article');
    card.className = 'diary-card';
    
    // Format Date representation
    const logDate = new Date(log.date);
    const dateStr = logDate.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });

    // Form stars display
    let starsHtml = '';
    const roundedRating = Math.round(log.rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        starsHtml += '★';
      } else {
        starsHtml += '<span class="rating-star-empty">★</span>';
      }
    }

    card.innerHTML = `
      <div class="diary-card-title-row">
        <div>
          <h3>${escapeHtml(log.bean)}</h3>
          <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">
            ${escapeHtml(log.roaster || 'Unknown Roaster')}
          </span>
        </div>
        <div class="diary-actions">
          <button class="action-icon-btn edit-log-action" data-id="${log.id}" title="Edit log">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="action-icon-btn delete delete-log-action" data-id="${log.id}" title="Delete log">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      </div>

      <div class="diary-recipe-stats">
        <div class="recipe-stat">
          <span class="recipe-val">${escapeHtml(log.device)}</span>
          <span class="recipe-lbl">Device</span>
        </div>
        <div class="recipe-stat">
          <span class="recipe-val">${log.coffeeWeight}g:${log.waterWeight}g</span>
          <span class="recipe-lbl">Ratio</span>
        </div>
        <div class="recipe-stat">
          <span class="recipe-val">${log.temp}°C</span>
          <span class="recipe-lbl">Temp</span>
        </div>
      </div>

      <div class="radar-chart-container">
        ${getRadarChartSVG(log.sensory)}
      </div>

      ${log.comments ? `<p class="diary-comments">"${escapeHtml(log.comments)}"</p>` : ''}

      <div class="card-footer">
        <div class="rating-display" aria-label="Rating: ${log.rating} stars">
          ${starsHtml}
        </div>
        <time datetime="${log.date}">${dateStr}</time>
      </div>
    `;
    
    // Bind buttons actions
    card.querySelector('.edit-log-action').addEventListener('click', () => openBrewDialog(log.id));
    card.querySelector('.delete-log-action').addEventListener('click', () => confirmDeleteLog(log.id));

    elements.diaryGrid.appendChild(card);
  });
}

// ==========================================
// 8. Sensory Radar Chart Generator (SVG)
// ==========================================
function getRadarChartSVG(sensory) {
  const cx = 60;
  const cy = 60;
  const r = 38;
  const labels = ['SW', 'AC', 'BT', 'BD', 'FI'];
  const values = [
    sensory.sweet ?? 3,
    sensory.acid ?? 3,
    sensory.bitter ?? 3,
    sensory.body ?? 3,
    sensory.finish ?? 3
  ];

  // 1. Concentric Pentagons
  let gridPolygons = '';
  for (let level = 1; level <= 5; level++) {
    const scale = level / 5;
    const pts = angles.map(a => {
      const x = cx + r * scale * Math.cos(a);
      const y = cy + r * scale * Math.sin(a);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    gridPolygons += `<polygon points="${pts}" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="0.7" />\n`;
  }

  // 2. Axis lines & labels
  let axisLines = '';
  let axisLabels = '';
  for (let i = 0; i < 5; i++) {
    const a = angles[i];
    const targetX = cx + r * Math.cos(a);
    const targetY = cy + r * Math.sin(a);
    axisLines += `<line x1="${cx}" y1="${cy}" x2="${targetX.toFixed(1)}" y2="${targetY.toFixed(1)}" stroke="rgba(255, 255, 255, 0.08)" stroke-width="0.7" stroke-dasharray="1 2" />\n`;
    
    // Labels positioning
    const labelR = r + 10;
    const lx = cx + labelR * Math.cos(a);
    const ly = cy + labelR * Math.sin(a);
    let anchor = 'middle';
    if (Math.cos(a) > 0.1) anchor = 'start';
    if (Math.cos(a) < -0.1) anchor = 'end';
    
    axisLabels += `<text x="${lx.toFixed(1)}" y="${(ly + 2.5).toFixed(1)}" fill="var(--text-muted)" font-size="7" font-weight="600" text-anchor="${anchor}">${labels[i]}</text>\n`;
  }

  // 3. User Data Polygon
  const valPts = angles.map((a, i) => {
    const scale = Math.min(5, Math.max(0, values[i])) / 5;
    const x = cx + r * scale * Math.cos(a);
    const y = cy + r * scale * Math.sin(a);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const valuePolygon = `<polygon points="${valPts}" fill="rgba(212, 163, 115, 0.22)" stroke="var(--accent-gold)" stroke-width="1.3" />`;

  return `
    <svg viewBox="0 0 120 120" class="chart-svg">
      ${gridPolygons}
      ${axisLines}
      ${valuePolygon}
      ${axisLabels}
    </svg>
  `;
}

// ==========================================
// 9. Brew Dialog Logic (Form Operations)
// ==========================================
function openBrewDialog(logId = null) {
  editingLogId = logId;
  elements.brewForm.reset();
  
  if (logId) {
    // EDIT LOG MODE
    const log = diaryLogs.find(item => item.id === logId);
    if (!log) return;
    
    elements.dialogTitle.textContent = 'Edit Brew Log';
    elements.inputBean.value = log.bean;
    elements.inputRoaster.value = log.roaster || '';
    elements.inputDevice.value = log.device;
    elements.inputCoffeeWeight.value = log.coffeeWeight;
    elements.inputWaterWeight.value = log.waterWeight;
    elements.inputGrind.value = log.grind || '';
    elements.inputTemp.value = log.temp;
    elements.tempValueBubble.textContent = log.temp;
    elements.inputTime.value = log.time || '';
    elements.inputComments.value = log.comments || '';
    
    // Star rating
    setRatingValue(log.rating || 4);
    
    // Sensory sliders
    const sensory = log.sensory || { sweet: 3, acid: 3, bitter: 3, body: 3, finish: 3 };
    elements.sliderSweet.value = sensory.sweet;
    elements.valSweet.textContent = parseFloat(sensory.sweet).toFixed(1);
    elements.sliderAcid.value = sensory.acid;
    elements.valAcid.textContent = parseFloat(sensory.acid).toFixed(1);
    elements.sliderBitter.value = sensory.bitter;
    elements.valBitter.textContent = parseFloat(sensory.bitter).toFixed(1);
    elements.sliderBody.value = sensory.body;
    elements.valBody.textContent = parseFloat(sensory.body).toFixed(1);
    elements.sliderFinish.value = sensory.finish;
    elements.valFinish.textContent = parseFloat(sensory.finish).toFixed(1);
  } else {
    // ADD LOG MODE
    elements.dialogTitle.textContent = 'Log Daily Brew';
    elements.inputCoffeeWeight.value = '15.0';
    elements.inputWaterWeight.value = '250';
    elements.inputTemp.value = '93';
    elements.tempValueBubble.textContent = '93';
    
    // Default star rating
    setRatingValue(4);
    
    // Default sensory profiles
    elements.sliderSweet.value = 3;
    elements.valSweet.textContent = '3.0';
    elements.sliderAcid.value = 3;
    elements.valAcid.textContent = '3.0';
    elements.sliderBitter.value = 2.5;
    elements.valBitter.textContent = '2.5';
    elements.sliderBody.value = 3;
    elements.valBody.textContent = '3.0';
    elements.sliderFinish.value = 3;
    elements.valFinish.textContent = '3.0';
  }

  updateFormRatio();
  elements.brewDialog.showModal();
}

function closeBrewDialog() {
  elements.brewDialog.close();
  editingLogId = null;
}

function updateFormRatio() {
  const coffee = parseFloat(elements.inputCoffeeWeight.value) || 0;
  const water = parseFloat(elements.inputWaterWeight.value) || 0;
  if (coffee > 0) {
    const ratio = (water / coffee).toFixed(1);
    elements.ratioCalc.textContent = `1:${ratio}`;
  } else {
    elements.ratioCalc.textContent = '—';
  }
}

function saveBrewLog() {
  const bean = elements.inputBean.value.trim();
  const roaster = elements.inputRoaster.value.trim();
  const device = elements.inputDevice.value;
  const coffeeWeight = parseFloat(elements.inputCoffeeWeight.value);
  const waterWeight = parseFloat(elements.inputWaterWeight.value);
  const grind = elements.inputGrind.value.trim();
  const temp = parseInt(elements.inputTemp.value);
  const time = elements.inputTime.value.trim();
  const comments = elements.inputComments.value.trim();
  
  if (!bean || !device || isNaN(coffeeWeight) || isNaN(waterWeight)) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  const sensory = {
    sweet: parseFloat(elements.sliderSweet.value),
    acid: parseFloat(elements.sliderAcid.value),
    bitter: parseFloat(elements.sliderBitter.value),
    body: parseFloat(elements.sliderBody.value),
    finish: parseFloat(elements.sliderFinish.value)
  };

  if (editingLogId) {
    // Update existing record
    const index = diaryLogs.findIndex(item => item.id === editingLogId);
    if (index !== -1) {
      diaryLogs[index] = {
        ...diaryLogs[index],
        bean,
        roaster,
        device,
        coffeeWeight,
        waterWeight,
        grind,
        temp,
        time,
        rating: currentRating,
        sensory,
        comments
      };
      showToast('Brew log updated successfully!');
    }
  } else {
    // Create new record
    const newLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      bean,
      roaster,
      device,
      coffeeWeight,
      waterWeight,
      grind,
      temp,
      time,
      rating: currentRating,
      sensory,
      comments
    };
    diaryLogs.unshift(newLog); // Add to beginning
    showToast('Brew log saved successfully!');
  }

  saveDiaryLogs();
  closeBrewDialog();
}

// ==========================================
// 10. Log Deletion
// ==========================================
let logIdToDelete = null;

function confirmDeleteLog(logId) {
  logIdToDelete = logId;
  
  elements.deleteConfirmYes.onclick = executeDeleteLog;
  elements.deleteConfirmNo.onclick = closeDeleteConfirmDialog;
  
  elements.deleteDialog.showModal();
}

function closeDeleteConfirmDialog() {
  elements.deleteDialog.close();
  logIdToDelete = null;
}

function executeDeleteLog() {
  if (logIdToDelete) {
    diaryLogs = diaryLogs.filter(item => item.id !== logIdToDelete);
    saveDiaryLogs();
    showToast('Brew log deleted.');
    closeDeleteConfirmDialog();
  }
}

// ==========================================
// 11. Data Portability (Export & Import)
// ==========================================
function exportLogsJSON() {
  if (diaryLogs.length === 0) {
    showToast('No logs available to export.', 'error');
    return;
  }
  
  try {
    const dataStr = JSON.stringify(diaryLogs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const dlAnchor = document.createElement('a');
    dlAnchor.href = url;
    dlAnchor.download = `coffee_diary_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    document.body.removeChild(dlAnchor);
    URL.revokeObjectURL(url);
    
    showToast('Logs backup exported successfully!');
  } catch (err) {
    console.error('Export failed:', err);
    showToast('Failed to export backup.', 'error');
  }
}

function importLogsJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      
      // Validation Check
      if (!Array.isArray(parsed)) {
        throw new Error('Data format must be a JSON array of logs.');
      }
      
      // Basic structure validation
      const isValid = parsed.every(item => {
        return item.id && item.date && item.bean && item.device && typeof item.rating === 'number';
      });

      if (!isValid) {
        throw new Error('Some logs are missing required fields (id, bean, device, rating).');
      }

      // Merge or overwrite strategy: Overwrite for restoring backup
      diaryLogs = parsed;
      // Re-sort
      diaryLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      saveDiaryLogs();
      showToast('Logs restored successfully!');
    } catch (err) {
      console.error('Import failed:', err);
      showToast(`Restore failed: ${err.message}`, 'error');
    }
    // Clear value so user can upload same file again
    elements.importFileInput.value = '';
  };
  reader.readAsText(file);
}

// ==========================================
// 12. Helper Utilities
// ==========================================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? '✓' : '⚠️';
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icon}</span>
    <span class="toast-message">${message}</span>
  `;
  
  elements.toastContainer.appendChild(toast);

  // Trigger Slide & Fade out
  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
