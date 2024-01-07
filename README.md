This is a little project to get the SensorBug BLE device information to be pushed into a data collection system.
It is a bit picky and I had to read a lot of [docs][2] from blueradios.com that show the specific specs
of the device.

It works, but may not be sustainable.  

Issues include:
* You must have an iPhone device pair with the sensor bug before it will emit data.
* You must read the advertisement data to get the data you want.  E.g., iPhone can authenticate, but nothing else can authenticate.  Not sure why, but [this article described the issue][1].
* There are no more sensorbugs to buy!!!!  :-( 
* Running on my own box and not on the rpi, due to lots of posts about linux being difficult to get setup for bluetooth.

Keep forgetting how to spin it up.
```shell
export MQTT_ENDPOINT="mqtt://192.168.1.246:1883"; export SENSOR_BUG_PASSWORD=<password>; node index.js
```

[1]:  https://github.com/IanHarvey/bluepy/issues/381
[2]:  https://www.blueradios.com/hardware_sensors.htm
