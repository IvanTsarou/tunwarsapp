#!/usr/bin/env python3
"""
Скрипт для создания иконок PWA для TunWars App
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
    
    # Размеры иконок
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    # Создаем папку icons если её нет
    os.makedirs('icons', exist_ok=True)
    
    print("🎨 Создание иконок PWA...")
    
    for size in sizes:
        # Создаем изображение с градиентом
        img = Image.new('RGB', (size, size), color='#667eea')
        draw = ImageDraw.Draw(img)
        
        # Рисуем градиент (упрощенный - несколько прямоугольников)
        steps = 20
        for i in range(steps):
            y_start = int(size * i / steps)
            y_end = int(size * (i + 1) / steps)
            ratio = i / steps
            
            # Градиент от #667eea через #764ba2 к #f093fb
            if ratio < 0.5:
                # Первая половина: #667eea -> #764ba2
                r1, g1, b1 = 0x66, 0x7e, 0xea
                r2, g2, b2 = 0x76, 0x4b, 0xa2
                local_ratio = ratio * 2
            else:
                # Вторая половина: #764ba2 -> #f093fb
                r1, g1, b1 = 0x76, 0x4b, 0xa2
                r2, g2, b2 = 0xf0, 0x93, 0xfb
                local_ratio = (ratio - 0.5) * 2
            
            r = int(r1 + (r2 - r1) * local_ratio)
            g = int(g1 + (g2 - g1) * local_ratio)
            b = int(b1 + (b2 - b1) * local_ratio)
            
            draw.rectangle([(0, y_start), (size, y_end)], fill=(r, g, b))
        
        # Рисуем иконку - компас/карта
        center = size // 2
        outer_radius = size // 3
        inner_radius = int(outer_radius * 0.7)
        line_width = max(2, size // 40)
        
        # Внешний круг
        draw.ellipse(
            [center - outer_radius, center - outer_radius,
             center + outer_radius, center + outer_radius],
            outline='white', width=line_width
        )
        
        # Внутренний круг
        draw.ellipse(
            [center - inner_radius, center - inner_radius,
             center + inner_radius, center + inner_radius],
            outline='white', width=max(1, line_width // 2)
        )
        
        # Крест (север-юг-восток-запад)
        # Вертикальная линия
        draw.line(
            [center, center - outer_radius, center, center + outer_radius],
            fill='white', width=line_width
        )
        # Горизонтальная линия
        draw.line(
            [center - outer_radius, center, center + outer_radius, center],
            fill='white', width=line_width
        )
        
        # Точка в центре
        dot_size = max(3, size // 30)
        draw.ellipse(
            [center - dot_size, center - dot_size,
             center + dot_size, center + dot_size],
            fill='white'
        )
        
        # Звезда вверху (для темы Звёздных войн)
        star_size = size // 6
        star_y = center - int(outer_radius * 0.3)
        
        # Рисуем простую 5-конечную звезду
        star_points = []
        for i in range(10):
            angle = (i * 3.14159 / 5) - 1.5708  # -90 degrees
            if i % 2 == 0:
                radius = star_size // 2
            else:
                radius = star_size // 4
            x = center + int(radius * (1 if i < 5 else -1) * 0.3)
            y = star_y + int(radius * (1 if i < 5 else -1) * 0.3)
            star_points.append((x, y))
        
        if len(star_points) >= 3:
            draw.polygon(star_points[:5], fill='#FFE81F', outline=None)
        
        # Сохраняем
        output_path = f'icons/icon-{size}x{size}.png'
        img.save(output_path, 'PNG', optimize=True)
        print(f'✅ Создана: {output_path}')
    
    print(f'\n🎉 Все {len(sizes)} иконок успешно созданы в папке icons/!')
    
except ImportError:
    print("❌ Ошибка: Pillow не установлен")
    print("Установите его командой: pip3 install --user Pillow")
    exit(1)
except Exception as e:
    print(f"❌ Ошибка при создании иконок: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

