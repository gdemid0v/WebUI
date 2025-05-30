#!/bin/sh

# Проверка на запуск от root
if [ "$(id -u)" -ne 0 ]; then
    echo "Скрипт должен быть запущен от root"
    exit 1
fi

# Проверка наличия Apache (httpd)
if ! pgrep httpd > /dev/null; then
    echo "Apache не запущен. Установите и запустите Apache."
    exit 1
fi

# Директории для веб-приложения
WEBUI_DIR="/usr/htdocs/webui"
HTML_DIR="$WEBUI_DIR/html/main"
SCRIPTS_DIR="$WEBUI_DIR/scripts"

# Создание директорий
echo "Создание директорий..."
mkdir -p "$HTML_DIR" "$SCRIPTS_DIR"

# Проверка наличия файлов в текущей директории
if [ ! -f index.htm ] || [ ! -f app.js ] || [ ! -d styles ]; then
    echo "Отсутствуют необходимые файлы (index.htm, app.js, styles/). Поместите их в текущую директорию."
    exit 1
fi

# Копирование файлов фронтенда и бэкенда
echo "Копирование файлов..."
cp index.htm app.js styles/*.css "$HTML_DIR/"
cp *.sh "$SCRIPTS_DIR/" 2>/dev/null || echo "Скрипты для копирования не найдены, продолжаем..."

# Настройка прав доступа
echo "Настройка прав доступа..."
chown -R daemon:daemon "$WEBUI_DIR"
chmod -R 755 "$WEBUI_DIR"
chmod +x "$SCRIPTS_DIR"/*.sh 2>/dev/null

# Путь к конфигурационному файлу Apache
CONFIG_FILE="/etc/httpd.conf"

# Настройка конфигурации Apache, если файл существует
if [ -f "$CONFIG_FILE" ]; then
    echo "Настройка конфигурации Apache..."
    # Установка DocumentRoot
    sed -i 's|^DocumentRoot .*|DocumentRoot '"$HTML_DIR"'|' "$CONFIG_FILE"
    
    # Добавление настроек для CGI, если их нет
    if ! grep -q "ScriptAlias /cgi-bin/" "$CONFIG_FILE"; then
        echo "ScriptAlias /cgi-bin/ $SCRIPTS_DIR/" >> "$CONFIG_FILE"
        echo "<Directory \"$SCRIPTS_DIR\">" >> "$CONFIG_FILE"
        echo "    Options +ExecCGI" >> "$CONFIG_FILE"
        echo "    AddHandler cgi-script .sh" >> "$CONFIG_FILE"
        echo "    Require all granted" >> "$CONFIG_FILE"
        echo "</Directory>" >> "$CONFIG_FILE"
    fi
else
    echo "Конфигурационный файл Apache ($CONFIG_FILE) не найден. Настройте вручную."
fi

# Перезапуск Apache
echo "Перезапуск Apache..."
if [ -x /usr/bin/httpd ]; then
    /usr/bin/httpd -k restart
else
    echo "Не удалось перезапустить Apache. Выполните это вручную."
fi

echo "Настройка завершена! Проверьте веб-интерфейс по адресу устройства."