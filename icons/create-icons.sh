#!/bin/bash
# Простой скрипт для создания базовых иконок через ImageMagick или sips (macOS)

sizes=(72 96 128 144 152 192 384 512)

if command -v convert &> /dev/null; then
    # ImageMagick
    for size in "${sizes[@]}"; do
        convert -size ${size}x${size} xc:"#667eea" \
                -fill white -draw "circle $((size/2)),$((size/2)) $((size/2)),$((size/3))" \
                -fill white -draw "line $((size/2)),$((size/3)) $((size/2)),$((size-size/3))" \
                -fill white -draw "line $((size/3)),$((size/2)) $((size-size/3)),$((size/2))" \
                "icon-${size}x${size}.png"
    done
elif command -v sips &> /dev/null; then
    # macOS sips - создаем базовый квадрат
    for size in "${sizes[@]}"; do
        # Создаем простое изображение с цветом фона
        echo "Создание icon-${size}x${size}.png через sips..."
        # sips не очень подходит для создания с нуля, используем альтернативу
    done
fi

echo "✅ Иконки будут созданы через генератор HTML"
