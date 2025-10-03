let e,t,n,o,a,r,i,l,s,c,d,u,g,m,p,h,f,y,w,v;const x="powerMeterSession";function S(e){try{let t={timestamp:Date.now(),powerData:e.powerData,heartData:e.heartData,cadenceData:e.cadenceData,rawPowerMeasurements:e.rawPowerMeasurements,powerReadings:e.getPowerReadings(),powerAverages:e.getPowerAverages(),lastPowerValue:e.lastPowerValue,lastHeartRateValue:e.lastHeartRateValue,lastCadenceValue:e.lastCadenceValue,sessionStartTime:e.sessionStartTime};localStorage.setItem(x,JSON.stringify(t))}catch(e){console.warn("Failed to save session data:",e)}}function b(){localStorage.removeItem(x)}let E=[],C={"10s":{current:0,best:0},"20s":{current:0,best:0},"30s":{current:0,best:0},"40s":{current:0,best:0},"50s":{current:0,best:0},"1m":{current:0,best:0},"2m":{current:0,best:0},"3m":{current:0,best:0},"4m":{current:0,best:0},"5m":{current:0,best:0}};function I(){e&&(e.textContent=C["10s"].current||"--",t.textContent=C["10s"].best||"--",n.textContent=C["20s"].current||"--",o.textContent=C["20s"].best||"--",a.textContent=C["30s"].current||"--",r.textContent=C["30s"].best||"--",i.textContent=C["40s"].current||"--",l.textContent=C["40s"].best||"--",s.textContent=C["50s"].current||"--",c.textContent=C["50s"].best||"--",d.textContent=C["1m"].current||"--",u.textContent=C["1m"].best||"--",g.textContent=C["2m"].current||"--",m.textContent=C["2m"].best||"--",p.textContent=C["3m"].current||"--",h.textContent=C["3m"].best||"--",f.textContent=C["4m"].current||"--",y.textContent=C["4m"].best||"--",w.textContent=C["5m"].current||"--",v.textContent=C["5m"].best||"--")}function T(){for(let e of(E=[],Object.keys(C)))C[e].current=0,C[e].best=0;I()}const B={powerValueElement:null,hrValueElement:null,cadenceValueElement:null,deviceNameElement:null,hrDeviceName:null,cadenceDeviceName:null,statusText:null,hrStatusText:null,cadenceStatusText:null,hrConnectionStatus:null,cadenceConnectionStatus:null,powerMeterConnectButton:null,hrConnectButton:null,speedCadenceConnectButton:null,exportButtons:{json:null,csv:null,tcx:null,rawJson:null,rawCsv:null,image:null,clearSession:null,googleDocs:null,googleSheets:null,googleAuth:null,configureGoogleApi:null,intervals:null,configureIntervals:null},connectSection:null,exportSection:null,powerAveragesSection:null,hamburgerBtn:null,menuDropdown:null,powerAveragesToggle:null,powerMetricToggle:null,heartRateMetricToggle:null,cadenceMetricToggle:null,connectSectionToggle:null,exportSectionToggle:null,showInfoMenuItem:null,showQrCodeMenuItem:null,spyModeToggle:null,powerCard:null,heartRateCard:null,cadenceCard:null,spyCard:null,spyModeSection:null,spyValueElement:null,spyStatusElement:null,spyInstructionsElement:null};function A(e){if(!B.powerValueElement)return;let t=e||"--";B.powerValueElement.textContent=t,B.powerValueElement.setAttribute("data-value",t)}function D(){A("--"),B.hrValueElement&&(B.hrValueElement.textContent="--"),B.cadenceValueElement&&(B.cadenceValueElement.textContent="--")}function M(){let e=new Date,t=e.getFullYear(),n=String(e.getMonth()+1).padStart(2,"0"),o=String(e.getDate()).padStart(2,"0");return`${t}-${n}-${o}`}async function L(){if("wakeLock"in navigator)try{(await navigator.wakeLock.request("screen")).addEventListener("release",()=>{console.log("Wake lock was released")})}catch(e){console.error(`${e.name}, ${e.message}`)}}const P="cycling_power",k="cycling_power_measurement",$="cycling_speed_and_cadence";let R=null,_=null,G=null,N=null,F=0,O=0,V=null;async function U(e,t){if(await L(),!navigator.bluetooth)return void e.onStatusUpdate("Web Bluetooth API is not available.");try{e.onStatusUpdate("Scanning for power meters..."),R=await navigator.bluetooth.requestDevice({filters:[{services:[P]}]}),e.onStatusUpdate("Connecting to device..."),t.deviceNameElement&&(t.deviceNameElement.textContent=`Device: ${R.name||"Unknown Device"}`),R.addEventListener("gattserverdisconnected",()=>{j(e,t)});let n=await R.gatt.connect(),o=await n.getPrimaryService(P),a=await o.getCharacteristic(k);try{let e=await o.getCharacteristic("cycling_power_feature");await e.readValue()}catch{}return await a.startNotifications(),a.addEventListener("characteristicvaluechanged",t=>{var n=t,o=e;let a=n.target.value,r={timestamp:Date.now(),flags:a.getUint16(0,!0),rawBytes:Array.from(new Uint8Array(a.buffer)).map(e=>e.toString(16).padStart(2,"0")).join(" "),dataLength:a.byteLength};a.getUint16(0,!0);let i=a.getInt16(2,!0);r.instantaneousPower=i,o.onPowerMeasurement(i,r)}),e.onStatusUpdate("Connected and receiving data!"),t.powerMeterConnectButton&&(t.powerMeterConnectButton.disabled=!0),!0}catch(n){return e.onStatusUpdate(`Error: ${n.message}`),console.error("Connection failed:",n),R&&R.removeEventListener("gattserverdisconnected",()=>{j(e,t)}),!1}}async function H(e,t){if(await L(),!navigator.bluetooth)return void e.onStatusUpdate("Web Bluetooth API is not available.");try{e.onStatusUpdate("Scanning for devices..."),t.hrConnectionStatus&&(t.hrConnectionStatus.textContent="Connecting..."),_=await navigator.bluetooth.requestDevice({filters:[{services:["heart_rate"]}]}),e.onStatusUpdate("Connecting to device..."),t.hrDeviceName&&(t.hrDeviceName.textContent=`Device: ${_.name}`),_.addEventListener("gattserverdisconnected",()=>{var n,o;n=e,o=t,n.onStatusUpdate("Device disconnected."),o.hrConnectionStatus&&(o.hrConnectionStatus.textContent="Disconnected"),o.hrDeviceName&&(o.hrDeviceName.textContent=""),o.hrConnectButton&&(o.hrConnectButton.disabled=!1),_=null,n.onHeartRateChange(0)});let n=await _.gatt.connect(),o=await n.getPrimaryService("heart_rate"),a=await o.getCharacteristic("heart_rate_measurement");return await a.startNotifications(),a.addEventListener("characteristicvaluechanged",t=>{var n=t,o=e;let a=function(e){let t=e.getUint8(0);return 1&t?e.getUint16(1,!0):e.getUint8(1)}(n.target.value);o.onHeartRateChange(a)}),e.onStatusUpdate("Connected!"),t.hrConnectionStatus&&(t.hrConnectionStatus.textContent="Connected"),t.hrConnectButton&&(t.hrConnectButton.disabled=!0),!0}catch(n){return e.onStatusUpdate(`Error: ${n.message}`),t.hrConnectionStatus&&(t.hrConnectionStatus.textContent="Connection Failed"),console.error("Connection failed:",n),!1}}async function q(e,t){if(await L(),!navigator.bluetooth)return void e.onStatusUpdate("Web Bluetooth API is not available.");try{e.onStatusUpdate("Scanning for sensors..."),t.cadenceConnectionStatus&&(t.cadenceConnectionStatus.textContent="Connecting..."),V&&(clearTimeout(V),V=null),F=0,O=0,G=await navigator.bluetooth.requestDevice({filters:[{services:[$]}]}),e.onStatusUpdate("Connecting to device..."),t.cadenceDeviceName&&(t.cadenceDeviceName.textContent=`Device: ${G.name}`),G.addEventListener("gattserverdisconnected",()=>{var n,o;n=e,o=t,n.onStatusUpdate("Device disconnected."),o.cadenceConnectionStatus&&(o.cadenceConnectionStatus.textContent="Disconnected"),o.cadenceDeviceName&&(o.cadenceDeviceName.textContent=""),o.speedCadenceConnectButton&&(o.speedCadenceConnectButton.disabled=!1),G=null,n.onCadenceChange(0),V&&(clearTimeout(V),V=null),F=0,O=0});let n=await G.gatt.connect(),o=await n.getPrimaryService($),a=await o.getCharacteristic("csc_measurement");return await a.startNotifications(),a.addEventListener("characteristicvaluechanged",t=>{!function(e,t){let n=e.target.value,o=n.getUint8(0),a=1;if(1&o&&(a+=6),2&o){let e=n.getUint16(a,!0),o=n.getUint16(a+2,!0);if(F>0){let n=e-F,a=(o-O)/1024;if(a>0){let e=Math.round(n/a*60);t.onCadenceChange(e),V&&clearTimeout(V),V=setTimeout(()=>{t.onCadenceChange(0),V=null},3e3)}}F=e,O=o}}(t,e)}),e.onStatusUpdate("Connected!"),t.cadenceConnectionStatus&&(t.cadenceConnectionStatus.textContent="Connected"),t.speedCadenceConnectButton&&(t.speedCadenceConnectButton.disabled=!0),!0}catch(n){return e.onStatusUpdate(`Error: ${n.message}`),t.cadenceConnectionStatus&&(t.cadenceConnectionStatus.textContent="Connection Failed"),console.error("Speed/Cadence connection failed:",n),!1}}async function z(e,t){if(!navigator.bluetooth)return void console.error("Web Bluetooth API is not available.");try{t.spyInstructionsElement&&(t.spyInstructionsElement.style.display="none"),t.spyStatusElement&&(t.spyStatusElement.textContent="Scanning for spy power meter...",t.spyStatusElement.style.display="block"),N=await navigator.bluetooth.requestDevice({filters:[{services:[P]}]}),t.spyStatusElement&&(t.spyStatusElement.textContent="Connecting to spy device..."),N.addEventListener("gattserverdisconnected",()=>{K(t)});let e=await N.gatt.connect(),n=await e.getPrimaryService(P),o=await n.getCharacteristic(k);return await o.startNotifications(),o.addEventListener("characteristicvaluechanged",e=>{var n=e,o=t;let a=new Uint8Array(n.target.value.buffer),r=0;a.length>=4&&(r=a[2]+(a[3]<<8)),o.spyValueElement&&(o.spyValueElement.textContent=r)}),t.spyStatusElement&&(t.spyStatusElement.textContent="Spy connected!",t.spyStatusElement.style.display="none"),!0}catch(e){return t.spyStatusElement&&(t.spyStatusElement.textContent=`Spy Error: ${e.message}`),console.error("Spy connection failed:",e),N&&(N.removeEventListener("gattserverdisconnected",()=>{K(t)}),N=null),setTimeout(()=>{t.spyStatusElement&&(t.spyStatusElement.style.display="none"),t.spyInstructionsElement&&(t.spyInstructionsElement.style.display="block")},3e3),!1}}function W(e){N&&N.gatt.connected&&N.gatt.disconnect(),N=null,e.spyValueElement&&(e.spyValueElement.textContent="--"),e.spyStatusElement&&(e.spyStatusElement.style.display="none"),e.spyInstructionsElement&&(e.spyInstructionsElement.style.display="block")}function j(e,t){e.onStatusUpdate("Device disconnected."),t.deviceNameElement&&(t.deviceNameElement.textContent=""),t.powerMeterConnectButton&&(t.powerMeterConnectButton.disabled=!1),R&&(R.removeEventListener("gattserverdisconnected",()=>{j(e,t)}),R=null),e.onDisconnected()}function K(e){N=null,e.spyValueElement&&(e.spyValueElement.textContent="--"),e.spyStatusElement&&(e.spyStatusElement.textContent="Spy disconnected",e.spyStatusElement.style.display="block"),setTimeout(()=>{e.spyStatusElement&&(e.spyStatusElement.style.display="none"),e.spyInstructionsElement&&(e.spyInstructionsElement.style.display="block")},3e3)}function Y(e){let t={time:e=>`<Time>${new Date(e).toISOString()}</Time>`,heartRate:e=>`
<HeartRateBpm>
  <Value>${e}</Value>
</HeartRateBpm>
            `.trim(),cadence:e=>`<Cadence>${e}</Cadence>`,power:e=>`
<Extensions>
  <ns2:TPX>
    <ns2:Watts>${e}</ns2:Watts>
  </ns2:TPX>
</Extensions>
            `.trim()},n=Object.keys(t).map(n=>void 0===e[n]?"":t[n](e[n])).filter(e=>e).join("\n");return`
<Trackpoint>
  ${n}
</Trackpoint>
`.trim()}async function X({dataPoints:e,powerAverages:t}){let n=e.filter(e=>void 0!==e.heartRate),o=e.filter(e=>void 0!==e.cadence),a=e.filter(e=>void 0!==e.power),r=document.createElement("canvas"),i=r.getContext("2d"),l=200;Object.values(t).some(e=>e.current>0||e.best>0)&&(l+=200),n.length>0&&n.some(e=>e.heartRate>0)&&(l+=140),o.length>0&&o.some(e=>e.cadence>0)&&(l+=140),a.length>0&&(l+=350),n.length>0&&(l+=350),o.length>0&&(l+=350);let s=Math.max(600,l);r.width=1200,r.height=s,i.fillStyle="#1a1a2e",i.fillRect(0,0,1200,s),i.fillStyle="#ffffff",i.font="bold 36px Arial, sans-serif",i.textAlign="center",i.fillText("Power Meter Summary",600,50),i.font="18px Arial, sans-serif",i.fillStyle="#cccccc";let c=new Date;if(i.fillText(c.toLocaleDateString()+" "+c.toLocaleTimeString(),600,80),a.length>0){let e=Math.round(Math.round((a[a.length-1].timestamp-a[0].timestamp)/1e3)/60);i.fillText(`Session Duration: ${e} minutes`,600,105)}let d=130;if(Object.values(t).some(e=>e.current>0||e.best>0)){i.fillStyle="#ffffff",i.font="bold 24px Arial, sans-serif",i.textAlign="left",i.fillText("Power Averages",50,d),d+=40;let e=[{label:"10s",data:t["10s"]},{label:"30s",data:t["30s"]},{label:"1m",data:t["1m"]},{label:"2m",data:t["2m"]},{label:"4m",data:t["4m"]},{label:"8m",data:t["8m"]}];i.font="16px Arial, sans-serif",i.fillStyle="#cccccc",i.fillText("Duration",70,d),i.fillText("Best",220,d),i.fillText("Duration",470,d),i.fillText("Best",620,d),d+=30;for(let t=0;t<e.length;t++){let n=e[t],o=t<3?70:470,a=d+25*(t<3?t:t-3);i.fillStyle="#ffffff",i.fillText(n.label,o,a),i.fillStyle=n.data.best>0?"#e74c3c":"#666666",i.fillText(n.data.best+"W",o+150,a)}d+=100}if(n.length>0){let e=n.map(e=>e.heartRate).filter(e=>e>0);if(e.length>0){i.fillStyle="#ffffff",i.font="bold 24px Arial, sans-serif",i.textAlign="left",i.fillText("Heart Rate Statistics",50,d),d+=40;let t=Math.max(...e),n=Math.min(...e),o=Math.round(e.reduce((e,t)=>e+t,0)/e.length);i.font="16px Arial, sans-serif",i.fillStyle="#cccccc",i.fillText("Average:",70,d),i.fillStyle="#e74c3c",i.fillText(`${o} BPM`,200,d),d+=25,i.fillStyle="#cccccc",i.fillText("Maximum:",70,d),i.fillStyle="#e74c3c",i.fillText(`${t} BPM`,200,d),d+=25,i.fillStyle="#cccccc",i.fillText("Minimum:",70,d),i.fillStyle="#e74c3c",i.fillText(`${n} BPM`,200,d),d+=40}}if(o.length>0){let e=o.map(e=>e.cadence).filter(e=>e>0).map(e=>Math.max(0,Math.min(200,e)));if(e.length>0){i.fillStyle="#ffffff",i.font="bold 24px Arial, sans-serif",i.textAlign="left",i.fillText("Cadence Statistics",50,d),d+=40;let t=Math.max(...e),n=Math.min(...e),o=Math.round(e.reduce((e,t)=>e+t,0)/e.length);i.font="16px Arial, sans-serif",i.fillStyle="#cccccc",i.fillText("Average:",70,d),i.fillStyle="#f39c12",i.fillText(`${o} RPM`,200,d),d+=25,i.fillStyle="#cccccc",i.fillText("Maximum:",70,d),i.fillStyle="#f39c12",i.fillText(`${t} RPM`,200,d),d+=25,i.fillStyle="#cccccc",i.fillText("Minimum:",70,d),i.fillStyle="#f39c12",i.fillText(`${n} RPM`,200,d),d+=40}}return a.length>0||n.length>0||o.length>0?(a.length>0&&(d+=20,i.fillStyle="#ffffff",i.font="bold 20px Arial, sans-serif",i.fillText("Power Timeline",50,d),J(i,a,"power",50,d+=30,1100,300,"#3498db","W"),d+=350),n.length>0&&(i.fillStyle="#ffffff",i.font="bold 20px Arial, sans-serif",i.fillText("Heart Rate Timeline",50,d),J(i,n,"heartRate",50,d+=30,1100,300,"#e74c3c","BPM"),d+=350),o.length>0&&(i.fillStyle="#ffffff",i.font="bold 20px Arial, sans-serif",i.fillText("Cadence Timeline",50,d),J(i,o,"cadence",50,d+=30,1100,300,"#f39c12","RPM"),d+=350),r):(i.fillStyle="#cccccc",i.font="24px Arial, sans-serif",i.textAlign="center",i.fillText("No data recorded yet",600,s/2),i.font="16px Arial, sans-serif",i.fillText("Start recording to see your activity summary",600,s/2+40),r)}function J(e,t,n,o,a,r,i,l,s){if(0===t.length)return;e.fillStyle="rgba(255, 255, 255, 0.05)",e.fillRect(o,a,r,i),e.strokeStyle="rgba(255, 255, 255, 0.2)",e.lineWidth=1,e.strokeRect(o,a,r,i);let c=t.map(e=>e[n]).filter(e=>e>0);if(0===c.length)return;let d=Math.min(...c),u=Math.max(...c),g=u-d||1;e.fillStyle="#cccccc",e.font="12px Arial, sans-serif",e.textAlign="right";for(let t=0;t<=4;t++){let n=Math.round(d+g*t/4),r=a+i-i*t/4;e.fillText(n+s,o-10,r+4)}e.strokeStyle=l,e.lineWidth=2,e.beginPath();let m=!0;for(let l=0;l<t.length;l++){let s=t[l][n];if(s>0){let n=o+l/(t.length-1)*r,c=a+i-(s-d)/g*i;m?(e.moveTo(n,c),m=!1):e.lineTo(n,c)}}e.stroke(),e.fillStyle=l;for(let l=0;l<t.length;l+=Math.max(1,Math.floor(t.length/50))){let s=t[l][n];if(s>0){let n=o+l/(t.length-1)*r,c=a+i-(s-d)/g*i;e.beginPath(),e.arc(n,c,3,0,2*Math.PI),e.fill()}}e.strokeStyle="rgba(255, 255, 255, 0.1)",e.lineWidth=1;for(let t=1;t<4;t++){let n=a+i*t/4;e.beginPath(),e.moveTo(o,n),e.lineTo(o+r,n),e.stroke()}if(t.length>1){e.fillStyle="#cccccc",e.font="12px Arial, sans-serif",e.textAlign="center";let n=new Date(t[0].timestamp),l=new Date(t[t.length-1].timestamp);if(e.fillText(n.toLocaleTimeString(),o,a+i+20),e.fillText(l.toLocaleTimeString(),o+r,a+i+20),t.length>10){let n=new Date(t[Math.floor(t.length/2)].timestamp);e.fillText(n.toLocaleTimeString(),o+r/2,a+i+20)}}e.fillStyle="#ffffff",e.font="12px Arial, sans-serif",e.textAlign="left",e.fillText(`Max: ${u}${s}`,o+10,a+20),e.fillText(`Min: ${d}${s}`,o+10,a+35),e.fillText(`Avg: ${Math.round(c.reduce((e,t)=>e+t,0)/c.length)}${s}`,o+10,a+50)}const Q={CLIENT_ID:"",API_KEY:"",DISCOVERY_DOCS:["https://docs.googleapis.com/$discovery/rest?version=v1","https://sheets.googleapis.com/$discovery/rest?version=v4"],SCOPES:["https://www.googleapis.com/auth/documents","https://www.googleapis.com/auth/spreadsheets","https://www.googleapis.com/auth/drive.file"]},Z={BASE_URL:"https://intervals.icu/api/v1",API_KEY:"",ATHLETE_ID:""},ee={isGoogleApiLoaded:!1,isUserSignedIn:!1,authInstance:null,lastError:null,intervals:{isConfigured:!1,apiKey:null,athleteId:null,lastUpload:null}};async function et(e){try{if(0===e.dataPoints.length)throw Error("No data available to export. Please record some activity first.");let t=await X({dataPoints:e.dataPoints,powerAverages:e.powerAverages});return new Promise((e,n)=>{t.toBlob(t=>{t?(en(t,`power_meter_summary_${M()}.png`),e()):n(Error("Failed to generate image blob"))},"image/png")})}catch(e){throw console.error("Error generating summary image:",e),e}}function en(e,t){try{if(!e||!(e instanceof Blob))throw Error("Invalid blob provided for download");if(!t||"string"!=typeof t)throw Error("Invalid filename provided for download");let n=URL.createObjectURL(e),o=document.createElement("a");o.href=n,o.download=t,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(n)}catch(e){throw console.error("Error during file download:",e),e}}async function eo(e,t){try{return Q.CLIENT_ID=e,Q.API_KEY=t,window.gapi||await new Promise((e,t)=>{if(document.querySelector('script[src*="apis.google.com"]'))return void e();let n=document.createElement("script");n.src="https://apis.google.com/js/api.js",n.onload=e,n.onerror=()=>t(Error("Failed to load Google API script")),document.head.appendChild(n)}),await new Promise((e,t)=>{window.gapi.load("auth2:client",{callback:e,onerror:t})}),await window.gapi.client.init({apiKey:Q.API_KEY,clientId:Q.CLIENT_ID,discoveryDocs:Q.DISCOVERY_DOCS,scope:Q.SCOPES.join(" ")}),ee.authInstance=window.gapi.auth2.getAuthInstance(),ee.isGoogleApiLoaded=!0,ee.isUserSignedIn=ee.authInstance.isSignedIn.get(),console.log("Google API initialized successfully"),!0}catch(e){return console.error("Failed to initialize Google API:",e),ee.lastError=e.message,!1}}async function ea(){try{if(!ee.isGoogleApiLoaded)throw Error("Google API not initialized. Please configure API credentials first.");return ee.isUserSignedIn||(await ee.authInstance.signIn(),ee.isUserSignedIn=ee.authInstance.isSignedIn.get()),ee.isUserSignedIn}catch(e){return console.error("Google authentication failed:",e),ee.lastError=e.message,!1}}async function er(){try{ee.authInstance&&ee.isUserSignedIn&&(await ee.authInstance.signOut(),ee.isUserSignedIn=!1)}catch(e){console.error("Google sign out failed:",e)}}function ei(e,t){try{if(!e||"string"!=typeof e||0===e.trim().length)throw Error("Valid API key is required");if(!t||"string"!=typeof t||0===t.trim().length)throw Error("Valid athlete ID is required");let n=e.trim(),o=t.trim();return Z.API_KEY=n,Z.ATHLETE_ID=o,ee.intervals.isConfigured=!0,ee.intervals.apiKey=n,ee.intervals.athleteId=o,console.log("intervals.icu configuration initialized successfully"),!0}catch(e){return console.error("Failed to initialize intervals.icu configuration:",e),ee.lastError=e.message,!1}}function el(){return ee.intervals.isConfigured&&ee.intervals.apiKey&&ee.intervals.athleteId}async function es(e){try{if(!el())throw Error("intervals.icu not configured. Please set up API credentials first.");let{powerData:t,sessionStartTime:n,powerAverages:o,activityName:a,description:r}=e;if(!t||0===t.length)throw Error("No power data available to export");let i=function(e){let{powerData:t,sessionStartTime:n,description:o}=e,a=new Date(n).toISOString(),r=`<?xml version="1.0" encoding="UTF-8"?>
`;r+=`<TrainingCenterDatabase xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd" xmlns:ns5="http://www.garmin.com/xmlschemas/ActivityGoals/v1" xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2" xmlns:ns2="http://www.garmin.com/xmlschemas/UserProfile/v2" xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ns4="http://www.garmin.com/xmlschemas/ProfileExtension/v1">
  <Activities>
    <Activity Sport="Biking">
      <Id>${a}</Id>
      <Notes>${o}</Notes>
      <Lap StartTime="${a}">
`;let i=function(e){if(0===e.length)return{totalTime:0,distance:0,maxSpeed:0,calories:0,avgHeartRate:0,maxHeartRate:0,avgPower:0,maxPower:0};let t=new Date(e[0].timestamp).getTime(),n=(new Date(e[e.length-1].timestamp).getTime()-t)/1e3,o=e.map(e=>e.power||0).filter(e=>e>0),a=e.map(e=>e.heartRate||0).filter(e=>e>0),r=o.length>0?o.reduce((e,t)=>e+t,0)/o.length:0,i=r>0?Math.sqrt(r/3.6):15,l=r>0?Math.round(r*n*4.18/1e3):Math.round(10*n);return{totalTime:Math.round(n),distance:Math.round(i/3.6*n),maxSpeed:Math.round(1.2*i/3.6*100)/100,calories:l,avgHeartRate:a.length>0?a.reduce((e,t)=>e+t,0)/a.length:0,maxHeartRate:a.length>0?Math.max(...a):0,avgPower:r,maxPower:o.length>0?Math.max(...o):0}}(t);return r+=`        <TotalTimeSeconds>${i.totalTime}</TotalTimeSeconds>
        <DistanceMeters>${i.distance}</DistanceMeters>
        <MaximumSpeed>${i.maxSpeed}</MaximumSpeed>
        <Calories>${i.calories}</Calories>
`,i.avgHeartRate>0&&(r+=`        <AverageHeartRateBpm><Value>${Math.round(i.avgHeartRate)}</Value></AverageHeartRateBpm>
        <MaximumHeartRateBpm><Value>${i.maxHeartRate}</Value></MaximumHeartRateBpm>
`),r+=`        <Intensity>Active</Intensity>
        <TriggerMethod>Manual</TriggerMethod>
        <Track>
`,t.forEach(e=>{let t=new Date(e.timestamp).toISOString();r+=`          <Trackpoint>
            <Time>${t}</Time>
`,e.heartRate&&e.heartRate>0&&(r+=`            <HeartRateBpm><Value>${e.heartRate}</Value></HeartRateBpm>
`),e.cadence&&e.cadence>0&&(r+=`            <Cadence>${e.cadence}</Cadence>
`),r+=`            <Extensions>
              <ns3:TPX>
`,e.power&&e.power>0&&(r+=`                <ns3:Watts>${e.power}</ns3:Watts>
`),r+=`              </ns3:TPX>
            </Extensions>
          </Trackpoint>
`}),r+=`        </Track>
        <Extensions>
          <ns3:LX>
`,i.avgPower>0&&(r+=`            <ns3:AvgWatts>${Math.round(i.avgPower)}</ns3:AvgWatts>
            <ns3:MaxWatts>${i.maxPower}</ns3:MaxWatts>
`),r+=`          </ns3:LX>
        </Extensions>
      </Lap>
      <Extensions>
        <ns3:ActivityExtensions>
`,i.avgPower>0&&(r+=`          <ns3:AvgWatts>${Math.round(i.avgPower)}</ns3:AvgWatts>
          <ns3:MaxWatts>${i.maxPower}</ns3:MaxWatts>
`),r+=`        </ns3:ActivityExtensions>
      </Extensions>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`}({powerData:t,sessionStartTime:n,powerAverages:o,activityName:a||`Power Meter Session - ${new Date(n).toLocaleDateString()}`,description:r||"Exported from Power Saver Web App"}),l=await ec(i,{name:a||`Power Meter Session - ${new Date(n).toLocaleDateString()}`,description:r||"Exported from Power Saver Web App",type:"Ride"});return console.log("Successfully exported to intervals.icu:",l),ee.intervals.lastUpload=new Date().toISOString(),l}catch(e){throw console.error("Error exporting to intervals.icu:",e),ee.lastError=e.message,Error(`Failed to export to intervals.icu: ${e.message}`)}}async function ec(e,t){try{let n=new FormData,o=new Blob([e],{type:"application/xml"});n.append("file",o,`power-session-${Date.now()}.tcx`),n.append("name",t.name),n.append("description",t.description),n.append("type",t.type);let a=await fetch(`${Z.BASE_URL}/athlete/${Z.ATHLETE_ID}/activities`,{method:"POST",headers:{Authorization:`Basic ${btoa(`${Z.API_KEY}:`)}`},body:n});if(!a.ok){let e=await a.text();throw Error(`intervals.icu API error: ${a.status} - ${e}`)}let r=await a.json();return r.id||r.activity_id||"uploaded"}catch(e){throw console.error("Upload to intervals.icu failed:",e),e}}async function ed(e){try{if(!await ea())throw Error("Google authentication required");let{powerData:t,powerAverages:n,sessionStartTime:o}=e,a=o?new Date(o):new Date,r=`Power Meter Session - ${a.toLocaleDateString()}`,i=function(e,t,n){let o=[],a=1,r=`Power Meter Session Report
${n.toLocaleDateString()} ${n.toLocaleTimeString()}

`;o.push({insertText:{location:{index:a},text:r}}),a+=r.length,o.push({updateTextStyle:{range:{startIndex:1,endIndex:r.indexOf("\n")},textStyle:{bold:!0,fontSize:{magnitude:18,unit:"PT"}},fields:"bold,fontSize"}});let i=function(e,t){if(0===e.length)return"Session Summary\n\nNo data recorded during this session.\n\n";let n=function(e){if(e.length<2)return 0;let t=new Date(e[0].timestamp).getTime();return new Date(e[e.length-1].timestamp).getTime()-t}(e),o=function(e){if(0===e.length)return{avgPower:0,maxPower:0,minPower:0,avgHeartRate:0,maxHeartRate:0,avgCadence:0,maxCadence:0};let t=e.map(e=>e.power||0).filter(e=>e>0),n=e.map(e=>e.heartRate||0).filter(e=>e>0),o=e.map(e=>e.cadence||0).filter(e=>e>0);return{avgPower:t.length>0?t.reduce((e,t)=>e+t,0)/t.length:0,maxPower:t.length>0?Math.max(...t):0,minPower:t.length>0?Math.min(...t):0,avgHeartRate:n.length>0?n.reduce((e,t)=>e+t,0)/n.length:0,maxHeartRate:n.length>0?Math.max(...n):0,avgCadence:o.length>0?o.reduce((e,t)=>e+t,0)/o.length:0,maxCadence:o.length>0?Math.max(...o):0}}(e),a="Session Summary\n\n";return a+=`Duration: ${function(e){let t=Math.floor(e/1e3),n=Math.floor(t/60),o=Math.floor(n/60);return o>0?`${o}h ${n%60}m ${t%60}s`:n>0?`${n}m ${t%60}s`:`${t}s`}(n)}
Total Data Points: ${e.length}
Average Power: ${o.avgPower.toFixed(1)} W
Maximum Power: ${o.maxPower} W
Minimum Power: ${o.minPower} W
`,o.avgHeartRate>0&&(a+=`Average Heart Rate: ${o.avgHeartRate.toFixed(0)} BPM
Maximum Heart Rate: ${o.maxHeartRate} BPM
`),o.avgCadence>0&&(a+=`Average Cadence: ${o.avgCadence.toFixed(0)} RPM
Maximum Cadence: ${o.maxCadence} RPM
`),t&&(a+="\nPower Averages:\n",t.fiveSecond&&(a+=`5-second: ${t.fiveSecond.toFixed(1)} W
`),t.thirtySecond&&(a+=`30-second: ${t.thirtySecond.toFixed(1)} W
`),t.oneMinute&&(a+=`1-minute: ${t.oneMinute.toFixed(1)} W
`),t.fiveMinute&&(a+=`5-minute: ${t.fiveMinute.toFixed(1)} W
`)),a+"\n\nDetailed Data\n\n"}(e,t);if(o.push({insertText:{location:{index:a},text:i}}),a+=i.length,e.length>0){let t=function(e){let t=[["Time","Power (W)","Heart Rate (BPM)","Cadence (RPM)"]];return e.slice(0,50).forEach(e=>{let n=new Date(e.timestamp).toLocaleTimeString();t.push([n,e.power||"--",e.heartRate||"--",e.cadence||"--"])}),e.length>50&&(t.push(["...","...","...","..."]),t.push([`${e.length} total data points`,"","",""])),t}(e);o.push({insertTable:{location:{index:a},rows:t.length,columns:t[0].length}}),a+=50}return o}(t,n,a),l=(await window.gapi.client.docs.documents.create({resource:{title:r}})).result.documentId;await window.gapi.client.docs.documents.batchUpdate({documentId:l,resource:{requests:i}});let s=`https://docs.google.com/document/d/${l}/edit`;return window.open(s,"_blank"),console.log("Successfully exported to Google Docs:",l),l}catch(e){throw console.error("Error exporting to Google Docs:",e),Error(`Failed to export to Google Docs: ${e.message}`)}}async function eu(e){try{if(!await ea())throw Error("Google authentication required");let{powerData:t,rawMeasurements:n,sessionStartTime:o}=e,a=o?new Date(o):new Date,r=`Power Meter Data - ${a.toLocaleDateString()}`,i=(await window.gapi.client.sheets.spreadsheets.create({resource:{properties:{title:r},sheets:[{properties:{title:"Summary Data",gridProperties:{rowCount:Math.max(1e3,t.length+10),columnCount:10}}},{properties:{title:"Raw Measurements",gridProperties:{rowCount:Math.max(1e3,n.length+10),columnCount:8}}}]}})).result.spreadsheetId,l=eg(t,"summary"),s=eg(n,"raw");await window.gapi.client.sheets.spreadsheets.values.batchUpdate({spreadsheetId:i,resource:{valueInputOption:"RAW",data:[{range:"Summary Data!A1",values:l},{range:"Raw Measurements!A1",values:s}]}}),await em(i);let c=`https://docs.google.com/spreadsheets/d/${i}/edit`;return window.open(c,"_blank"),console.log("Successfully exported to Google Sheets:",i),i}catch(e){throw console.error("Error exporting to Google Sheets:",e),Error(`Failed to export to Google Sheets: ${e.message}`)}}function eg(e,t){return"summary"===t?function(e){let t=[["Timestamp","Power (W)","Heart Rate (BPM)","Cadence (RPM)","Time (s)"]];return e.forEach((e,n)=>{let o=new Date(e.timestamp).toISOString();t.push([o,e.power||"",e.heartRate||"",e.cadence||"",n])}),t}(e):"raw"===t?function(e){let t=[["Timestamp","Flags","Data Length","Instantaneous Power","Raw Bytes"]];return e.forEach(e=>{let n=new Date(e.timestamp).toISOString();t.push([n,e.flags||"",e.dataLength||"",e.instantaneousPower||"",e.rawBytes||""])}),t}(e):[]}async function em(e){try{let t=[{repeatCell:{range:{sheetId:0,startRowIndex:0,endRowIndex:1},cell:{userEnteredFormat:{backgroundColor:{red:.9,green:.9,blue:.9},textFormat:{bold:!0}}},fields:"userEnteredFormat(backgroundColor,textFormat)"}},{repeatCell:{range:{sheetId:1,startRowIndex:0,endRowIndex:1},cell:{userEnteredFormat:{backgroundColor:{red:.9,green:.9,blue:.9},textFormat:{bold:!0}}},fields:"userEnteredFormat(backgroundColor,textFormat)"}},{autoResizeDimensions:{dimensions:{sheetId:0,dimension:"COLUMNS",startIndex:0,endIndex:5}}},{autoResizeDimensions:{dimensions:{sheetId:1,dimension:"COLUMNS",startIndex:0,endIndex:5}}}];await window.gapi.client.sheets.spreadsheets.batchUpdate({spreadsheetId:e,resource:{requests:t}})}catch(e){console.warn("Failed to apply formatting to Google Sheet:",e)}}function ep(e,t){e&&(t?(e.textContent="\uD83D\uDD17 Sign Out from Google",e.classList.add("signed-in"),e.setAttribute("aria-label","Sign out from Google account")):(e.textContent="\uD83D\uDD17 Sign In to Google",e.classList.remove("signed-in"),e.setAttribute("aria-label","Sign in to Google account for cloud exports")))}async function eh(e,t){try{let n=await fetch(`${Z.BASE_URL}/athlete/${t}`,{method:"GET",headers:{Authorization:`Basic ${btoa(`API_KEY:${e}`)}`}});if(!n.ok){let e=await n.text();return{success:!1,error:`API error: ${n.status} - ${e}`}}let o=await n.json();return{success:!0,athleteName:o.name||o.username,athleteData:o}}catch(e){return{success:!1,error:e.message}}}function ef(){let e=document.querySelector(".dashboard");if(!e)return;let t=document.querySelector(".collapsed-sections-row");t&&(t.querySelectorAll(".power-averages-section").forEach(t=>{e.parentNode.insertBefore(t,e.nextSibling)}),t.remove()),e.classList.remove("has-collapsed-sections")}let ey=[],ew=[],ev=[],ex=[],eS=0,eb=0,eE=0,eC=null,eI=null;const eT={get powerData(){return ey},get rawPowerMeasurements(){return ew},get heartData(){return ev},get cadenceData(){return ex},get lastPowerValue(){return eS},get lastHeartRateValue(){return eb},get lastCadenceValue(){return eE},get sessionStartTime(){return eC},getPowerAverages:function(){return{...C}},getPowerReadings:function(){return[...E]},resetAllSessionData:function(){ey.length=0,ev.length=0,ex.length=0,ew.length=0,T(),eS=0,eb=0,eE=0,eC=null,D(),b()},elements:B},eB={onPowerMeasurement:(e,t)=>{A(e),eS=e,ew.push(t);let n=Date.now();E.push({timestamp:n,power:e});let o=n-36e4;E=E.filter(e=>e.timestamp>o),function(){let e=Date.now();for(let[t,n]of Object.entries({"10s":1e4,"20s":2e4,"30s":3e4,"40s":4e4,"50s":5e4,"1m":6e4,"2m":12e4,"3m":18e4,"4m":24e4,"5m":3e5})){let o=e-n,a=E.filter(e=>e.timestamp>=o);if(a.length>0){let e=Math.round(a.reduce((e,t)=>e+t.power,0)/a.length);C[t].current=e,e>C[t].best&&(C[t].best=e)}else C[t].current=0}}(),I()},onDisconnected:()=>{D(),T(),eI&&(clearInterval(eI),eI=null),eS=0},onStatusUpdate:e=>{B.statusText&&(B.statusText.textContent=e)}},eA={onHeartRateChange:e=>{B.hrValueElement&&(B.hrValueElement.textContent=e),eb=e},onStatusUpdate:e=>{B.hrStatusText&&(B.hrStatusText.textContent=e)}},eD={onCadenceChange:e=>{B.cadenceValueElement&&(B.cadenceValueElement.textContent=e),eE=e},onStatusUpdate:e=>{B.cadenceStatusText&&(B.cadenceStatusText.textContent=e)}};async function eM(){try{let e=function(){let e=localStorage.getItem("google_client_id")||"undefined"!=typeof window&&window.GOOGLE_CONFIG&&window.GOOGLE_CONFIG.CLIENT_ID||null;return"undefined"!=typeof window&&window.GOOGLE_CONFIG&&delete window.GOOGLE_CONFIG.CLIENT_ID,e}(),t=function(){let e=localStorage.getItem("google_api_key")||"undefined"!=typeof window&&window.GOOGLE_CONFIG&&window.GOOGLE_CONFIG.API_KEY||null;return"undefined"!=typeof window&&window.GOOGLE_CONFIG&&delete window.GOOGLE_CONFIG.API_KEY,e}();e&&t?(console.log("Initializing Google API for cloud exports..."),await eo(e,t)?(console.log("Google API initialized successfully"),B.exportButtons.googleDocs&&(B.exportButtons.googleDocs.disabled=!1,B.exportButtons.googleDocs.title="Export session report to Google Docs"),B.exportButtons.googleSheets&&(B.exportButtons.googleSheets.disabled=!1,B.exportButtons.googleSheets.title="Export detailed data to Google Sheets"),B.exportButtons.googleAuth&&(B.exportButtons.googleAuth.disabled=!1),B.exportButtons.configureGoogleApi&&(B.exportButtons.configureGoogleApi.disabled=!1),el()&&eP()):(console.warn("Failed to initialize Google API"),eL("Failed to initialize Google API"))):(console.info("Google API credentials not configured. Cloud exports disabled."),eL("Google API credentials not configured"),function(){let e=document.querySelector(".cloud-export-section");if(e&&!e.querySelector(".config-notice")){let t=document.createElement("div");t.className="config-notice",t.innerHTML=`
      <p style="font-size: 0.9rem; color: #FFB74D; margin: 0.5rem 0; text-align: center;">
        \u{1F4A1} To enable cloud exports, configure Google API credentials in the browser console:<br>
        <code style="background: rgba(0,0,0,0.3); padding: 2px 4px; border-radius: 3px;">
          localStorage.setItem('google_client_id', 'your-client-id');<br>
          localStorage.setItem('google_api_key', 'your-api-key');
        </code>
      </p>
    `,e.appendChild(t)}}());let n=localStorage.getItem("intervals_api_key")||"undefined"!=typeof window&&window.INTERVALS_CONFIG&&window.INTERVALS_CONFIG.API_KEY||null,o=localStorage.getItem("intervals_athlete_id")||"undefined"!=typeof window&&window.INTERVALS_CONFIG&&window.INTERVALS_CONFIG.ATHLETE_ID||null;n&&o?(console.log("Initializing intervals.icu configuration..."),ei(n,o)?(console.log("intervals.icu configured successfully"),eP()):(console.warn("Failed to initialize intervals.icu configuration"),ek("Failed to initialize intervals.icu"))):(console.info("intervals.icu credentials not configured."),ek("intervals.icu credentials not configured"))}catch(e){console.error("Error initializing cloud exports:",e),eL(`Error: ${e.message}`)}}function eL(e){B.exportButtons.googleDocs&&(B.exportButtons.googleDocs.disabled=!0,B.exportButtons.googleDocs.title=`Disabled: ${e}`),B.exportButtons.googleSheets&&(B.exportButtons.googleSheets.disabled=!0,B.exportButtons.googleSheets.title=`Disabled: ${e}`),B.exportButtons.googleAuth&&(B.exportButtons.googleAuth.disabled=!0,B.exportButtons.googleAuth.title=`Disabled: ${e}`),B.exportButtons.configureGoogleApi&&(B.exportButtons.configureGoogleApi.disabled=!1,B.exportButtons.configureGoogleApi.title="Configure Google API credentials")}function eP(){B.exportButtons.intervals&&(B.exportButtons.intervals.disabled=!1,B.exportButtons.intervals.title="Export activity to intervals.icu"),B.exportButtons.configureIntervals&&(B.exportButtons.configureIntervals.disabled=!1,B.exportButtons.configureIntervals.title="Configure intervals.icu credentials")}function ek(e){B.exportButtons.intervals&&(B.exportButtons.intervals.disabled=!0,B.exportButtons.intervals.title=`Disabled: ${e}`),B.exportButtons.configureIntervals&&(B.exportButtons.configureIntervals.disabled=!1,B.exportButtons.configureIntervals.title="Configure intervals.icu credentials")}async function e$(){B.powerValueElement=document.getElementById("power-value"),B.hrValueElement=document.getElementById("hr-value"),B.cadenceValueElement=document.getElementById("cadence-value"),B.deviceNameElement=document.getElementById("device-name"),B.hrDeviceName=document.getElementById("hrDeviceName"),B.cadenceDeviceName=document.getElementById("cadenceDeviceName"),B.statusText=document.getElementById("status"),B.hrStatusText=document.getElementById("hrStatus"),B.cadenceStatusText=document.getElementById("cadenceStatus"),B.hrConnectionStatus=document.getElementById("hrConnectionStatus"),B.cadenceConnectionStatus=document.getElementById("cadenceConnectionStatus"),B.powerMeterConnectButton=document.getElementById("connectButton"),B.hrConnectButton=document.getElementById("hrConnectButton"),B.speedCadenceConnectButton=document.getElementById("speedCadenceConnectButton"),B.exportButtons.json=document.getElementById("exportJsonButton"),B.exportButtons.csv=document.getElementById("exportCsvButton"),B.exportButtons.tcx=document.getElementById("exportTcxButton"),B.exportButtons.rawJson=document.getElementById("exportRawJsonButton"),B.exportButtons.rawCsv=document.getElementById("exportRawCsvButton"),B.exportButtons.image=document.getElementById("exportImageButton"),B.exportButtons.clearSession=document.getElementById("clearSessionButton"),B.exportButtons.googleDocs=document.getElementById("exportGoogleDocsButton"),B.exportButtons.googleSheets=document.getElementById("exportGoogleSheetsButton"),B.exportButtons.googleAuth=document.getElementById("googleAuthButton"),B.exportButtons.configureGoogleApi=document.getElementById("configureGoogleApiButton"),B.exportButtons.intervals=document.getElementById("exportIntervalsButton"),B.exportButtons.configureIntervals=document.getElementById("configureIntervalsButton"),B.connectSection=document.getElementById("connectSection"),B.exportSection=document.getElementById("exportSection"),B.powerAveragesSection=document.getElementById("powerAveragesSection"),B.hamburgerBtn=document.getElementById("hamburgerButton"),B.menuDropdown=document.getElementById("menuDropdown"),B.powerAveragesToggle=document.getElementById("powerAveragesToggle"),B.powerMetricToggle=document.getElementById("powerMetricToggle"),B.heartRateMetricToggle=document.getElementById("heartRateMetricToggle"),B.cadenceMetricToggle=document.getElementById("cadenceMetricToggle"),B.connectSectionToggle=document.getElementById("connectSectionToggle"),B.exportSectionToggle=document.getElementById("exportSectionToggle"),B.showInfoMenuItem=document.getElementById("showInfoMenuItem"),B.showQrCodeMenuItem=document.getElementById("showQrCodeMenuItem"),B.spyModeToggle=document.getElementById("spyModeToggle"),B.powerCard=document.querySelector(".power-card"),B.heartRateCard=document.querySelector(".hr-card"),B.cadenceCard=document.querySelector(".cadence-card"),B.spyCard=document.querySelector(".spy-card"),B.spyModeSection=document.getElementById("spyModeSection"),B.spyValueElement=document.getElementById("spy-value"),B.spyStatusElement=document.getElementById("spyStatus"),B.spyInstructionsElement=document.getElementById("spyInstructions"),B.hrConnectionStatus&&(B.hrConnectionStatus.textContent="Disconnected"),B.cadenceConnectionStatus&&(B.cadenceConnectionStatus.textContent="Disconnected"),e=document.getElementById("avg10s-current"),t=document.getElementById("avg10s-best"),n=document.getElementById("avg20s-current"),o=document.getElementById("avg20s-best"),a=document.getElementById("avg30s-current"),r=document.getElementById("avg30s-best"),i=document.getElementById("avg40s-current"),l=document.getElementById("avg40s-best"),s=document.getElementById("avg50s-current"),c=document.getElementById("avg50s-best"),d=document.getElementById("avg1m-current"),u=document.getElementById("avg1m-best"),g=document.getElementById("avg2m-current"),m=document.getElementById("avg2m-best"),p=document.getElementById("avg3m-current"),h=document.getElementById("avg3m-best"),f=document.getElementById("avg4m-current"),y=document.getElementById("avg4m-best"),w=document.getElementById("avg5m-current"),v=document.getElementById("avg5m-best"),B.connectSection&&(B.connectSection.style.display="block",B.connectSection.querySelectorAll("button:not(.section-toggle-button)").forEach(e=>e.style.display="block")),B.exportSection&&(B.exportSection.style.display="block"),B.powerAveragesSection&&(B.powerAveragesSection.style.display="none");let D=document.querySelector(".dashboard"),L=document.getElementById("powerAveragesSection"),P=L&&"none"===L.style.display;D&&(P?D.classList.add("maximized"):D.classList.remove("maximized")),ef(),function(e){if(!e.hamburgerBtn||!e.menuDropdown)return console.error("Hamburger menu elements not found:",{hamburgerBtn:!!e.hamburgerBtn,menuDropdown:!!e.menuDropdown});e.hamburgerBtn.addEventListener("click",function(){e.menuDropdown.classList.contains("active")?e.menuDropdown.classList.remove("active"):e.menuDropdown.classList.add("active")}),document.addEventListener("click",function(t){t.target.closest(".hamburger-menu")||e.menuDropdown.classList.remove("active")})}(B),function(e){if(!e.powerAveragesToggle||!e.powerAveragesSection)return console.error("Power averages toggle elements not found:",{powerAveragesToggle:!!e.powerAveragesToggle,powerAveragesSection:!!e.powerAveragesSection});let t=!1;e.powerAveragesToggle.addEventListener("click",function(){(t=!t)?(e.powerAveragesSection.style.display="block",e.powerAveragesToggle.classList.add("active")):(e.powerAveragesSection.style.display="none",e.powerAveragesToggle.classList.remove("active")),ef()})}(B);if(B.powerMetricToggle&&B.powerCard){let e=!0;B.powerMetricToggle.classList.add("active"),B.powerMetricToggle.addEventListener("click",function(){(e=!e)?(B.powerCard.style.display="block",B.powerMetricToggle.classList.add("active")):(B.powerCard.style.display="none",B.powerMetricToggle.classList.remove("active"))})}else console.error("Power metric toggle elements not found");if(B.heartRateMetricToggle&&B.heartRateCard){let e=!0;B.heartRateMetricToggle.classList.add("active"),B.heartRateMetricToggle.addEventListener("click",function(){(e=!e)?(B.heartRateCard.style.display="block",B.heartRateMetricToggle.classList.add("active")):(B.heartRateCard.style.display="none",B.heartRateMetricToggle.classList.remove("active"))})}else console.error("Heart rate metric toggle elements not found");if(B.cadenceMetricToggle&&B.cadenceCard){let e=!0;B.cadenceMetricToggle.classList.add("active"),B.cadenceMetricToggle.addEventListener("click",function(){(e=!e)?(B.cadenceCard.style.display="block",B.cadenceMetricToggle.classList.add("active")):(B.cadenceCard.style.display="none",B.cadenceMetricToggle.classList.remove("active"))})}else console.error("Cadence metric toggle elements not found");if(B.connectSectionToggle&&B.connectSection){let e=!0;B.connectSectionToggle.classList.add("active"),B.connectSection.style.display="block",B.connectSectionToggle.addEventListener("click",function(){console.log("Toggling connect section, now visible:",e=!e),e?(B.connectSection.style.display="block",B.connectSectionToggle.classList.add("active")):(B.connectSection.style.display="none",B.connectSectionToggle.classList.remove("active"))})}else console.error("Connect section toggle elements not found");if(B.exportSectionToggle&&B.exportSection){let e=!1;B.exportSectionToggle.addEventListener("click",function(){(e=!e)?(B.exportSection.style.display="block",B.exportSectionToggle.classList.add("active")):(B.exportSection.style.display="none",B.exportSectionToggle.classList.remove("active"))})}else console.error("Export section toggle elements not found");!function(e,t){if(!e.spyModeToggle||!e.spyModeSection)return console.error("Spy mode toggle elements not found");let n=!1;e.spyModeToggle.addEventListener("click",function(){(n=!n)?(e.spyModeSection.style.display="block",e.spyModeToggle.classList.add("active")):(e.spyModeSection.style.display="none",e.spyModeToggle.classList.remove("active"),t(),e.spyValueElement&&(e.spyValueElement.textContent="--"),e.spyStatusElement&&(e.spyStatusElement.style.display="none")),e.spyInstructionsElement&&(e.spyInstructionsElement.style.display="block")})}(B,()=>W(B)),B.showInfoMenuItem?B.showInfoMenuItem.addEventListener("click",function(){!function(){let e=document.createElement("div");e.className="modal-backdrop",e.style.cssText=`
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
    `;let t=document.createElement("div");t.className="modal",t.style.cssText=`
        background: #1a1a2e;
        border-radius: 12px;
        padding: 2rem;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        margin: 20px;
        border: 1px solid rgba(255, 255, 255, 0.2);
    `,t.innerHTML=`
        <div style="text-align: center; margin-bottom: 1.5rem;">
            <h2 style="color: #3498db; margin: 0 0 0.5rem 0; font-size: 1.8rem;">\u{1F6B4} Web Bluetooth Power Meter</h2>
            <p style="color: #cccccc; margin: 0; font-size: 1rem;">Real-time cycling data analysis</p>
        </div>

        <div style="color: #ffffff; line-height: 1.6;">
            <h3 style="color: #f39c12; margin: 1.5rem 0 1rem 0;">\u{1F4F1} What is this app?</h3>
            <p style="margin-bottom: 1rem;">
                This is a web-based power meter application that connects to Bluetooth cycling devices 
                to provide real-time power, heart rate, and cadence data analysis. Perfect for indoor 
                training, data logging, and performance tracking.
            </p>

            <h3 style="color: #f39c12; margin: 1.5rem 0 1rem 0;">\u{1F517} How to connect devices:</h3>
            <ol style="margin-bottom: 1rem; padding-left: 1.5rem;">
                <li><strong>Power Meter:</strong> Click "Connect Power Meter" and select your cycling power device</li>
                <li><strong>Heart Rate:</strong> Click "Connect Heart Rate" to pair your HR monitor</li>
                <li><strong>Cadence:</strong> Click "Connect Cadence" for speed/cadence sensors</li>
            </ol>

            <h3 style="color: #f39c12; margin: 1.5rem 0 1rem 0;">\u{1F4CA} Features:</h3>
            <ul style="margin-bottom: 1rem; padding-left: 1.5rem;">
                <li><strong>Real-time Metrics:</strong> Live power, heart rate, and cadence display</li>
                <li><strong>Power Averages:</strong> 10s, 20s, 30s, 40s, 50s, 1m, 2m, 3m, 4m, and 5m rolling averages</li>
                <li><strong>Data Export:</strong> JSON, CSV, TCX, and visual summary image formats</li>
                <li><strong>Session Persistence:</strong> Data automatically saved and restored</li>
                <li><strong>Custom Dashboard:</strong> Toggle metrics and sections via hamburger menu</li>
            </ul>

            <h3 style="color: #f39c12; margin: 1.5rem 0 1rem 0;">\u{2699}\u{FE0F} Using the hamburger menu:</h3>
            <ul style="margin-bottom: 1rem; padding-left: 1.5rem;">
                <li><strong>Toggle Sections:</strong> Show/hide different parts of the interface</li>
                <li><strong>Load Debug Data:</strong> Generate 1000 test data points for testing</li>
                <li><strong>Customize View:</strong> Control which metrics are visible</li>
            </ul>

            <h3 style="color: #f39c12; margin: 1.5rem 0 1rem 0;">\u{1F310} Browser Support:</h3>
            <p style="margin-bottom: 1rem;">
                Requires a browser with Web Bluetooth support:
                <br>\u{2022} Chrome 56+ \u{2022} Edge 79+ \u{2022} Opera 43+
            </p>

            <h3 style="color: #f39c12; margin: 1.5rem 0 1rem 0;">\u{1F4A1} Tips:</h3>
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
    `,e.appendChild(t),document.body.appendChild(e);let n=t.querySelector("#closeInfoModal"),o=()=>{document.body.removeChild(e)};n.addEventListener("click",o),e.addEventListener("click",t=>{t.target===e&&o()});let a=e=>{"Escape"===e.key&&(o(),document.removeEventListener("keydown",a))};document.addEventListener("keydown",a),n.addEventListener("mouseenter",()=>{n.style.transform="translateY(-2px)",n.style.boxShadow="0 8px 24px rgba(52, 152, 219, 0.4)"}),n.addEventListener("mouseleave",()=>{n.style.transform="translateY(0)",n.style.boxShadow="none"})}(),B.menuDropdown&&B.menuDropdown.classList.remove("active")}):console.error("Show info menu item not found"),B.showQrCodeMenuItem?B.showQrCodeMenuItem.addEventListener("click",function(){!function(){let e="https://colscoding.github.io/power-saver/",t=document.createElement("div");t.className="modal-backdrop",t.style.cssText=`
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
    `;let n=document.createElement("div");n.className="modal",n.style.cssText=`
        background: #1a1a2e;
        border-radius: 12px;
        padding: 2rem;
        max-width: 400px;
        max-height: 80vh;
        overflow-y: auto;
        margin: 20px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        text-align: center;
    `;let o=document.createElement("canvas");o.width=256,o.height=256,o.style.cssText=`
        background: white;
        border-radius: 8px;
        margin: 1rem 0;
        max-width: 100%;
        height: auto;
    `,function(e,t){let n=e.getContext("2d"),o=e.width;n.fillStyle="#ffffff",n.fillRect(0,0,o,o);let a=`https://api.qrserver.com/v1/create-qr-code/?size=${o}x${o}&data=${encodeURIComponent(t)}`,r=new Image;r.crossOrigin="anonymous",r.onload=function(){n.drawImage(r,0,0,o,o)},r.onerror=function(){var e=n,t=o;e.fillStyle="#000000",e.font="12px Arial",e.textAlign="center";let a=t/25;for(let t=0;t<25;t++)for(let n=0;n<25;n++)((t+n)%3==0||0===t||24===t||0===n||24===n)&&e.fillRect(t*a,n*a,a,a);e.fillStyle="#ffffff",e.fillRect(.2*t,.4*t,.6*t,.2*t),e.fillStyle="#000000",e.fillText("QR Code",t/2,t/2-10),e.fillText("Unavailable",t/2,t/2+10)},r.src=a}(o,e),n.innerHTML=`
        <div style="margin-bottom: 1.5rem;">
            <h2 style="color: #9b59b6; margin: 0 0 0.5rem 0; font-size: 1.8rem;">\u{1F4F1} Share Power Meter App</h2>
            <p style="color: #cccccc; margin: 0; font-size: 1rem;">Scan to access the app on any device</p>
        </div>
        
        <div id="qr-container" style="margin: 1.5rem 0;"></div>
        
        <div style="margin: 1.5rem 0;">
            <p style="color: #ffffff; margin: 0 0 0.5rem 0; font-weight: 600;">Or visit directly:</p>
            <a href="${e}" target="_blank" style="
                color: #9b59b6; 
                text-decoration: none; 
                font-size: 0.9rem;
                word-break: break-all;
                line-height: 1.4;
            ">${e}</a>
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
    `,n.querySelector("#qr-container").appendChild(o),t.appendChild(n),document.body.appendChild(t);let a=n.querySelector("#closeQrModal"),r=()=>{document.body.removeChild(t)};a.addEventListener("click",r),t.addEventListener("click",e=>{e.target===t&&r()});let i=e=>{"Escape"===e.key&&(r(),document.removeEventListener("keydown",i))};document.addEventListener("keydown",i),a.addEventListener("mouseenter",()=>{a.style.transform="translateY(-2px)",a.style.boxShadow="0 8px 24px rgba(155, 89, 182, 0.4)"}),a.addEventListener("mouseleave",()=>{a.style.transform="translateY(0)",a.style.boxShadow="none"})}(),B.menuDropdown&&B.menuDropdown.classList.remove("active")}):console.error("Show QR code menu item not found"),B.powerMeterConnectButton&&B.powerMeterConnectButton.addEventListener("click",async()=>{ey.length=0,ew.length=0,eS=0,T(),eI&&clearInterval(eI),await U(eB,B)&&(eC||(eC=Date.now()),eI=setInterval(()=>{ey.push({timestamp:Date.now(),power:eS,heartRate:eb,cadence:eE}),ey.length%100==0&&S(eT)},100))}),B.hrConnectButton&&B.hrConnectButton.addEventListener("click",async()=>{await H(eA,B)}),B.speedCadenceConnectButton&&B.speedCadenceConnectButton.addEventListener("click",async()=>{await q(eD,B)}),B.spyCard&&B.spyCard.addEventListener("click",async()=>{N&&N.gatt.connected?W(B):await z({},B)});let{elements:k}=eT;k.exportButtons.json&&k.exportButtons.json.addEventListener("click",()=>{var e=eT.powerData;if(!e||!Array.isArray(e)||0===e.length)throw Error("No valid power data available to export as JSON");en(new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),`power_data_${M()}.json`)}),k.exportButtons.csv&&k.exportButtons.csv.addEventListener("click",()=>{var e=eT.powerData;if(!e||!Array.isArray(e)||0===e.length)throw Error("No valid power data available to export as CSV");let t="timestamp,power,heartRate,cadence\n";e.forEach(e=>{let n=e.timestamp||"",o=e.power||0,a=e.heartRate||0,r=e.cadence||0;t+=`${n},${o},${a},${r}
`}),en(new Blob([t],{type:"text/csv;charset=utf-8;"}),`power_data_${M()}.csv`)}),k.exportButtons.rawJson&&k.exportButtons.rawJson.addEventListener("click",()=>{en(new Blob([JSON.stringify(eT.rawPowerMeasurements,null,2)],{type:"application/json"}),`raw_power_measurements_${M()}.json`)}),k.exportButtons.rawCsv&&k.exportButtons.rawCsv.addEventListener("click",()=>{var e;let t;e=eT.rawPowerMeasurements,t="timestamp,flags,dataLength,instantaneousPower,rawBytes\n",e.forEach(e=>{t+=`${e.timestamp},${e.flags},${e.dataLength},${e.instantaneousPower},"${e.rawBytes}"
`}),en(new Blob([t],{type:"text/csv;charset=utf-8;"}),`raw_power_measurements_${M()}.csv`)}),k.exportButtons.tcx&&k.exportButtons.tcx.addEventListener("click",()=>{try{var e=eT.powerData;try{if(0===e.length)throw Error("No power data available to export.");let t=function(e){if(!Array.isArray(e)||0===e.length)return"";let t=e.filter(e=>e&&"object"==typeof e&&void 0!==e.timestamp&&!isNaN(new Date(e.timestamp).getTime()));if(0===t.length)return"";let n=t.map(e=>({time:e.timestamp,...void 0!==e.power&&{power:e.power},...void 0!==e.heartRate&&{heartRate:e.heartRate},...void 0!==e.cadence&&{cadence:e.cadence}})).sort((e,t)=>e.time-t.time),o=e=>!e.power||e.power<=0;for(;n.length>0&&o(n[0]);)n.shift();for(;n.length>0&&o(n[n.length-1]);)n.pop();if(0===n.length)return"";let a=n.map(Y).join("\n"),r=new Date(n[0].time).toISOString();return`<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase
  xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd"
  xmlns:ns2="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
  <Activities>
    <Activity Sport="Biking">
      <Id>${r}</Id>
      <Name>E Bike Indoor Cycling Trainer</Name>
      <Lap StartTime="${r}">
        <Track>
        ${a}
        </Track>
      </Lap>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`}(e),n=new Blob([t],{type:"application/xml;charset=utf-8;"});en(n,`power_data_${M()}.tcx`)}catch(e){throw console.error("Error generating TCX:",e),e}}catch(e){alert(`Error generating TCX file: ${e.message}`)}}),k.exportButtons.image&&k.exportButtons.image.addEventListener("click",async()=>{try{await et({dataPoints:eT.powerData,powerAverages:eT.getPowerAverages()})}catch(e){alert(`Error generating summary image: ${e.message}`)}}),k.exportButtons.clearSession&&k.exportButtons.clearSession.addEventListener("click",()=>{confirm("Are you sure you want to clear all session data? This action cannot be undone.")&&(eT.resetAllSessionData(),alert("Session data cleared successfully!"))}),k.exportButtons.googleDocs&&k.exportButtons.googleDocs.addEventListener("click",async()=>{try{await ed({powerData:eT.powerData,powerAverages:eT.getPowerAverages(),sessionStartTime:eT.sessionStartTime})}catch(e){alert(`Error exporting to Google Docs: ${e.message}`)}}),k.exportButtons.googleSheets&&k.exportButtons.googleSheets.addEventListener("click",async()=>{try{await eu({powerData:eT.powerData,rawMeasurements:eT.rawPowerMeasurements,sessionStartTime:eT.sessionStartTime})}catch(e){alert(`Error exporting to Google Sheets: ${e.message}`)}}),k.exportButtons.googleAuth&&k.exportButtons.googleAuth.addEventListener("click",async()=>{try{if(ee.isUserSignedIn)await er(),ep(k.exportButtons.googleAuth,!1);else{let e=await ea();ep(k.exportButtons.googleAuth,e)}}catch(e){alert(`Google authentication error: ${e.message}`)}}),k.exportButtons.configureGoogleApi&&k.exportButtons.configureGoogleApi.addEventListener("click",()=>{let e=document.createElement("div");e.className="modal-backdrop",e.style.cssText=`
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;let t=document.createElement("div");t.className="config-modal",t.style.cssText=`
        background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
        border-radius: 12px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        color: white;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
    `;let n=localStorage.getItem("google_client_id")||"",o=localStorage.getItem("google_api_key")||"";t.innerHTML=`
        <h3 style="margin: 0 0 1.5rem 0; color: #4CAF50;">Google API Configuration</h3>
        <p style="margin-bottom: 1.5rem; color: #ccc; line-height: 1.5;">
            To enable cloud exports, you need to configure Google API credentials. 
            <a href="https://console.developers.google.com/" target="_blank" style="color: #4CAF50;">
                Get credentials from Google Cloud Console
            </a>
        </p>
        
        <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: #ddd; font-weight: 500;">
                Google Client ID:
            </label>
            <input type="text" id="clientIdInput" value="${n}" 
                   style="width: 100%; padding: 0.75rem; border: 1px solid #555; border-radius: 6px; 
                          background: #333; color: white; font-size: 0.9rem;" 
                   placeholder="your-client-id.googleusercontent.com">
        </div>
        
        <div style="margin-bottom: 2rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: #ddd; font-weight: 500;">
                Google API Key:
            </label>
            <input type="text" id="apiKeyInput" value="${o}" 
                   style="width: 100%; padding: 0.75rem; border: 1px solid #555; border-radius: 6px; 
                          background: #333; color: white; font-size: 0.9rem;" 
                   placeholder="your-api-key">
        </div>
        
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
            <button id="cancelConfig" style="padding: 0.75rem 1.5rem; border: 1px solid #666; 
                                           background: transparent; color: white; border-radius: 6px; 
                                           cursor: pointer; transition: all 0.3s ease;">
                Cancel
            </button>
            <button id="saveConfig" style="padding: 0.75rem 1.5rem; border: none; 
                                         background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%); 
                                         color: white; border-radius: 6px; cursor: pointer; 
                                         transition: all 0.3s ease; font-weight: 500;">
                Save & Reload
            </button>
        </div>
    `,e.appendChild(t),document.body.appendChild(e),t.querySelector("#cancelConfig").addEventListener("click",()=>{document.body.removeChild(e)}),t.querySelector("#saveConfig").addEventListener("click",()=>{let n=t.querySelector("#clientIdInput").value.trim(),o=t.querySelector("#apiKeyInput").value.trim();n&&o?(localStorage.setItem("google_client_id",n),localStorage.setItem("google_api_key",o),document.body.removeChild(e),alert("Google API credentials saved successfully! The page will reload to apply changes."),window.location.reload()):alert("Please enter both Client ID and API Key.")}),e.addEventListener("click",t=>{t.target===e&&document.body.removeChild(e)}),setTimeout(()=>{t.querySelector("#clientIdInput").focus()},100)}),k.exportButtons.intervals&&k.exportButtons.intervals.addEventListener("click",async()=>{try{await es({powerData:eT.powerData,powerAverages:eT.getPowerAverages(),sessionStartTime:eT.sessionStartTime}),alert("Successfully exported to intervals.icu!")}catch(e){alert(`Error exporting to intervals.icu: ${e.message}`)}}),k.exportButtons.configureIntervals&&k.exportButtons.configureIntervals.addEventListener("click",()=>{let e=document.createElement("div");e.className="modal-backdrop",e.style.cssText=`
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;let t=document.createElement("div");t.className="config-modal",t.style.cssText=`
        background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
        border-radius: 12px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        color: white;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
    `;let n=localStorage.getItem("intervals_api_key")||"",o=localStorage.getItem("intervals_athlete_id")||"";t.innerHTML=`
        <h3 style="margin: 0 0 1.5rem 0; color: #FF6B35;">intervals.icu Configuration</h3>
        <p style="margin-bottom: 1.5rem; color: #ccc; line-height: 1.5;">
            Configure your intervals.icu credentials to export activities directly. 
            <a href="https://intervals.icu/settings" target="_blank" style="color: #FF6B35;">
                Get your API key from intervals.icu settings
            </a>
        </p>
        
        <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: #ddd; font-weight: 500;">
                API Key:
            </label>
            <input type="text" id="intervalsApiKeyInput" value="${n}" 
                   style="width: 100%; padding: 0.75rem; border: 1px solid #555; border-radius: 6px; 
                          background: #333; color: white; font-size: 0.9rem;" 
                   placeholder="your-intervals-api-key">
            <small style="color: #aaa; font-size: 0.8rem;">
                Found in intervals.icu \u{2192} Settings \u{2192} Developer
            </small>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: #ddd; font-weight: 500;">
                Athlete ID:
            </label>
            <input type="text" id="intervalsAthleteIdInput" value="${o}" 
                   style="width: 100%; padding: 0.75rem; border: 1px solid #555; border-radius: 6px; 
                          background: #333; color: white; font-size: 0.9rem;" 
                   placeholder="i123456">
            <small style="color: #aaa; font-size: 0.8rem;">
                Your athlete ID (usually starts with 'i' followed by numbers)
            </small>
        </div>
        
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
            <button id="cancelIntervalsConfig" style="padding: 0.75rem 1.5rem; border: 1px solid #666; 
                                                    background: transparent; color: white; border-radius: 6px; 
                                                    cursor: pointer; transition: all 0.3s ease;">
                Cancel
            </button>
            <button id="saveIntervalsConfig" style="padding: 0.75rem 1.5rem; border: none; 
                                                   background: linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%); 
                                                   color: white; border-radius: 6px; cursor: pointer; 
                                                   transition: all 0.3s ease; font-weight: 500;">
                Save & Test
            </button>
        </div>
    `,e.appendChild(t),document.body.appendChild(e),t.querySelector("#cancelIntervalsConfig").addEventListener("click",()=>{document.body.removeChild(e)}),t.querySelector("#saveIntervalsConfig").addEventListener("click",async()=>{let n=t.querySelector("#intervalsApiKeyInput").value.trim(),o=t.querySelector("#intervalsAthleteIdInput").value.trim();if(n&&o)try{let t=await eh(n,o);t.success?(localStorage.setItem("intervals_api_key",n),localStorage.setItem("intervals_athlete_id",o),ei(n,o),document.body.removeChild(e),alert(`intervals.icu configured successfully!\\nAthlete: ${t.athleteName||o}`)):alert(`Configuration test failed: ${t.error}`)}catch(e){alert(`Error testing configuration: ${e.message}`)}else alert("Please enter both API Key and Athlete ID.")}),e.addEventListener("click",t=>{t.target===e&&document.body.removeChild(e)}),setTimeout(()=>{t.querySelector("#intervalsApiKeyInput").focus()},100)}),await eM();let $=function(){try{let e=localStorage.getItem(x);if(!e)return null;let t=JSON.parse(e);if(Date.now()-t.timestamp>864e5)return localStorage.removeItem(x),null;return t}catch(e){return console.warn("Failed to load session data:",e),localStorage.removeItem(x),null}}();$&&await new Promise(e=>{let t=document.createElement("div");t.className="modal-backdrop";let n=document.createElement("div");n.className="modal";let o=Math.round((Date.now()-$.timestamp)/6e4),a=($.powerData?.length||0)+($.heartData?.length||0)+($.cadenceData?.length||0);n.innerHTML=`
      <h3>Previous Session Found</h3>
      <p>
        A previous session was found from ${o} minutes ago with ${a} data points.
      </p>
      <p>
        Would you like to restore this session or start fresh?
      </p>
      <div class="modal-buttons">
        <button id="startFresh" class="modal-button secondary">Start Fresh</button>
        <button id="restoreSession" class="modal-button primary">Restore Session</button>
      </div>
    `,t.appendChild(n),document.body.appendChild(t),n.querySelector("#startFresh").addEventListener("click",()=>{document.body.removeChild(t),b(),e(!1)}),n.querySelector("#restoreSession").addEventListener("click",()=>{document.body.removeChild(t),e(!0)}),t.addEventListener("click",n=>{n.target===t&&(document.body.removeChild(t),e(!1))})})?function(e){try{var t,n;e.powerData&&(ey.length=0,ey.push(...e.powerData)),e.heartData&&(ev.length=0,ev.push(...e.heartData)),e.cadenceData&&(ex.length=0,ex.push(...e.cadenceData)),e.rawPowerMeasurements&&(ew.length=0,ew.push(...e.rawPowerMeasurements)),e.powerReadings&&(E=[...e.powerReadings]),e.powerAverages&&(t=e.powerAverages,Object.assign(C,t),I()),void 0!==e.lastPowerValue&&(eS=e.lastPowerValue),void 0!==e.lastHeartRateValue&&(eb=e.lastHeartRateValue),void 0!==e.lastCadenceValue&&(eE=e.lastCadenceValue),void 0!==e.sessionStartTime&&(eC=e.sessionStartTime),void 0!==(n={power:eS,heartRate:eb,cadence:eE}).power&&A(n.power),void 0!==n.heartRate&&B.hrValueElement&&(B.hrValueElement.textContent=n.heartRate||"--"),void 0!==n.cadence&&B.cadenceValueElement&&(B.cadenceValueElement.textContent=n.cadence||"--"),I(),ey.length>0&&function(e){let t=document.createElement("div");t.style.cssText=`
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
  `,t.textContent=`Session restored! ${e} data points recovered.`;let n=document.createElement("style");n.textContent=`
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `,document.head.appendChild(n),document.body.appendChild(t),setTimeout(()=>{t.style.animation="slideIn 0.3s ease-out reverse",setTimeout(()=>{t.parentNode&&t.parentNode.removeChild(t),n.parentNode&&n.parentNode.removeChild(n)},300)},5e3)}(ey.length)}catch(e){return console.warn("Failed to restore session data:",e),!1}}($):eC=Date.now(),window.addEventListener("beforeunload",function(){ey.length>0&&S(eT)}),setInterval(()=>{ey.length>0&&S(eT)},3e4)}document.addEventListener("DOMContentLoaded",e$);
//# sourceMappingURL=power-saver.f0b88fe2.js.map
