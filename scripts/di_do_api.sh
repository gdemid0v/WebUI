#!/bin/sh

echo "Content-Type: application/json; charset=utf-8"
echo ""

CONFIG_FILE="/etc/cons/cons.conf"
JSON="{"
FIRST_ENTRY=1

while IFS= read -r line; do
    case "$line" in
        DIGITAL[0-9]*\ =*|DIGDIR[0-9]*\ =*)
            key=${line%% *}
            path=${line#*= }
            value=$( [ -r "$path" ] && tr -d '\n\r' < "$path" 2>/dev/null || echo "error" )

            [ "$FIRST_ENTRY" -eq 0 ] && JSON="$JSON," || FIRST_ENTRY=0
            JSON="$JSON \"$key\": { \"path\": \"$path\", \"value\": \"$value\" }"
            ;;
    esac
done < "$CONFIG_FILE"

JSON="$JSON }"
echo "$JSON"
