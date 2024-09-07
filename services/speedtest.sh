#!/usr/bin/env bash

size=25000000;
iterations=5;
json=$(curl -s https://www.speedtest.net/api/js/servers?limit=1);
url_upload=$(echo "${json}" | grep -o '"url":"[^"]*"' | sed 's/"url":"\([^"]*\)".*/\1/' | sed 's/\\//g');
url_download=$(echo "${url_upload}" | sed 's@\(/\([^/]*\)/\([^/]*\)/\).*@\1download?size=@');
speed_download=0;
speed_upload=0;
speed_upload_total=0;
speed_download_total=0;
available_space=$(df /tmp/ | awk 'NR==2 {print $4}');
available_space=$((available_space * 1024 - 1048576));
if [ -n "$available_space" ] && [ "$available_space" -lt "$size" ]; then
	size=$available_space
fi
for i in $(seq 1 $iterations); do
	speed_download=$(curl --connect-timeout 8 "${url_download}${size}" -w "%{speed_download}" -o /tmp/speedtest.bin -s);
	speed_upload=$(curl --connect-timeout 8 -F "file=@/tmp/speedtest.bin" "${url_upload}" -w "%{speed_upload}" -o /dev/null -s);
	speed_upload_total=$((speed_upload_total + speed_upload));
	speed_download_total=$((speed_download_total + speed_download));
	rm -f /tmp/speedtest.bin;
done
echo "download=$((speed_download_total / iterations))";
echo "upload=$((speed_upload_total / iterations))";
