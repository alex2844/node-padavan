# History

Retrieves traffic usage statistics.

## Outputs

1. **Standard Output**
   - `msg.payload` (`object`): The raw history object from the router
     (`daily` and `monthly` arrays).
   - `msg.networkUsage` (`string`): Total traffic for the current period
     (Month or Day) in a human-readable format (e.g., "15.2 GB").
   - `msg.networkUsageMB` (`number`): Total traffic in Megabytes (integer).

## Details

This node automatically prioritizes **Monthly** statistics.

1. If monthly history is available, `networkUsage` reflects the current
   month's total.
2. If monthly history is missing (e.g., after a reset), it falls back to
   **Daily** statistics for the current day.

This data structure is optimized for integration with voice assistants (like
Google Home `NetworkControl` trait) and dashboards.
