let e,t,n,a,r,o,i,l,s,c,d,u,m,g,p,h,f,y,v,w;const x="powerMeterSession";function b(e){try{let t={timestamp:Date.now(),powerData:e.powerData,heartData:e.heartData,cadenceData:e.cadenceData,rawPowerMeasurements:e.rawPowerMeasurements,powerReadings:e.getPowerReadings(),powerAverages:e.getPowerAverages(),lastPowerValue:e.lastPowerValue,lastHeartRateValue:e.lastHeartRateValue,lastCadenceValue:e.lastCadenceValue,sessionStartTime:e.sessionStartTime};localStorage.setItem(x,JSON.stringify(t))}catch(e){console.warn("Failed to save session data:",e)}}function S(){localStorage.removeItem(x)}let C=[],E={"10s":{current:0,best:0},"20s":{current:0,best:0},"30s":{current:0,best:0},"40s":{current:0,best:0},"50s":{current:0,best:0},"1m":{current:0,best:0},"2m":{current:0,best:0},"3m":{current:0,best:0},"4m":{current:0,best:0},"5m":{current:0,best:0}};function T(){e&&(e.textContent=E["10s"].current||"--",t.textContent=E["10s"].best||"--",n.textContent=E["20s"].current||"--",a.textContent=E["20s"].best||"--",r.textContent=E["30s"].current||"--",o.textContent=E["30s"].best||"--",i.textContent=E["40s"].current||"--",l.textContent=E["40s"].best||"--",s.textContent=E["50s"].current||"--",c.textContent=E["50s"].best||"--",d.textContent=E["1m"].current||"--",u.textContent=E["1m"].best||"--",m.textContent=E["2m"].current||"--",g.textContent=E["2m"].best||"--",p.textContent=E["3m"].current||"--",h.textContent=E["3m"].best||"--",f.textContent=E["4m"].current||"--",y.textContent=E["4m"].best||"--",v.textContent=E["5m"].current||"--",w.textContent=E["5m"].best||"--")}function I(){for(let e of(C=[],Object.keys(E)))E[e].current=0,E[e].best=0;T()}const D={powerValueElement:null,hrValueElement:null,cadenceValueElement:null,deviceNameElement:null,hrDeviceName:null,cadenceDeviceName:null,statusText:null,hrStatusText:null,cadenceStatusText:null,hrConnectionStatus:null,cadenceConnectionStatus:null,powerMeterConnectButton:null,hrConnectButton:null,speedCadenceConnectButton:null,exportButtons:{json:null,csv:null,tcx:null,rawJson:null,rawCsv:null,image:null,clearSession:null,googleDocs:null,googleSheets:null,googleAuth:null,configureGoogleApi:null,intervals:null,configureIntervals:null},powerAveragesSection:null,hamburgerBtn:null,menuDropdown:null,powerAveragesToggle:null,powerMetricToggle:null,heartRateMetricToggle:null,cadenceMetricToggle:null,showInfoMenuItem:null,showQrCodeMenuItem:null,spyModeToggle:null,powerCard:null,heartRateCard:null,cadenceCard:null,spyCard:null,spyModeSection:null,spyValueElement:null,spyStatusElement:null,spyInstructionsElement:null};function M(e){if(!D.powerValueElement)return;let t=e||"--";D.powerValueElement.textContent=t,D.powerValueElement.setAttribute("data-value",t)}function A(){M("--"),D.hrValueElement&&(D.hrValueElement.textContent="--"),D.cadenceValueElement&&(D.cadenceValueElement.textContent="--")}function k(){let e=new Date,t=e.getFullYear(),n=String(e.getMonth()+1).padStart(2,"0"),a=String(e.getDate()).padStart(2,"0");return`${t}-${n}-${a}`}async function B(){if("wakeLock"in navigator)try{(await navigator.wakeLock.request("screen")).addEventListener("release",()=>{console.log("Wake lock was released")})}catch(e){console.error(`${e.name}, ${e.message}`)}}const P="cycling_power",L="cycling_power_measurement",$="cycling_speed_and_cadence";let R=null,N=null,U=null,V=null,F=0,_=0,H=null;async function q(e,t){if(await B(),!navigator.bluetooth)return void e.onStatusUpdate("Web Bluetooth API is not available.");try{e.onStatusUpdate("Scanning for power meters..."),R=await navigator.bluetooth.requestDevice({filters:[{services:[P]}]}),e.onStatusUpdate("Connecting to device..."),t.deviceNameElement&&(t.deviceNameElement.textContent=`Device: ${R.name||"Unknown Device"}`),R.addEventListener("gattserverdisconnected",()=>{j(e,t)});let n=await R.gatt.connect(),a=await n.getPrimaryService(P),r=await a.getCharacteristic(L);try{let e=await a.getCharacteristic("cycling_power_feature");await e.readValue()}catch{}return await r.startNotifications(),r.addEventListener("characteristicvaluechanged",t=>{var n=t,a=e;let r=n.target.value,o={timestamp:Date.now(),flags:r.getUint16(0,!0),rawBytes:Array.from(new Uint8Array(r.buffer)).map(e=>e.toString(16).padStart(2,"0")).join(" "),dataLength:r.byteLength};r.getUint16(0,!0);let i=r.getInt16(2,!0);o.instantaneousPower=i,a.onPowerMeasurement(i,o)}),e.onStatusUpdate("Connected and receiving data!"),t.powerMeterConnectButton&&(t.powerMeterConnectButton.disabled=!0),!0}catch(n){return e.onStatusUpdate(`Error: ${n.message}`),console.error("Connection failed:",n),R&&R.removeEventListener("gattserverdisconnected",()=>{j(e,t)}),!1}}async function G(e,t){if(await B(),!navigator.bluetooth)return void e.onStatusUpdate("Web Bluetooth API is not available.");try{e.onStatusUpdate("Scanning for devices..."),t.hrConnectionStatus&&(t.hrConnectionStatus.textContent="Connecting..."),N=await navigator.bluetooth.requestDevice({filters:[{services:["heart_rate"]}]}),e.onStatusUpdate("Connecting to device..."),t.hrDeviceName&&(t.hrDeviceName.textContent=`Device: ${N.name}`),N.addEventListener("gattserverdisconnected",()=>{var n,a;n=e,a=t,n.onStatusUpdate("Device disconnected."),a.hrConnectionStatus&&(a.hrConnectionStatus.textContent="Disconnected"),a.hrDeviceName&&(a.hrDeviceName.textContent=""),a.hrConnectButton&&(a.hrConnectButton.disabled=!1),N=null,n.onHeartRateChange(0)});let n=await N.gatt.connect(),a=await n.getPrimaryService("heart_rate"),r=await a.getCharacteristic("heart_rate_measurement");return await r.startNotifications(),r.addEventListener("characteristicvaluechanged",t=>{var n=t,a=e;let r=function(e){let t=e.getUint8(0);return 1&t?e.getUint16(1,!0):e.getUint8(1)}(n.target.value);a.onHeartRateChange(r)}),e.onStatusUpdate("Connected!"),t.hrConnectionStatus&&(t.hrConnectionStatus.textContent="Connected"),t.hrConnectButton&&(t.hrConnectButton.disabled=!0),!0}catch(n){return e.onStatusUpdate(`Error: ${n.message}`),t.hrConnectionStatus&&(t.hrConnectionStatus.textContent="Connection Failed"),console.error("Connection failed:",n),!1}}async function W(e,t){if(await B(),!navigator.bluetooth)return void e.onStatusUpdate("Web Bluetooth API is not available.");try{e.onStatusUpdate("Scanning for sensors..."),t.cadenceConnectionStatus&&(t.cadenceConnectionStatus.textContent="Connecting..."),H&&(clearTimeout(H),H=null),F=0,_=0,U=await navigator.bluetooth.requestDevice({filters:[{services:[$]}]}),e.onStatusUpdate("Connecting to device..."),t.cadenceDeviceName&&(t.cadenceDeviceName.textContent=`Device: ${U.name}`),U.addEventListener("gattserverdisconnected",()=>{var n,a;n=e,a=t,n.onStatusUpdate("Device disconnected."),a.cadenceConnectionStatus&&(a.cadenceConnectionStatus.textContent="Disconnected"),a.cadenceDeviceName&&(a.cadenceDeviceName.textContent=""),a.speedCadenceConnectButton&&(a.speedCadenceConnectButton.disabled=!1),U=null,n.onCadenceChange(0),H&&(clearTimeout(H),H=null),F=0,_=0});let n=await U.gatt.connect(),a=await n.getPrimaryService($),r=await a.getCharacteristic("csc_measurement");return await r.startNotifications(),r.addEventListener("characteristicvaluechanged",t=>{!function(e,t){let n=e.target.value,a=n.getUint8(0),r=1;if(1&a&&(r+=6),2&a){let e=n.getUint16(r,!0),a=n.getUint16(r+2,!0);if(F>0){let n=e-F,r=(a-_)/1024;if(r>0){let e=Math.round(n/r*60);t.onCadenceChange(e),H&&clearTimeout(H),H=setTimeout(()=>{t.onCadenceChange(0),H=null},3e3)}}F=e,_=a}}(t,e)}),e.onStatusUpdate("Connected!"),t.cadenceConnectionStatus&&(t.cadenceConnectionStatus.textContent="Connected"),t.speedCadenceConnectButton&&(t.speedCadenceConnectButton.disabled=!0),!0}catch(n){return e.onStatusUpdate(`Error: ${n.message}`),t.cadenceConnectionStatus&&(t.cadenceConnectionStatus.textContent="Connection Failed"),console.error("Speed/Cadence connection failed:",n),!1}}async function O(e,t){if(!navigator.bluetooth)return void console.error("Web Bluetooth API is not available.");try{t.spyInstructionsElement&&(t.spyInstructionsElement.style.display="none"),t.spyStatusElement&&(t.spyStatusElement.textContent="Scanning for spy power meter...",t.spyStatusElement.style.display="block"),V=await navigator.bluetooth.requestDevice({filters:[{services:[P]}]}),t.spyStatusElement&&(t.spyStatusElement.textContent="Connecting to spy device..."),V.addEventListener("gattserverdisconnected",()=>{K(t)});let e=await V.gatt.connect(),n=await e.getPrimaryService(P),a=await n.getCharacteristic(L);return await a.startNotifications(),a.addEventListener("characteristicvaluechanged",e=>{var n=e,a=t;let r=new Uint8Array(n.target.value.buffer),o=0;r.length>=4&&(o=r[2]+(r[3]<<8)),a.spyValueElement&&(a.spyValueElement.textContent=o)}),t.spyStatusElement&&(t.spyStatusElement.textContent="Spy connected!",t.spyStatusElement.style.display="none"),!0}catch(e){return t.spyStatusElement&&(t.spyStatusElement.textContent=`Spy Error: ${e.message}`),console.error("Spy connection failed:",e),V&&(V.removeEventListener("gattserverdisconnected",()=>{K(t)}),V=null),setTimeout(()=>{t.spyStatusElement&&(t.spyStatusElement.style.display="none"),t.spyInstructionsElement&&(t.spyInstructionsElement.style.display="block")},3e3),!1}}function z(e){V&&V.gatt.connected&&V.gatt.disconnect(),V=null,e.spyValueElement&&(e.spyValueElement.textContent="--"),e.spyStatusElement&&(e.spyStatusElement.style.display="none"),e.spyInstructionsElement&&(e.spyInstructionsElement.style.display="block")}function j(e,t){e.onStatusUpdate("Device disconnected."),t.deviceNameElement&&(t.deviceNameElement.textContent=""),t.powerMeterConnectButton&&(t.powerMeterConnectButton.disabled=!1),R&&(R.removeEventListener("gattserverdisconnected",()=>{j(e,t)}),R=null),e.onDisconnected()}function K(e){V=null,e.spyValueElement&&(e.spyValueElement.textContent="--"),e.spyStatusElement&&(e.spyStatusElement.textContent="Spy disconnected",e.spyStatusElement.style.display="block"),setTimeout(()=>{e.spyStatusElement&&(e.spyStatusElement.style.display="none"),e.spyInstructionsElement&&(e.spyInstructionsElement.style.display="block")},3e3)}function X(e){let t={time:e=>`<Time>${new Date(e).toISOString()}</Time>`,heartRate:e=>`
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
`.trim()}async function Y({dataPoints:e,powerAverages:t}){let n=e.filter(e=>void 0!==e.heartRate),a=e.filter(e=>void 0!==e.cadence),r=e.filter(e=>void 0!==e.power),o=document.createElement("canvas"),i=o.getContext("2d"),l=200;Object.values(t).some(e=>e.current>0||e.best>0)&&(l+=200),n.length>0&&n.some(e=>e.heartRate>0)&&(l+=140),a.length>0&&a.some(e=>e.cadence>0)&&(l+=140),r.length>0&&(l+=350),n.length>0&&(l+=350),a.length>0&&(l+=350);let s=Math.max(600,l);o.width=1200,o.height=s,i.fillStyle="#1a1a2e",i.fillRect(0,0,1200,s),i.fillStyle="#ffffff",i.font="bold 36px Arial, sans-serif",i.textAlign="center",i.fillText("Power Meter Summary",600,50),i.font="18px Arial, sans-serif",i.fillStyle="#cccccc";let c=new Date;if(i.fillText(c.toLocaleDateString()+" "+c.toLocaleTimeString(),600,80),r.length>0){let e=Math.round(Math.round((r[r.length-1].timestamp-r[0].timestamp)/1e3)/60);i.fillText(`Session Duration: ${e} minutes`,600,105)}let d=130;if(Object.values(t).some(e=>e.current>0||e.best>0)){i.fillStyle="#ffffff",i.font="bold 24px Arial, sans-serif",i.textAlign="left",i.fillText("Power Averages",50,d),d+=40;let e=[{label:"10s",data:t["10s"]},{label:"30s",data:t["30s"]},{label:"1m",data:t["1m"]},{label:"2m",data:t["2m"]},{label:"4m",data:t["4m"]},{label:"8m",data:t["8m"]}];i.font="16px Arial, sans-serif",i.fillStyle="#cccccc",i.fillText("Duration",70,d),i.fillText("Best",220,d),i.fillText("Duration",470,d),i.fillText("Best",620,d),d+=30;for(let t=0;t<e.length;t++){let n=e[t],a=t<3?70:470,r=d+25*(t<3?t:t-3);i.fillStyle="#ffffff",i.fillText(n.label,a,r),i.fillStyle=n.data.best>0?"#e74c3c":"#666666",i.fillText(n.data.best+"W",a+150,r)}d+=100}if(n.length>0){let e=n.map(e=>e.heartRate).filter(e=>e>0);if(e.length>0){i.fillStyle="#ffffff",i.font="bold 24px Arial, sans-serif",i.textAlign="left",i.fillText("Heart Rate Statistics",50,d),d+=40;let t=Math.max(...e),n=Math.min(...e),a=Math.round(e.reduce((e,t)=>e+t,0)/e.length);i.font="16px Arial, sans-serif",i.fillStyle="#cccccc",i.fillText("Average:",70,d),i.fillStyle="#e74c3c",i.fillText(`${a} BPM`,200,d),d+=25,i.fillStyle="#cccccc",i.fillText("Maximum:",70,d),i.fillStyle="#e74c3c",i.fillText(`${t} BPM`,200,d),d+=25,i.fillStyle="#cccccc",i.fillText("Minimum:",70,d),i.fillStyle="#e74c3c",i.fillText(`${n} BPM`,200,d),d+=40}}if(a.length>0){let e=a.map(e=>e.cadence).filter(e=>e>0).map(e=>Math.max(0,Math.min(200,e)));if(e.length>0){i.fillStyle="#ffffff",i.font="bold 24px Arial, sans-serif",i.textAlign="left",i.fillText("Cadence Statistics",50,d),d+=40;let t=Math.max(...e),n=Math.min(...e),a=Math.round(e.reduce((e,t)=>e+t,0)/e.length);i.font="16px Arial, sans-serif",i.fillStyle="#cccccc",i.fillText("Average:",70,d),i.fillStyle="#f39c12",i.fillText(`${a} RPM`,200,d),d+=25,i.fillStyle="#cccccc",i.fillText("Maximum:",70,d),i.fillStyle="#f39c12",i.fillText(`${t} RPM`,200,d),d+=25,i.fillStyle="#cccccc",i.fillText("Minimum:",70,d),i.fillStyle="#f39c12",i.fillText(`${n} RPM`,200,d),d+=40}}return r.length>0||n.length>0||a.length>0?(r.length>0&&(d+=20,i.fillStyle="#ffffff",i.font="bold 20px Arial, sans-serif",i.fillText("Power Timeline",50,d),J(i,r,"power",50,d+=30,1100,300,"#3498db","W"),d+=350),n.length>0&&(i.fillStyle="#ffffff",i.font="bold 20px Arial, sans-serif",i.fillText("Heart Rate Timeline",50,d),J(i,n,"heartRate",50,d+=30,1100,300,"#e74c3c","BPM"),d+=350),a.length>0&&(i.fillStyle="#ffffff",i.font="bold 20px Arial, sans-serif",i.fillText("Cadence Timeline",50,d),J(i,a,"cadence",50,d+=30,1100,300,"#f39c12","RPM"),d+=350),o):(i.fillStyle="#cccccc",i.font="24px Arial, sans-serif",i.textAlign="center",i.fillText("No data recorded yet",600,s/2),i.font="16px Arial, sans-serif",i.fillText("Start recording to see your activity summary",600,s/2+40),o)}function J(e,t,n,a,r,o,i,l,s){if(0===t.length)return;e.fillStyle="rgba(255, 255, 255, 0.05)",e.fillRect(a,r,o,i),e.strokeStyle="rgba(255, 255, 255, 0.2)",e.lineWidth=1,e.strokeRect(a,r,o,i);let c=t.map(e=>e[n]).filter(e=>e>0);if(0===c.length)return;let d=Math.min(...c),u=Math.max(...c),m=u-d||1;e.fillStyle="#cccccc",e.font="12px Arial, sans-serif",e.textAlign="right";for(let t=0;t<=4;t++){let n=Math.round(d+m*t/4),o=r+i-i*t/4;e.fillText(n+s,a-10,o+4)}e.strokeStyle=l,e.lineWidth=2,e.beginPath();let g=!0;for(let l=0;l<t.length;l++){let s=t[l][n];if(s>0){let n=a+l/(t.length-1)*o,c=r+i-(s-d)/m*i;g?(e.moveTo(n,c),g=!1):e.lineTo(n,c)}}e.stroke(),e.fillStyle=l;for(let l=0;l<t.length;l+=Math.max(1,Math.floor(t.length/50))){let s=t[l][n];if(s>0){let n=a+l/(t.length-1)*o,c=r+i-(s-d)/m*i;e.beginPath(),e.arc(n,c,3,0,2*Math.PI),e.fill()}}e.strokeStyle="rgba(255, 255, 255, 0.1)",e.lineWidth=1;for(let t=1;t<4;t++){let n=r+i*t/4;e.beginPath(),e.moveTo(a,n),e.lineTo(a+o,n),e.stroke()}if(t.length>1){e.fillStyle="#cccccc",e.font="12px Arial, sans-serif",e.textAlign="center";let n=new Date(t[0].timestamp),l=new Date(t[t.length-1].timestamp);if(e.fillText(n.toLocaleTimeString(),a,r+i+20),e.fillText(l.toLocaleTimeString(),a+o,r+i+20),t.length>10){let n=new Date(t[Math.floor(t.length/2)].timestamp);e.fillText(n.toLocaleTimeString(),a+o/2,r+i+20)}}e.fillStyle="#ffffff",e.font="12px Arial, sans-serif",e.textAlign="left",e.fillText(`Max: ${u}${s}`,a+10,r+20),e.fillText(`Min: ${d}${s}`,a+10,r+35),e.fillText(`Avg: ${Math.round(c.reduce((e,t)=>e+t,0)/c.length)}${s}`,a+10,r+50)}const Q={BASE_URL:"https://intervals.icu/api/v1",API_KEY:"",ATHLETE_ID:""},Z={isGoogleApiLoaded:!1,isUserSignedIn:!1,authInstance:null,lastError:null,intervals:{isConfigured:!1,apiKey:null,athleteId:null,lastUpload:null}};async function ee(e){try{if(0===e.dataPoints.length)throw Error("No data available to export. Please record some activity first.");let t=await Y({dataPoints:e.dataPoints,powerAverages:e.powerAverages});return new Promise((e,n)=>{t.toBlob(t=>{t?(et(t,`power_meter_summary_${k()}.png`),e()):n(Error("Failed to generate image blob"))},"image/png")})}catch(e){throw console.error("Error generating summary image:",e),e}}function et(e,t){try{if(!e||!(e instanceof Blob))throw Error("Invalid blob provided for download");if(!t||"string"!=typeof t)throw Error("Invalid filename provided for download");let n=URL.createObjectURL(e),a=document.createElement("a");a.href=n,a.download=t,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(n)}catch(e){throw console.error("Error during file download:",e),e}}async function en(){try{if(!Z.isGoogleApiLoaded)throw Error("Google API not initialized. Please configure API credentials first.");return Z.isUserSignedIn||(await Z.authInstance.signIn(),Z.isUserSignedIn=Z.authInstance.isSignedIn.get()),Z.isUserSignedIn}catch(e){return console.error("Google authentication failed:",e),Z.lastError=e.message,!1}}async function ea(){try{Z.authInstance&&Z.isUserSignedIn&&(await Z.authInstance.signOut(),Z.isUserSignedIn=!1)}catch(e){console.error("Google sign out failed:",e)}}function er(){return Z.intervals.isConfigured&&Z.intervals.apiKey&&Z.intervals.athleteId}async function eo(e){try{if(!er())throw Error("intervals.icu not configured. Please set up API credentials first.");let{powerData:t,sessionStartTime:n,powerAverages:a,activityName:r,description:o}=e;if(!t||0===t.length)throw Error("No power data available to export");let i=function(e){let{powerData:t,sessionStartTime:n,description:a}=e,r=new Date(n).toISOString(),o=`<?xml version="1.0" encoding="UTF-8"?>
`;o+=`<TrainingCenterDatabase xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd" xmlns:ns5="http://www.garmin.com/xmlschemas/ActivityGoals/v1" xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2" xmlns:ns2="http://www.garmin.com/xmlschemas/UserProfile/v2" xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ns4="http://www.garmin.com/xmlschemas/ProfileExtension/v1">
  <Activities>
    <Activity Sport="Biking">
      <Id>${r}</Id>
      <Notes>${a}</Notes>
      <Lap StartTime="${r}">
`;let i=function(e){if(0===e.length)return{totalTime:0,distance:0,maxSpeed:0,calories:0,avgHeartRate:0,maxHeartRate:0,avgPower:0,maxPower:0};let t=new Date(e[0].timestamp).getTime(),n=(new Date(e[e.length-1].timestamp).getTime()-t)/1e3,a=e.map(e=>e.power||0).filter(e=>e>0),r=e.map(e=>e.heartRate||0).filter(e=>e>0),o=a.length>0?a.reduce((e,t)=>e+t,0)/a.length:0,i=o>0?Math.sqrt(o/3.6):15,l=o>0?Math.round(o*n*4.18/1e3):Math.round(10*n);return{totalTime:Math.round(n),distance:Math.round(i/3.6*n),maxSpeed:Math.round(1.2*i/3.6*100)/100,calories:l,avgHeartRate:r.length>0?r.reduce((e,t)=>e+t,0)/r.length:0,maxHeartRate:r.length>0?Math.max(...r):0,avgPower:o,maxPower:a.length>0?Math.max(...a):0}}(t);return o+=`        <TotalTimeSeconds>${i.totalTime}</TotalTimeSeconds>
        <DistanceMeters>${i.distance}</DistanceMeters>
        <MaximumSpeed>${i.maxSpeed}</MaximumSpeed>
        <Calories>${i.calories}</Calories>
`,i.avgHeartRate>0&&(o+=`        <AverageHeartRateBpm><Value>${Math.round(i.avgHeartRate)}</Value></AverageHeartRateBpm>
        <MaximumHeartRateBpm><Value>${i.maxHeartRate}</Value></MaximumHeartRateBpm>
`),o+=`        <Intensity>Active</Intensity>
        <TriggerMethod>Manual</TriggerMethod>
        <Track>
`,t.forEach(e=>{let t=new Date(e.timestamp).toISOString();o+=`          <Trackpoint>
            <Time>${t}</Time>
`,e.heartRate&&e.heartRate>0&&(o+=`            <HeartRateBpm><Value>${e.heartRate}</Value></HeartRateBpm>
`),e.cadence&&e.cadence>0&&(o+=`            <Cadence>${e.cadence}</Cadence>
`),o+=`            <Extensions>
              <ns3:TPX>
`,e.power&&e.power>0&&(o+=`                <ns3:Watts>${e.power}</ns3:Watts>
`),o+=`              </ns3:TPX>
            </Extensions>
          </Trackpoint>
`}),o+=`        </Track>
        <Extensions>
          <ns3:LX>
`,i.avgPower>0&&(o+=`            <ns3:AvgWatts>${Math.round(i.avgPower)}</ns3:AvgWatts>
            <ns3:MaxWatts>${i.maxPower}</ns3:MaxWatts>
`),o+=`          </ns3:LX>
        </Extensions>
      </Lap>
      <Extensions>
        <ns3:ActivityExtensions>
`,i.avgPower>0&&(o+=`          <ns3:AvgWatts>${Math.round(i.avgPower)}</ns3:AvgWatts>
          <ns3:MaxWatts>${i.maxPower}</ns3:MaxWatts>
`),o+=`        </ns3:ActivityExtensions>
      </Extensions>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`}({powerData:t,sessionStartTime:n,powerAverages:a,activityName:r||`Power Meter Session - ${new Date(n).toLocaleDateString()}`,description:o||"Exported from Power Saver Web App"}),l=await ei(i,{name:r||`Power Meter Session - ${new Date(n).toLocaleDateString()}`,description:o||"Exported from Power Saver Web App",type:"Ride"});return console.log("Successfully exported to intervals.icu:",l),Z.intervals.lastUpload=new Date().toISOString(),l}catch(e){throw console.error("Error exporting to intervals.icu:",e),Z.lastError=e.message,Error(`Failed to export to intervals.icu: ${e.message}`)}}async function ei(e,t){try{let n=new FormData,a=new Blob([e],{type:"application/xml"});n.append("file",a,`power-session-${Date.now()}.tcx`),n.append("name",t.name),n.append("description",t.description),n.append("type",t.type);let r=await fetch(`${Q.BASE_URL}/athlete/${Q.ATHLETE_ID}/activities`,{method:"POST",headers:{Authorization:`Basic ${btoa(`${Q.API_KEY}:`)}`},body:n});if(!r.ok){let e=await r.text();throw Error(`intervals.icu API error: ${r.status} - ${e}`)}let o=await r.json();return o.id||o.activity_id||"uploaded"}catch(e){throw console.error("Upload to intervals.icu failed:",e),e}}async function el(e){try{if(!await en())throw Error("Google authentication required");let{powerData:t,powerAverages:n,sessionStartTime:a}=e,r=a?new Date(a):new Date,o=`Power Meter Session - ${r.toLocaleDateString()}`,i=function(e,t,n){let a=[],r=1,o=`Power Meter Session Report
${n.toLocaleDateString()} ${n.toLocaleTimeString()}

`;a.push({insertText:{location:{index:r},text:o}}),r+=o.length,a.push({updateTextStyle:{range:{startIndex:1,endIndex:o.indexOf("\n")},textStyle:{bold:!0,fontSize:{magnitude:18,unit:"PT"}},fields:"bold,fontSize"}});let i=function(e,t){if(0===e.length)return"Session Summary\n\nNo data recorded during this session.\n\n";let n=function(e){if(e.length<2)return 0;let t=new Date(e[0].timestamp).getTime();return new Date(e[e.length-1].timestamp).getTime()-t}(e),a=function(e){if(0===e.length)return{avgPower:0,maxPower:0,minPower:0,avgHeartRate:0,maxHeartRate:0,avgCadence:0,maxCadence:0};let t=e.map(e=>e.power||0).filter(e=>e>0),n=e.map(e=>e.heartRate||0).filter(e=>e>0),a=e.map(e=>e.cadence||0).filter(e=>e>0);return{avgPower:t.length>0?t.reduce((e,t)=>e+t,0)/t.length:0,maxPower:t.length>0?Math.max(...t):0,minPower:t.length>0?Math.min(...t):0,avgHeartRate:n.length>0?n.reduce((e,t)=>e+t,0)/n.length:0,maxHeartRate:n.length>0?Math.max(...n):0,avgCadence:a.length>0?a.reduce((e,t)=>e+t,0)/a.length:0,maxCadence:a.length>0?Math.max(...a):0}}(e),r="Session Summary\n\n";return r+=`Duration: ${function(e){let t=Math.floor(e/1e3),n=Math.floor(t/60),a=Math.floor(n/60);return a>0?`${a}h ${n%60}m ${t%60}s`:n>0?`${n}m ${t%60}s`:`${t}s`}(n)}
Total Data Points: ${e.length}
Average Power: ${a.avgPower.toFixed(1)} W
Maximum Power: ${a.maxPower} W
Minimum Power: ${a.minPower} W
`,a.avgHeartRate>0&&(r+=`Average Heart Rate: ${a.avgHeartRate.toFixed(0)} BPM
Maximum Heart Rate: ${a.maxHeartRate} BPM
`),a.avgCadence>0&&(r+=`Average Cadence: ${a.avgCadence.toFixed(0)} RPM
Maximum Cadence: ${a.maxCadence} RPM
`),t&&(r+="\nPower Averages:\n",t.fiveSecond&&(r+=`5-second: ${t.fiveSecond.toFixed(1)} W
`),t.thirtySecond&&(r+=`30-second: ${t.thirtySecond.toFixed(1)} W
`),t.oneMinute&&(r+=`1-minute: ${t.oneMinute.toFixed(1)} W
`),t.fiveMinute&&(r+=`5-minute: ${t.fiveMinute.toFixed(1)} W
`)),r+"\n\nDetailed Data\n\n"}(e,t);if(a.push({insertText:{location:{index:r},text:i}}),r+=i.length,e.length>0){let t=function(e){let t=[["Time","Power (W)","Heart Rate (BPM)","Cadence (RPM)"]];return e.slice(0,50).forEach(e=>{let n=new Date(e.timestamp).toLocaleTimeString();t.push([n,e.power||"--",e.heartRate||"--",e.cadence||"--"])}),e.length>50&&(t.push(["...","...","...","..."]),t.push([`${e.length} total data points`,"","",""])),t}(e);a.push({insertTable:{location:{index:r},rows:t.length,columns:t[0].length}}),r+=50}return a}(t,n,r),l=(await window.gapi.client.docs.documents.create({resource:{title:o}})).result.documentId;await window.gapi.client.docs.documents.batchUpdate({documentId:l,resource:{requests:i}});let s=`https://docs.google.com/document/d/${l}/edit`;return window.open(s,"_blank"),console.log("Successfully exported to Google Docs:",l),l}catch(e){throw console.error("Error exporting to Google Docs:",e),Error(`Failed to export to Google Docs: ${e.message}`)}}async function es(e){try{if(!await en())throw Error("Google authentication required");let{powerData:t,rawMeasurements:n,sessionStartTime:a}=e,r=a?new Date(a):new Date,o=`Power Meter Data - ${r.toLocaleDateString()}`,i=(await window.gapi.client.sheets.spreadsheets.create({resource:{properties:{title:o},sheets:[{properties:{title:"Summary Data",gridProperties:{rowCount:Math.max(1e3,t.length+10),columnCount:10}}},{properties:{title:"Raw Measurements",gridProperties:{rowCount:Math.max(1e3,n.length+10),columnCount:8}}}]}})).result.spreadsheetId,l=ec(t,"summary"),s=ec(n,"raw");await window.gapi.client.sheets.spreadsheets.values.batchUpdate({spreadsheetId:i,resource:{valueInputOption:"RAW",data:[{range:"Summary Data!A1",values:l},{range:"Raw Measurements!A1",values:s}]}}),await ed(i);let c=`https://docs.google.com/spreadsheets/d/${i}/edit`;return window.open(c,"_blank"),console.log("Successfully exported to Google Sheets:",i),i}catch(e){throw console.error("Error exporting to Google Sheets:",e),Error(`Failed to export to Google Sheets: ${e.message}`)}}function ec(e,t){return"summary"===t?function(e){let t=[["Timestamp","Power (W)","Heart Rate (BPM)","Cadence (RPM)","Time (s)"]];return e.forEach((e,n)=>{let a=new Date(e.timestamp).toISOString();t.push([a,e.power||"",e.heartRate||"",e.cadence||"",n])}),t}(e):"raw"===t?function(e){let t=[["Timestamp","Flags","Data Length","Instantaneous Power","Raw Bytes"]];return e.forEach(e=>{let n=new Date(e.timestamp).toISOString();t.push([n,e.flags||"",e.dataLength||"",e.instantaneousPower||"",e.rawBytes||""])}),t}(e):[]}async function ed(e){try{let t=[{repeatCell:{range:{sheetId:0,startRowIndex:0,endRowIndex:1},cell:{userEnteredFormat:{backgroundColor:{red:.9,green:.9,blue:.9},textFormat:{bold:!0}}},fields:"userEnteredFormat(backgroundColor,textFormat)"}},{repeatCell:{range:{sheetId:1,startRowIndex:0,endRowIndex:1},cell:{userEnteredFormat:{backgroundColor:{red:.9,green:.9,blue:.9},textFormat:{bold:!0}}},fields:"userEnteredFormat(backgroundColor,textFormat)"}},{autoResizeDimensions:{dimensions:{sheetId:0,dimension:"COLUMNS",startIndex:0,endIndex:5}}},{autoResizeDimensions:{dimensions:{sheetId:1,dimension:"COLUMNS",startIndex:0,endIndex:5}}}];await window.gapi.client.sheets.spreadsheets.batchUpdate({spreadsheetId:e,resource:{requests:t}})}catch(e){console.warn("Failed to apply formatting to Google Sheet:",e)}}async function eu(e,t){try{let n=await fetch(`${Q.BASE_URL}/athlete/${t}`,{method:"GET",headers:{Authorization:`Basic ${btoa(`API_KEY:${e}`)}`}});if(!n.ok){let e=await n.text();return{success:!1,error:`API error: ${n.status} - ${e}`}}let a=await n.json();return{success:!0,athleteName:a.name||a.username,athleteData:a}}catch(e){return{success:!1,error:e.message}}}function em(e,t){let n=document.createElement("div");return n.className="export-modal",n.innerHTML=`
        <div class="export-modal-content">
            <div class="export-modal-header">
                <h3 class="export-modal-title">${e}</h3>
                <button class="export-modal-close" aria-label="Close modal">&times;</button>
            </div>
            <div class="export-modal-description">${t}</div>
            <div class="export-modal-buttons"></div>
        </div>
    `,n.querySelector(".export-modal-close").addEventListener("click",()=>eh(n)),n.addEventListener("click",e=>{e.target===n&&eh(n)}),n}function eg(e,t){let n=e.querySelector(".export-modal-buttons");t.forEach(e=>{let t=document.createElement("button");t.className=`export-modal-button ${e.className||""}`,t.disabled=e.disabled||!1,t.innerHTML=`
            <span>${e.text}</span>
            ${e.description?`<small style="opacity: 0.7; font-size: 0.8em;">${e.description}</small>`:""}
        `,t.addEventListener("click",e.onClick),n.appendChild(t)})}function ep(e){document.body.appendChild(e),requestAnimationFrame(()=>{e.classList.add("show")})}function eh(e){e.classList.remove("show"),setTimeout(()=>{e.parentNode&&document.body.removeChild(e)},300)}function ef(){let e=document.querySelector(".dashboard");if(!e)return;let t=document.querySelector(".collapsed-sections-row");t&&(t.querySelectorAll(".power-averages-section").forEach(t=>{e.parentNode.insertBefore(t,e.nextSibling)}),t.remove()),e.classList.remove("has-collapsed-sections")}let ey=[],ev=[],ew=[],ex=[],eb=0,eS=0,eC=0,eE=null,eT=null;const eI={get powerData(){return ey},get rawPowerMeasurements(){return ev},get heartData(){return ew},get cadenceData(){return ex},get lastPowerValue(){return eb},get lastHeartRateValue(){return eS},get lastCadenceValue(){return eC},get sessionStartTime(){return eE},getPowerAverages:function(){return{...E}},getPowerReadings:function(){return[...C]},resetAllSessionData:function(){ey.length=0,ew.length=0,ex.length=0,ev.length=0,I(),eb=0,eS=0,eC=0,eE=null,A(),S()},elements:D},eD={onPowerMeasurement:(e,t)=>{M(e),eb=e,ev.push(t);let n=Date.now();C.push({timestamp:n,power:e});let a=n-36e4;C=C.filter(e=>e.timestamp>a),function(){let e=Date.now();for(let[t,n]of Object.entries({"10s":1e4,"20s":2e4,"30s":3e4,"40s":4e4,"50s":5e4,"1m":6e4,"2m":12e4,"3m":18e4,"4m":24e4,"5m":3e5})){let a=e-n,r=C.filter(e=>e.timestamp>=a);if(r.length>0){let e=Math.round(r.reduce((e,t)=>e+t.power,0)/r.length);E[t].current=e,e>E[t].best&&(E[t].best=e)}else E[t].current=0}}(),T()},onDisconnected:()=>{A(),I(),eT&&(clearInterval(eT),eT=null),eb=0},onStatusUpdate:e=>{D.statusText&&(D.statusText.textContent=e)}},eM={onHeartRateChange:e=>{D.hrValueElement&&(D.hrValueElement.textContent=e),eS=e},onStatusUpdate:e=>{D.hrStatusText&&(D.hrStatusText.textContent=e)}},eA={onCadenceChange:e=>{D.cadenceValueElement&&(D.cadenceValueElement.textContent=e),eC=e},onStatusUpdate:e=>{D.cadenceStatusText&&(D.cadenceStatusText.textContent=e)}};async function ek(){D.powerValueElement=document.getElementById("power-value"),D.hrValueElement=document.getElementById("hr-value"),D.cadenceValueElement=document.getElementById("cadence-value"),D.deviceNameElement=document.getElementById("device-name"),D.hrDeviceName=document.getElementById("hrDeviceName"),D.cadenceDeviceName=document.getElementById("cadenceDeviceName"),D.statusText=document.getElementById("status"),D.hrStatusText=document.getElementById("hrStatus"),D.cadenceStatusText=document.getElementById("cadenceStatus"),D.hrConnectionStatus=document.getElementById("hrConnectionStatus"),D.cadenceConnectionStatus=document.getElementById("cadenceConnectionStatus"),D.powerMeterConnectButton=document.getElementById("connectButton"),D.hrConnectButton=document.getElementById("hrConnectButton"),D.speedCadenceConnectButton=document.getElementById("speedCadenceConnectButton"),D.powerAveragesSection=document.getElementById("powerAveragesSection"),D.hamburgerBtn=document.getElementById("hamburgerButton"),D.menuDropdown=document.getElementById("menuDropdown"),D.powerAveragesToggle=document.getElementById("powerAveragesToggle"),D.powerMetricToggle=document.getElementById("powerMetricToggle"),D.heartRateMetricToggle=document.getElementById("heartRateMetricToggle"),D.cadenceMetricToggle=document.getElementById("cadenceMetricToggle"),D.showInfoMenuItem=document.getElementById("showInfoMenuItem"),D.showQrCodeMenuItem=document.getElementById("showQrCodeMenuItem"),D.spyModeToggle=document.getElementById("spyModeToggle"),D.powerCard=document.querySelector(".power-card"),D.heartRateCard=document.querySelector(".hr-card"),D.cadenceCard=document.querySelector(".cadence-card"),D.spyCard=document.querySelector(".spy-card"),D.spyModeSection=document.getElementById("spyModeSection"),D.spyValueElement=document.getElementById("spy-value"),D.spyStatusElement=document.getElementById("spyStatus"),D.spyInstructionsElement=document.getElementById("spyInstructions"),D.hrConnectionStatus&&(D.hrConnectionStatus.textContent="Disconnected"),D.cadenceConnectionStatus&&(D.cadenceConnectionStatus.textContent="Disconnected"),e=document.getElementById("avg10s-current"),t=document.getElementById("avg10s-best"),n=document.getElementById("avg20s-current"),a=document.getElementById("avg20s-best"),r=document.getElementById("avg30s-current"),o=document.getElementById("avg30s-best"),i=document.getElementById("avg40s-current"),l=document.getElementById("avg40s-best"),s=document.getElementById("avg50s-current"),c=document.getElementById("avg50s-best"),d=document.getElementById("avg1m-current"),u=document.getElementById("avg1m-best"),m=document.getElementById("avg2m-current"),g=document.getElementById("avg2m-best"),p=document.getElementById("avg3m-current"),h=document.getElementById("avg3m-best"),f=document.getElementById("avg4m-current"),y=document.getElementById("avg4m-best"),v=document.getElementById("avg5m-current"),w=document.getElementById("avg5m-best"),D.powerAveragesSection&&(D.powerAveragesSection.style.display="block");let A=document.querySelector(".dashboard"),B=document.getElementById("powerAveragesSection"),P=B&&"none"===B.style.display;A&&(P?A.classList.add("maximized"):A.classList.remove("maximized")),ef(),function(e){if(!e.hamburgerBtn||!e.menuDropdown)return console.error("Hamburger menu elements not found:",{hamburgerBtn:!!e.hamburgerBtn,menuDropdown:!!e.menuDropdown});e.hamburgerBtn.addEventListener("click",function(){e.menuDropdown.classList.contains("active")?e.menuDropdown.classList.remove("active"):e.menuDropdown.classList.add("active")}),document.addEventListener("click",function(t){t.target.closest(".hamburger-menu")||e.menuDropdown.classList.remove("active")})}(D),function(e){if(!e.powerAveragesToggle||!e.powerAveragesSection)return console.error("Power averages toggle elements not found:",{powerAveragesToggle:!!e.powerAveragesToggle,powerAveragesSection:!!e.powerAveragesSection});let t=!0;e.powerAveragesToggle.classList.add("active"),e.powerAveragesToggle.addEventListener("click",function(){(t=!t)?(e.powerAveragesSection.style.display="block",e.powerAveragesToggle.classList.add("active")):(e.powerAveragesSection.style.display="none",e.powerAveragesToggle.classList.remove("active")),ef()})}(D);if(D.powerMetricToggle&&D.powerCard){let e=!0;D.powerMetricToggle.classList.add("active"),D.powerMetricToggle.addEventListener("click",function(){(e=!e)?(D.powerCard.style.display="block",D.powerMetricToggle.classList.add("active")):(D.powerCard.style.display="none",D.powerMetricToggle.classList.remove("active"))})}else console.error("Power metric toggle elements not found");if(D.heartRateMetricToggle&&D.heartRateCard){let e=!0;D.heartRateMetricToggle.classList.add("active"),D.heartRateMetricToggle.addEventListener("click",function(){(e=!e)?(D.heartRateCard.style.display="block",D.heartRateMetricToggle.classList.add("active")):(D.heartRateCard.style.display="none",D.heartRateMetricToggle.classList.remove("active"))})}else console.error("Heart rate metric toggle elements not found");if(D.cadenceMetricToggle&&D.cadenceCard){let e=!0;D.cadenceMetricToggle.classList.add("active"),D.cadenceMetricToggle.addEventListener("click",function(){(e=!e)?(D.cadenceCard.style.display="block",D.cadenceMetricToggle.classList.add("active")):(D.cadenceCard.style.display="none",D.cadenceMetricToggle.classList.remove("active"))})}else console.error("Cadence metric toggle elements not found");!function(e,t){if(!e.spyModeToggle||!e.spyModeSection)return console.error("Spy mode toggle elements not found");let n=!1;e.spyModeToggle.addEventListener("click",function(){(n=!n)?(e.spyModeSection.style.display="block",e.spyModeToggle.classList.add("active")):(e.spyModeSection.style.display="none",e.spyModeToggle.classList.remove("active"),t(),e.spyValueElement&&(e.spyValueElement.textContent="--"),e.spyStatusElement&&(e.spyStatusElement.style.display="none")),e.spyInstructionsElement&&(e.spyInstructionsElement.style.display="block")})}(D,()=>z(D)),D.showInfoMenuItem?D.showInfoMenuItem.addEventListener("click",function(){!function(){let e=document.createElement("div");e.className="modal-backdrop",e.style.cssText=`
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
    `,e.appendChild(t),document.body.appendChild(e);let n=t.querySelector("#closeInfoModal"),a=()=>{document.body.removeChild(e)};n.addEventListener("click",a),e.addEventListener("click",t=>{t.target===e&&a()});let r=e=>{"Escape"===e.key&&(a(),document.removeEventListener("keydown",r))};document.addEventListener("keydown",r),n.addEventListener("mouseenter",()=>{n.style.transform="translateY(-2px)",n.style.boxShadow="0 8px 24px rgba(52, 152, 219, 0.4)"}),n.addEventListener("mouseleave",()=>{n.style.transform="translateY(0)",n.style.boxShadow="none"})}(),D.menuDropdown&&D.menuDropdown.classList.remove("active")}):console.error("Show info menu item not found"),D.showQrCodeMenuItem?D.showQrCodeMenuItem.addEventListener("click",function(){!function(){let e="https://colscoding.github.io/power-saver/",t=document.createElement("div");t.className="modal-backdrop",t.style.cssText=`
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
    `;let a=document.createElement("canvas");a.width=256,a.height=256,a.style.cssText=`
        background: white;
        border-radius: 8px;
        margin: 1rem 0;
        max-width: 100%;
        height: auto;
    `,function(e,t){let n=e.getContext("2d"),a=e.width;n.fillStyle="#ffffff",n.fillRect(0,0,a,a);let r=`https://api.qrserver.com/v1/create-qr-code/?size=${a}x${a}&data=${encodeURIComponent(t)}`,o=new Image;o.crossOrigin="anonymous",o.onload=function(){n.drawImage(o,0,0,a,a)},o.onerror=function(){var e=n,t=a;e.fillStyle="#000000",e.font="12px Arial",e.textAlign="center";let r=t/25;for(let t=0;t<25;t++)for(let n=0;n<25;n++)((t+n)%3==0||0===t||24===t||0===n||24===n)&&e.fillRect(t*r,n*r,r,r);e.fillStyle="#ffffff",e.fillRect(.2*t,.4*t,.6*t,.2*t),e.fillStyle="#000000",e.fillText("QR Code",t/2,t/2-10),e.fillText("Unavailable",t/2,t/2+10)},o.src=r}(a,e),n.innerHTML=`
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
    `,n.querySelector("#qr-container").appendChild(a),t.appendChild(n),document.body.appendChild(t);let r=n.querySelector("#closeQrModal"),o=()=>{document.body.removeChild(t)};r.addEventListener("click",o),t.addEventListener("click",e=>{e.target===t&&o()});let i=e=>{"Escape"===e.key&&(o(),document.removeEventListener("keydown",i))};document.addEventListener("keydown",i),r.addEventListener("mouseenter",()=>{r.style.transform="translateY(-2px)",r.style.boxShadow="0 8px 24px rgba(155, 89, 182, 0.4)"}),r.addEventListener("mouseleave",()=>{r.style.transform="translateY(0)",r.style.boxShadow="none"})}(),D.menuDropdown&&D.menuDropdown.classList.remove("active")}):console.error("Show QR code menu item not found"),D.powerMeterConnectButton&&D.powerMeterConnectButton.addEventListener("click",async()=>{ey.length=0,ev.length=0,eb=0,I(),eT&&clearInterval(eT),await q(eD,D)&&(eE||(eE=Date.now()),eT=setInterval(()=>{ey.push({timestamp:Date.now(),power:eb,heartRate:eS,cadence:eC}),ey.length%100==0&&b(eI)},100))}),D.hrConnectButton&&D.hrConnectButton.addEventListener("click",async()=>{await G(eM,D)}),D.speedCadenceConnectButton&&D.speedCadenceConnectButton.addEventListener("click",async()=>{await W(eA,D)}),D.spyCard&&D.spyCard.addEventListener("click",async()=>{V&&V.gatt.connected?z(D):await O({},D)});(function(){let e=document.getElementById("exportMenuSection");e&&e.classList.add("collapsed")})(),function(){let e=document.getElementById("exportSectionToggleHeader"),t=document.getElementById("exportMenuSection");e&&t&&e.addEventListener("click",()=>{t.classList.toggle("collapsed")})}();let L=document.getElementById("exportBasicMenuItem");L&&L.addEventListener("click",()=>{let e=em("\uD83D\uDCC4 Basic Exports","Export your session data in various formats"),t=[{text:"\uD83D\uDCCB Export Summary JSON",description:"Session summary with averages",onClick:()=>{var t=eI.powerData;if(!t||!Array.isArray(t)||0===t.length)throw Error("No valid power data available to export as JSON");et(new Blob([JSON.stringify(t,null,2)],{type:"application/json"}),`power_data_${k()}.json`),eh(e)}},{text:"\uD83D\uDCCA Export Summary CSV",description:"Session summary for spreadsheets",onClick:()=>{var t=eI.powerData;if(!t||!Array.isArray(t)||0===t.length)throw Error("No valid power data available to export as CSV");let n="timestamp,power,heartRate,cadence\n";t.forEach(e=>{let t=e.timestamp||"",a=e.power||0,r=e.heartRate||0,o=e.cadence||0;n+=`${t},${a},${r},${o}
`}),et(new Blob([n],{type:"text/csv;charset=utf-8;"}),`power_data_${k()}.csv`),eh(e)}},{text:"\uD83C\uDFC3 Export TCX",description:"Training Center XML format",onClick:()=>{try{var t=eI.powerData;try{if(0===t.length)throw Error("No power data available to export.");let e=function(e){if(!Array.isArray(e)||0===e.length)return"";let t=e.filter(e=>e&&"object"==typeof e&&void 0!==e.timestamp&&!isNaN(new Date(e.timestamp).getTime()));if(0===t.length)return"";let n=t.map(e=>({time:e.timestamp,...void 0!==e.power&&{power:e.power},...void 0!==e.heartRate&&{heartRate:e.heartRate},...void 0!==e.cadence&&{cadence:e.cadence}})).sort((e,t)=>e.time-t.time),a=e=>!e.power||e.power<=0;for(;n.length>0&&a(n[0]);)n.shift();for(;n.length>0&&a(n[n.length-1]);)n.pop();if(0===n.length)return"";let r=n.map(X).join("\n"),o=new Date(n[0].time).toISOString();return`<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase
  xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd"
  xmlns:ns2="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
  <Activities>
    <Activity Sport="Biking">
      <Id>${o}</Id>
      <Name>E Bike Indoor Cycling Trainer</Name>
      <Lap StartTime="${o}">
        <Track>
        ${r}
        </Track>
      </Lap>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`}(t),n=new Blob([e],{type:"application/xml;charset=utf-8;"});et(n,`power_data_${k()}.tcx`)}catch(e){throw console.error("Error generating TCX:",e),e}eh(e)}catch(e){alert(`Error generating TCX file: ${e.message}`)}}},{text:"\uD83D\uDD0D Export Raw JSON",description:"Complete measurement data",onClick:()=>{et(new Blob([JSON.stringify(eI.rawPowerMeasurements,null,2)],{type:"application/json"}),`raw_power_measurements_${k()}.json`),eh(e)}},{text:"\uD83D\uDCC8 Export Raw CSV",description:"Raw measurements for analysis",onClick:()=>{var t;let n;t=eI.rawPowerMeasurements,n="timestamp,flags,dataLength,instantaneousPower,rawBytes\n",t.forEach(e=>{n+=`${e.timestamp},${e.flags},${e.dataLength},${e.instantaneousPower},"${e.rawBytes}"
`}),et(new Blob([n],{type:"text/csv;charset=utf-8;"}),`raw_power_measurements_${k()}.csv`),eh(e)}},{text:"\uD83D\uDDBC️ Export Summary Image",description:"Visual summary of your session",className:"primary",onClick:async()=>{try{await ee({dataPoints:eI.powerData,powerAverages:eI.getPowerAverages()}),eh(e)}catch(e){alert(`Error generating summary image: ${e.message}`)}}}];eg(e,t),ep(e)});let $=document.getElementById("exportCloudMenuItem");$&&$.addEventListener("click",()=>{!function e(t){let n=em("☁️ Cloud Exports","Export to cloud services and platforms"),a=Z.isUserSignedIn,r=[{text:a?"\uD83D\uDD13 Sign Out from Google":"\uD83D\uDD17 Sign In to Google",description:a?"Sign out from Google account":"Sign in to enable Google exports",className:a?"danger":"success",onClick:async()=>{try{a?(await ea(),alert("Signed out successfully!")):await en()&&alert("Signed in successfully!"),eh(n),setTimeout(()=>e(t),100)}catch(e){alert(`Google authentication error: ${e.message}`)}}},{text:"\uD83D\uDCC4 Export to Google Docs",description:"Create a formatted session report",disabled:!a,onClick:async()=>{if(a)try{await el({powerData:t.powerData,powerAverages:t.getPowerAverages(),sessionStartTime:t.sessionStartTime}),alert("Successfully exported to Google Docs!"),eh(n)}catch(e){alert(`Error exporting to Google Docs: ${e.message}`)}}},{text:"\uD83D\uDCCA Export to Google Sheets",description:"Create a detailed data spreadsheet",disabled:!a,onClick:async()=>{if(a)try{await es({powerData:t.powerData,powerAverages:t.getPowerAverages(),rawMeasurements:t.rawPowerMeasurements,sessionStartTime:t.sessionStartTime}),alert("Successfully exported to Google Sheets!"),eh(n)}catch(e){alert(`Error exporting to Google Sheets: ${e.message}`)}}},{text:"⚙️ Configure Google API",description:"Set up Google API credentials",onClick:()=>{eh(n);let e=document.createElement("div");e.className="modal-backdrop",e.style.cssText=`
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
    `;let a=localStorage.getItem("google_client_id")||"",r=localStorage.getItem("google_api_key")||"";t.innerHTML=`
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
            <input type="text" id="clientIdInput" value="${a}" 
                   style="width: 100%; padding: 0.75rem; border: 1px solid #555; border-radius: 6px; 
                          background: #333; color: white; font-size: 0.9rem;" 
                   placeholder="your-client-id.googleusercontent.com">
        </div>
        
        <div style="margin-bottom: 2rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: #ddd; font-weight: 500;">
                Google API Key:
            </label>
            <input type="text" id="apiKeyInput" value="${r}" 
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
    `,e.appendChild(t),document.body.appendChild(e),t.querySelector("#cancelConfig").addEventListener("click",()=>{document.body.removeChild(e)}),t.querySelector("#saveConfig").addEventListener("click",()=>{let n=t.querySelector("#clientIdInput").value.trim(),a=t.querySelector("#apiKeyInput").value.trim();n&&a?(localStorage.setItem("google_client_id",n),localStorage.setItem("google_api_key",a),document.body.removeChild(e),alert("Google API credentials saved successfully! The page will reload to apply changes."),window.location.reload()):alert("Please enter both Client ID and API Key.")}),e.addEventListener("click",t=>{t.target===e&&document.body.removeChild(e)}),setTimeout(()=>{t.querySelector("#clientIdInput").focus()},100)}}];eg(n,r),ep(n)}(eI)});let R=document.getElementById("exportServicesMenuItem");R&&R.addEventListener("click",()=>{let e=em("\uD83C\uDFC3 Training Platforms","Export to training analysis platforms"),t=er(),n=[{text:"\uD83D\uDEB4 Export to intervals.icu",description:"Upload activity to intervals.icu",disabled:!t,onClick:async()=>{if(t)try{await eo({powerData:eI.powerData,powerAverages:eI.getPowerAverages(),sessionStartTime:eI.sessionStartTime}),alert("Successfully exported to intervals.icu!"),eh(e)}catch(e){alert(`Error exporting to intervals.icu: ${e.message}`)}}},{text:"⚙️ Configure intervals.icu",description:"Set up intervals.icu credentials",onClick:()=>{eh(e);let t=document.createElement("div");t.className="modal-backdrop",t.style.cssText=`
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
    `;let n=document.createElement("div");n.className="config-modal",n.style.cssText=`
        background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
        border-radius: 12px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        color: white;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
    `;let a=localStorage.getItem("intervals_api_key")||"",r=localStorage.getItem("intervals_athlete_id")||"";n.innerHTML=`
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
            <input type="text" id="intervalsApiKeyInput" value="${a}" 
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
            <input type="text" id="intervalsAthleteIdInput" value="${r}" 
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
    `,t.appendChild(n),document.body.appendChild(t),n.querySelector("#cancelIntervalsConfig").addEventListener("click",()=>{document.body.removeChild(t)}),n.querySelector("#saveIntervalsConfig").addEventListener("click",async()=>{let e=n.querySelector("#intervalsApiKeyInput").value.trim(),a=n.querySelector("#intervalsAthleteIdInput").value.trim();if(e&&a)try{let n=await eu(e,a);n.success?(localStorage.setItem("intervals_api_key",e),localStorage.setItem("intervals_athlete_id",a),function(e,t){try{if(!e||"string"!=typeof e||0===e.trim().length)throw Error("Valid API key is required");if(!t||"string"!=typeof t||0===t.trim().length)throw Error("Valid athlete ID is required");let n=e.trim(),a=t.trim();Q.API_KEY=n,Q.ATHLETE_ID=a,Z.intervals.isConfigured=!0,Z.intervals.apiKey=n,Z.intervals.athleteId=a,console.log("intervals.icu configuration initialized successfully")}catch(e){return console.error("Failed to initialize intervals.icu configuration:",e),Z.lastError=e.message,!1}}(e,a),document.body.removeChild(t),alert(`intervals.icu configured successfully!\\nAthlete: ${n.athleteName||a}`)):alert(`Configuration test failed: ${n.error}`)}catch(e){alert(`Error testing configuration: ${e.message}`)}else alert("Please enter both API Key and Athlete ID.")}),t.addEventListener("click",e=>{e.target===t&&document.body.removeChild(t)}),setTimeout(()=>{n.querySelector("#intervalsApiKeyInput").focus()},100)}}];eg(e,n),ep(e)});let N=document.getElementById("exportUtilsMenuItem");N&&N.addEventListener("click",()=>{let e=em("\uD83D\uDEE0️ Utilities","Session management and utilities"),t=[{text:"\uD83D\uDDD1️ Clear Session Data",description:"Clear all session data (cannot be undone)",className:"danger",onClick:()=>{confirm("Are you sure you want to clear all session data? This action cannot be undone.")&&(eI.resetAllSessionData(),alert("Session data cleared successfully!"),eh(e))}}];eg(e,t),ep(e)});let U=function(){try{let e=localStorage.getItem(x);if(!e)return null;let t=JSON.parse(e);if(Date.now()-t.timestamp>864e5)return localStorage.removeItem(x),null;return t}catch(e){return console.warn("Failed to load session data:",e),localStorage.removeItem(x),null}}();U&&await new Promise(e=>{let t=document.createElement("div");t.className="modal-backdrop";let n=document.createElement("div");n.className="modal";let a=Math.round((Date.now()-U.timestamp)/6e4),r=(U.powerData?.length||0)+(U.heartData?.length||0)+(U.cadenceData?.length||0);n.innerHTML=`
      <h3>Previous Session Found</h3>
      <p>
        A previous session was found from ${a} minutes ago with ${r} data points.
      </p>
      <p>
        Would you like to restore this session or start fresh?
      </p>
      <div class="modal-buttons">
        <button id="startFresh" class="modal-button secondary">Start Fresh</button>
        <button id="restoreSession" class="modal-button primary">Restore Session</button>
      </div>
    `,t.appendChild(n),document.body.appendChild(t),n.querySelector("#startFresh").addEventListener("click",()=>{document.body.removeChild(t),S(),e(!1)}),n.querySelector("#restoreSession").addEventListener("click",()=>{document.body.removeChild(t),e(!0)}),t.addEventListener("click",n=>{n.target===t&&(document.body.removeChild(t),e(!1))})})?function(e){try{var t,n;e.powerData&&(ey.length=0,ey.push(...e.powerData)),e.heartData&&(ew.length=0,ew.push(...e.heartData)),e.cadenceData&&(ex.length=0,ex.push(...e.cadenceData)),e.rawPowerMeasurements&&(ev.length=0,ev.push(...e.rawPowerMeasurements)),e.powerReadings&&(C=[...e.powerReadings]),e.powerAverages&&(t=e.powerAverages,Object.assign(E,t),T()),void 0!==e.lastPowerValue&&(eb=e.lastPowerValue),void 0!==e.lastHeartRateValue&&(eS=e.lastHeartRateValue),void 0!==e.lastCadenceValue&&(eC=e.lastCadenceValue),void 0!==e.sessionStartTime&&(eE=e.sessionStartTime),void 0!==(n={power:eb,heartRate:eS,cadence:eC}).power&&M(n.power),void 0!==n.heartRate&&D.hrValueElement&&(D.hrValueElement.textContent=n.heartRate||"--"),void 0!==n.cadence&&D.cadenceValueElement&&(D.cadenceValueElement.textContent=n.cadence||"--"),T(),ey.length>0&&function(e){let t=document.createElement("div");t.style.cssText=`
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
  `,document.head.appendChild(n),document.body.appendChild(t),setTimeout(()=>{t.style.animation="slideIn 0.3s ease-out reverse",setTimeout(()=>{t.parentNode&&t.parentNode.removeChild(t),n.parentNode&&n.parentNode.removeChild(n)},300)},5e3)}(ey.length)}catch(e){return console.warn("Failed to restore session data:",e),!1}}(U):eE=Date.now(),window.addEventListener("beforeunload",function(){ey.length>0&&b(eI)}),setInterval(()=>{ey.length>0&&b(eI)},3e4)}document.addEventListener("DOMContentLoaded",ek);
//# sourceMappingURL=power-saver.2f5402b7.js.map
