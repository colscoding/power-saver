
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
        return '';
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
        return '';
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
        return '';
    }

    // Generate XML
    const trackpoints = processedData.map(createTrackpoint).join('\n');
    const startTime = processedData[0].time;
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

export { generateTcxString };