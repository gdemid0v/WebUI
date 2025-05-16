#!/bin/bash

echo "Content-Type: application/json"
echo ""

# Производитель и модель
Manufacturer=$(grep -m1 'vendor_id' /proc/cpuinfo | awk -F': ' '{print $2}')
Model=$(grep -m1 'model name' /proc/cpuinfo | awk -F': ' '{print $2}' | sed 's/^ *//')

IP_Address=$(ip -4 addr show eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}')
Netmask=$(ip -4 addr show eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}/\d+' | cut -d'/' -f2)

# MAC-адрес
MAC_Address=$(ip link show eth0 2>/dev/null | awk '/link\/ether/ {print $2}' | head -1)
if [ -z "$MAC_Address" ]; then
    MAC_Address="00:00:00:00:00:00" # Запасное значение
fi

# Время загрузки системы
STARTtime=$(uptime -s)

# Время работы системы
UPtime=$(uptime -p | sed 's/up //')

# Текущее время
Time=$(date "+%H:%M:%S %d.%m.%Y")

# Загрузка CPU
CPU=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}')

# Использование RAM
RAM=$(free -m | awk '/Mem:/ {printf "%.1f%%", ($3/$2)*100}')

# Возврат в JSON
cat <<EOF
{
  "Manufacturer": "$Manufacturer",
  "Model": "$Model",
  "IP-Address": "$IP_Address",
  "Netmask": "$Netmask",
  "MAC-Address": "$MAC_Address",
  "STARTtime": "$STARTtime",
  "UPtime": "$UPtime",
  "Time": "$Time",
  "CPU": "$CPU",
  "RAM": "$RAM"
}
EOF