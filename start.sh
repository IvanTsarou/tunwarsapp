#!/bin/bash

# Скрипт для запуска локального сервера tunis.sw:9999

PORT=9999
DOMAIN="tunis.sw"

echo "🚀 Запуск сервера для $DOMAIN:$PORT"
echo ""

# Проверка домена
if ! grep -q "$DOMAIN" /etc/hosts 2>/dev/null; then
    echo "⚠️  Домен $DOMAIN не найден в /etc/hosts"
    echo "   Добавьте его командой:"
    echo "   sudo sh -c 'echo \"127.0.0.1    $DOMAIN\" >> /etc/hosts'"
    echo ""
fi

# Запуск сервера
cd "$(dirname "$0")"
echo "📁 Директория: $(pwd)"
echo "🌐 URL: http://$DOMAIN:$PORT"
echo "🌐 Альтернативный URL: http://localhost:$PORT"
echo ""
echo "⏹️  Для остановки нажмите Ctrl+C"
echo ""

python3 -m http.server $PORT

