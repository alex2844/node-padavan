# Devices

Retrieves the list of currently connected devices from the router.

## Outputs

1. **Standard Output**
   - `msg.payload` (`array`): An array of current device objects. Each object
     contains:
     - `hostname`: Device name.
     - `ip`: IP address.
     - `mac`: MAC address.
     - `type`: Connection type (`eth`, `2.4GHz`, `5GHz`).
     - `rssi`: Signal strength (for Wi-Fi clients).
   - `msg.numConnectedDevices` (`number`): The total count of connected
     devices.
   - `msg.changes` (`object`): A summary of changes since the last check.
     - `hasChanges` (`boolean`): `true` if any change occurred.
     - `added` (`array`): List of new devices.
     - `removed` (`array`): List of disconnected devices.
     - `changed` (`array`): List of devices with changed properties (IP, name,
       type).

## Details

Any message sent to this node triggers a fresh lookup.

The node implements **smart caching** to filter out "ghost" entries (e.g.,
when a device switches from Wi-Fi to Ethernet in the ARP table momentarily
during disconnection).
