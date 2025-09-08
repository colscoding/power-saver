const scanButton = document.getElementById('scanButton');
const deviceList = document.getElementById('deviceList');
const dataContainer = document.getElementById('dataContainer');
const downloadButton = document.getElementById('downloadButton');

let connectedDevice = null;
let savedData = [];


scanButton.addEventListener('click', async () => {
    const btPermission = await navigator.permissions.query({ name: "bluetooth" });
    console.log('Bluetooth permission state:', btPermission.state);
    if (!navigator?.bluetooth) {
        console.error('Bluetooth API is not available in this browser.');
        return;
    }
    try {
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['battery_service', 'device_information'] // Add any services you need
        });
        displayDevice(device);
    } catch (error) {
        console.error('Error scanning for devices:', error);
    }
});

function displayDevice(device) {
    const listItem = document.createElement('li');
    listItem.textContent = `Name: ${device.name || 'Unknown'}, ID: ${device.id}`;
    listItem.addEventListener('click', () => connectToDevice(device));
    deviceList.appendChild(listItem);
}

async function connectToDevice(device) {
    try {
        const server = await device.gatt.connect();
        connectedDevice = server;
        console.log('Connected to device:', device.name);
        // Now you can discover services and characteristics
        // and start listening for data
        startSavingData();
    } catch (error) {
        console.error('Error connecting to device:', error);
    }
}

function startSavingData() {
    // This is a placeholder. You'll need to replace this with actual
    // logic to read data from the connected sensor's characteristics.
    setInterval(() => {
        if (connectedDevice) {
            const dataPoint = {
                timestamp: new Date().toISOString(),
                value: Math.random() * 100 // Replace with actual sensor data
            };
            savedData.push(dataPoint);
            dataContainer.textContent += JSON.stringify(dataPoint, null, 2) + '\n';
            downloadButton.disabled = false;
        }
    }, 1000);
}

downloadButton.addEventListener('click', () => {
    const dataStr = JSON.stringify(savedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sensor-data.json';
    link.click();
    URL.revokeObjectURL(url);
});
