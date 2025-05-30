#!/bin/sh

echo "Content-Type: application/json"
echo ""

read -r data

ip=$(echo "$data" | sed -n 's/.*"ip":"\([^"]*\)".*/\1/p')
mask=$(echo "$data" | sed -n 's/.*"mask":"\([^"]*\)".*/\1/p')

if [ -z "$ip" ] || [ -z "$mask" ]; then
    echo '{"status": "error", "message": "Invalid IP or mask"}' >&2
    exit 1
fi

config_dir="/tmp"
new_file="interfaces_$(date +%s).conf"
full_path="${config_dir}/${new_file}"

cat > "$full_path" <<EOF
# Configure Loopback
auto lo
iface lo inet loopback
#
auto eth0
iface eth0 inet static
 hwaddress ether 00:00:00:00:00:AA
 address $ip
 netmask $mask
#gateway 192.168.1.1
EOF

if [ -f "$full_path" ]; then
    echo '{"status": "success", "filename": "'$new_file'"}'
else
    echo '{"status": "error", "message": "File creation failed"}' >&2
    exit 1
fi