
/**
 * Simple XML formatter using native JavaScript
 * @param {string} xml - Raw XML string
 * @returns {string} Formatted XML with proper indentation
 */
function formatXml(xml) {
    const PADDING = '  '; // 2 spaces for indentation
    const reg = /(>)(<)(\/*)/g;
    let formatted = xml.replace(reg, '$1\n$2$3');

    let pad = 0;
    return formatted.split('\n').map(line => {
        let indent = 0;
        if (line.match(/.+<\/\w[^>]*>$/)) {
            indent = 0;
        } else if (line.match(/^<\/\w/) && pad > 0) {
            pad -= 1;
        } else if (line.match(/^<\w[^>]*[^\/]>.*$/)) {
            indent = 1;
        } else {
            indent = 0;
        }

        const padding = PADDING.repeat(pad);
        pad += indent;
        return padding + line;
    }).join('\n');
}

/**
 * Creates a trackpoint XML element for a single data point
 * @param {Object} dataPoint - Data point with time, power, heartRate, cadence
 * @param {number} dataPoint.time - Timestamp for the data point
 * @param {number} [dataPoint.power] - Power measurement in watts
 * @param {number} [dataPoint.heartRate] - Heart rate in BPM
 * @param {number} [dataPoint.cadence] - Cadence in RPM
 * @returns {string} XML trackpoint string
 */
function createTrackpoint(dataPoint) {
    const translations = {
        time: time => `<Time>${new Date(time).toISOString()}</Time>`,
        heartRate: hr => `
<HeartRateBpm>
  <Value>${hr}</Value>
</HeartRateBpm>
            `.trim(),
        cadence: cad => `<Cadence>${cad}</Cadence>`,
        power: pw => `
<Extensions>
  <ns2:TPX>
    <ns2:Watts>${pw}</ns2:Watts>
  </ns2:TPX>
</Extensions>
            `.trim(),
    }
    const contents = Object.keys(translations).map(key => {
        if (dataPoint[key] === undefined) return '';
        return translations[key](dataPoint[key])
    }).filter(x => x).join('\n');

    return `
<Trackpoint>
  ${contents}
</Trackpoint>
`.trim();
}

/**
 * Generates the complete TCX XML from processed data points
 * @param {Array<Object>} dataPoints - Array of processed data points
 * @param {number} dataPoints[].time - Timestamp for each data point
 * @param {number} [dataPoints[].power] - Power measurement in watts
 * @param {number} [dataPoints[].heartRate] - Heart rate in BPM
 * @param {number} [dataPoints[].cadence] - Cadence in RPM
 * @param {string} [sportType] - Sport type for the activity (default: "Other")
 * @returns {string} Complete TCX XML string conforming to Garmin TCX standard
 */
function generateTcxXml(dataPoints, sportType = 'Other') {
    if (dataPoints.length === 0) {
        throw new Error("No data points provided for TCX generation");
    }
    const trackpoints = dataPoints.map(createTrackpoint).join('\n');
    const startTime = dataPoints[0].time;
    const startTimeISO = new Date(startTime).toISOString();
    const rawXml = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase
  xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd"
  xmlns:ns2="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
  <Activities>
    <Activity Sport="${sportType}">
      <Id>${startTimeISO}</Id>
      <Name>Indoor Cycling</Name>
      <Lap StartTime="${startTimeISO}">
        <Track>
        ${trackpoints}
        </Track>
      </Lap>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;

    // Format the XML with proper indentation using native JavaScript
    return formatXml(rawXml);
}

/**
 * Generates a TCX XML string from power data for cycling activities
 * @param {Array<Object>} powerData - Array of power measurement objects
 * @param {number} powerData[].timestamp - Unix timestamp or Date-parseable value
 * @param {number} [powerData[].power] - Power measurement in watts
 * @param {number} [powerData[].heartRate] - Heart rate in beats per minute
 * @param {number} [powerData[].cadence] - Pedal cadence in revolutions per minute
 * @returns {string} Complete TCX XML string conforming to Garmin Training Center format
 * @throws {Error} When input validation fails or no valid data is found
 * @example
 * const powerData = [
 *   { timestamp: 1640995200000, power: 250, heartRate: 145, cadence: 90 },
 *   { timestamp: 1640995201000, power: 255, heartRate: 147, cadence: 92 }
 * ];
 * const tcxXml = generateTcxString(powerData);
 */
function generateTcxString(powerData) {
    // Validate input data
    if (!Array.isArray(powerData)) {
        throw new Error("Input must be an array of power data objects");
    }

    if (powerData.length === 0) {
        throw new Error("Input power data array is empty");
    }

    const isValidDataPoint = (dataPoint) => {
        return !!(dataPoint &&
            typeof dataPoint === 'object' &&
            dataPoint.timestamp !== undefined &&
            !isNaN(new Date(dataPoint.timestamp).getTime()));
    }
    // Filter out invalid data points
    const validDataPoints = powerData.filter(isValidDataPoint);

    if (validDataPoints.length === 0) {
        throw new Error("No valid data points found in input array");
    }

    // Transform and normalize data using native JavaScript
    const normalizeDataPoint = (item) => ({
        time: item.timestamp,
        ...(item.power !== undefined && { power: item.power }),
        ...(item.heartRate !== undefined && { heartRate: item.heartRate }),
        // ...(item.cadence !== undefined && { cadence: item.cadence })
    });

    // Helper functions for data processing
    const isPositivePower = (dataPoint) => dataPoint.power && dataPoint.power > 0;
    const isEmptyPower = (dataPoint) => !isPositivePower(dataPoint);

    // Data processing pipeline using native JavaScript
    let processedData = validDataPoints
        .map(normalizeDataPoint)
        .sort((a, b) => a.time - b.time);

    // Remove leading empty power readings
    while (processedData.length > 0 && isEmptyPower(processedData[0])) {
        processedData.shift();
    }

    // Remove trailing empty power readings
    while (processedData.length > 0 && isEmptyPower(processedData[processedData.length - 1])) {
        processedData.pop();
    }

    if (processedData.length === 0) {
        throw new Error("No valid power data found after processing and filtering");
    }

    // Generate TCX XML
    return generateTcxXml(processedData);
}

module.exports = {
    generateTcxString,
    createTrackpoint,
    generateTcxXml,
};

