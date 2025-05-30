#!/bin/sh

echo "Content-Type: application/json; charset=utf-8"
echo ""

CONFIG_FILE="/etc/cons/cons.conf"
FIRST_ENTRY=1
printf '{'

while IFS= read -r line; do
    case "$line" in
        RELAY[0-9]*\ =*)
            key=${line%% *}
            path=${line#*= }

            if [ -f "$path" ]; then
                value=$(tr -d '\r\n' < "$path")
            else
                value="error"
            fi

            [ "$FIRST_ENTRY" -eq 0 ] && printf ',' || FIRST_ENTRY=0

            esc_path=$(printf '%s' "$path" | sed 's/"/\\"/g')
            esc_value=$(printf '%s' "$value" | sed 's/"/\\"/g')

            printf ' "%s": { "path": "%s", "value": "%s" }' "$key" "$esc_path" "$esc_value"
            ;;
    esac
done < "$CONFIG_FILE"

printf ' }\n'
