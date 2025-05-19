# WebUI
Настройка веб-сервера Apache2 на "КРОНОС"
1) Создал в /var/www/ папки html, scripts
2) В папку html перенес сайт (папку main с проектом)
3) Принял решение оставить штатную конфигурацию Apache в которой читается директория usr

n) Посмотрел в /etc/apache2/httpd.conf куда указаны настройки размещения

n) Создал в этих настройках по пути (/usr/htdocs/) каталог webui, в каталоге webui создал каталоги html, scripts, в каталоге html положил морду

4) Переношу соданные мной файлы в /usr/htdocs/webui
5) В файле /etc/apache2/httpd.conf меняю DocumentRoot с DocumentRoot "/usr/htdocs" на DocumentRoot "/usr/htdocs/webui/html/main"
6) В файле /etc/apache2/httpd.conf меняю Directory с <Directory "/usr/htdocs"> на <Directory "/usr/htdocs/webui/html/main">
7) В файле /etc/apache2/httpd.conf меняю IfModule dir_module с:
<IfModule dir_module>
    DirectoryIndex index.html index.cgi
</IfModule>
на:
<IfModule dir_module>
    DirectoryIndex index.htm index.html index.cgi
</IfModule>

n) Дал права доступа пользователю daemon:
chown -R daemon:daemon /usr/htdocs/webui
chmod -R 755 /usr/htdocs/webui
