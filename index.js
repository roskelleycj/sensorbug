const mqtt = require("mqtt")

if (!process.env.MQTT_ENDPOINT) {
  console.log('Did you forget to set the MQTT_ENDPOINT?')
  process.exit(1)
}
if (!process.env.SENSOR_BUG_PASSWORD) {
  console.log('Did you forget to set the SENSOR_BUG_PASSWORD?')
  process.exit(1)
}
const mqttClient = mqtt.connect(process.env.MQTT_ENDPOINT, {
  clientId: 'sensors/mac/in/office-1/cjr-laptop',
  username: 'sensorBug',
  password: process.env.SENSOR_BUG_PASSWORD
});
const noble = require('@abandonware/noble');

const DEBUG_LOGS = process.env.DEBUG

noble.on('stateChange', async (state) => {
  if (state === 'poweredOn') {
    console.log('Starting scan...')
    await noble.startScanningAsync([], false);
  }
});

function log(msg) {
  if (DEBUG_LOGS) {
    console.log(msg)
  }
}

noble.on('discover', async (peripheral) => {
  await noble.stopScanningAsync();

  log(`Peripheral with ID '${peripheral.id}' found`);
  const advertisement = peripheral.advertisement;

  const localName = advertisement.localName;
  const txPowerLevel = advertisement.txPowerLevel;
  const manufacturerData = advertisement.manufacturerData;

  if (localName) {
    log(`  Local Name        = ${localName}`);
  }

  if (txPowerLevel) {
    log(`  TX Power Level    = ${txPowerLevel}`);
  }

  if (manufacturerData) {
    log(`  Manufacturer Data = ${manufacturerData.toString('hex')}`);
    //      let data = Buffer.from([0x85, 0x00, 0x02, 0x00, 0x3c, 0x5e, 0x00, 0x43, 0x4e, 0x01])
    // let data = Buffer.from([0x85,0x00,0x02,0x00,0x3c,0x5c,0x01,0x43,0xd6,0xff])
    const data = manufacturerData
    const blueRadiosCid = data[1].toString(16).padStart(2, '0') + data[0].toString(16).padStart(2, '0')
    const majorPid = data[2].toString(16).padStart(2, '0')
    const minorPid = data[3].toString(16).padStart(2, '0')
    if (blueRadiosCid === '0085' && majorPid === '02' && minorPid === '00') {
      console.log(`Found: ${JSON.stringify(peripheral.advertisement)}`);
      console.log(`${new Date().toISOString()}: Manufacturer Data = ${manufacturerData.toString('hex')}`);

      const templateIdByte = data[4].toString(16).padStart(2, '0')
      const encrypted = data[4] >> 7 === 1
      if (templateIdByte === '3c' && !encrypted) {
        const batteryLevel = data[5]
        const configCounter = data[6]
        log(`  Battery Level '${batteryLevel}%' and configuration counter ${configCounter}`)

        const dynamicDataStructureId = data[7]
        log(`  DynamicDataStructureId '${dynamicDataStructureId}'`)
        const alertEnabledFlag = dynamicDataStructureId >> 7
        if (alertEnabledFlag) {
          log(`  Alert Flag enabled.  Not coded to handle that.  Skipping.`)
        }
        else {
          const dataFlag = dynamicDataStructureId >> 6 & 0b01
          if (dataFlag) {
            const dynamicDataStructureDataType = dynamicDataStructureId & 0b00111111
            if (dynamicDataStructureDataType === 3) {
              const lsb = data[8]
              const msb = data[9] << 8
              const combinedNumber = msb + lsb
              const negative = combinedNumber & 32768
              let value
              if (negative === 0) {
                value = combinedNumber
              }
              else {
                value = (combinedNumber ^ 65535) + 1;
              }
              const temperatureC = value * 0.0625
              const temperatureF = (temperatureC * 9/5) + 32

              log(`  Temperature C '${temperatureC}' F '${temperatureF}'` )
              const temperatureData = {
                fahrenheit: temperatureF,
                celsius: temperatureC,
              }
              const batteryData = {
                power_level: batteryLevel,
                battery_included: true
              }
              if (mqttClient.connected) {
                let temperatureJson = JSON.stringify(temperatureData);
                let batteryJson = JSON.stringify(batteryData);
                console.log(`${new Date().toISOString()}: emitting event: [${temperatureJson}, ${batteryJson}]`)
                mqttClient.publish(`sensors/blebug/out/front-porch-1/SensorBug109136/temperature`, temperatureJson, (error, packet) => {
                  if (error) {
                    log(error)
                  }
                })
                mqttClient.publish(`sensors/blebug/out/front-porch-1/SensorBug109136/battery`, batteryJson, (error, packet) => {
                  if (error) {
                    log(error)
                  }
                })
              }
            }
            else {
              log(`  Dynamic Data Structure Data Type must be '3' and found '${dynamicDataStructureDataType}' Skipping.`)
            }
          }
          else {
            log(`  Data Flag NOT enabled.  Not coded to handle that.  Skipping.`)
          }
        }
      }
      else {
        log(`  Template ID Byte or encrypted does not match '3c' found '${templateIdByte}' and encrypted '${encrypted}'`)
      }
      // Waiting 1m before getting next set of stats.  E.g., what good does 1s stats do?
      await new Promise(r => setTimeout(r, 60000));
    }
    else {
      log(`Skipping as it is not a BlueSense device.`)
    }
  }

  log("##############################");

  // Turn scanning back on
  await noble.startScanningAsync([], false);

});

process.on('SIGINT', function () {
  console.log('Caught interrupt signal');
  noble.stopScanning(() => process.exit());
});

process.on('SIGQUIT', function () {
  console.log('Caught interrupt signal');
  noble.stopScanning(() => process.exit());
});

process.on('SIGTERM', function () {
  console.log('Caught interrupt signal');
  noble.stopScanning(() => process.exit());
});

mqttClient.publish(`sensors/mac/in/office-1/cjr-laptop/connect`, JSON.stringify({start: true}), (error, packet) => {
  console.log("start")
  if (error) {
    console.log(error)
  }
})
