# Parameters

Retrieve and modify parameters


### Input

| msg           | type
| ---           | ---
| *`payload`*   | object
| `topic`       | string


| topic     | Description
| ---       | ---
| *`list`*  | Retrieve all parameters
| *`get`*   | Retrieve specific parameters
| *`set`*   | Modify parameters


| payload           |
| ---               |
| *`sid_list`*      |
| *`action_mode`*   |


### Output

| msg       | type
| ---       | ---
| `topic`   | string
| `payload` | object


### Details

If `sid_list` is specified, changes will be sent via the web panel.

If `action_mode` is not specified, it will be sent as ` Apply `.
