/**
 * TCX (Training Center XML) Generation Module
 * Generates Garmin Training Center Database XML files for cycling activities
 */

/**
 * Check if a data point has valid power data
 * @param {Object} dataPoint - Data point to check
 * @returns {boolean} True if power is present and greater than 0
 */
function hasValidPower(dataPoint) {
  return dataPoint.power !== undefined && dataPoint.power > 0;
}

/**
 * Check if a timestamp is valid
 * @param {number} timestamp - Timestamp to validate
 * @returns {boolean} True if timestamp is valid
 */
function isValidTimestamp(timestamp) {
  return timestamp !== undefined && !isNaN(new Date(timestamp).getTime());
}

/**
 * Creates a trackpoint XML element for a single data point
 * @param {Object} dataPoint - Data point with time, power, heartRate, cadence
 * @returns {string} XML trackpoint string
 */
function createTrackpoint(dataPoint) {
  const xmlBuilders = {
    time: (time) => `<Time>${new Date(time).toISOString()}</Time>`,
    heartRate: (hr) => `
<HeartRateBpm>
  <Value>${hr}</Value>
</HeartRateBpm>`.trim(),
    cadence: (cad) => `<Cadence>${cad}</Cadence>`,
    power: (pw) => `
<Extensions>
  <ns2:TPX>
    <ns2:Watts>${pw}</ns2:Watts>
  </ns2:TPX>
</Extensions>`.trim(),
  };

  const contents = Object.keys(xmlBuilders)
    .map((key) => {
      if (dataPoint[key] === undefined) {
        return '';
      }
      return xmlBuilders[key](dataPoint[key]);
    })
    .filter(Boolean) // Remove empty strings
    .join('\n');

  return `
<Trackpoint>
  ${contents}
</Trackpoint>`.trim();
}

/**
 * Normalize a data point to the format expected by TCX
 * @param {Object} item - Raw data point
 * @returns {Object} Normalized data point with time, power, heartRate, and cadence properties
 */
function normalizeDataPoint(item) {
  return {
    time: item.timestamp,
    ...(item.power !== undefined && { power: item.power }),
    ...(item.heartRate !== undefined && { heartRate: item.heartRate }),
    ...(item.cadence !== undefined && { cadence: item.cadence }),
  };
}

/**
 * Remove leading and trailing data points without valid power data
 * @param {Array<Object>} dataPoints - Array of data points
 * @returns {Array<Object>} Trimmed array
 */
function trimEmptyPowerEntries(dataPoints) {
  const result = [...dataPoints];

  // Remove leading entries without power
  while (result.length > 0 && !hasValidPower(result[0])) {
    result.shift();
  }

  // Remove trailing entries without power
  while (result.length > 0 && !hasValidPower(result[result.length - 1])) {
    result.pop();
  }

  return result;
}

/**
 * Generates TCX XML string from power data for cycling activities
 * @param {Array<Object>} powerData - Array of power measurement objects
 * @returns {string} Complete TCX XML string, or empty string if no valid data
 */
function generateTcxString(powerData) {
  // Validate input data
  if (!Array.isArray(powerData) || powerData.length === 0) {
    return '';
  }

  // Filter valid data points (must be objects with valid timestamps)
  const validDataPoints = powerData.filter(
    (dataPoint) =>
      dataPoint &&
      typeof dataPoint === 'object' &&
      isValidTimestamp(dataPoint.timestamp)
  );

  if (validDataPoints.length === 0) {
    return '';
  }

  // Normalize and sort data by time
  const processedData = validDataPoints
    .map(normalizeDataPoint)
    .sort((a, b) => a.time - b.time);

  // Remove entries without power at the beginning and end
  const trimmedData = trimEmptyPowerEntries(processedData);

  if (trimmedData.length === 0) {
    return '';
  }

  // Generate trackpoints XML
  const trackpoints = trimmedData.map(createTrackpoint).join('\n');
  const startTime = trimmedData[0].time;
  const startTimeISO = new Date(startTime).toISOString();

  // Build complete TCX document
  const tcxXml = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase
  xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd"
  xmlns:ns2="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
  <Activities>
    <Activity Sport="Biking">
      <Id>${startTimeISO}</Id>
      <Name>E Bike Indoor Cycling Trainer</Name>
      <Lap StartTime="${startTimeISO}">
        <Track>
        ${trackpoints}
        </Track>
      </Lap>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;

  return tcxXml;
}

export { generateTcxString };