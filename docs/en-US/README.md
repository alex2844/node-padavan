# padavan

[![version](https://img.shields.io/npm/v/padavan.svg)](https://www.npmjs.org/package/padavan)
[![commit](https://img.shields.io/github/last-commit/alex2844/node-padavan.svg)](https://github.com/alex2844/node-padavan)
[![engine](https://img.shields.io/badge/Node--RED-contrib--padavan-red.svg)](node-red/README.md)
[![ru](https://img.shields.io/badge/lang-ru-white)](../ru/README.md)
[![en](https://img.shields.io/badge/lang-en-green)](README.md)

Router management with Padavan firmware


## Install

``` shell
npm install padavan
```


## Usage

```javascript
import Padavan from 'padavan';
const client = new Padavan({
    repo, branch, token, // GITHUB
    host, username, password // Router
});
```


## API

### Get current status
```javascript
await client.getStatus();
// { lavg, uptime, ram, swap, cpu, wifi2, wifi5 }
```

### Get traffic history
```javascript
await client.getHistory();
// { daily_history, monthly_history }
```

### Get logs
```javascript
await client.getLog();
```

### Get device list
```javascript
await client.getDevices();
// [{ hostname, ip, mac, rssi }]
```

### Get parameters
```javascript
await client.getParams(); // Object with all parameters
await client.getParams('firmver_sub'); // Only { firmver_sub }
await client.getParams([ 'firmver_sub', 'ip6_service' ]); // { firmver_sub, ip6_service }
```

### Set parameters
```javascript
await client.setParams({
	sid_list: 'IP6Connection;',
	ip6_service: '6in4'
}); // Enable ipv6
await client.setParams({
	ip6_service: ''
}); // Disable ipv6
```

### Start SpeedTest on the device
```javascript
await client.startSpeedTest();
// { networkDownloadSpeedMbps, networkUploadSpeedMbps }
```

### Start firmware build in the repository
```javascript
await client.startBuild();
```

### Get the firmware changelog
```javascript
await client.getChangelog();
await client.getChangelog(from_id, to_id);
// { from_id, to_id, data: [] }
```

### Start firmware upgrade
```javascript
await client.startUpgrade();
```

### Reboot
```javascript
await client.startReboot();
```

### Find repositories with firmware for the device
```javascript
await client.find();
await client.find(productid);
// [{ repo, branch, active, created_at, name }]
```
