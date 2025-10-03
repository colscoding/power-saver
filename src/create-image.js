// Summary Image Generation Functions
/**
 * Generates a comprehensive summary        const averagesData = [
            { label: '10s', data: powerAverages['10s'] },
            { label: '20s', data: powerAverages['20s'] },
            { label: '30s', data: powerAverages['30s'] },
            { label: '40s', data: powerAverages['40s'] },
            { label: '50s', data: powerAverages['50s'] },
            { label: '1m', data: powerAverages['1m'] },
            { label: '2m', data: powerAverages['2m'] },
            { label: '3m', data: powerAverages['3m'] },
            { label: '4m', data: powerAverages['4m'] },
            { label: '5m', data: powerAverages['5m'] },
        ];ith power averages and timeline charts
 * @returns {Promise<HTMLCanvasElement>} Canvas containing the summary image
 */
async function generateSummaryImage({ dataPoints, powerAverages }) {
    const hrDataPoints = dataPoints.filter((d) => d.heartRate !== undefined);
    const cadenceDataPoints = dataPoints.filter((d) => d.cadence !== undefined);
    const powerDataPoints = dataPoints.filter((d) => d.power !== undefined);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Calculate required height based on available data
    let requiredHeight = 200; // Base height for title and headers

    // Add height for power averages if available
    if (Object.values(powerAverages).some((avg) => avg.current > 0 || avg.best > 0)) {
        requiredHeight += 200;
    }

    // Add height for heart rate statistics if available
    if (hrDataPoints.length > 0 && hrDataPoints.some(d => d.heartRate > 0)) {
        requiredHeight += 140;
    }

    // Add height for cadence statistics if available
    if (cadenceDataPoints.length > 0 && cadenceDataPoints.some(d => d.cadence > 0)) {
        requiredHeight += 140;
    }

    // Add height for each chart
    const singleChartHeight = 350;
    if (powerDataPoints.length > 0) requiredHeight += singleChartHeight;
    if (hrDataPoints.length > 0) requiredHeight += singleChartHeight;
    if (cadenceDataPoints.length > 0) requiredHeight += singleChartHeight;

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
    if (powerDataPoints.length > 0) {
        const sessionEnd = powerDataPoints[powerDataPoints.length - 1].timestamp;
        const sessionStart = powerDataPoints[0].timestamp;
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

    // Heart Rate Statistics Section
    if (hrDataPoints.length > 0) {
        const heartRates = hrDataPoints.map(d => d.heartRate).filter(hr => hr > 0);
        if (heartRates.length > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Heart Rate Statistics', 50, yOffset);
            yOffset += 40;

            const maxHR = Math.max(...heartRates);
            const minHR = Math.min(...heartRates);
            const avgHR = Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length);

            ctx.font = '16px Arial, sans-serif';
            ctx.fillStyle = '#cccccc';
            ctx.fillText('Average:', 70, yOffset);
            ctx.fillStyle = '#e74c3c';
            ctx.fillText(`${avgHR} BPM`, 200, yOffset);
            yOffset += 25;

            ctx.fillStyle = '#cccccc';
            ctx.fillText('Maximum:', 70, yOffset);
            ctx.fillStyle = '#e74c3c';
            ctx.fillText(`${maxHR} BPM`, 200, yOffset);
            yOffset += 25;

            ctx.fillStyle = '#cccccc';
            ctx.fillText('Minimum:', 70, yOffset);
            ctx.fillStyle = '#e74c3c';
            ctx.fillText(`${minHR} BPM`, 200, yOffset);
            yOffset += 40;
        }
    }

    // Cadence Statistics Section
    if (cadenceDataPoints.length > 0) {
        const clampCadence = (cad) => Math.max(0, Math.min(200, cad));
        const cadences = cadenceDataPoints.map(d => d.cadence).filter(cad => cad > 0).map(clampCadence);
        if (cadences.length > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Cadence Statistics', 50, yOffset);
            yOffset += 40;

            const maxCadence = Math.max(...cadences);
            const minCadence = Math.min(...cadences);
            const avgCadence = Math.round(cadences.reduce((a, b) => a + b, 0) / cadences.length);

            ctx.font = '16px Arial, sans-serif';
            ctx.fillStyle = '#cccccc';
            ctx.fillText('Average:', 70, yOffset);
            ctx.fillStyle = '#f39c12';
            ctx.fillText(`${avgCadence} RPM`, 200, yOffset);
            yOffset += 25;

            ctx.fillStyle = '#cccccc';
            ctx.fillText('Maximum:', 70, yOffset);
            ctx.fillStyle = '#f39c12';
            ctx.fillText(`${maxCadence} RPM`, 200, yOffset);
            yOffset += 25;

            ctx.fillStyle = '#cccccc';
            ctx.fillText('Minimum:', 70, yOffset);
            ctx.fillStyle = '#f39c12';
            ctx.fillText(`${minCadence} RPM`, 200, yOffset);
            yOffset += 40;
        }
    }

    // If no data is available, show a message
    const hasData = powerDataPoints.length > 0 || hrDataPoints.length > 0 || cadenceDataPoints.length > 0;
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
    if (powerDataPoints.length > 0) {
        yOffset += 20;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.fillText('Power Timeline', chartStartX, yOffset);
        yOffset += 30;

        drawTimelineChart(
            ctx,
            powerDataPoints,
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
    if (hrDataPoints.length > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.fillText('Heart Rate Timeline', chartStartX, yOffset);
        yOffset += 30;

        drawTimelineChart(
            ctx,
            hrDataPoints,
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
    if (cadenceDataPoints.length > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.fillText('Cadence Timeline', chartStartX, yOffset);
        yOffset += 30;

        drawTimelineChart(
            ctx,
            cadenceDataPoints,
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

export { generateSummaryImage };