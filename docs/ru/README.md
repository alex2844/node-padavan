# padavan

[![version](https://img.shields.io/npm/v/padavan.svg)](https://www.npmjs.org/package/padavan)
[![commit](https://img.shields.io/github/last-commit/alex2844/node-padavan.svg)](https://github.com/alex2844/node-padavan)
[![engine](https://img.shields.io/badge/Node--RED-contrib--padavan-red.svg)](node-red/README.md)
[![ru](https://img.shields.io/badge/lang-ru-green)](README.md)
[![en](https://img.shields.io/badge/lang-en-white)](../en-US/README.md)

Управление роутером с прошивкой padavan


## Установка

``` shell
npm install padavan
```


## Использование

```javascript
import Padavan from 'padavan';
const client = new Padavan({
    repo, branch, token, // GITHUB
    host, username, password // Router
});
```


## API

### Получить текущее состояние
```javascript
await client.getStatus();
// { lavg, uptime, ram, swap, cpu, wifi2, wifi5 }
```

### Получить историю трафика
```javascript
await client.getHistory();
// { daily_history, monthly_history }
```

### Получить логи
```javascript
await client.getLog();
```

### Получить список устройств
```javascript
await client.getDevices();
// [{ hostname, ip, mac, rssi }]
```

### Получить параметры
```javascript
await client.getParams(); // Объект со всеми параметрами
await client.getParams('firmver_sub'); // Только { firmver_sub }
await client.getParams([ 'firmver_sub', 'ip6_service' ]); // { firmver_sub, ip6_service }
```

### Изменить параметры
```javascript
await client.setParams({
	sid_list: 'IP6Connection;',
	ip6_service: '6in4'
}); // Включить ipv6
await client.setParams({
	ip6_service: ''
}); // Выключить ipv6
```

### Запустить SpeedTest на устройстве
```javascript
await client.startSpeedTest();
// { networkDownloadSpeedMbps, networkUploadSpeedMbps }
```

### Запустить сборку прошивки в репозитории
```javascript
await client.startBuild();
```

### Получить список изменений прошивки
```javascript
await client.getChangelog();
await client.getChangelog(from_id, to_id);
// { from_id, to_id, data: [] }
```

### Запустить устновку прошивки
```javascript
await client.startUpgrade();
```

### Перезагрузить
```javascript
await client.startReboot();
```

### Найти репозитории с прошивками для устройства
```javascript
await client.find();
await client.find(productid);
// [{ repo, branch, active, created_at, name }]
```
