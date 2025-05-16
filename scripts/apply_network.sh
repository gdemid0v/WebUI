#!/bin/bash

echo "Content-Type: application/json"
echo ""

# Чтение данных из POST-запроса
read -r data
ip=$(echo "$data" | jq -r '.ip')
mask=$(echo "$data" | jq -r '.mask')

# Применение настроек
sudo ip addr flush dev eth0
sudo ip addr add ${ip}/${mask} dev eth0
sudo ip link set dev eth0 up

# Возврат результата
echo '{"status": "success", "new_ip": "'$ip'"}'