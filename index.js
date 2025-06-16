// ==UserScript==
// @name         ARPTn
// @namespace    http://tampermonkey.net/
// @version      4.9.15
// @description
// 1) Блок 1: Глобальная проверка «До разблокировки осталось решить».
// 2) Блок 2: Мгновенные анимации ChessKing – переопределение jQuery.animate/fadeIn/fadeOut, авто-клик «Следующее задание».
// 3) Блок 3: Фильтр турниров Chess.com – скрыть нежелательные турниры по ключевым словам.
// 4) Блок 4: Hide Elements – универсальное скрытие элементов через GM_addStyle.
// 5) Блок 5: Hide Specific Tournaments and sSections – скрытие по классам/иконкам с MutationObserver.
// 6) Блок 6: Lichess – показывать только Blitz & Rapid через GM_addStyle.
// 7) Блок 7: URL-based Body Cleaner – заменяет содержимое body на «Страница заблокирована!».
// 8) Блок 8: Контроль отправки сообщений – по числу решённых задач.
// 9) Блок 9: Sound Control – mute audio on all sites except lichess.org and chess.com.
// 10) Блок 10: Time Control – контроль оставшегося времени.
// @include      *
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // ==============================
    // === Общие настройки скрипта ===
    // ==============================
    const courseId            = 22;     // ID курса на ChessKing
    let   minTasksPerDay      = 1000;      // Минимум задач в день
    const maxTimePerDay       = 2400;    // Максимальное время в минутах (3 часа)
    const dailyTimeLimit      = {       // Ежедневный лимит времени
        hour: 21,
        minute: 30
    };

    // Подбадривающие фразы
    const encouragingPhrases = [
        "Ты молодец!", "Так держать!", "У тебя получается!", "С каждым разом всё лучше!",
        "Ты растёшь как шахматист!", "Смело вперёд!", "Ты умный и внимательный!",
        "Ошибки — путь к победе!", "Ты почти решил!", "Шаг за шагом — и ты чемпион!",
        "Ты на правильном пути!", "Каждая задача делает тебя сильнее!", "Горжусь твоим старанием!",
        "Ты способен на многое!", "Ты справишься!", "Ты умеешь думать стратегически!",
        "Ты настоящий исследователь!", "Пробуй ещё — и получится!", "Вижу, как ты стараешься!",
        "Ты растёшь с каждой задачей!", "Думай смело — и побеждай!", "Ты умница!",
        "Дальше будет ещё интереснее!", "Ты находчивый!", "Ты любишь вызовы — и это круто!",
        "У тебя отличная логика!", "Давай ещё одну — ты можешь!", "Ты становишься всё сильнее!",
        "Каждая задача — тренировка мозга!", "Ты почти у цели!", "Ты внимательный!",
        "Ты уже стал лучше, чем вчера!", "Ум — твоя суперсила!", "Ты всё правильно делаешь!",
        "Ты учишься побеждать!", "Твои старания — уже победа!", "Не сдавайся — ты сможешь!",
        "Отличный ход!", "Ты талантливый шахматист!", "Ещё чуть-чуть — и ты решишь!",
        "Ты ловкий стратег!", "Ты умеешь думать вперёд!", "Я верю в тебя!", "Ты крутой!",
        "Невероятно, как ты растёшь!", "Каждая задача — шаг к победе!", "Ты становишься мастером!",
        "Смотри, как у тебя получается!", "Давай попробуем вместе!", "Ты умеешь справляться с трудностями!",
        "У тебя острый ум!", "Ты настоящий чемпион!", "Супер! Ты решаешь всё быстрее!",
        "Ты тренируешь свой мозг!", "Ты сильный игрок!", "Продолжай в том же духе!",
        "Ты делаешь успехи!", "Ты всё ближе к цели!", "Ты умеешь находить правильный путь!",
        "Каждая ошибка делает тебя умнее!", "Ты не боишься сложностей!", "Сложно — значит интересно!",
        "Ты находишь решения!", "Ты не сдаёшься — это круто!", "Ты умело справляешься!",
        "У тебя отлично получается думать!", "Ты сам решаешь — и это важно!", "Шахматы — это твоё!",
        "Ты стараешься — и это главное!", "Ещё шаг — и победа!", "Ты уже многому научился!",
        "Ты умеешь концентрироваться!", "Каждая задача — как приключение!", "Ты сообразительный!",
        "Ты думаешь глубоко!", "Ты умеешь ждать и побеждать!", "Ты тренируешь терпение и силу воли!",
        "Ты способен решать самые сложные задачи!", "Ты мастер шаг за шагом!", "Ты находишь хитрые ходы!",
        "Ты идёшь к вершине!", "Ты умеешь мыслить, как чемпион!", "Ты настоящий борец!",
        "Ты умеешь выигрывать красиво!", "Ты — сила и ум!", "Ты можешь справиться с любой задачей!",
        "Ты заряжен на успех!", "Ты решаешь всё лучше и лучше!", "Твоя настойчивость восхищает!",
        "Ты умеешь думать, как гроссмейстер!", "Ты умный и смелый!", "Ты сам удивишься, на что способен!",
        "Ты раскрываешь свой талант!", "Ты умеешь сосредоточиться!", "Ты внимательный и терпеливый!",
        "Ты движешься к своей победе!", "Ты — звезда шахмат!", "Ты заслуживаешь аплодисментов!",
        "Ты делаешь невозможное возможным!", "Ты тренируешь силу мысли!", "Ты станешь мастером!",
        "Ты умеешь побеждать красиво!"
    ];

    // GM-ключи для хранения данных
    const GM_KEYS = {
        TOTAL_TASKS: `ck_total_tasks_${courseId}`,
        TOTAL_SOLVED: `ck_total_solved_${courseId}`,
        DAILY_SOLVED: `daily_solved_${courseId}`,
        MESSAGES_SENT: `messages_sent_${courseId}`,
        TIME_REMAINING: `time_remaining_${courseId}` // Новый ключ для хранения оставшегося времени
    };

    // Общие URL и ключи
    const coursePageBase = `https://learn.chessking.com/learning/course/${courseId}`;
    const tasksHashURL   = `${coursePageBase}/tasks#`;
    const dateKey        = getTodayDateString();

    // GM-ключи для текущей даты:
    const keyInitial      = `initial_solved_${courseId}_${dateKey}`;   // initialVal
    const keyDailyCount   = `daily_solved_${courseId}_${dateKey}`;     // сколько решено сегодня
    const keyCachedSolved = `cached_solved_${courseId}_${dateKey}`;    // кеш: solvedToday
    const keyCachedUnlock = `cached_unlock_${courseId}_${dateKey}`;    // кеш: unlockRemaining

    const enableChessAnim       = 1;    // Блок 2
    const enableChessComFilter  = 1;    // Блок 3
    const enableHideElements    = 1;    // Блок 4
    const enableHideTournaments = 1;    // Блок 5
    const enableLichessFilter   = 1;    // Блок 6
    const enableMessageControl  = 1;    // Блок 8: контроль отправки сообщений
    const tasksPerMessage       = 50;  // Количество решённых задач для 1 сообщения

    // =================================
    // === Вспомогательные функции ===
    // =================================
    function getTodayDateString() {
        const now = new Date();
        const y   = now.getFullYear();
        const m   = String(now.getMonth() + 1).padStart(2, '0');
        const d   = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function readGMNumber(key) {
        const v = GM_getValue(key, null);
        if (v === null) {
            return null;
        }
        const num = parseInt(v, 10);
        return isNaN(num) ? null : num;
    }

    function writeGMNumber(key, num) {
        GM_setValue(key, String(num));
    }

    // Читает текущее количество решённых задач прямо из DOM /tasks
    function readSolvedCountFromDOM() {
        // Новый универсальный селектор
        const solvedElem = document.querySelector('span.course-overview__stats-item[title*="Решенное"] span');
        console.log('[DEBUG] solvedElem:', solvedElem, solvedElem?.innerText);
        if (solvedElem) {
            // Парсим строку вида "15574 / 19271"
            const match = solvedElem.innerText.match(/(\d+)\s*\/\s*(\d+)/);
            if (match) {
                const solved = parseInt(match[1], 10);
                const total = parseInt(match[2], 10);
                if (!isNaN(solved) && !isNaN(total)) {
                    writeGMNumber(GM_KEYS.TOTAL_SOLVED, solved);
                    writeGMNumber(GM_KEYS.TOTAL_TASKS, total);
                    return { solved, total };
                }
            }
        }
        // Fallback: попробуем вернуть из GM
        const fallbackTotal = readGMNumber(GM_KEYS.TOTAL_TASKS);
        const fallbackSolved = readGMNumber(GM_KEYS.TOTAL_SOLVED);
        if (fallbackTotal !== null && fallbackSolved !== null) {
            console.log('[DEBUG] Fallback from GM:', fallbackSolved, fallbackTotal);
            return { solved: fallbackSolved, total: fallbackTotal };
        }
        return null;
    }

    // =================================
    // === ФУНКЦИЯ: buildUIandStartUpdates ===
    // =================================
    window.buildUIandStartUpdates = function() {
        console.log("[Tracker] buildUIandStartUpdates: строим UI и запускаем fetchAndUpdate()");

        // Функция для получения статистики курса
        function fetchCourseStats() {
            return new Promise((resolve) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: coursePageBase,
                    onload(response) {
                        if (response.status === 200) {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(response.responseText, 'text/html');
                            const statsElem = doc.querySelector('span.course-overview__stats-item[title*="Решенное"] span');
                            if (statsElem) {
                                const match = statsElem.innerText.match(/(\d+)\s*\/\s*(\d+)/);
                                if (match) {
                                    const solved = parseInt(match[1], 10);
                                    const total = parseInt(match[2], 10);
                                    resolve({ solved, total });
                                    return;
                                }
                            }
                        }
                        resolve(null);
                    },
                    onerror() {
                        resolve(null);
                    }
                });
            });
        }

        // Функция для обновления статистики на странице
        function updateCourseStats() {
            fetchCourseStats().then(stats => {
                if (stats) {
                    const { solved, total } = stats;
                    const remaining = total - solved;
                    
                    // Добавляем или обновляем элемент со статистикой
                    let statsDiv = document.getElementById('ck-course-stats');
                    if (!statsDiv) {
                        statsDiv = document.createElement('div');
                        statsDiv.id = 'ck-course-stats';
                        statsDiv.style.cssText = `
                            position: fixed;
                            top: 10px;
                            left: 10px;
                            background-color: white;
                            border: 1px solid #ccc;
                            padding: 10px;
                            z-index: 2147483647;
                            font-family: Arial, sans-serif;
                            font-size: 14px;
                            color: #000;
                            border-radius: 4px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        `;
                        document.body.appendChild(statsDiv);
                    }
                    
                    statsDiv.innerHTML = `
                        <div style="font-weight: bold; margin-bottom: 5px;">Статистика курса:</div>
                        <div>Решено задач: <strong>${solved}</strong></div>
                        <div>Всего задач: <strong>${total}</strong></div>
                        <div>Осталось решить: <strong>${remaining}</strong></div>
                        <div>Прогресс: <strong>${Math.round((solved / total) * 100)}%</strong></div>
                    `;
                }
            });
        }

        // Запускаем обновление статистики сразу и затем каждые 5 минут
        updateCourseStats();
        setInterval(updateCourseStats, 300000);

        // Функция для показа подбадривающего сообщения
        function showEncouragingMessage() {
            // Удаляем предыдущее сообщение, если оно есть
            const existingMessage = document.getElementById('ck-encouraging-message');
            if (existingMessage) {
                existingMessage.remove();
            }

            const phrase = encouragingPhrases[Math.floor(Math.random() * encouragingPhrases.length)];
            const messageDiv = document.createElement('div');
            messageDiv.id = 'ck-encouraging-message';
            messageDiv.style.cssText = `
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 18px;
                color: #2196F3;
                text-align: center;
                opacity: 0;
                transition: opacity 0.5s ease-in-out;
                font-weight: bold;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
                background-color: rgba(255, 255, 255, 0.9);
                padding: 10px 20px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                z-index: 2147483647;
            `;
            messageDiv.textContent = phrase;
            
            document.body.appendChild(messageDiv);
            
            // Показываем сообщение с анимацией
            setTimeout(() => {
                messageDiv.style.opacity = '1';
            }, 100);

            // Удаляем сообщение через 30 секунд
            setTimeout(() => {
                messageDiv.style.opacity = '0';
                setTimeout(() => {
                    messageDiv.remove();
                }, 500);
            }, 30000);
        }

        function fetchAndUpdate() {
            console.log("[Tracker][fetchAndUpdate] Запуск fetch + обновление UI");
            window.fetchCourseDataViaGM(true).then(data => {
                if (!data) {
                    console.log("[Tracker][fetchAndUpdate] fetch вернул null");
                    return;
                }
                const { totalSolved, solvedToday, unlockRemaining } = data;

                // Проверяем, нужно ли показать подбадривающее сообщение
                if (solvedToday > 0 && solvedToday % 50 === 0) {
                    // Обновляем страницу перед показом сообщения
                    window.fetchCourseDataViaGM(true).then(() => {
                        showEncouragingMessage();
                    });
                }

                // Обновляем кеш (fetch-based)
                writeGMNumber(keyCachedSolved, solvedToday);
                writeGMNumber(keyCachedUnlock, unlockRemaining);
                console.log(`[Tracker][fetchAndUpdate] Фетч: totalSolved=${totalSolved}, solvedToday=${solvedToday}, unlockRemaining=${unlockRemaining}`);

                // ==== Обновляем <title> ====
                const oldTitle = document.title.replace(/^\d+\s·\s/, '');
                document.title = `${unlockRemaining} · ${oldTitle}`;
                console.log(`[Tracker][fetchAndUpdate] Обновлён title: "${document.title}"`);

                // ==== История totalSolved для графика ====
                let readings = [];
                try {
                    readings = JSON.parse(localStorage.getItem('ck_readings') || '[]');
                } catch {
                    readings = [];
                }
                readings.push({ time: new Date().toISOString(), solved: totalSolved });
                if (readings.length > 60) readings = readings.slice(-60);
                localStorage.setItem('ck_readings', JSON.stringify(readings));
                console.log(`[Tracker][fetchAndUpdate] Добавили чтение: time=${readings.slice(-1)[0].time}, solved=${readings.slice(-1)[0].solved}`);

                // ==== Вычисляем diffs (интервал ≤ 90 сек) ====
                const diffs = [];
                for (let i = 1; i < readings.length; i++) {
                    const t0 = new Date(readings[i - 1].time).getTime();
                    const t1 = new Date(readings[i].time).getTime();
                    if (t1 - t0 <= 90000) {
                        diffs.push(readings[i].solved - readings[i - 1].solved);
                    }
                }
                console.log(`[Tracker][fetchAndUpdate] diffs (последние 5): ${diffs.slice(-5)}`);
                const graphDiffs = diffs.length > 30 ? diffs.slice(-30) : diffs;

                // ==== Средняя скорость (медиана последних 10, без подряд 0) ====
                let lastTen = diffs.length > 10 ? diffs.slice(-10) : diffs;
                const filtered = [];
                for (let i = 0; i < lastTen.length; i++) {
                    if (lastTen[i] === 0 && i > 0 && lastTen[i - 1] === 0) continue;
                    filtered.push(lastTen[i]);
                }
                if (filtered.length === 0) filtered.push(...lastTen);

                let avgPerMin = 0;
                if (filtered.length) {
                    const sorted = [...filtered].sort((a, b) => a - b);
                    const mid = Math.floor(sorted.length / 2);
                    avgPerMin = (sorted.length % 2)
                        ? sorted[mid]
                        : (sorted[mid - 1] + sorted[mid]) / 2;
                    avgPerMin = Math.round(avgPerMin);
                }
                console.log(`[Tracker][fetchAndUpdate] avgPerMin=${avgPerMin}`);

                // ==== Максимальная скорость (из положительных > avgPerMin) ====
                const positives = lastTen.filter(x => x > 0);
                const candidateMax = positives.filter(x => x > avgPerMin);
                let maxPerMin = 0;
                if (candidateMax.length) {
                    maxPerMin = Math.max(...candidateMax);
                } else if (positives.length) {
                    maxPerMin = Math.max(...positives);
                }
                console.log(`[Tracker][fetchAndUpdate] maxPerMin=${maxPerMin}`);

                // ==== Общее число задач и оставшиеся задачи ====
                const domData = readSolvedCountFromDOM();
                const totalTasks = domData ? domData.total : readGMNumber(GM_KEYS.TOTAL_TASKS) || 0;
                const remainingTasks = Math.max(0, totalTasks - totalSolved);
                console.log(`[Tracker][fetchAndUpdate] totalTasks=${totalTasks}, remainingTasks=${remainingTasks}`);

                let remainingTimeText = "нет данных";
                if (maxPerMin > 0) {
                    const minsLeft = remainingTasks / maxPerMin;
                    const h = Math.floor(minsLeft / 60);
                    const m = Math.round(minsLeft % 60);
                    remainingTimeText = `${h} ч ${m} мин`;
                }
                console.log(`[Tracker][fetchAndUpdate] remainingTimeText="${remainingTimeText}"`);

                const nextTh = Math.ceil(totalSolved / 1000) * 1000;
                const toNext = nextTh - totalSolved;
                let milestoneText = "нет данных";
                if (maxPerMin > 0) {
                    const m2 = toNext / maxPerMin;
                    const h2 = Math.floor(m2 / 60);
                    const m3 = Math.round(m2 % 60);
                    milestoneText = `${h2} ч ${m3} мин`;
                }
                console.log(`[Tracker][fetchAndUpdate] milestoneText="${milestoneText}"`);

                // =====================================
                // === Рисуем overlay с графиком и метриками ===
                // =====================================
                let overlay = document.getElementById('ck-progress-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'ck-progress-overlay';
                    overlay.style.position = 'fixed';
                    overlay.style.top = '10px';
                    overlay.style.right = '10px';
                    overlay.style.backgroundColor = 'white';
                    overlay.style.border = '1px solid #ccc';
                    overlay.style.padding = '10px';
                    overlay.style.zIndex = '2147483647';
                    overlay.style.fontFamily = 'Arial, sans-serif';
                    overlay.style.fontSize = '12px';
                    overlay.style.color = '#000';
                    overlay.innerHTML = '<strong>Прогресс задач&nbsp;(разница за минуту)</strong><br/>';

                    const contentDiv = document.createElement('div');
                    contentDiv.id = 'ck-progress-content';

                    const canvas = document.createElement('canvas');
                    canvas.id = 'ck-progress-canvas';
                    canvas.width = 400;
                    canvas.height = 150;
                    contentDiv.appendChild(canvas);

                    const metricsDiv = document.createElement('div');
                    metricsDiv.id = 'ck-progress-metrics';
                    metricsDiv.style.marginTop = '0px';
                    contentDiv.appendChild(metricsDiv);

                    overlay.appendChild(contentDiv);
                    document.body.appendChild(overlay);

                    const toggleBtn = document.createElement('button');
                    toggleBtn.id = 'ck-toggle-btn';
                    toggleBtn.textContent = 'Свернуть';
                    toggleBtn.style.position = 'absolute';
                    toggleBtn.style.top = '2px';
                    toggleBtn.style.right = '2px';
                    toggleBtn.style.fontSize = '10px';
                    toggleBtn.style.padding = '2px 5px';
                    overlay.appendChild(toggleBtn);
                    toggleBtn.addEventListener('click', () => {
                        const cd = document.getElementById('ck-progress-content');
                        if (cd.style.display === 'none') {
                            cd.style.display = 'block';
                            toggleBtn.textContent = 'Свернуть';
                        } else {
                            cd.style.display = 'none';
                            toggleBtn.textContent = 'Развернуть';
                        }
                    });
                    console.log("[Tracker] Overlay создан");
                }

                // Рисуем график
                const canvas = document.getElementById('ck-progress-canvas');
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const margin = 30;
                const graphW  = canvas.width - margin * 2;
                const graphH  = canvas.height - margin * 2;
                const maxDiff = Math.max(...graphDiffs, 1);

                // Горизонтальная ось
                ctx.beginPath();
                ctx.moveTo(margin, canvas.height - margin);
                ctx.lineTo(canvas.width - margin, canvas.height - margin);
                ctx.strokeStyle = '#000';
                ctx.stroke();

                if (graphDiffs.length) {
                    const step = graphDiffs.length > 1 ? graphW / (graphDiffs.length - 1) : graphW;
                    const pts = [];
                    for (let i = 0; i < graphDiffs.length; i++) {
                        const x = margin + i * step;
                        const y = canvas.height - margin - (graphDiffs[i] / maxDiff) * graphH;
                        pts.push({ x, y, v: graphDiffs[i] });
                    }
                    ctx.beginPath();
                    ctx.moveTo(pts[0].x, pts[0].y);
                    for (let i = 1; i < pts.length; i++) {
                        ctx.lineTo(pts[i].x, pts[i].y);
                    }
                    ctx.strokeStyle = 'blue';
                    ctx.stroke();

                    ctx.font = "10px Arial";
                    for (const p of pts) {
                        ctx.fillStyle = 'red';
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
                        ctx.fill();
                        ctx.fillStyle = 'black';
                        ctx.fillText(p.v, p.x - 5, p.y - 5);
                    }
                } else {
                    ctx.font = "14px Arial";
                    ctx.fillText("Недостаточно данных", margin, margin + 20);
                }

                // Обновляем метрики
                const metricsDiv = document.getElementById('ck-progress-metrics');
                metricsDiv.innerHTML = `
                    <div>Решено задач сегодня: <strong>${solvedToday}</strong></div>
                    <div>До разблокировки осталось решить: <strong>${unlockRemaining}</strong></div>
                    <div>Средняя скорость: <strong>${avgPerMin}</strong> задач/мин</div>
                    <div>Оставшееся время: <strong>${remainingTimeText}</strong></div>
                    <div>Задач осталось: <strong>${remainingTasks}</strong></div>
                `;
                console.log("[Tracker] UI обновлён");
            });
        }

        // Запускаем fetchAndUpdate сразу и затем по таймеру
        fetchAndUpdate();
        setInterval(fetchAndUpdate, 60000);
    };

    // Делаем fetchCourseDataViaGM глобальной функцией
    window.fetchCourseDataViaGM = function(allowInit) {
        console.log(`[Tracker][fetchCourseDataViaGM] Запуск (allowInit=${allowInit})`);
        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: coursePageBase,
                onload(response) {
                    console.log(`[Tracker][fetchCourseDataViaGM] HTTP статус: ${response.status}`);
                    if (response.status < 200 || response.status >= 300) {
                        console.warn(`[Tracker][fetchCourseDataViaGM] Некорректный статус: ${response.status}`);
                        resolve(null);
                        return;
                    }
                    const html = response.responseText;
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    const solvedElem = doc.querySelector('span.course-overview__stats-item[title*="Решенное"] span');
                    if (!solvedElem) {
                        console.warn("[Tracker][fetchCourseDataViaGM] Элемент «Решенное» не найден");
                        resolve(null);
                        return;
                    }
                    const totalText = solvedElem.innerText.split('/')[0].trim();
                    const totalSolved = parseInt(totalText, 10);
                    console.log(`[Tracker][fetchCourseDataViaGM] totalSolved (с сервера) = ${totalSolved}`);
                    if (isNaN(totalSolved)) {
                        console.warn("[Tracker][fetchCourseDataViaGM] Не удалось распарсить totalSolved");
                        resolve(null);
                        return;
                    }

                    let initialVal = readGMNumber(keyInitial);
                    let solvedToday;

                    if (initialVal === null) {
                        console.log("[Tracker][fetchCourseDataViaGM] initialVal отсутствует");
                        if (allowInit) {
                            initialVal = totalSolved;
                            writeGMNumber(keyInitial, initialVal);
                            solvedToday = 0;
                            console.log(`[Tracker][fetchCourseDataViaGM] (tasks) initialVal = ${initialVal}, solvedToday = 0`);
                        } else {
                            solvedToday = 0;
                            console.log("[Tracker][fetchCourseDataViaGM] (не /tasks) solvedToday = 0");
                        }
                    } else {
                        solvedToday = Math.max(0, totalSolved - initialVal);
                        console.log(`[Tracker][fetchCourseDataViaGM] initialVal=${initialVal}, solvedToday=${solvedToday}`);
                    }

                    writeGMNumber(keyDailyCount, solvedToday);
                    const unlockRemaining = Math.max(minTasksPerDay - solvedToday, 0);
                    console.log(`[Tracker][fetchCourseDataViaGM] unlockRemaining=${unlockRemaining}`);

                    resolve({ totalSolved, solvedToday, unlockRemaining });
                },
                onerror(err) {
                    console.error("[Tracker][fetchCourseDataViaGM] Ошибка GM_xmlhttpRequest:", err);
                    resolve(null);
                }
            });
        });
    };

    // ===============================
    // === БЛОК 1: Проверка + Редирект ===
    // ===============================
    (function() {
        const hostname   = window.location.hostname;
        const pathname   = window.location.pathname;
        // Определяем: является ли текущая страница /tasks
        const isTasksPage = hostname.endsWith('learn.chessking.com')
                            && pathname.includes(`/learning/course/${courseId}/tasks`);
        // Любая другая — isOtherPage
        const isOtherPage = !isTasksPage;

        // Сброс ключей в полночь
        const savedDate = GM_getValue('ck_tracker_date', null);
        if (savedDate !== dateKey) {
            console.log(`[Tracker] Новый день (${dateKey}) — сбрасываем все GM-ключи для yesterday`);
            GM_setValue('ck_tracker_date', dateKey);
            GM_setValue(keyInitial, null);
            GM_setValue(keyDailyCount, null);
            GM_setValue(keyCachedSolved, null);
            GM_setValue(keyCachedUnlock, null);
        } else {
            console.log(`[Tracker] Дата не изменилась (${dateKey}), GM-ключи не сбрасываем`);
        }

        // Если мы на /tasks, сразу очищаем старый кеш (чтобы убрать устаревшие данные)
        if (isTasksPage) {
            console.log("[Tracker] Мы на /tasks → очищаем GM-ключи cached_unlock и cached_solved");
            GM_setValue(keyCachedUnlock, null);
            GM_setValue(keyCachedSolved, null);
        }

        // Если НЕ /tasks, сразу скрываем <body> до проверки
        if (isOtherPage && document.body) {
            document.documentElement.style.backgroundColor = '#fff';
            document.body.style.visibility = 'hidden';
            console.log("[Tracker] Скрыли body на чужой странице до проверки");
        }

        console.log(`[Tracker] Скрипт запустился на: ${window.location.href}`);
        console.log(`[Tracker] isTasksPage=${isTasksPage}, isOtherPage=${isOtherPage}`);

        // --------------------------------------------
        // 1) Если НЕ /tasks: проверяем GM-кеш, иначе — fetch и кеш, затем решаем
        // --------------------------------------------
        if (isOtherPage) {
            console.log("[Tracker] Обрабатываем не-/tasks страницу");

            // 1.1) Читаем из GM-хранилища `cached_unlock`
            const cachedUnlock = readGMNumber(keyCachedUnlock);
            if (cachedUnlock !== null) {
                console.log(`[Tracker] Используем GM-кеш: cached_unlock = ${cachedUnlock}`);
                if (cachedUnlock > 0) {
                    console.log("[Tracker] cached_unlock > 0 → редиректим на /tasks");
                    window.location.replace(tasksHashURL);
                } else {
                    console.log("[Tracker] cached_unlock = 0 → показываем страницу");
                    if (document.body) document.body.style.visibility = '';
                }
                return;
            }

            // 1.2) GM-кеша нет → однократно fetchCourseDataViaGM(false)
            console.log("[Tracker] GM-кеша нет, выполняем fetchCourseDataViaGM(false)");
            window.fetchCourseDataViaGM(false).then(data => {
                if (!data) {
                    console.log("[Tracker] fetch вернул null → показываем страницу");
                    if (document.body) document.body.style.visibility = '';
                    return;
                }
                const { solvedToday, unlockRemaining } = data;
                writeGMNumber(keyCachedSolved, solvedToday);
                writeGMNumber(keyCachedUnlock, unlockRemaining);
                console.log(`[Tracker] После fetch: solvedToday=${solvedToday}, unlockRemaining=${unlockRemaining}`);
                if (unlockRemaining > 0) {
                    console.log("[Tracker] unlockRemaining > 0 → редиректим на /tasks");
                    window.location.replace(tasksHashURL);
                } else {
                    console.log("[Tracker] unlockRemaining = 0 → показываем страницу");
                    if (document.body) document.body.style.visibility = '';
                }
            });
            return;
        }

        // --------------------------------------------
        // 2) Если мы на /tasks: ждём DOMContentLoaded → DOM-инициализация кеша + автообновление + UI
        // --------------------------------------------
        if (isTasksPage) {
            console.log("[Tracker] На /tasks → скрываем body и ждём DOMContentLoaded");
            if (document.body) document.body.style.visibility = 'hidden';

            function onTasksPageLoad() {
                console.log("[Tracker] DOMContentLoaded на /tasks");

                // 2.1) Синхронизируем кеш из DOM
                function syncCacheFromDOM() {
                    const domData = readSolvedCountFromDOM();
                    if (!domData) return;

                    let initialVal = readGMNumber(keyInitial);
                    let solvedToday;
                    if (initialVal === null) {
                        initialVal = domData.solved;
                        writeGMNumber(keyInitial, initialVal);
                        solvedToday = 0;
                        console.log(`[Tracker](tasks, DOM) initialVal=domSolved=${initialVal}, solvedToday=0`);
                    } else {
                        solvedToday = Math.max(0, domData.solved - initialVal);
                        console.log(`[Tracker](tasks, DOM) initialVal=${initialVal}, domSolved=${domData.solved}, solvedToday=${solvedToday}`);
                    }
                    writeGMNumber(keyDailyCount, solvedToday);
                    const unlockRemaining = Math.max(minTasksPerDay - solvedToday, 0);
                    writeGMNumber(keyCachedSolved, solvedToday);
                    writeGMNumber(keyCachedUnlock, unlockRemaining);
                    console.log(`[Tracker](tasks, DOM) synced: cached_solved=${solvedToday}, cached_unlock=${unlockRemaining}`);

                    // Обновляем <title>
                    const oldTitle = document.title.replace(/^\d+\s·\s/, '');
                    document.title = `${unlockRemaining} · ${oldTitle}`;
                    console.log(`[Tracker](tasks, DOM) Обновлён title: "${document.title}"`);
                }

                // Сразу синхронизируем кеш из DOM
                syncCacheFromDOM();

                // 2.2) Показываем <body>
                if (document.body) document.body.style.visibility = '';

                // 2.3) Запускаем каждую секунду проверку DOM → синхронизируем кеш
                console.log("[Tracker] Запускаем интервал каждые 1 сек для синхронизации кеша из DOM");
                setInterval(syncCacheFromDOM, 1000);

                // 2.4) Строим UI + запускаем fetchAndUpdate
                window.buildUIandStartUpdates();
            }

            if (document.readyState === 'interactive' || document.readyState === 'complete') {
                onTasksPageLoad();
            } else {
                window.addEventListener('DOMContentLoaded', onTasksPageLoad);
            }
        }
    })();

    // =========================================
    // === БЛОК 2: Мгновенные анимации ChessKing ===
    // =========================================
    if (enableChessAnim) {
        (function() {
            function overrideJQueryAnimate() {
                if (window.jQuery && jQuery.fn && jQuery.fn.animate) {
                    jQuery.fn.animate = function(prop, duration, easing, callback) {
                        this.css(prop);
                        if (typeof callback === "function") callback.call(this);
                        return this;
                    };
                    jQuery.fn.fadeIn = function(duration, easing, callback) {
                        this.show().css({ opacity: 1 });
                        if (typeof callback === "function") callback.call(this);
                        return this;
                    };
                    jQuery.fn.fadeOut = function(duration, easing, callback) {
                        this.hide().css({ opacity: 0 });
                        if (typeof callback === "function") callback.call(this);
                        return this;
                    };
                    if (jQuery.fn.callbackAnimate) {
                        jQuery.fn.callbackAnimate = function(callback, prop, duration, easing) {
                            this.css(prop);
                            setTimeout(callback, 1);
                            return this;
                        };
                    }
                    if (jQuery.fn.deferredAnimate) {
                        jQuery.fn.deferredAnimate = function(prop, duration, easing) {
                            this.css(prop);
                            return jQuery.Deferred().resolve().promise();
                        };
                    }
                }
            }

            // Ждем загрузки jQuery
            function waitForJQuery() {
                if (window.jQuery) {
                    overrideJQueryAnimate();
                } else {
                    setTimeout(waitForJQuery, 100);
                }
            }
            waitForJQuery();

            function isElementVisible(el) {
                return el.offsetParent !== null;
            }
            function autoClickNextButton() {
                document.querySelectorAll("a.btn.btn-primary").forEach(btn => {
                    if (btn.textContent.trim() === "Следующее задание" && isElementVisible(btn)) {
                        btn.click();
                    }
                });
            }
            function setupObserver() {
                const observer = new MutationObserver(autoClickNextButton);
                if (document.body) {
                    observer.observe(document.body, { childList: true, subtree: true });
                }
                autoClickNextButton();
            }
            if (document.body) {
                setupObserver();
            } else {
                document.addEventListener("DOMContentLoaded", setupObserver);
            }
        })();
    }

    // ===========================================
    // === БЛОК 3: Chess.com Tournament Filter ===
    // ===========================================
    if (enableChessComFilter) {
        (function() {
            const filters = ["Bullet", "Live 960", "3 Check", "King of the Hill", "Crazyhouse"];
            function filterTournaments() {
                document.querySelectorAll('.tournaments-list-item-component').forEach(row => {
                    const text = row.innerText;
                    for (const f of filters) {
                        if (text.includes(f)) {
                            row.style.display = 'none';
                            console.log(`[ChessComFilter] Скрыли турнир по "${f}": "${text.split('\n')[0]}"`);
                            break;
                        }
                    }
                });
            }
            window.addEventListener("load", () => {
                console.log("[ChessComFilter] Страница загружена, фильтруем турниры");
                filterTournaments();
                const container = document.querySelector('.tournaments-list-list-body');
                if (container) {
                    const obs = new MutationObserver(() => {
                        console.log("[ChessComFilter] MutationObserver: обновляем фильтр");
                        filterTournaments();
                    });
                    obs.observe(container, { childList: true, subtree: true });
                }
            });
        })();
    }

    // ======================================
    // === БЛОК 4: Hide Elements (GM_addStyle) ===
    // ======================================
    if (enableHideElements) {
        GM_addStyle(`
            a.direct-menu-item-component.direct-menu-item[href="/variants"] { display: none !important; }
            .tournaments-header-tabs-component nav a:not(.tournaments-header-tabs-highlighted) { display: none !important; }
            .tournaments-header-tabs-component .tournament-header-buttons-component,
            .layout-column-two { display: none !important; }
            .tournaments-filter-component,
            .competition-announcements-competition,
            a[data-nav-link="play"] { display: none !important; }
            a.nav-link-component.nav-link-main-link.sprite.variants[href="/variants"] { display: none !important; }
            .selector-button-dropdown-component > button:nth-child(n+2):nth-child(-n+10) { display: none !important; }
            .toggle-custom-game-component,
            .live-stats-component,
            .nav-search-form,
            .direct-menu-sub-items { display: none !important; }
            div[data-tab="games"],
            div[data-tab="players"] { display: none !important; }
            .search-tooltip-component.search-icon-font.icon-шасс.мagnifying-глас,
            button.nav-link-компонент-nav-link-mainлин-nav-link-кнопка-наверх[data-amplitude-nav-selection="more-top"],
            a.nav-link-компонент-nav-link-mainлин-nav-link-кнопка-наверх[data-amplitude-nav-selection="social-top"],
            a.nav-link-компонент-nav-link-mainлин-nav-link-кнопка-наверх[data-amplitude-nav-selection="news-top"],
            a.nav-link-компонент-nav-link-mainлин-nav-link-кнопка-наверх[data-amplitude-nav-selection="watch-top"] { display: none !important; }
            .nav-link-компонент-nav-link-mainлин čесс-logo-wrapper.sprite čесс-logo[data-nav-link="home"],
            .nav-menu-area,
            button.nav-action.ui-mode[data-amplitude-nav-selection="subnav-uимode"],
            button.nav-action.resize[data-amplitude-nav-selection="subnav-collapseexpand"],
            a.nav-action.link.has-попover=settings[data-amplitude-nav-selection="subnav-settings"],
            button.btn-link.logout[data-amplitude-nav-selection="subnav-settings-logout"],
            button.nav-action.has-попover.help[data-amplitude-nav-selection="subnav-help"] { display: none !important; }
            .toolbar-menu-area.toolbar-area-right,
            .v5-header-link.v5-x-wide[href="/games/archive/deмченко_timофей"],
            footer#navigation-footer { display: none !important; }
            .nav-link-компонент-nav-link-mainлин.sprite.tournaments[href="/tournaments"] { display: none !important; }
            .nav-link-компонент-nav-link-mainлин.sprite.computer[href="/play/computer"],
            .nav-link-компонент-nav-link-mainлин.sprite.leaderboard[href="/leaderboard"],
            .nav-link-компонент-nav-link-mainлин.sprite.archive[href="/games/archive"] { display: none !important; }
            .game-panel-btns-container.board-panel-game-панель-wrapper { display: none !important; }
            .bot-компонент[data-бот-selection-name="Наташа"] { display: none !important; }
        `);
        console.log("[HideElements] GM_addStyle применён");
    }

    // ==========================================================
    // === БЛОК 5: Hide Specific Tournaments and Sections (JS) ===
    // ==========================================================
    if (enableHideTournaments) {
        (function() {
            function hideT() {
                document.querySelectorAll('.tournaments-list-item-component.tournaments-list-item-list-row').forEach(el => {
                    const toHide =
                        el.querySelector('.threecheck.icon-font-chess.icon-colored') ||
                        el.querySelector('.bullet.icon-font-chess.icon-colored') ||
                        el.querySelector('.live960.icon-font-chess.icon-colored') ||
                        el.querySelector('.kingofthehill.icon-font-chess.icon-colored') ||
                        el.querySelector('.crazyhouse.icon-font-chess.icon-colored') ||
                        el.querySelector('.bughouse.icon-font-chess.icon-colored') ||
                        el.querySelector('.threecheck.tournament-event-icon') ||
                        el.querySelector('.bullet.tournament-event-icon') ||
                        el.querySelector('.live960.tournament-event-icon') ||
                        el.querySelector('.kingofthehill.tournament-event-icon') ||
                        el.querySelector('.crazyhouse.tournament-event-icon') ||
                        el.querySelector('.bughouse.tournament-event-icon') ||
                        el.querySelector('.icon-font-chess.icon-colored.kingofthehill.tournament-event-icon') ||
                        (el.querySelector('.tournaments-list-item-time-label-col') &&
                         el.querySelector('.tournaments-list-item-time-label-col').textContent.trim() === '1 мин.');

                    if (toHide) {
                        el.style.setProperty('display', 'none', 'important');
                        console.log(`[HideTournaments] Скрыли турнир: "${el.innerText.split('\n')[0]}"`);
                    }
                });
            }
            function hideS() {
                document.querySelectorAll('.time-selector-section-component').forEach(sec => {
                    const lbl = sec.querySelector('.time-selector-section-label');
                    if (lbl && (lbl.textContent.trim() === 'Заочные' || lbl.textContent.trim() === 'Пуля')) {
                        sec.style.setProperty('display', 'none', 'important');
                        console.log(`[HideSections] Скрыли раздел: ${lbl.textContent.trim()}`);
                    }
                });
                document.querySelectorAll('.recent-time-section-component').forEach(sec => {
                    const lbl = sec.querySelector('.recent-time-section-label');
                    if (lbl && lbl.textContent.trim() === 'Последние') {
                        sec.style.setProperty('display', 'none', 'important');
                        console.log("[HideSections] Скрыли раздел: Последние");
                    }
                });
            }
            window.addEventListener('load', () => {
                console.log("[HideTournaments] Страница загружена, скрываем турниры и секции");
                hideT();
                hideS();
            });
            setInterval(() => {
                hideT();
                hideS();
            }, 1000);
        })();
    }

    // ==============================================
    // === БЛОК 6: Lichess – только Blitz & Rapid ===
    // ==============================================
    if (enableLichessFilter) {
        GM_addStyle(`
          .tour-chart__inner a.tsht:not(
            :has(> span.icon[title="Пуля"]),
            :has(> span.icon[title="Bullet"]),
            :has(> span.icon[title="Blitz"]),
            :has(> span.icon[title="Rapid"]),
            :has(> span.icon[title="Блиц"]),
            :has(> span.icon[title="Рапид"])
          ) {
            display: none !important;
          }
        `);
        console.log("[LichessFilter] GM_addStyle применён");
    }

    // ===========================================
    // === БЛОК 7: URL-based Body Cleaner ===
    // ===========================================
    (function() {
        const blocked = [
            "youtube.com",
            "music.youtube.com",
            "chrome.google.com/webstore",
            "chromewebstore.google.com",
            "addons.mozilla.org",
            "microsoftedge.microsoft.com/addons",
            "opera.com/extensions",
            "addons.opera.com",
            "yandex.ru/extensions"
        ];
        function isBlocked() {
            return blocked.some(site => location.hostname.includes(site));
        }
        function injectCSS() {
            const style = document.createElement('style');
            style.textContent = `
                html, body { visibility: hidden !important; }
                html::before {
                    content: 'Страница заблокирована!';
                    visibility: visible !important;
                    position: fixed;
                    top: 40%;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    color: red;
                    font-size: 2em;
                    text-align: center;
                    z-index: 999999;
                }
            `;
            document.documentElement.appendChild(style);
            console.log("[URLBlock] Контент заблокирован через GM_addStyle");
        }
        if (isBlocked()) {
            if (document.readyState === 'loading') {
                document.addEventListener("DOMContentLoaded", injectCSS);
            } else {
                injectCSS();
            }
        }
    })();

    // ===========================================
    // === БЛОК 9: Sound Control ===
    // ===========================================
    (function() {
        function isAllowedSite() {
            const hostname = location.hostname;
            return hostname.endsWith('lichess.org') || hostname.endsWith('chess.com');
        }

        function muteAllAudio() {
            if (!isAllowedSite()) {
                document.querySelectorAll('audio, video').forEach(media => {
                    media.muted = true;
                    media.volume = 0;
                });
            }
        }

        // Initial mute
        muteAllAudio();

        // Set up observer for dynamically added media elements
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeName === 'AUDIO' || node.nodeName === 'VIDEO') {
                        if (!isAllowedSite()) {
                            node.muted = true;
                            node.volume = 0;
                        }
                    }
                });
            });
        });

        if (document.documentElement) {
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        }

        // Also handle media elements that might be added through other means
        setInterval(muteAllAudio, 1000);
    })();

    // === БЛОК 8: контроль отправки задач и динамическая блокировка при переключении диалогов ===
    if (enableMessageControl) {
        (function() {
            // 0) URL-гвард: отработаем только на нужных страницах
            const path   = location.pathname;
            const isInbox = path.startsWith('/inbox/');
            const isForum = /^\/forum\/team-[^\/]+\/[^\/]+/.test(path);
            if (!isInbox && !isForum) return;

            // 1) GM-ключи
            const dateKey         = getTodayDateString();
            const keyDailyCount   = `daily_solved_${courseId}_${dateKey}`;
            const keyMessageCount = `messages_sent_${courseId}_${dateKey}`;
            const tasksPerMsg     = tasksPerMessage;
            if (readGMNumber(keyMessageCount) === null) {
                writeGMNumber(keyMessageCount, 0);
            }

            // 2) Подсчёт
            function getCounts() {
                const solved    = readGMNumber(keyDailyCount)   || 0;
                const sent      = readGMNumber(keyMessageCount) || 0;
                const allowed   = Math.floor(solved / tasksPerMsg);
                const remaining = allowed - sent;
                return { solved, allowed, sent, remaining };
            }

            // 3) Инициализация формы
            function initFormControl(form) {
                if (!form || form.dataset.msgCtrlInit) return;
                const ta  = form.querySelector('textarea');
                const btn = form.querySelector('button[type="submit"]');
                if (!ta || !btn) return;

                // создаём индикатор рядом с textarea
                const info = document.createElement('div');
                info.style.cssText = 'font-size:12px;color:#c00;margin-top:4px;margin-left:4px;';
                ta.parentNode.insertBefore(info, ta.nextSibling);

                // обновление состояния
                function refresh() {
                    const { solved, allowed, sent, remaining } = getCounts();
                    const tasksToNext = tasksPerMsg - (solved % tasksPerMsg);
                    ta.disabled  = remaining <= 0;
                    btn.disabled = remaining <= 0;
                    info.textContent = remaining > 0
                        ? `Доступно ${remaining}/${allowed} сообщений`
                        : `Доступно 0. Решите ещё ${tasksToNext} задач`;
                }
                refresh();

                // блокировка сабмита
                form.addEventListener('submit', e => {
                    if (getCounts().remaining <= 0) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                    }
                }, true);

                // инкремент по клику
                btn.addEventListener('click', () => {
                    const cnt = getCounts();
                    if (cnt.remaining > 0) {
                        writeGMNumber(keyMessageCount, cnt.sent + 1);
                        refresh();
                    }
                }, true);

                // инкремент по Enter
                ta.addEventListener('keydown', e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        setTimeout(() => {
                            const cnt = getCounts();
                            if (cnt.remaining > 0) {
                                writeGMNumber(keyMessageCount, cnt.sent + 1);
                                refresh();
                            }
                        }, 50);
                    }
                });

                form.dataset.msgCtrlInit = '1';
            }

            // 4) Постоянный опрос (не останавливаемся), ищем обе формы
            setInterval(() => {
                // Lichess — диалоги в мессенджере
                initFormControl(document.querySelector('.msg-app__convo__post'));
                // Форум — форма ответа
                initFormControl(document.querySelector('form.form3.reply'));
            }, 300);
        })();
    }

    // Показываем оверлей с графиком на странице курса, если есть блок с количеством задач
    (function showOverlayOnCoursePage() {
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;
        const isCoursePage = hostname.endsWith('learn.chessking.com') && 
                           pathname === `/learning/course/${courseId}`;
        const isTasksPage = hostname.endsWith('learn.chessking.com') && 
                           pathname.includes(`/learning/course/${courseId}/tasks`);
        
        if (isCoursePage || isTasksPage) {
            console.log(`[Tracker] Инициализация UI на ${isTasksPage ? 'странице задач' : 'странице курса'}`);
            
            // Ждём загрузки DOM
            function initUI() {
                // Проверяем наличие buildUIandStartUpdates
                if (typeof window.buildUIandStartUpdates !== 'function') {
                    setTimeout(initUI, 100);
                    return;
                }

                window.buildUIandStartUpdates();
            }
            
            // Запускаем инициализацию в зависимости от состояния загрузки страницы
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                initUI();
            } else {
                document.addEventListener('DOMContentLoaded', initUI);
                window.addEventListener('load', initUI);
            }
        }
    })();

    // ===========================================
    // === БЛОК 10: Time Control ===
    // ===========================================
    (function() {
        let timeControlInitialized = false;

        function initializeTimeControl() {
            if (timeControlInitialized) return;
            timeControlInitialized = true;

            // Проверяем и сбрасываем время в полночь
            const savedDate = GM_getValue('ck_time_date', null);
            if (savedDate !== dateKey) {
                GM_setValue('ck_time_date', dateKey);
                GM_setValue(GM_KEYS.TIME_REMAINING, maxTimePerDay);
                GM_setValue('ck_time_start', Date.now());
            }

            // Функция для форматирования времени в чч:мм
            function formatTime(minutes) {
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
            }

            // Функция для обновления title
            function updateTitle(minutes) {
                if (!document.title) return;
                const timeStr = formatTime(minutes);
                const oldTitle = document.title.replace(/^\d{2}:\d{2}\s·\s/, '');
                document.title = `${timeStr} · ${oldTitle}`;
            }

            // Функция для создания и показа оверлея
            function showTimeOverlay(minutes) {
                if (!document.body) return;

                let overlay = document.getElementById('ck-time-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'ck-time-overlay';
                    overlay.style.position = 'fixed';
                    overlay.style.top = '10px';
                    overlay.style.right = '10px';
                    overlay.style.backgroundColor = 'white';
                    overlay.style.border = '1px solid #ccc';
                    overlay.style.padding = '10px';
                    overlay.style.zIndex = '2147483647';
                    overlay.style.fontFamily = 'Arial, sans-serif';
                    overlay.style.fontSize = '12px';
                    overlay.style.color = '#000';
                    document.body.appendChild(overlay);
                }
                overlay.innerHTML = `<strong>Оставшееся время:</strong><br/>${formatTime(minutes)}`;
            }

            // Функция для очистки body
            function clearBody() {
                if (!document.body) return;

                document.body.innerHTML = '';
                document.body.style.backgroundColor = '#fff';
                document.body.style.display = 'flex';
                document.body.style.justifyContent = 'center';
                document.body.style.alignItems = 'center';
                document.body.style.height = '100vh';
                document.body.style.margin = '0';
                document.body.style.fontFamily = 'Arial, sans-serif';
                document.body.style.fontSize = '24px';
                document.body.style.color = '#000';
                document.body.textContent = 'Время истекло!';
            }

            // Функция для проверки времени суток
            function getMinutesUntilDailyLimit() {
                const now = new Date();
                const limitTime = new Date(now);
                limitTime.setHours(dailyTimeLimit.hour, dailyTimeLimit.minute, 0, 0);

                // Если текущее время больше лимита, возвращаем 0
                if (now >= limitTime) return 0;

                // Иначе возвращаем количество минут до лимита
                return Math.floor((limitTime - now) / (60 * 1000));
            }

            // Основная функция контроля времени
            function controlTime() {
                // Получаем время начала дня
                let startTime = GM_getValue('ck_time_start', null);
                if (startTime === null) {
                    startTime = Date.now();
                    GM_setValue('ck_time_start', startTime);
                }

                // Вычисляем прошедшее время в минутах
                const elapsedMinutes = Math.floor((Date.now() - startTime) / (60 * 1000));
                
                // Вычисляем оставшееся время по maxTimePerDay
                let remainingTimeByMax = Math.max(0, maxTimePerDay - elapsedMinutes);
                
                // Вычисляем оставшееся время до дневного лимита
                let remainingTimeByDailyLimit = getMinutesUntilDailyLimit();
                
                // Берем меньшее из двух значений
                let remainingTime = Math.min(remainingTimeByMax, remainingTimeByDailyLimit);
                
                // Сохраняем оставшееся время
                writeGMNumber(GM_KEYS.TIME_REMAINING, remainingTime);

                // Обновляем title
                updateTitle(remainingTime);

                // Проверяем, нужно ли показать оверлей (за 15 минут до конца)
                if (remainingTime <= 15) {
                    showTimeOverlay(remainingTime);
                }

                // Если время истекло, очищаем body
                if (remainingTime <= 0) {
                    clearBody();
                    return;
                }

                // Запускаем следующий тик через минуту
                setTimeout(controlTime, 60000);
            }

            // Запускаем контроль времени
            controlTime();
        }

        // Запускаем инициализацию в зависимости от состояния загрузки страницы
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeTimeControl);
        } else {
            initializeTimeControl();
        }
    })();
})();




