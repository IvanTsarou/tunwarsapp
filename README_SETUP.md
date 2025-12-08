# Инструкция по настройке TunWars App

## Шаги для создания нового репозитория на GitHub и деплоя

### 1. Создание репозитория на GitHub

1. Перейдите на [GitHub](https://github.com)
2. Нажмите кнопку **"New repository"** (или "+" → "New repository")
3. Заполните форму:
   - **Repository name:** `tunwarsapp` (или другое имя на ваше усмотрение)
   - **Description:** "PWA версия путеводителя по Тунису и локациям Звёздных войн"
   - **Visibility:** Public (или Private, как вам удобнее)
   - **НЕ** создавайте README, .gitignore или лицензию (они уже есть)
4. Нажмите **"Create repository"**

### 2. Подключение локального репозитория к GitHub

После создания репозитория GitHub покажет инструкции. Выполните в терминале:

```bash
cd /Users/air/Sites/TunWarsapp

# Добавьте remote (замените YOUR-USERNAME на ваш GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/tunwarsapp.git

# Отправьте код на GitHub
git branch -M main
git push -u origin main
```

### 3. Деплой на хостинг

#### Вариант A: Vercel (рекомендуется)

1. Перейдите на [vercel.com](https://vercel.com) и войдите через GitHub
2. Нажмите **"Add New..."** → **"Import Git Repository"**
3. Выберите репозиторий `tunwarsapp`
4. Настройки:
   - **Framework Preset:** Other
   - **Build Command:** (оставьте пустым)
   - **Output Directory:** (оставьте пустым)
5. Нажмите **"Deploy"**
6. После деплоя вы получите URL типа `tunwarsapp.vercel.app`

#### Вариант B: Netlify

1. Перейдите на [netlify.com](https://netlify.com) и войдите через GitHub
2. Нажмите **"Add new site"** → **"Import an existing project"**
3. Выберите репозиторий `tunwarsapp`
4. Настройки:
   - **Build command:** (оставьте пустым)
   - **Publish directory:** `.` (корневая папка)
5. Нажмите **"Deploy site"**

#### Вариант C: GitHub Pages

1. В репозитории на GitHub перейдите в **Settings**
2. В разделе **Pages** выберите:
   - **Source:** Deploy from a branch
   - **Branch:** main
   - **Folder:** / (root)
3. Нажмите **Save**
4. Сайт будет доступен по адресу: `https://YOUR-USERNAME.github.io/tunwarsapp/`

### 4. Проверка работы

После деплоя проверьте:
- ✅ Сайт открывается по новому URL
- ✅ Все страницы работают
- ✅ Карты загружаются
- ✅ Фото отображаются
- ✅ Навигация работает

### 5. Следующие шаги (PWA)

После успешного деплоя можно будет добавить:
- `manifest.json` для PWA
- `sw.js` (Service Worker) для офлайн работы
- Иконки приложения

---

**Примечание:** Все дальнейшие изменения PWA будут делаться в этом проекте.


