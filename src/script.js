// Screen Wake Lock
let wakeLock = null;

async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        // Wake lock was released
      });
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  }
}

// Currently unused but may be needed for future functionality
// eslint-disable-next-line no-unused-vars
async function releaseWakeLock() {
  if (wakeLock !== null) {
    await wakeLock.release();
    wakeLock = null;
  }
}

// TCX Generation Functions
/**
 * Creates a trackpoint XML element for a single data point
 * @param {Object} dataPoint - Data point with time, power, heartRate, cadence
 * @returns {string} XML trackpoint string
 */
function createTrackpoint(dataPoint) {
  const translations = {
    time: (time) => `<Time>${new Date(time).toISOString()}</Time>`,
    heartRate: (hr) =>
      `
<HeartRateBpm>
  <Value>${hr}</Value>
</HeartRateBpm>
            `.trim(),
    cadence: (cad) => `<Cadence>${cad}</Cadence>`,
    power: (pw) =>
      `
<Extensions>
  <ns2:TPX>
    <ns2:Watts>${pw}</ns2:Watts>
  </ns2:TPX>
</Extensions>
            `.trim(),
  };
  const contents = Object.keys(translations)
    .map((key) => {
      if (dataPoint[key] === undefined) return '';
      return translations[key](dataPoint[key]);
    })
    .filter((x) => x)
    .join('\n');

  return `
<Trackpoint>
  ${contents}
</Trackpoint>
`.trim();
}

/**
 * Generates TCX XML string from power data for cycling activities
 * @param {Array<Object>} powerData - Array of power measurement objects
 * @returns {string} Complete TCX XML string
 */
function generateTcxString(powerData) {
  // Validate input data
  if (!Array.isArray(powerData) || powerData.length === 0) {
    throw new Error('Input power data array is empty or invalid');
  }

  // Filter and normalize data
  const validDataPoints = powerData.filter(
    (dataPoint) =>
      dataPoint &&
      typeof dataPoint === 'object' &&
      dataPoint.timestamp !== undefined &&
      !isNaN(new Date(dataPoint.timestamp).getTime())
  );

  if (validDataPoints.length === 0) {
    throw new Error('No valid data points found');
  }

  // Transform data
  const normalizeDataPoint = (item) => ({
    time: item.timestamp,
    ...(item.power !== undefined && { power: item.power }),
    ...(item.heartRate !== undefined && { heartRate: item.heartRate }),
    ...(item.cadence !== undefined && { cadence: item.cadence }),
  });

  // Process data
  let processedData = validDataPoints.map(normalizeDataPoint).sort((a, b) => a.time - b.time);

  // Remove leading/trailing entries without power
  const isEmptyPower = (dataPoint) => !dataPoint.power || dataPoint.power <= 0;
  while (processedData.length > 0 && isEmptyPower(processedData[0])) {
    processedData.shift();
  }
  while (processedData.length > 0 && isEmptyPower(processedData[processedData.length - 1])) {
    processedData.pop();
  }

  if (processedData.length === 0) {
    throw new Error('No valid power data found after processing');
  }

  // Calculate exercise statistics
  const validPowerReadings = processedData
    .filter((d) => d.power && d.power > 0)
    .map((d) => parseFloat(d.power));
  const avgPower =
    validPowerReadings.length > 0
      ? Math.round(validPowerReadings.reduce((a, b) => a + b, 0) / validPowerReadings.length)
      : 0;
  const maxPower = validPowerReadings.length > 0 ? Math.max(...validPowerReadings) : 0;

  const startTime = processedData[0].time;
  const endTime = processedData[processedData.length - 1].time;
  const duration = Math.round((endTime - startTime) / 1000 / 60); // duration in minutes

  // Generate activity notes with exercise description and power averages
  const exerciseDescription = 'Indoor cycling session recorded with Power Saver app.';

  let powerAveragesText = '';
  if (typeof powerAverages !== 'undefined' && powerAverages) {
    const averagesList = [];

    if (powerAverages['10s'] && powerAverages['10s'].best > 0) {
      averagesList.push(`10s: ${powerAverages['10s'].best}W`);
    }
    if (powerAverages['30s'] && powerAverages['30s'].best > 0) {
      averagesList.push(`30s: ${powerAverages['30s'].best}W`);
    }
    if (powerAverages['1m'] && powerAverages['1m'].best > 0) {
      averagesList.push(`1min: ${powerAverages['1m'].best}W`);
    }
    if (powerAverages['2m'] && powerAverages['2m'].best > 0) {
      averagesList.push(`2min: ${powerAverages['2m'].best}W`);
    }
    if (powerAverages['4m'] && powerAverages['4m'].best > 0) {
      averagesList.push(`4min: ${powerAverages['4m'].best}W`);
    }
    if (powerAverages['8m'] && powerAverages['8m'].best > 0) {
      averagesList.push(`8min: ${powerAverages['8m'].best}W`);
    }

    if (averagesList.length > 0) {
      powerAveragesText = `\n\nBest Power Averages: ${averagesList.join(', ')}`;
    }
  }

  const sessionStats = `\nSession Stats: Duration: ${duration} min, Avg Power: ${avgPower}W, Max Power: ${maxPower}W`;
  const activityNotes = exerciseDescription + sessionStats + powerAveragesText;

  // Helper function to escape XML special characters
  const escapeXml = (text) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Generate XML
  const trackpoints = processedData.map(createTrackpoint).join('\n');
  const startTimeISO = new Date(startTime).toISOString();

  const rawXml = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase
  xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd"
  xmlns:ns2="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
  <Activities>
    <Activity Sport="Biking">
      <Id>${startTimeISO}</Id>
      <Name>E Bike Indoor Cycling Trainer</Name>
      <Notes>${escapeXml(activityNotes)}</Notes>
      <Lap StartTime="${startTimeISO}">
        <Track>
        ${trackpoints}
        </Track>
      </Lap>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;

  return rawXml;
}

// Summary Image Generation Functions
/**
 * Generates a comprehensive summary image with power averages and timeline charts
 * @returns {Promise<HTMLCanvasElement>} Canvas containing the summary image
 */
async function generateSummaryImage() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Calculate required height based on available data
  let requiredHeight = 200; // Base height for title and headers

  // Add height for power averages if available
  if (Object.values(powerAverages).some((avg) => avg.current > 0 || avg.best > 0)) {
    requiredHeight += 200;
  }

  // Add height for each chart
  const singleChartHeight = 350;
  if (powerData.length > 0) requiredHeight += singleChartHeight;
  if (heartData.length > 0) requiredHeight += singleChartHeight;
  if (cadenceData.length > 0) requiredHeight += singleChartHeight;

  // Set canvas size for high resolution export
  const width = 1200;
  const height = Math.max(600, requiredHeight);
  canvas.width = width;
  canvas.height = height;

  // Set background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Power Meter Summary', width / 2, 50);

  // Date and time
  ctx.font = '18px Arial, sans-serif';
  ctx.fillStyle = '#cccccc';
  const now = new Date();
  ctx.fillText(now.toLocaleDateString() + ' ' + now.toLocaleTimeString(), width / 2, 80);

  // Session duration
  if (powerData.length > 0) {
    const sessionEnd = powerData[powerData.length - 1].timestamp;
    const sessionStart = powerData[0].timestamp;
    const sessionSeconds = Math.round((sessionEnd - sessionStart) / 1000);
    const durationMinutes = Math.round(sessionSeconds / 60); // minutes
    ctx.fillText(`Session Duration: ${durationMinutes} minutes`, width / 2, 105);
  }

  let yOffset = 130;

  // Power Averages Section
  if (Object.values(powerAverages).some((avg) => avg.current > 0 || avg.best > 0)) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Power Averages', 50, yOffset);
    yOffset += 40;

    const avgData = [
      { label: '10s', data: powerAverages['10s'] },
      { label: '30s', data: powerAverages['30s'] },
      { label: '1m', data: powerAverages['1m'] },
      { label: '2m', data: powerAverages['2m'] },
      { label: '4m', data: powerAverages['4m'] },
      { label: '8m', data: powerAverages['8m'] },
    ];

    // Draw power averages table
    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('Duration', 70, yOffset);
    ctx.fillText('Best', 220, yOffset);
    ctx.fillText('Duration', 470, yOffset);
    ctx.fillText('Best', 620, yOffset);
    yOffset += 30;

    // Draw averages in two columns
    for (let i = 0; i < avgData.length; i++) {
      const avg = avgData[i];
      const xBase = i < 3 ? 70 : 470;
      const row = i < 3 ? i : i - 3;
      const y = yOffset + row * 25;

      ctx.fillStyle = '#ffffff';
      ctx.fillText(avg.label, xBase, y);
      ctx.fillStyle = avg.data.best > 0 ? '#e74c3c' : '#666666';
      ctx.fillText(avg.data.best + 'W', xBase + 150, y);
    }

    yOffset += 100;
  }

  // If no data is available, show a message
  const hasData = powerData.length > 0 || heartData.length > 0 || cadenceData.length > 0;
  if (!hasData) {
    ctx.fillStyle = '#cccccc';
    ctx.font = '24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data recorded yet', width / 2, height / 2);
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText('Start recording to see your activity summary', width / 2, height / 2 + 40);
    return canvas;
  }

  // Charts section
  const chartHeight = 300;
  const chartWidth = width - 100;
  const chartStartX = 50;

  // Power Chart
  if (powerData.length > 0) {
    yOffset += 20;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText('Power Timeline', chartStartX, yOffset);
    yOffset += 30;

    drawTimelineChart(
      ctx,
      powerData,
      'power',
      chartStartX,
      yOffset,
      chartWidth,
      chartHeight,
      '#3498db',
      'W'
    );
    yOffset += chartHeight + 50;
  }

  // Heart Rate Chart
  if (heartData.length > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText('Heart Rate Timeline', chartStartX, yOffset);
    yOffset += 30;

    drawTimelineChart(
      ctx,
      heartData,
      'heartRate',
      chartStartX,
      yOffset,
      chartWidth,
      chartHeight,
      '#e74c3c',
      'BPM'
    );
    yOffset += chartHeight + 50;
  }

  // Cadence Chart
  if (cadenceData.length > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText('Cadence Timeline', chartStartX, yOffset);
    yOffset += 30;

    drawTimelineChart(
      ctx,
      cadenceData,
      'cadence',
      chartStartX,
      yOffset,
      chartWidth,
      chartHeight,
      '#f39c12',
      'RPM'
    );
    yOffset += chartHeight + 50;
  }

  return canvas;
}

/**
 * Draws a timeline chart for the given data
 */
function drawTimelineChart(ctx, data, valueKey, x, y, width, height, color, unit) {
  if (data.length === 0) return;

  // Draw chart background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(x, y, width, height);

  // Draw border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);

  // Find min/max values for scaling
  const values = data.map((d) => d[valueKey]).filter((v) => v > 0);
  if (values.length === 0) return;

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  // Draw Y-axis labels
  ctx.fillStyle = '#cccccc';
  ctx.font = '12px Arial, sans-serif';
  ctx.textAlign = 'right';

  for (let i = 0; i <= 4; i++) {
    const value = Math.round(minValue + (range * i) / 4);
    const labelY = y + height - (height * i) / 4;
    ctx.fillText(value + unit, x - 10, labelY + 4);
  }

  // Draw chart line
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();

  let firstPoint = true;
  for (let i = 0; i < data.length; i++) {
    const point = data[i];
    const value = point[valueKey];

    if (value > 0) {
      const chartX = x + (i / (data.length - 1)) * width;
      const chartY = y + height - ((value - minValue) / range) * height;

      if (firstPoint) {
        ctx.moveTo(chartX, chartY);
        firstPoint = false;
      } else {
        ctx.lineTo(chartX, chartY);
      }
    }
  }

  ctx.stroke();

  // Draw data points
  ctx.fillStyle = color;
  for (let i = 0; i < data.length; i += Math.max(1, Math.floor(data.length / 50))) {
    const point = data[i];
    const value = point[valueKey];

    if (value > 0) {
      const chartX = x + (i / (data.length - 1)) * width;
      const chartY = y + height - ((value - minValue) / range) * height;

      ctx.beginPath();
      ctx.arc(chartX, chartY, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  // Draw grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;

  // Horizontal grid lines
  for (let i = 1; i < 4; i++) {
    const gridY = y + (height * i) / 4;
    ctx.beginPath();
    ctx.moveTo(x, gridY);
    ctx.lineTo(x + width, gridY);
    ctx.stroke();
  }

  // Add time axis labels
  if (data.length > 1) {
    ctx.fillStyle = '#cccccc';
    ctx.font = '12px Arial, sans-serif';
    ctx.textAlign = 'center';

    const startTime = new Date(data[0].timestamp);
    const endTime = new Date(data[data.length - 1].timestamp);

    // Start time
    ctx.fillText(startTime.toLocaleTimeString(), x, y + height + 20);

    // End time
    ctx.fillText(endTime.toLocaleTimeString(), x + width, y + height + 20);

    // Middle time if session is long enough
    if (data.length > 10) {
      const middleTime = new Date(data[Math.floor(data.length / 2)].timestamp);
      ctx.fillText(middleTime.toLocaleTimeString(), x + width / 2, y + height + 20);
    }
  }

  // Add min/max annotations
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Max: ${maxValue}${unit}`, x + 10, y + 20);
  ctx.fillText(`Min: ${minValue}${unit}`, x + 10, y + 35);
  ctx.fillText(
    `Avg: ${Math.round(values.reduce((a, b) => a + b, 0) / values.length)}${unit}`,
    x + 10,
    y + 50
  );
}

// Data Persistence Functions
const SESSION_STORAGE_KEY = 'powerMeterSession';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Save current session data to localStorage
 */
function saveSessionData() {
  try {
    const sessionData = {
      timestamp: Date.now(),
      powerData: powerData,
      heartData: heartData,
      cadenceData: cadenceData,
      rawPowerMeasurements: rawPowerMeasurements,
      powerReadings: powerReadings,
      powerAverages: powerAverages,
      lastPowerValue: lastPowerValue,
      lastHeartRateValue: lastHeartRateValue,
      lastCadenceValue: lastCadenceValue,
      sessionStartTime: sessionStartTime,
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  } catch (error) {
    console.warn('Failed to save session data:', error);
  }
}

/**
 * Load session data from localStorage if available and recent
 * Returns the session data object if available, null if not
 */
function loadSessionData() {
  try {
    const savedData = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!savedData) return null;

    const sessionData = JSON.parse(savedData);
    const now = Date.now();

    // Check if session is too old (older than 24 hours)
    if (now - sessionData.timestamp > SESSION_TIMEOUT) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return sessionData;
  } catch (error) {
    console.warn('Failed to load session data:', error);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

/**
 * Apply session data to restore the session
 */
function restoreSessionData(sessionData) {
  try {
    // Restore data arrays
    if (sessionData.powerData) ((powerData.length = 0), powerData.push(...sessionData.powerData));
    if (sessionData.heartData) ((heartData.length = 0), heartData.push(...sessionData.heartData));
    if (sessionData.cadenceData)
      ((cadenceData.length = 0), cadenceData.push(...sessionData.cadenceData));
    if (sessionData.rawPowerMeasurements)
      ((rawPowerMeasurements.length = 0),
        rawPowerMeasurements.push(...sessionData.rawPowerMeasurements));
    if (sessionData.powerReadings)
      ((powerReadings.length = 0), powerReadings.push(...sessionData.powerReadings));

    // Restore power averages completely
    if (sessionData.powerAverages) {
      Object.assign(powerAverages, sessionData.powerAverages);
    }

    // Restore last values
    if (sessionData.lastPowerValue !== undefined) lastPowerValue = sessionData.lastPowerValue;
    if (sessionData.lastHeartRateValue !== undefined)
      lastHeartRateValue = sessionData.lastHeartRateValue;
    if (sessionData.lastCadenceValue !== undefined) lastCadenceValue = sessionData.lastCadenceValue;
    if (sessionData.sessionStartTime !== undefined) sessionStartTime = sessionData.sessionStartTime;

    // Update displays with restored data
    updateDisplaysFromRestoredData();

    return true;
  } catch (error) {
    console.warn('Failed to restore session data:', error);
    return false;
  }
}

/**
 * Helper function to update power value with enhanced styling
 */
function updatePowerValue(value) {
  const displayValue = value || '--';
  powerValueElement.textContent = displayValue;
  powerValueElement.setAttribute('data-value', displayValue);
}

/**
 * Update displays after restoring session data
 */
function updateDisplaysFromRestoredData() {
  // Update current metric values
  updatePowerValue(lastPowerValue);
  hrValueElement.textContent = lastHeartRateValue || '--';
  cadenceValueElement.textContent = lastCadenceValue || '--';

  // Update power averages display
  updatePowerAveragesDisplay();

  // Show session restoration notification
  if (powerData.length > 0) {
    showSessionRestoredNotification();
  }
}

/**
 * Show notification that session was restored
 */
function showSessionRestoredNotification() {
  const notification = document.createElement('div');
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 1000;
        font-size: 0.9rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
    `;
  notification.textContent = `Session restored! ${powerData.length} data points recovered.`;

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  // Remove notification after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 300);
  }, 5000);
}

/**
 * Clear session data from localStorage
 */
function clearSessionData() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

const connectButton = document.getElementById('connectButton');
const statusText = document.getElementById('status');
const powerValueElement = document.getElementById('power-value');
const hrValueElement = document.getElementById('hr-value');
const cadenceValueElement = document.getElementById('cadence-value');
const deviceNameElement = document.getElementById('device-name');
const exportJsonButton = document.getElementById('exportJsonButton');
const exportCsvButton = document.getElementById('exportCsvButton');
const exportTcxButton = document.getElementById('exportTcxButton');
const exportRawJsonButton = document.getElementById('exportRawJsonButton');
const exportRawCsvButton = document.getElementById('exportRawCsvButton');
const exportImageButton = document.getElementById('exportImageButton');
const clearSessionButton = document.getElementById('clearSessionButton');

// Power averages elements
const avg10sCurrentElement = document.getElementById('avg10s-current');
const avg10sBestElement = document.getElementById('avg10s-best');
const avg30sCurrentElement = document.getElementById('avg30s-current');
const avg30sBestElement = document.getElementById('avg30s-best');
const avg1mCurrentElement = document.getElementById('avg1m-current');
const avg1mBestElement = document.getElementById('avg1m-best');
const avg2mCurrentElement = document.getElementById('avg2m-current');
const avg2mBestElement = document.getElementById('avg2m-best');
const avg4mCurrentElement = document.getElementById('avg4m-current');
const avg4mBestElement = document.getElementById('avg4m-best');
const avg8mCurrentElement = document.getElementById('avg8m-current');
const avg8mBestElement = document.getElementById('avg8m-best');

// Toggle elements
const toggleConnectSection = document.getElementById('toggleConnectSection');
const toggleExportSection = document.getElementById('toggleExportSection');
const connectSection = document.getElementById('connectSection');
const exportSection = document.getElementById('exportSection');
const powerAveragesSection = document.getElementById('powerAveragesSection');
const connectToggleText = document.getElementById('connectToggleText');
const exportToggleText = document.getElementById('exportToggleText');

// Hamburger menu elements
const hamburgerBtn = document.getElementById('hamburgerButton');
const menuDropdown = document.getElementById('menuDropdown');
const powerAveragesToggle = document.getElementById('powerAveragesToggle');
const powerMetricToggle = document.getElementById('powerMetricToggle');
const heartRateMetricToggle = document.getElementById('heartRateMetricToggle');
const cadenceMetricToggle = document.getElementById('cadenceMetricToggle');
const connectSectionToggle = document.getElementById('connectSectionToggle');
const exportSectionToggle = document.getElementById('exportSectionToggle');
const loadDebugDataMenuItem = document.getElementById('loadDebugDataMenuItem');
const showInfoMenuItem = document.getElementById('showInfoMenuItem');
const showQrCodeMenuItem = document.getElementById('showQrCodeMenuItem');
const spyModeToggle = document.getElementById('spyModeToggle');

// Metric card elements
const powerCard = document.querySelector('.power-card');
const heartRateCard = document.querySelector('.hr-card');
const cadenceCard = document.querySelector('.cadence-card');
const spyCard = document.querySelector('.spy-card');
const spyModeSection = document.getElementById('spyModeSection');

// Connection status elements on buttons
const hrConnectionStatus = document.getElementById('hrConnectionStatus');
const cadenceConnectionStatus = document.getElementById('cadenceConnectionStatus');

// Initialize all connection status to disconnected state
if (hrConnectionStatus) hrConnectionStatus.textContent = 'Disconnected';
if (cadenceConnectionStatus) cadenceConnectionStatus.textContent = 'Disconnected';

// Only add event listeners if elements exist
if (hamburgerBtn && menuDropdown) {
  // Hamburger menu functionality
  hamburgerBtn.addEventListener('click', function () {
    const isActive = menuDropdown.classList.contains('active');
    if (isActive) {
      menuDropdown.classList.remove('active');
    } else {
      menuDropdown.classList.add('active');
    }
  });

  // Close menu when clicking outside
  document.addEventListener('click', function (event) {
    if (!event.target.closest('.hamburger-menu')) {
      menuDropdown.classList.remove('active');
    }
  });
} else {
  console.error('Hamburger menu elements not found:', {
    hamburgerBtn: !!hamburgerBtn,
    menuDropdown: !!menuDropdown,
  });
}

if (powerAveragesToggle && powerAveragesSection) {
  // Power averages toggle via hamburger menu
  let powerAveragesVisible = false;
  powerAveragesToggle.addEventListener('click', function () {
    powerAveragesVisible = !powerAveragesVisible;

    if (powerAveragesVisible) {
      powerAveragesSection.style.display = 'block';
      powerAveragesToggle.classList.add('active');
    } else {
      powerAveragesSection.style.display = 'none';
      powerAveragesToggle.classList.remove('active');
    }
    manageCollapsedSectionsLayout();
  });
} else {
  console.error('Power averages toggle elements not found:', {
    powerAveragesToggle: !!powerAveragesToggle,
    powerAveragesSection: !!powerAveragesSection,
  });
}

// Power metric toggle via hamburger menu
if (powerMetricToggle && powerCard) {
  let powerMetricVisible = true; // Start visible by default
  powerMetricToggle.classList.add('active'); // Set initial active state

  powerMetricToggle.addEventListener('click', function () {
    powerMetricVisible = !powerMetricVisible;

    if (powerMetricVisible) {
      powerCard.style.display = 'block';
      powerMetricToggle.classList.add('active');
    } else {
      powerCard.style.display = 'none';
      powerMetricToggle.classList.remove('active');
    }
  });
} else {
  console.error('Power metric toggle elements not found:', {
    powerMetricToggle: !!powerMetricToggle,
    powerCard: !!powerCard,
  });
}

// Heart rate metric toggle via hamburger menu
if (heartRateMetricToggle && heartRateCard) {
  let heartRateMetricVisible = true; // Start visible by default
  heartRateMetricToggle.classList.add('active'); // Set initial active state

  heartRateMetricToggle.addEventListener('click', function () {
    heartRateMetricVisible = !heartRateMetricVisible;

    if (heartRateMetricVisible) {
      heartRateCard.style.display = 'block';
      heartRateMetricToggle.classList.add('active');
    } else {
      heartRateCard.style.display = 'none';
      heartRateMetricToggle.classList.remove('active');
    }
  });
} else {
  console.error('Heart rate metric toggle elements not found:', {
    heartRateMetricToggle: !!heartRateMetricToggle,
    heartRateCard: !!heartRateCard,
  });
}

// Cadence metric toggle via hamburger menu
if (cadenceMetricToggle && cadenceCard) {
  let cadenceMetricVisible = true; // Start visible by default
  cadenceMetricToggle.classList.add('active'); // Set initial active state

  cadenceMetricToggle.addEventListener('click', function () {
    cadenceMetricVisible = !cadenceMetricVisible;

    if (cadenceMetricVisible) {
      cadenceCard.style.display = 'block';
      cadenceMetricToggle.classList.add('active');
    } else {
      cadenceCard.style.display = 'none';
      cadenceMetricToggle.classList.remove('active');
    }
  });
} else {
  console.error('Cadence metric toggle elements not found:', {
    cadenceMetricToggle: !!cadenceMetricToggle,
    cadenceCard: !!cadenceCard,
  });
}

// Connect section toggle via hamburger menu
if (connectSectionToggle && connectSection) {
  let connectSectionVisible = true; // Start visible by default
  connectSectionToggle.classList.add('active'); // Set initial active state

  connectSectionToggle.addEventListener('click', function () {
    connectSectionVisible = !connectSectionVisible;

    if (connectSectionVisible) {
      connectSection.style.display = 'block';
      connectSectionToggle.classList.add('active');
    } else {
      connectSection.style.display = 'none';
      connectSectionToggle.classList.remove('active');
    }
  });
} else {
  console.error('Connect section toggle elements not found:', {
    connectSectionToggle: !!connectSectionToggle,
    connectSection: !!connectSection,
  });
}

// Export section toggle via hamburger menu
if (exportSectionToggle && exportSection) {
  let exportSectionVisible = false; // Start hidden by default (as it currently is)
  // exportSectionToggle starts inactive since export section is initially hidden

  exportSectionToggle.addEventListener('click', function () {
    exportSectionVisible = !exportSectionVisible;

    if (exportSectionVisible) {
      exportSection.style.display = 'block';
      exportSectionToggle.classList.add('active');
    } else {
      exportSection.style.display = 'none';
      exportSectionToggle.classList.remove('active');
    }
  });
} else {
  console.error('Export section toggle elements not found:', {
    exportSectionToggle: !!exportSectionToggle,
    exportSection: !!exportSection,
  });
}

// Spy mode toggle via hamburger menu
if (spyModeToggle && spyModeSection) {
  let spyModeVisible = false; // Start hidden by default

  spyModeToggle.addEventListener('click', function () {
    spyModeVisible = !spyModeVisible;

    if (spyModeVisible) {
      spyModeSection.style.display = 'block';
      spyModeToggle.classList.add('active');
      // Make sure instructions are visible when first enabling spy mode
      if (spyInstructionsElement) {
        spyInstructionsElement.style.display = 'block';
      }
    } else {
      spyModeSection.style.display = 'none';
      spyModeToggle.classList.remove('active');
      // Disconnect spy device if connected
      if (spyMeterDevice) {
        disconnectSpyMeter();
      }
      // Reset spy display elements
      if (spyValueElement) spyValueElement.textContent = '--';
      if (spyStatusElement) spyStatusElement.style.display = 'none';
      if (spyInstructionsElement) spyInstructionsElement.style.display = 'block';
    }
  });
} else {
  console.error('Spy mode toggle elements not found:', {
    spyModeToggle: !!spyModeToggle,
    spyModeSection: !!spyModeSection,
  });
}

// Debug data functionality
if (loadDebugDataMenuItem) {
  loadDebugDataMenuItem.addEventListener('click', function () {
    loadDebugData();
    // Close the menu after loading debug data
    if (menuDropdown) {
      menuDropdown.classList.remove('active');
    }
  });
} else {
  console.error('Load debug data menu item not found');
}

// Info functionality
if (showInfoMenuItem) {
  showInfoMenuItem.addEventListener('click', function () {
    showAppInfo();
    // Close the menu after showing info
    if (menuDropdown) {
      menuDropdown.classList.remove('active');
    }
  });
} else {
  console.error('Show info menu item not found');
}

// QR Code functionality
if (showQrCodeMenuItem) {
  showQrCodeMenuItem.addEventListener('click', function () {
    showQrCodeModal();
    // Close the menu after showing QR code
    if (menuDropdown) {
      menuDropdown.classList.remove('active');
    }
  });
} else {
  console.error('Show QR code menu item not found');
}

// Toggle functionality for connect section
toggleConnectSection.addEventListener('click', () => {
  const connectButtons = connectSection.querySelectorAll('button:not(.section-toggle-button)');
  const sectionHeader = connectSection.querySelector('.section-header');
  const isHidden = connectButtons[0].style.display === 'none';
  if (isHidden) {
    connectButtons.forEach((btn) => (btn.style.display = 'block'));
    connectToggleText.textContent = 'Hide Connect Devices';
    toggleConnectSection.classList.remove('collapsed');
    connectSection.classList.remove('collapsed');
    sectionHeader.classList.remove('collapsed');
  } else {
    connectButtons.forEach((btn) => (btn.style.display = 'none'));
    connectToggleText.textContent = 'Show Connect Devices';
    toggleConnectSection.classList.add('collapsed');
    connectSection.classList.add('collapsed');
    sectionHeader.classList.add('collapsed');
  }
  // Don't call updateDashboardLayout for bottom controls
});

// Toggle functionality for export section
toggleExportSection.addEventListener('click', () => {
  const exportButtons = document.getElementById('export-buttons');
  const sectionHeader = exportSection.querySelector('.section-header');
  const isHidden = exportButtons.style.display === 'none';
  if (isHidden) {
    exportSection.style.display = 'block';
    exportButtons.style.display = 'flex';
    exportToggleText.textContent = 'Hide Export Data';
    toggleExportSection.classList.remove('collapsed');
    exportSection.classList.remove('collapsed');
    sectionHeader.classList.remove('collapsed');
  } else {
    exportButtons.style.display = 'none';
    exportToggleText.textContent = 'Show Export Data';
    toggleExportSection.classList.add('collapsed');
    exportSection.classList.add('collapsed');
    sectionHeader.classList.add('collapsed');
  }
  // Don't call updateDashboardLayout for bottom controls
});

// Function to update dashboard layout based on visible sections
function updateDashboardLayout() {
  const dashboard = document.querySelector('.dashboard');
  const powerAveragesHidden = powerAveragesSection && powerAveragesSection.style.display === 'none';

  if (powerAveragesHidden) {
    dashboard.classList.add('maximized');
  } else {
    dashboard.classList.remove('maximized');
  }

  // Manage horizontal layout for collapsed sections (excluding bottom controls)
  manageCollapsedSectionsLayout();
}

// Function to manage horizontal layout of collapsed sections
function manageCollapsedSectionsLayout() {
  const dashboard = document.querySelector('.dashboard');

  // Only manage power averages section for collapsed layout -
  // connect and export sections are now bottom controls and stay at bottom
  // Note: collapsedSections logic simplified since only power averages section is managed now

  // Remove any existing collapsed sections row
  const existingRow = document.querySelector('.collapsed-sections-row');
  if (existingRow) {
    // Move sections back to their original positions
    const sectionsInRow = existingRow.querySelectorAll('.power-averages-section');
    sectionsInRow.forEach((section) => {
      // Insert sections back after the dashboard
      dashboard.parentNode.insertBefore(section, dashboard.nextSibling);
    });
    existingRow.remove();
  }

  // Power averages section doesn't need horizontal grouping since it's the only
  // section that can be managed this way now
  dashboard.classList.remove('has-collapsed-sections');
}

// Initialize sections - connect section visible, export section hidden (controlled by hamburger menu)
const connectButtons = connectSection.querySelectorAll('button:not(.section-toggle-button)');
connectButtons.forEach((btn) => (btn.style.display = 'block'));

// Initialize export section as hidden (controlled by hamburger menu)
exportSection.style.display = 'none';

// Initialize power averages section as hidden (controlled by hamburger menu)
powerAveragesSection.style.display = 'none';

updateDashboardLayout();

let powerData = [];
let rawPowerMeasurements = [];
let lastPowerValue = 0;
let sessionStartTime = null;

// Power averaging data structures
let powerReadings = []; // Array to store timestamped power readings
let powerAverages = {
  '10s': { current: 0, best: 0 },
  '30s': { current: 0, best: 0 },
  '1m': { current: 0, best: 0 },
  '2m': { current: 0, best: 0 },
  '4m': { current: 0, best: 0 },
  '8m': { current: 0, best: 0 },
};

// Power averaging functions
function addPowerReading(power) {
  const now = Date.now();
  powerReadings.push({ timestamp: now, power: power });

  // Keep only the last 8 minutes of readings (plus some buffer)
  const eightMinutesAgo = now - 9 * 60 * 1000; // 9 minutes to be safe
  powerReadings = powerReadings.filter((reading) => reading.timestamp > eightMinutesAgo);

  // Calculate current averages
  calculatePowerAverages();
  updatePowerAveragesDisplay();
}

function calculatePowerAverages() {
  const now = Date.now();
  const periods = {
    '10s': 10 * 1000,
    '30s': 30 * 1000,
    '1m': 60 * 1000,
    '2m': 120 * 1000,
    '4m': 240 * 1000,
    '8m': 480 * 1000,
  };

  for (const [periodKey, periodMs] of Object.entries(periods)) {
    const cutoffTime = now - periodMs;
    const relevantReadings = powerReadings.filter((reading) => reading.timestamp >= cutoffTime);

    if (relevantReadings.length > 0) {
      const sum = relevantReadings.reduce((total, reading) => total + reading.power, 0);
      const average = Math.round(sum / relevantReadings.length);
      powerAverages[periodKey].current = average;

      // Update best if current is better
      if (average > powerAverages[periodKey].best) {
        powerAverages[periodKey].best = average;
      }
    } else {
      powerAverages[periodKey].current = 0;
    }
  }
}

function updatePowerAveragesDisplay() {
  avg10sCurrentElement.textContent = powerAverages['10s'].current || '--';
  avg10sBestElement.textContent = powerAverages['10s'].best || '--';
  avg30sCurrentElement.textContent = powerAverages['30s'].current || '--';
  avg30sBestElement.textContent = powerAverages['30s'].best || '--';
  avg1mCurrentElement.textContent = powerAverages['1m'].current || '--';
  avg1mBestElement.textContent = powerAverages['1m'].best || '--';
  avg2mCurrentElement.textContent = powerAverages['2m'].current || '--';
  avg2mBestElement.textContent = powerAverages['2m'].best || '--';
  avg4mCurrentElement.textContent = powerAverages['4m'].current || '--';
  avg4mBestElement.textContent = powerAverages['4m'].best || '--';
  avg8mCurrentElement.textContent = powerAverages['8m'].current || '--';
  avg8mBestElement.textContent = powerAverages['8m'].best || '--';
}

function resetPowerAverages() {
  powerReadings = [];
  for (const period of Object.keys(powerAverages)) {
    powerAverages[period].current = 0;
    powerAverages[period].best = 0;
  }
  updatePowerAveragesDisplay();
}

/**
 * Reset all session data (called when all devices disconnect)
 */
function resetAllSessionData() {
  // Clear all data arrays
  powerData.length = 0;
  heartData.length = 0;
  cadenceData.length = 0;
  rawPowerMeasurements.length = 0;
  powerReadings.length = 0;

  // Reset power averages
  for (const period of Object.keys(powerAverages)) {
    powerAverages[period].current = 0;
    powerAverages[period].best = 0;
  }

  // Reset last values
  lastPowerValue = 0;
  lastHeartRateValue = 0;
  lastCadenceValue = 0;
  sessionStartTime = null;

  // Update displays
  updatePowerAveragesDisplay();
  updatePowerValue('--');
  hrValueElement.textContent = '--';
  cadenceValueElement.textContent = '--';

  // Clear localStorage
  clearSessionData();
}

/**
 * Load debug data with 1000 data points for testing
 */
function loadDebugData() {
  console.log('Loading debug data...');

  // Clear existing data first
  resetAllSessionData();

  // Set session start time to 1 hour ago
  const now = Date.now();
  sessionStartTime = now - 60 * 60 * 1000; // 1 hour ago

  // Generate 1000 data points over 1 hour (one every 3.6 seconds)
  const dataPointInterval = (60 * 60 * 1000) / 1000; // 3.6 seconds

  for (let i = 0; i < 1000; i++) {
    const timestamp = sessionStartTime + i * dataPointInterval;

    // Generate realistic power data (150-400W with some variation)
    const basePower = 250;
    const powerVariation = 150;
    const powerNoise = (Math.random() - 0.5) * 50;
    const powerWave = Math.sin(i / 100) * powerVariation;
    const power = Math.max(0, Math.round(basePower + powerWave + powerNoise));

    // Generate realistic heart rate data (120-180 BPM)
    const baseHR = 150;
    const hrVariation = 30;
    const hrNoise = (Math.random() - 0.5) * 10;
    const hrWave = Math.sin(i / 150) * hrVariation;
    const heartRate = Math.max(60, Math.min(200, Math.round(baseHR + hrWave + hrNoise)));

    // Generate realistic cadence data (70-110 RPM)
    const baseCadence = 90;
    const cadenceVariation = 20;
    const cadenceNoise = (Math.random() - 0.5) * 8;
    const cadenceWave = Math.sin(i / 80) * cadenceVariation;
    const cadence = Math.max(0, Math.round(baseCadence + cadenceWave + cadenceNoise));

    // Add to data arrays
    powerData.push({ timestamp, power, heartRate, cadence });
    heartData.push({ timestamp, heartRate });
    cadenceData.push({ timestamp, cadence });

    // Add power reading for averages calculation
    powerReadings.push({ timestamp, power });

    // Add raw measurement for TCX export
    rawPowerMeasurements.push({
      timestamp,
      flags: 0,
      rawBytes: '00 00 ' + power.toString(16).padStart(4, '0'),
      dataLength: 4,
      instantaneousPower: power,
    });
  }

  // Update last values to the most recent data point
  const lastData = powerData[powerData.length - 1];
  lastPowerValue = lastData.power;
  lastHeartRateValue = lastData.heartRate;
  lastCadenceValue = lastData.cadence;

  // Calculate power averages for all the debug data
  calculateAllPowerAverages();

  // Update displays
  updatePowerValue(lastPowerValue);
  hrValueElement.textContent = lastHeartRateValue;
  cadenceValueElement.textContent = lastCadenceValue;
  updatePowerAveragesDisplay();

  // Save to localStorage
  saveSessionData();

  // Show success message
  alert(
    `Debug data loaded successfully!\n1000 data points generated over 1 hour.\nPower: ${lastPowerValue}W, HR: ${lastHeartRateValue}BPM, Cadence: ${lastCadenceValue}RPM`
  );

  console.log('Debug data loaded:', {
    powerDataPoints: powerData.length,
    heartDataPoints: heartData.length,
    cadenceDataPoints: cadenceData.length,
  });
}

/**
 * Calculate power averages for all periods based on current powerReadings
 */
function calculateAllPowerAverages() {
  const periods = {
    '10s': 10 * 1000,
    '30s': 30 * 1000,
    '1m': 60 * 1000,
    '2m': 2 * 60 * 1000,
    '4m': 4 * 60 * 1000,
    '8m': 8 * 60 * 1000,
  };

  const now = Date.now();

  for (const [periodKey, duration] of Object.entries(periods)) {
    const periodStart = now - duration;
    const periodReadings = powerReadings.filter((reading) => reading.timestamp >= periodStart);

    if (periodReadings.length > 0) {
      const averagePower = Math.round(
        periodReadings.reduce((sum, reading) => sum + reading.power, 0) / periodReadings.length
      );

      powerAverages[periodKey].current = averagePower;

      // Update best if this current average is better
      if (averagePower > powerAverages[periodKey].best) {
        powerAverages[periodKey].best = averagePower;
      }
    }
  }
}

/**
 * Show application information and usage instructions
 */
function showAppInfo() {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

  const modalContent = document.createElement('div');
  modalContent.className = 'modal';
  modalContent.style.cssText = `
        background: #1a1a2e;
        border-radius: 12px;
        padding: 2rem;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        margin: 20px;
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;

  modalContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 1.5rem;">
            <h2 style="color: #3498db; margin: 0 0 0.5rem 0; font-size: 1.8rem;">🚴 Web Bluetooth Power Meter</h2>
            <p style="color: #cccccc; margin: 0; font-size: 1rem;">Real-time cycling data analysis</p>
        </div>

        <div style="color: #ffffff; line-height: 1.6;">
            <h3 style="color: #f39c12; margin: 1.5rem 0 1rem 0;">📱 What is this app?</h3>
            <p style="margin-bottom: 1rem;">
                This is a web-based power meter application that connects to Bluetooth cycling devices 
                to provide real-time power, heart rate, and cadence data analysis. Perfect for indoor 
                training, data logging, and performance tracking.
            </p>

            <h3 style="color: #f39c12; margin: 1.5rem 0 1rem 0;">🔗 How to connect devices:</h3>
            <ol style="margin-bottom: 1rem; padding-left: 1.5rem;">
                <li><strong>Power Meter:</strong> Click "Connect Power Meter" and select your cycling power device</li>
                <li><strong>Heart Rate:</strong> Click "Connect Heart Rate" to pair your HR monitor</li>
                <li><strong>Cadence:</strong> Click "Connect Cadence" for speed/cadence sensors</li>
            </ol>

            <h3 style="color: #f39c12; margin: 1.5rem 0 1rem 0;">📊 Features:</h3>
            <ul style="margin-bottom: 1rem; padding-left: 1.5rem;">
                <li><strong>Real-time Metrics:</strong> Live power, heart rate, and cadence display</li>
                <li><strong>Power Averages:</strong> 10s, 30s, 1m, 2m, 4m, and 8m rolling averages</li>
                <li><strong>Data Export:</strong> JSON, CSV, TCX, and visual summary image formats</li>
                <li><strong>Session Persistence:</strong> Data automatically saved and restored</li>
                <li><strong>Custom Dashboard:</strong> Toggle metrics and sections via hamburger menu</li>
            </ul>

            <h3 style="color: #f39c12; margin: 1.5rem 0 1rem 0;">⚙️ Using the hamburger menu:</h3>
            <ul style="margin-bottom: 1rem; padding-left: 1.5rem;">
                <li><strong>Toggle Sections:</strong> Show/hide different parts of the interface</li>
                <li><strong>Load Debug Data:</strong> Generate 1000 test data points for testing</li>
                <li><strong>Customize View:</strong> Control which metrics are visible</li>
            </ul>

            <h3 style="color: #f39c12; margin: 1.5rem 0 1rem 0;">🌐 Browser Support:</h3>
            <p style="margin-bottom: 1rem;">
                Requires a browser with Web Bluetooth support:
                <br>• Chrome 56+ • Edge 79+ • Opera 43+
            </p>

            <h3 style="color: #f39c12; margin: 1.5rem 0 1rem 0;">💡 Tips:</h3>
            <ul style="margin-bottom: 1.5rem; padding-left: 1.5rem;">
                <li>Make sure your devices are in pairing mode before connecting</li>
                <li>Data is automatically saved to your browser's local storage</li>
                <li>Use the export functions to save your workout data</li>
                <li>The app works offline once loaded</li>
            </ul>
        </div>

        <div style="text-align: center; margin-top: 2rem;">
            <button id="closeInfoModal" style="
                background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            ">Got it!</button>
        </div>
    `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Close modal event listeners
  const closeButton = modalContent.querySelector('#closeInfoModal');
  const closeModal = () => {
    document.body.removeChild(modal);
  };

  closeButton.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  // Add hover effect to button
  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.transform = 'translateY(-2px)';
    closeButton.style.boxShadow = '0 8px 24px rgba(52, 152, 219, 0.4)';
  });

  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.transform = 'translateY(0)';
    closeButton.style.boxShadow = 'none';
  });
}

/**
 * Show QR code modal with link to the app
 */
function showQrCodeModal() {
  const appUrl = 'https://colscoding.github.io/power-saver/';

  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

  const modalContent = document.createElement('div');
  modalContent.className = 'modal';
  modalContent.style.cssText = `
        background: #1a1a2e;
        border-radius: 12px;
        padding: 2rem;
        max-width: 400px;
        max-height: 80vh;
        overflow-y: auto;
        margin: 20px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        text-align: center;
    `;

  // Create QR code canvas
  const qrCanvas = document.createElement('canvas');
  qrCanvas.width = 256;
  qrCanvas.height = 256;
  qrCanvas.style.cssText = `
        background: white;
        border-radius: 8px;
        margin: 1rem 0;
        max-width: 100%;
        height: auto;
    `;

  // Generate QR code
  generateQRCode(qrCanvas, appUrl);

  modalContent.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
            <h2 style="color: #9b59b6; margin: 0 0 0.5rem 0; font-size: 1.8rem;">📱 Share Power Meter App</h2>
            <p style="color: #cccccc; margin: 0; font-size: 1rem;">Scan to access the app on any device</p>
        </div>
        
        <div id="qr-container" style="margin: 1.5rem 0;"></div>
        
        <div style="margin: 1.5rem 0;">
            <p style="color: #ffffff; margin: 0 0 0.5rem 0; font-weight: 600;">Or visit directly:</p>
            <a href="${appUrl}" target="_blank" style="
                color: #9b59b6; 
                text-decoration: none; 
                font-size: 0.9rem;
                word-break: break-all;
                line-height: 1.4;
            ">${appUrl}</a>
        </div>

        <div style="text-align: center; margin-top: 2rem;">
            <button id="closeQrModal" style="
                background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            ">Close</button>
        </div>
    `;

  // Insert QR code canvas
  const qrContainer = modalContent.querySelector('#qr-container');
  qrContainer.appendChild(qrCanvas);

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Close modal event listeners
  const closeButton = modalContent.querySelector('#closeQrModal');
  const closeModal = () => {
    document.body.removeChild(modal);
  };

  closeButton.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  // Add hover effect to button
  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.transform = 'translateY(-2px)';
    closeButton.style.boxShadow = '0 8px 24px rgba(155, 89, 182, 0.4)';
  });

  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.transform = 'translateY(0)';
    closeButton.style.boxShadow = 'none';
  });
}

/**
 * Generate QR code on canvas using a simple QR code generation algorithm
 */
function generateQRCode(canvas, text) {
  const ctx = canvas.getContext('2d');
  const size = canvas.width;

  // Clear canvas with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Simple QR code generation using an online QR code API as fallback
  // For a production app, you'd want to include a proper QR code library
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;

  const img = new Image();
  img.crossOrigin = 'anonymous';

  img.onload = function () {
    ctx.drawImage(img, 0, 0, size, size);
  };

  img.onerror = function () {
    // Fallback: draw a simple pattern if QR API fails
    drawFallbackQR(ctx, size);
  };

  img.src = qrApiUrl;
}

/**
 * Fallback QR code representation when API is unavailable
 */
function drawFallbackQR(ctx, size) {
  ctx.fillStyle = '#000000';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';

  // Draw a simple grid pattern
  const cellSize = size / 25;
  for (let i = 0; i < 25; i++) {
    for (let j = 0; j < 25; j++) {
      if ((i + j) % 3 === 0 || i === 0 || i === 24 || j === 0 || j === 24) {
        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
      }
    }
  }

  // Add text in center
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(size * 0.2, size * 0.4, size * 0.6, size * 0.2);
  ctx.fillStyle = '#000000';
  ctx.fillText('QR Code', size / 2, size / 2 - 10);
  ctx.fillText('Unavailable', size / 2, size / 2 + 10);
}

let lastHeartRateValue = 0;
let lastCadenceValue = 0;
let dataLoggerInterval = null;
let powerMeterDevice = null;
const CYCLING_POWER_SERVICE_UUID = 'cycling_power';
const CYCLING_POWER_MEASUREMENT_CHARACTERISTIC_UUID = 'cycling_power_measurement';
const CYCLING_POWER_FEATURE_CHARACTERISTIC_UUID = 'cycling_power_feature';
const CYCLING_CADENCE_SERVICE_UUID = 'cycling_speed_and_cadence';
const CSC_MEASUREMENT_CHARACTERISTIC_UUID = 'csc_measurement';

// Spy mode variables
let spyMeterDevice = null;
const spyValueElement = document.getElementById('spy-value');
const spyStatusElement = document.getElementById('spyStatus');
const spyInstructionsElement = document.getElementById('spyInstructions');

connectButton.addEventListener('click', async () => {
  await requestWakeLock();
  if (!navigator.bluetooth) {
    statusText.textContent = 'Web Bluetooth API is not available.';
    return;
  }

  // Reset data from previous session
  powerData = [];
  rawPowerMeasurements = [];
  lastPowerValue = 0;
  resetPowerAverages();
  if (dataLoggerInterval) {
    clearInterval(dataLoggerInterval);
  }

  try {
    statusText.textContent = 'Scanning for power meters...';

    // Scan specifically for devices advertising the Cycling Power service
    powerMeterDevice = await navigator.bluetooth.requestDevice({
      filters: [
        {
          services: [CYCLING_POWER_SERVICE_UUID],
        },
      ],
    });

    statusText.textContent = 'Connecting to device...';
    deviceNameElement.textContent = `Device: ${powerMeterDevice.name || 'Unknown Device'}`;

    powerMeterDevice.addEventListener('gattserverdisconnected', onDisconnected);

    const server = await powerMeterDevice.gatt.connect();
    const service = await server.getPrimaryService(CYCLING_POWER_SERVICE_UUID);
    const characteristic = await service.getCharacteristic(
      CYCLING_POWER_MEASUREMENT_CHARACTERISTIC_UUID
    );

    // Check for and subscribe to advanced power features if available
    try {
      const featureCharacteristic = await service.getCharacteristic(
        CYCLING_POWER_FEATURE_CHARACTERISTIC_UUID
      );
      // eslint-disable-next-line no-unused-vars
      const features = await featureCharacteristic.readValue();
      // This value can be used to determine what the power meter supports,
      // but for now we just parse what's in the measurement characteristic.
    } catch {
      // Cycling Power Feature characteristic not found
    }

    // Subscribe to power measurement notifications
    await characteristic.startNotifications();

    characteristic.addEventListener('characteristicvaluechanged', handlePowerMeasurement);

    statusText.textContent = 'Connected and receiving data!';
    connectButton.disabled = true;

    // Start session if this is the first connection
    if (!sessionStartTime) {
      sessionStartTime = Date.now();
    }

    // exportButtons.style.display = 'block';

    dataLoggerInterval = setInterval(() => {
      powerData.push({
        timestamp: Date.now(),
        power: lastPowerValue,
        heartRate: lastHeartRateValue,
        cadence: lastCadenceValue,
      });

      // Save session data every 10 seconds
      if (powerData.length % 100 === 0) {
        // Every 100 readings = 10 seconds
        saveSessionData();
      }
    }, 100);
  } catch (error) {
    statusText.textContent = `Error: ${error.message}`;
    console.error('Connection failed:', error);
    if (powerMeterDevice) {
      powerMeterDevice.removeEventListener('gattserverdisconnected', onDisconnected);
    }
  }
});

// Spy mode connection functionality
spyCard.addEventListener('click', async () => {
  if (!spyMeterDevice) {
    await connectToSpyMeter();
  } else {
    disconnectSpyMeter();
  }
});

async function connectToSpyMeter() {
  if (!navigator.bluetooth) {
    console.error('Web Bluetooth API is not available.');
    return;
  }

  try {
    spyInstructionsElement.style.display = 'none';
    spyStatusElement.textContent = 'Scanning for spy power meter...';
    spyStatusElement.style.display = 'block';
    // Connecting status handled by spyStatusElement

    // Scan for devices advertising the Cycling Power service
    spyMeterDevice = await navigator.bluetooth.requestDevice({
      filters: [
        {
          services: [CYCLING_POWER_SERVICE_UUID],
        },
      ],
    });

    spyStatusElement.textContent = 'Connecting to spy device...';

    spyMeterDevice.addEventListener('gattserverdisconnected', onSpyDisconnected);

    const server = await spyMeterDevice.gatt.connect();
    const service = await server.getPrimaryService(CYCLING_POWER_SERVICE_UUID);
    const characteristic = await service.getCharacteristic(
      CYCLING_POWER_MEASUREMENT_CHARACTERISTIC_UUID
    );

    // Subscribe to power measurement notifications
    await characteristic.startNotifications();

    characteristic.addEventListener('characteristicvaluechanged', handleSpyPowerMeasurement);

    spyStatusElement.textContent = 'Spy connected!';
    spyStatusElement.style.display = 'none';
    // Connected status handled by spyStatusElement
  } catch (error) {
    spyStatusElement.textContent = `Spy Error: ${error.message}`;
    // Error status handled by spyStatusElement
    console.error('Spy connection failed:', error);
    if (spyMeterDevice) {
      spyMeterDevice.removeEventListener('gattserverdisconnected', onSpyDisconnected);
      spyMeterDevice = null;
    }
    // Show instructions again if connection failed
    setTimeout(() => {
      spyStatusElement.style.display = 'none';
      spyInstructionsElement.style.display = 'block';
    }, 3000);
  }
}

function disconnectSpyMeter() {
  if (spyMeterDevice && spyMeterDevice.gatt.connected) {
    spyMeterDevice.gatt.disconnect();
  }
  spyMeterDevice = null;
  spyValueElement.textContent = '--';
  spyStatusElement.style.display = 'none';
  spyInstructionsElement.style.display = 'block';
}

function onSpyDisconnected() {
  console.log('Spy device disconnected');
  spyMeterDevice = null;
  spyValueElement.textContent = '--';
  spyStatusElement.textContent = 'Spy disconnected';
  spyStatusElement.style.display = 'block';
  setTimeout(() => {
    spyStatusElement.style.display = 'none';
    spyInstructionsElement.style.display = 'block';
  }, 3000);
}

function handleSpyPowerMeasurement(event) {
  const value = event.target.value;
  const data = new Uint8Array(value.buffer);

  // Parse cycling power measurement data (same format as main power meter)
  let instantaneousPower = 0;

  if (data.length >= 4) {
    // Read instantaneous power (16-bit unsigned integer, little endian)
    instantaneousPower = data[2] + (data[3] << 8);
  }

  spyValueElement.textContent = instantaneousPower;
}

exportJsonButton.addEventListener('click', () => {
  const jsonString = JSON.stringify(powerData, null, 2);
  const blob = new Blob([jsonString], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  a.download = `power_data_${dateString}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

exportCsvButton.addEventListener('click', () => {
  let csvContent = 'timestamp,power,heartRate,cadence\n';
  powerData.forEach((row) => {
    csvContent += `${row.timestamp},${row.power},${row.heartRate},${row.cadence}\n`;
  });

  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  a.download = `power_data_${dateString}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Export raw power measurements as JSON
exportRawJsonButton.addEventListener('click', () => {
  const jsonString = JSON.stringify(rawPowerMeasurements, null, 2);
  const blob = new Blob([jsonString], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  a.download = `raw_power_measurements_${dateString}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Export raw power measurements as CSV
exportRawCsvButton.addEventListener('click', () => {
  let csvContent = 'timestamp,flags,dataLength,instantaneousPower,rawBytes\n';

  rawPowerMeasurements.forEach((measurement) => {
    csvContent += `${measurement.timestamp},${measurement.flags},${measurement.dataLength},${measurement.instantaneousPower},"${measurement.rawBytes}"\n`;
  });

  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  a.download = `raw_power_measurements_${dateString}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Export TCX
exportTcxButton.addEventListener('click', () => {
  try {
    if (powerData.length === 0) {
      alert('No power data available to export.');
      return;
    }

    const tcxContent = generateTcxString(powerData);

    const blob = new Blob([tcxContent], {
      type: 'application/xml;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    a.download = `power_data_${dateString}.tcx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating TCX:', error);
    alert(`Error generating TCX file: ${error.message}`);
  }
});

// Export Summary Image
exportImageButton.addEventListener('click', async () => {
  try {
    if (powerData.length === 0 && heartData.length === 0 && cadenceData.length === 0) {
      alert('No data available to export. Please record some activity first.');
      return;
    }

    const canvas = await generateSummaryImage();

    // Create download link
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      a.download = `power_meter_summary_${dateString}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  } catch (error) {
    console.error('Error generating summary image:', error);
    alert(`Error generating summary image: ${error.message}`);
  }
});

// Clear Session Data
clearSessionButton.addEventListener('click', () => {
  const confirmed = confirm(
    'Are you sure you want to clear all session data? This action cannot be undone.'
  );
  if (confirmed) {
    resetAllSessionData();
    alert('Session data cleared successfully!');
  }
});

function handlePowerMeasurement(event) {
  const value = event.target.value;
  const timestamp = Date.now();

  // Store simplified raw measurement data
  const rawMeasurement = {
    timestamp: timestamp,
    flags: value.getUint16(0, true),
    rawBytes: Array.from(new Uint8Array(value.buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' '),
    dataLength: value.byteLength,
  };

  // The data is a DataView object with a flags field and the power value.
  // Ref: https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.cycling_power_measurement.xml
  // eslint-disable-next-line no-unused-vars
  const flags = value.getUint16(0, true);
  let offset = 2;

  // Power is always present
  const power = value.getInt16(offset, true);
  rawMeasurement.instantaneousPower = power;
  updatePowerValue(power);
  lastPowerValue = power;

  // Add power reading to averaging calculations
  addPowerReading(power);

  // Store the simplified raw measurement
  rawPowerMeasurements.push(rawMeasurement);
}
/**
 * Parses the Cycling Power Measurement characteristic data.
 * The data is a DataView object with a flags field and the power value.
 * The instantaneous power is a 16-bit signed integer starting at the 3rd byte (offset 2).
 * Ref: https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.characteristic.cycling_power_measurement.xml
 * Currently unused but kept for potential future use.
 */
// eslint-disable-next-line no-unused-vars
function parsePowerMeasurement(value) {
  // The first 2 bytes are flags. The next 2 bytes are the instantaneous power.
  // The power value is a signed 16-bit integer (sint16)
  const instantaneousPower = value.getInt16(2, /*littleEndian=*/ true);
  return instantaneousPower;
}

function onDisconnected() {
  statusText.textContent = 'Device disconnected.';
  // Status handled by statusText element
  deviceNameElement.textContent = '';
  updatePowerValue('--');
  resetPowerAverages();
  connectButton.disabled = false;
  if (dataLoggerInterval) {
    clearInterval(dataLoggerInterval);
    dataLoggerInterval = null;
  }
  if (powerMeterDevice) {
    powerMeterDevice.removeEventListener('gattserverdisconnected', onDisconnected);
    powerMeterDevice = null;
  }
  lastPowerValue = 0;
}

const heartData = [];
const cadenceData = [];
// eslint-disable-next-line no-unused-vars
let hrDataLoggerInterval = null; // Reserved for future HR data logging functionality

const hrConnectButton = document.getElementById('hrConnectButton');
const hrStatusText = document.getElementById('hrStatus');
const hrValue = document.getElementById('hr-value');
const hrDeviceName = document.getElementById('hrDeviceName');

let hrBluetoothDevice = null;

hrConnectButton.addEventListener('click', async () => {
  await requestWakeLock();
  if (!navigator.bluetooth) {
    hrStatusText.textContent = 'Web Bluetooth API is not available.';
    return;
  }

  try {
    hrStatusText.textContent = 'Scanning for devices...';
    if (hrConnectionStatus) hrConnectionStatus.textContent = 'Connecting...';

    // Filter for devices that advertise the 'heart_rate' service
    hrBluetoothDevice = await navigator.bluetooth.requestDevice({
      filters: [
        {
          services: ['heart_rate'],
        },
      ],
    });

    hrStatusText.textContent = 'Connecting to device...';
    hrDeviceName.textContent = `Device: ${hrBluetoothDevice.name}`;

    // Add a listener for when the device gets disconnected
    hrBluetoothDevice.addEventListener('gattserverdisconnected', onDisconnectedHr);

    const hrServer = await hrBluetoothDevice.gatt.connect();
    const hrService = await hrServer.getPrimaryService('heart_rate');
    const hrCharacteristic = await hrService.getCharacteristic('heart_rate_measurement');

    // Start notifications to receive heart rate data
    await hrCharacteristic.startNotifications();

    hrCharacteristic.addEventListener('characteristicvaluechanged', handleHeartRateChanged);

    hrStatusText.textContent = 'Connected!';
    if (hrConnectionStatus) hrConnectionStatus.textContent = 'Connected';
    hrConnectButton.disabled = true;
  } catch (error) {
    hrStatusText.textContent = `Error: ${error.message}`;
    if (hrConnectionStatus) hrConnectionStatus.textContent = 'Connection Failed';
    console.error('Connection failed:', error);
  }
});

function handleHeartRateChanged(event) {
  const value = event.target.value;
  const heartRate = parseHeartRate(value);
  hrValue.textContent = heartRate;
  lastHeartRateValue = heartRate;
}

/**
 * The heart rate measurement is a DataView object.
 * The first byte is a flag, and the subsequent byte(s) are the heart rate value.
 * We need to check the first bit of the flag to see if the value is 8-bit or 16-bit.
 */
function parseHeartRate(value) {
  const flags = value.getUint8(0);
  // Check if the heart rate value format is UINT16 (bit 0 is 1) or UINT8 (bit 0 is 0)
  const is16bit = flags & 0x1;
  if (is16bit) {
    // If 16-bit, read 2 bytes starting from the second byte
    return value.getUint16(1, /*littleEndian=*/ true);
  } else {
    // If 8-bit, read 1 byte starting from the second byte
    return value.getUint8(1);
  }
}

function onDisconnectedHr() {
  hrStatusText.textContent = 'Device disconnected.';
  if (hrConnectionStatus) hrConnectionStatus.textContent = 'Disconnected';
  hrDeviceName.textContent = '';
  hrValue.textContent = '--';
  hrConnectButton.disabled = false;
  hrBluetoothDevice = null;
  lastHeartRateValue = 0;
}

const speedCadenceConnectButton = document.getElementById('speedCadenceConnectButton');
const cadenceStatusText = document.getElementById('cadenceStatus');
const cadenceDeviceName = document.getElementById('cadenceDeviceName');
let speedCadenceBluetoothDevice = null;

speedCadenceConnectButton.addEventListener('click', async () => {
  await requestWakeLock();
  if (!navigator.bluetooth) {
    cadenceStatusText.textContent = 'Web Bluetooth API is not available.';
    return;
  }

  try {
    cadenceStatusText.textContent = 'Scanning for sensors...';
    if (cadenceConnectionStatus) cadenceConnectionStatus.textContent = 'Connecting...';

    // Reset cadence variables for clean start
    if (cadenceResetTimer) {
      clearTimeout(cadenceResetTimer);
      cadenceResetTimer = null;
    }
    lastCrankRevs = 0;
    lastCrankTime = 0;
    lastCadenceValue = 0;

    speedCadenceBluetoothDevice = await navigator.bluetooth.requestDevice({
      filters: [
        {
          services: [CYCLING_CADENCE_SERVICE_UUID],
        },
      ],
    });

    cadenceStatusText.textContent = 'Connecting to device...';
    cadenceDeviceName.textContent = `Device: ${speedCadenceBluetoothDevice.name}`;

    speedCadenceBluetoothDevice.addEventListener(
      'gattserverdisconnected',
      onDisconnectedSpeedCadence
    );

    const server = await speedCadenceBluetoothDevice.gatt.connect();
    const service = await server.getPrimaryService(CYCLING_CADENCE_SERVICE_UUID);
    const characteristic = await service.getCharacteristic(CSC_MEASUREMENT_CHARACTERISTIC_UUID);

    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', handleSpeedCadenceMeasurement);

    cadenceStatusText.textContent = 'Connected!';
    if (cadenceConnectionStatus) cadenceConnectionStatus.textContent = 'Connected';
    speedCadenceConnectButton.disabled = true;
  } catch (error) {
    cadenceStatusText.textContent = `Error: ${error.message}`;
    if (cadenceConnectionStatus) cadenceConnectionStatus.textContent = 'Connection Failed';
    console.error('Speed/Cadence connection failed:', error);
  }
});

let lastCrankRevs = 0;
let lastCrankTime = 0;
let cadenceResetTimer = null;

function handleSpeedCadenceMeasurement(event) {
  const value = event.target.value;
  const flags = value.getUint8(0);
  let offset = 1;

  const wheelRevsPresent = flags & 0x01;
  const crankRevsPresent = flags & 0x02;

  // Skip wheel revolution data since we don't need speed/distance
  if (wheelRevsPresent) {
    offset += 6; // Skip wheel data
  }

  if (crankRevsPresent) {
    const cumulativeCrankRevolutions = value.getUint16(offset, true);
    const lastCrankEventTime = value.getUint16(offset + 2, true); // 1/1024 seconds

    if (lastCrankRevs > 0) {
      const revs = cumulativeCrankRevolutions - lastCrankRevs;
      const time = (lastCrankEventTime - lastCrankTime) / 1024; // in seconds
      if (time > 0) {
        const cadence = (revs / time) * 60; // RPM
        cadenceValueElement.textContent = Math.round(cadence);
        lastCadenceValue = Math.round(cadence);

        // Clear any existing reset timer
        if (cadenceResetTimer) {
          clearTimeout(cadenceResetTimer);
        }

        // Set timer to reset cadence to 0 if no new data comes in for 3 seconds
        cadenceResetTimer = setTimeout(() => {
          cadenceValueElement.textContent = '0';
          lastCadenceValue = 0;
          cadenceResetTimer = null;
        }, 3000);
      }
    }
    lastCrankRevs = cumulativeCrankRevolutions;
    lastCrankTime = lastCrankEventTime;
  }
}

function onDisconnectedSpeedCadence() {
  cadenceStatusText.textContent = 'Device disconnected.';
  if (cadenceConnectionStatus) cadenceConnectionStatus.textContent = 'Disconnected';
  cadenceDeviceName.textContent = '';
  cadenceValueElement.textContent = '--';
  speedCadenceConnectButton.disabled = false;
  speedCadenceBluetoothDevice = null;
  lastCadenceValue = 0;

  // Clear cadence reset timer and reset variables
  if (cadenceResetTimer) {
    clearTimeout(cadenceResetTimer);
    cadenceResetTimer = null;
  }
  lastCrankRevs = 0;
  lastCrankTime = 0;
}

// Initialize session on page load
/**
 * Show restoration dialog to let user choose
 */
function showRestorationDialog(sessionData) {
  return new Promise((resolve) => {
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    // Create modal dialog
    const modal = document.createElement('div');
    modal.className = 'modal';

    // Get session info
    const sessionAge = Math.round((Date.now() - sessionData.timestamp) / (1000 * 60)); // minutes
    const dataCount =
      (sessionData.powerData?.length || 0) +
      (sessionData.heartData?.length || 0) +
      (sessionData.cadenceData?.length || 0);

    modal.innerHTML = `
            <h3>Previous Session Found</h3>
            <p>
                A previous session was found from ${sessionAge} minutes ago with ${dataCount} data points.
            </p>
            <p>
                Would you like to restore this session or start fresh?
            </p>
            <div class="modal-buttons">
                <button id="startFresh" class="modal-button secondary">Start Fresh</button>
                <button id="restoreSession" class="modal-button primary">Restore Session</button>
            </div>
        `;

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Handle button clicks
    modal.querySelector('#startFresh').addEventListener('click', () => {
      document.body.removeChild(backdrop);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      resolve(false);
    });

    modal.querySelector('#restoreSession').addEventListener('click', () => {
      document.body.removeChild(backdrop);
      resolve(true);
    });

    // Handle backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        document.body.removeChild(backdrop);
        resolve(false);
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', async function () {
  // Try to load previous session data
  const sessionData = loadSessionData();
  if (sessionData) {
    // Show restoration dialog
    const shouldRestore = await showRestorationDialog(sessionData);
    if (shouldRestore) {
      restoreSessionData(sessionData);
    } else {
      sessionStartTime = Date.now();
    }
  } else {
    sessionStartTime = Date.now();
  }

  // Save session data when page is about to be closed/refreshed
  window.addEventListener('beforeunload', function () {
    if (powerData.length > 0) {
      saveSessionData();
    }
  });

  // Save session data periodically (every 30 seconds as backup)
  setInterval(() => {
    if (powerData.length > 0) {
      saveSessionData();
    }
  }, 30000);
});
