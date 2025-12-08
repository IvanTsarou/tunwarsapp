// Основной JavaScript для сайта локаций Туниса

let map;
let markers = [];

// Маппинг регионов к цветам иконок
const regionColors = {
    'СТОЛИЦА И ОКРЕСТНОСТИ': '#3B82F6',
    'ДРЕВНИЕ ГОРОДА': '#8B5CF6',
    'ЗВЁЗДНЫЕ ВОЙНЫ': '#FFE81F',
    'ОСТРОВА И ПОБЕРЕЖЬЕ': '#06B6D4',
    'ПУСТЫНЯ И СОЛЬ': '#F59E0B',
    'ОАЗИС ТАУЗАР/НЕФТА': '#10B981',
    'СЕВЕР (РЕКОМЕНДУЕМЫЕ)': '#EC4899'
};

// Создание кастомной иконки
function createCustomIcon(location) {
    const color = location.isStarWars ? '#FFE81F' : (regionColors[location.region] || '#3B82F6');
    const iconClass = location.isStarWars ? 'fa-jedi' : getIconClass(location.region);
    
    return L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                background: ${location.isStarWars ? 'linear-gradient(135deg, #FFE81F 0%, #FFC107 100%)' : color};
                width: ${location.isStarWars ? '35px' : '30px'};
                height: ${location.isStarWars ? '35px' : '30px'};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: ${location.isStarWars ? '3px solid #000' : '2px solid white'};
                box-shadow: 0 ${location.isStarWars ? '4px 8px' : '2px 6px'} rgba(0,0,0,0.3);
            ">
                <i class="fas ${iconClass}" style="color: ${location.isStarWars ? '#000' : 'white'}; font-size: ${location.isStarWars ? '16px' : '12px'};"></i>
            </div>
        `,
        iconSize: [location.isStarWars ? 35 : 30, location.isStarWars ? 35 : 30],
        iconAnchor: [location.isStarWars ? 17.5 : 15, location.isStarWars ? 17.5 : 15]
    });
}

function getIconClass(region) {
    const icons = {
        'СТОЛИЦА И ОКРЕСТНОСТИ': 'fa-landmark',
        'ДРЕВНИЕ ГОРОДА': 'fa-monument',
        'ОСТРОВА И ПОБЕРЕЖЬЕ': 'fa-water',
        'ПУСТЫНЯ И СОЛЬ': 'fa-sun',
        'ОАЗИС ТАУЗАР/НЕФТА': 'fa-tree',
        'СЕВЕР (РЕКОМЕНДУЕМЫЕ)': 'fa-mountain'
    };
    return icons[region] || 'fa-map-marker-alt';
}

// Инициализация карты
function initMap() {
    map = L.map('map').setView([33.8869, 10.1028], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Добавляем маркеры
    if (typeof locations !== 'undefined' && locations) {
        addMarkersToMap();
    }
    
    // Кеширование тайлов для PWA (кешируем при первом просмотре)
    setupTileCaching();
}

// Настройка кеширования тайлов Leaflet для офлайн-работы
function setupTileCaching() {
    if (!('serviceWorker' in navigator)) {
        return; // Service Worker не поддерживается
    }
    
    let lastCacheTime = 0;
    const CACHE_DELAY = 2000; // Кешируем тайлы через 2 секунды после изменения карты
    
    // Кешируем тайлы после движения/зума карты
    map.on('moveend zoomend', () => {
        const now = Date.now();
        
        // Ограничиваем частоту запросов на кеширование
        if (now - lastCacheTime < CACHE_DELAY) {
            return;
        }
        
        lastCacheTime = now;
        
        // Получаем границы видимой области
        const bounds = map.getBounds();
        const zoom = map.getZoom();
        
        // Отправляем запрос Service Worker для кеширования тайлов
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'CACHE_TILES',
                bounds: {
                    north: bounds.getNorth(),
                    south: bounds.getSouth(),
                    east: bounds.getEast(),
                    west: bounds.getWest()
                },
                zoom: zoom
            });
        }
    });
    
    // Кешируем тайлы при первом открытии карты
    setTimeout(() => {
        const bounds = map.getBounds();
        const zoom = map.getZoom();
        
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'CACHE_TILES',
                bounds: {
                    north: bounds.getNorth(),
                    south: bounds.getSouth(),
                    east: bounds.getEast(),
                    west: bounds.getWest()
                },
                zoom: zoom
            });
        }
    }, 1000);
}

// Добавление маркеров на карту
function addMarkersToMap() {
    // Очищаем существующие маркеры
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    locations.forEach(location => {
        const icon = createCustomIcon(location);
        const [lon, lat] = location.coordinates;
        
        const marker = L.marker([lat, lon], { icon }).addTo(map);
        
        const popupContent = `
            <div style="padding: 10px; min-width: 200px;">
                <h3 style="margin: 0 0 10px 0; font-size: 1.1em; font-weight: bold;">${location.name}</h3>
                <p style="margin: 5px 0; color: #666; font-size: 0.9em;"><strong>Регион:</strong> ${location.region}</p>
                ${location.isStarWars ? '<p style="margin: 5px 0;"><span style="background: linear-gradient(135deg, #FFE81F 0%, #FFC107 100%); color: #000; padding: 3px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold;">⭐ ЗВЁЗДНЫЕ ВОЙНЫ</span></p>' : ''}
                <p style="margin: 10px 0 0 0; color: #555; font-size: 0.85em; line-height: 1.4;">${location.description}</p>
                <a href="location.html?id=${location.id}" 
                   style="display: inline-block; margin-top: 12px; padding: 8px 16px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-size: 0.9em; font-weight: 500; transition: background 0.2s;"
                   onmouseover="this.style.background='#059669'"
                   onmouseout="this.style.background='#10b981'">
                    Подробнее →
                </a>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        markers.push(marker);
    });

    // Автоматическое масштабирование
    if (locations.length > 0) {
        const bounds = L.latLngBounds(locations.map(loc => [loc.coordinates[1], loc.coordinates[0]]));
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

// Функция для показа локации на карте
function showOnMap(locationId) {
    if (typeof locations === 'undefined' || !locations) {
        console.error('Данные локаций не загружены');
        return;
    }
    
    const location = locations.find(loc => loc.id === locationId);
    if (!location) {
        console.error(`Локация с id ${locationId} не найдена`);
        return;
    }
    
    const [lon, lat] = location.coordinates;
    
    // Прокручиваем к карте
    document.getElementById('map').scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Перемещаем карту к локации
    if (map) {
        map.setView([lat, lon], 12, { animate: true });
        
        // Открываем попап
        const marker = markers.find(m => {
            const markerLatLng = m.getLatLng();
            return Math.abs(markerLatLng.lat - lat) < 0.001 && Math.abs(markerLatLng.lng - lon) < 0.001;
        });
        
        if (marker) {
            setTimeout(() => marker.openPopup(), 500);
        }
    }
}

// Получить одно лучшее фото для локации
function getBestLocationPhoto(location) {
    // Проверяем массив photos - первое фото обычно самое лучшее/известное
    if (location.photos && Array.isArray(location.photos) && location.photos.length > 0) {
        const firstPhoto = location.photos[0];
        // Проверяем что фото не пустое
        if (firstPhoto && firstPhoto.trim() !== '') {
            return firstPhoto; // Первое фото обычно самое качественное
        }
    }
    // Если нет массива photos, но есть photoUrl, используем его
    if (location.photoUrl && location.photoUrl.trim() !== '') {
        return location.photoUrl;
    }
    // Если нет фото, возвращаем null
    return null;
}

// Создание карточки локации
function createLocationCard(location) {
    const [lon, lat] = location.coordinates;
    const photo = getBestLocationPhoto(location);
    
    // Ссылки на карты
    const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
    const mapsMeUrl = `mapsme://map?v=1&ll=${lat},${lon}&n=${encodeURIComponent(location.name)}`;
    
    // Кодирование фото для отображения
    let encodedPhoto = photo;
    if (photo && !photo.startsWith('http') && !photo.startsWith('data:')) {
        // Правильное кодирование пути к фото
        const pathParts = photo.split('/');
        encodedPhoto = pathParts.map((part, idx) => {
            if (idx === 0) return part;
            // Кодируем каждый сегмент пути отдельно
            return encodeURIComponent(part);
        }).join('/');
    }
    
    // Отладка для локации Матмата (id: 10)
    if (location.id === 10) {
        console.log('🔍 Матмата - Отель Sidi Driss:', {
            id: location.id,
            name: location.name,
            photoUrl: location.photoUrl,
            photos: location.photos,
            photosLength: location.photos ? location.photos.length : 0,
            selectedPhoto: photo,
            encodedPhoto: encodedPhoto
        });
    }
    
    // Отладка: проверяем что photo не null/undefined
    if (location.id === 10 && !photo) {
        console.error('❌ Матмата: photo is null/undefined!', {
            photoUrl: location.photoUrl,
            photos: location.photos,
            photosType: typeof location.photos,
            photosIsArray: Array.isArray(location.photos)
        });
    }
    
    return `
        <div class="location-card bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer" 
             data-location-id="${location.id}" 
             data-region="${location.region}" 
             data-star-wars="${location.isStarWars}">
            <!-- Single Photo -->
            <div class="relative" style="height: 240px; overflow: hidden; border-radius: 0.5rem 0.5rem 0 0; background-color: #f3f4f6; pointer-events: none;">
                ${photo && encodedPhoto ? `
                    <img src="${encodedPhoto}" 
                         alt="${location.name}" 
                         style="width: 100%; height: 100%; object-fit: cover; display: block !important; visibility: visible !important; opacity: 1 !important; pointer-events: none;"
                         onerror="console.error('Ошибка загрузки фото:', '${encodedPhoto}'); this.parentElement.innerHTML='<div class=\\'flex items-center justify-center bg-gray-100 text-gray-400 h-full\\'><div class=\\'text-center\\'><i class=\\'fas fa-image text-4xl mb-2\\'></i><p class=\\'text-sm\\'>Фото не загружено: ${encodedPhoto}</p></div></div>';"
                         onload="console.log('Фото загружено:', '${encodedPhoto}');"
                         loading="lazy">
                ` : `
                    <div class="flex items-center justify-center bg-gray-100 text-gray-400 h-full">
                        <div class="text-center">
                            <i class="fas fa-image text-4xl mb-2"></i>
                            <p class="text-sm">Фото отсутствует</p>
                            <p class="text-xs mt-1">ID: ${location.id}, Photo: ${photo || 'null'}</p>
                        </div>
                    </div>
                `}
                
                ${location.isStarWars ? `
                    <div class="absolute top-3 right-3 z-50" style="z-index: 60 !important; pointer-events: none;">
                        <span class="star-wars-badge px-3 py-1 rounded-full text-xs font-bold text-black shadow-lg">
                            <i class="fas fa-jedi mr-1"></i>ЗВЁЗДНЫЕ ВОЙНЫ
                        </span>
                    </div>
                ` : ''}
            </div>
            
            <!-- Card Content -->
            <div class="p-4 sm:p-5">
                <h3 class="text-lg sm:text-xl font-bold text-gray-800 mb-1">${location.name}</h3>
                <p class="text-gray-500 text-xs mb-2 sm:mb-3">${location.region}</p>
                <p class="text-gray-600 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 line-clamp-3">${location.description}</p>
                
                <!-- Coordinates and Map Links - размещены по разным сторонам -->
                <div class="mb-4 pt-3 border-t border-gray-100" style="pointer-events: auto;">
                    <div class="flex items-center justify-between">
                        <!-- Google Maps слева -->
                        <a href="${googleMapsUrl}" 
                           target="_blank" 
                           class="flex items-center text-sm sm:text-base text-blue-600 hover:text-blue-800 font-semibold transition py-1.5 px-2 sm:py-2 sm:px-4 rounded-lg hover:bg-blue-50"
                           onclick="event.stopPropagation();">
                            <i class="fab fa-google mr-1 sm:mr-2 text-base sm:text-lg"></i>
                            <span class="hidden sm:inline">Google Maps</span>
                            <span class="sm:hidden">GMaps</span>
                        </a>
                        
                        <!-- Coordinates в центре -->
                        <div class="flex items-center text-xs text-gray-500 mx-1 sm:mx-2" style="pointer-events: none;">
                            <i class="fas fa-map-marker-alt mr-0.5 sm:mr-1 text-green-600 text-xs"></i>
                            <span class="text-xs sm:text-sm">${lat.toFixed(4)}, ${lon.toFixed(4)}</span>
                        </div>
                        
                        <!-- Maps.me справа -->
                        <a href="${mapsMeUrl}" 
                           class="flex items-center text-sm sm:text-base text-green-600 hover:text-green-800 font-semibold transition py-1.5 px-2 sm:py-2 sm:px-4 rounded-lg hover:bg-green-50"
                           onclick="event.stopPropagation();">
                            <i class="fas fa-map-marked-alt mr-1 sm:mr-2 text-base sm:text-lg"></i>
                            <span class="hidden sm:inline">Maps.me</span>
                            <span class="sm:hidden">Maps</span>
                        </a>
                    </div>
                </div>
                
                <!-- Actions -->
                <div class="flex gap-2" style="pointer-events: auto;">
                    <a href="location.html?id=${location.id}" 
                       class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition text-center"
                       onclick="event.stopPropagation(); event.preventDefault(); window.location.href='location.html?id=${location.id}';">
                        <i class="fas fa-info-circle mr-2"></i>
                        Подробнее
                    </a>
                    <button onclick="event.stopPropagation(); event.preventDefault(); showOnMap(${location.id});" 
                            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition">
                        <i class="fas fa-map-marker-alt mr-2"></i>
                        На карте
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Хранилище текущих индексов фото для каждой карточки
var cardPhotoIndices = {};

// Инициализация фотогалереи карточки
function initCardGallery(cardId, photoCount) {
    if (photoCount <= 1) return;
    cardPhotoIndices[cardId] = 0;
    // Убеждаемся что слайдер в начальной позиции
    const slider = document.getElementById(`slider-${cardId}`);
    if (slider) {
        slider.style.transform = 'translateX(0%)';
    }
    updateCardPhotoIndicator(cardId, 0);
}

// Навигация по фото в карточке
function navigateCardPhoto(cardId, direction) {
    console.log('navigateCardPhoto called:', cardId, direction);
    const slider = document.getElementById(`slider-${cardId}`);
    if (!slider) {
        console.error('Slider not found for:', cardId);
        return false;
    }
    
    const photoCount = slider.children.length;
    console.log('Photo count:', photoCount);
    if (photoCount <= 1) {
        console.log('Too few photos:', photoCount);
        return false;
    }
    
    if (!cardPhotoIndices.hasOwnProperty(cardId)) {
        cardPhotoIndices[cardId] = 0;
    }
    
    let newIndex = cardPhotoIndices[cardId] + direction;
    if (newIndex < 0) newIndex = photoCount - 1;
    if (newIndex >= photoCount) newIndex = 0;
    
    console.log('Moving from index', cardPhotoIndices[cardId], 'to', newIndex);
    cardPhotoIndices[cardId] = newIndex;
    
    // Перемещаем слайдер - каждое фото занимает 100% ширины контейнера
    const translateX = -(newIndex * 100);
    slider.style.transform = `translateX(${translateX}%)`;
    console.log('Slider moved to:', translateX, '%');
    
    updateCardPhotoIndicator(cardId, newIndex);
    return false; // Предотвращаем всплытие события
}

// Переход к конкретному фото
function goToCardPhoto(cardId, index) {
    const slider = document.getElementById(`slider-${cardId}`);
    if (!slider) {
        console.error('Slider not found:', `slider-${cardId}`);
        return false;
    }
    
    const photoCount = slider.children.length;
    if (index < 0 || index >= photoCount) return false;
    
    cardPhotoIndices[cardId] = index;
    
    // Перемещаем слайдер - каждый слайд занимает 100% ширины контейнера
    const translateX = -(index * 100);
    slider.style.transform = `translateX(${translateX}%)`;
    
    updateCardPhotoIndicator(cardId, index);
    return false; // Предотвращаем всплытие события
}

// Обновление индикаторов фото
function updateCardPhotoIndicator(cardId, activeIndex) {
    const gallery = document.getElementById(`gallery-${cardId}`);
    if (!gallery) return;
    
    const indicators = gallery.querySelectorAll('.photo-indicator');
    indicators.forEach((indicator, index) => {
        if (index === activeIndex) {
            indicator.classList.remove('bg-opacity-50');
            indicator.classList.add('bg-opacity-100', 'w-6', 'active');
        } else {
            indicator.classList.remove('bg-opacity-100', 'w-6', 'active');
            indicator.classList.add('bg-opacity-50');
        }
    });
}

// Рендеринг всех карточек локаций
function renderLocationCards(filteredLocations = null) {
    const container = document.getElementById('locations-container');
    if (!container) return;
    
    const locationsToRender = filteredLocations || locations;
    
    // Очищаем индексы фото
    cardPhotoIndices = {};
    
    if (!locationsToRender || locationsToRender.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center col-span-full">Локации не найдены</p>';
        return;
    }
    
    container.innerHTML = locationsToRender.map(location => createLocationCard(location)).join('');
    
    // Добавляем обработчик клика на карточку для перехода на страницу деталей
    container.querySelectorAll('.location-card').forEach(card => {
        const locationId = card.dataset.locationId;
        
        // Делаем всю карточку кликабельной
        card.style.cursor = 'pointer';
        card.style.position = 'relative';
        
        // Обработчик клика на всю карточку
        card.addEventListener('click', function(e) {
            // Проверяем, не кликнули ли по интерактивным элементам
            const clickedElement = e.target;
            
            // Если клик по ссылке или кнопке, не перехватываем
            if (clickedElement.closest('a') || clickedElement.closest('button')) {
                return;
            }
            
            // Всё остальное - переход на страницу локации
            e.preventDefault();
            e.stopPropagation();
            window.location.href = `location.html?id=${locationId}`;
        });
        
        // Убеждаемся, что кнопки и ссылки работают независимо
        const buttons = card.querySelectorAll('button, a');
        buttons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        });
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Сайт локаций Туниса загружен');
    
    // Ждем загрузки Leaflet и данных
    if (typeof L !== 'undefined') {
        initMap();
    } else {
        // Если Leaflet еще не загружен, ждем
        window.addEventListener('load', function() {
            setTimeout(initMap, 500);
        });
    }
    
    // Рендеринг карточек локаций
    if (typeof locations !== 'undefined' && locations) {
        renderLocationCards();
    } else {
        // Ждем загрузки данных
        window.addEventListener('load', function() {
            setTimeout(() => {
                if (typeof locations !== 'undefined' && locations) {
                    renderLocationCards();
                }
            }, 500);
        });
    }
    
    // Инициализация фильтров (если есть)
    initFilters();
});

// Инициализация фильтров
function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const resetButton = document.getElementById('reset-filter');
    
    if (filterButtons.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                // Удаляем active класс со всех кнопок
                filterButtons.forEach(b => b.classList.remove('active'));
                // Добавляем active класс к нажатой
                this.classList.add('active');
                
                // Применяем фильтр
                const filterText = this.textContent.trim();
                filterLocations(filterText);
            });
        });
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            if (filterButtons[0]) filterButtons[0].classList.add('active');
            filterLocations('Все локации');
        });
    }
}

// Фильтрация локаций
function filterLocations(filterText) {
    if (!locations || locations.length === 0) return;
    
    let filtered = [];
    
    if (filterText === 'Все локации' || filterText.includes('Все')) {
        filtered = locations;
    } else if (filterText.includes('Звёздные войны')) {
        filtered = locations.filter(loc => loc.isStarWars);
    } else {
        // Фильтр по региону
        filtered = locations.filter(loc => {
            const regionMap = {
                'Столица и окрестности': 'СТОЛИЦА И ОКРЕСТНОСТИ',
                'Древние города': 'ДРЕВНИЕ ГОРОДА',
                'Острова и побережье': 'ОСТРОВА И ПОБЕРЕЖЬЕ',
                'Пустыня и соль': 'ПУСТЫНЯ И СОЛЬ',
                'Оазисы': 'ОАЗИС ТАУЗАР/НЕФТА',
                'Северные регионы': 'СЕВЕР (РЕКОМЕНДУЕМЫЕ)'
            };
            
            for (let [key, value] of Object.entries(regionMap)) {
                if (filterText.includes(key)) {
                    return loc.region === value;
                }
            }
            return false;
        });
    }
    
        // Обновляем карту и карточки
    if (filtered.length > 0) {
        // Обновляем маркеры на карте
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];
        
        filtered.forEach(location => {
            const icon = createCustomIcon(location);
            const [lon, lat] = location.coordinates;
            const marker = L.marker([lat, lon], { icon }).addTo(map);
            
            const popupContent = `
                <div style="padding: 10px; min-width: 200px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 1.1em; font-weight: bold;">${location.name}</h3>
                    <p style="margin: 5px 0; color: #666; font-size: 0.9em;"><strong>Регион:</strong> ${location.region}</p>
                    ${location.isStarWars ? '<p style="margin: 5px 0;"><span style="background: linear-gradient(135deg, #FFE81F 0%, #FFC107 100%); color: #000; padding: 3px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold;">⭐ ЗВЁЗДНЫЕ ВОЙНЫ</span></p>' : ''}
                    <p style="margin: 10px 0 0 0; color: #555; font-size: 0.85em; line-height: 1.4;">${location.description}</p>
                    <a href="location.html?id=${location.id}" 
                       style="display: inline-block; margin-top: 12px; padding: 8px 16px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-size: 0.9em; font-weight: 500; transition: background 0.2s;"
                       onmouseover="this.style.background='#059669'"
                       onmouseout="this.style.background='#10b981'">
                        Подробнее →
                    </a>
                </div>
            `;
            marker.bindPopup(popupContent);
            markers.push(marker);
        });
        
        // Масштабируем карту
        if (filtered.length > 0) {
            const bounds = L.latLngBounds(filtered.map(loc => [loc.coordinates[1], loc.coordinates[0]]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }
    
    // Рендерим отфильтрованные карточки
    renderLocationCards(filtered);
}
