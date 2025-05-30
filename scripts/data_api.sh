#!/bin/sh

echo "Content-Type: application/json; charset=utf-8"
echo ""

MANUFACTURER="РЭА-Т"
MODEL="КРОНОС SI-SDB2-MB-2U"

# Получение интерфейса
INTERFACE="eth0"

ip_output=$(ip -4 addr show "$INTERFACE")
IP_Address=$(echo "$ip_output" | grep -o 'inet [0-9.]*' | awk '{print $2}')
Netmask=$(echo "$ip_output" | grep -o 'inet [0-9./]*' | cut -d'/' -f2)

# Текущая дата
Time=$(date "+%H:%M:%S %d.%m.%Y")

# Время работы системы (Значение в секундах)
UPtime=$(awk '{printf $1}' /proc/uptime)

# Возврат в JSON
cat <<EOF
{
  "Manufacturer": "$MANUFACTURER",
  "Model": "$MODEL",
  "IP-Address": "$IP_Address",
  "Netmask": "$Netmask",
  "UPtime": "$UPtime",
  "Time": "$Time"
}
EOF