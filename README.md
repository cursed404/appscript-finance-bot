https://docs.google.com/spreadsheets/d/1UoTbOupUtjMKoivLuEPMqwvfYrBxz-_kzIisvtLlasw/edit?gid=1349349533#gid=1349349533
Таблица
@appscriptTestDdsBot
Бот

Этот Telegram-бот помогает фиксировать финансовые операции в Google Таблице. 
Пользователь вводит данные о транзакции (тип операции, статья, сумма, комментарий), 
а бот записывает их в лист «Операции».

Дополнительно бот:

Ведёт логирование действий в листе «Логи».
Хранит список статей в листе «Справочник».
Управляет диалогом с пользователем через PropertiesService, запоминая промежуточные шаги.
Использует кэширование для быстрого доступа к справочнику.
Глобальные переменные
BOT_TOKEN – токен бота из BotFather (Telegram API).
SHEET_ID – ID Google Таблицы, куда записываются все данные.
SS – объект таблицы (SpreadsheetApp.openById(SHEET_ID)).
ARTICLE_CACHE – кэш списка статей (чтобы не обращаться к таблице каждый раз).
Основной обработчик – doPost(e)
Главная функция, которая принимает сообщения от Telegram. Выполняет следующие шаги:

Разбирает полученный JSON-запрос.
Извлекает chatId, text и userId.
Записывает входящие данные в лог.
Обрабатывает команды:
/start – предлагает выбрать тип операции (доход/расход).
/cancel – сбрасывает состояние и отменяет ввод.
Определяет текущее состояние пользователя и вызывает нужную обработку:
handleType – выбор типа операции.
handleArticle – выбор статьи.
handleAmount – ввод суммы.
handleComment – ввод комментария и запись операции в таблицу.
Обработка шагов диалога
handleType(userId, text)
Обрабатывает выбор типа операции (доход или расход).

Приводит текст к нижнему регистру, убирает пробелы.
Проверяет, допустим ли введённый тип.
Получает список доступных статей через getArticlesByType(type).
Сохраняет выбор пользователя и предлагает выбрать статью.
handleArticle(userId, text)
Обрабатывает выбор статьи.

Очищает введённое значение от пробелов.
Получает тип операции из сохранённых данных.
Проверяет, есть ли такая статья в списке допустимых.
Сохраняет статью и запрашивает ввод суммы.
handleAmount(userId, text)
Обрабатывает ввод суммы.

Убирает пробелы, проверяет, является ли ввод числом.
Если число корректное, сохраняет его.
Запрашивает ввод комментария (можно пропустить, отправив /skip).
handleComment(userId, text)
Обрабатывает ввод комментария и записывает данные в таблицу.

Извлекает сохранённые данные (тип, статья, сумма).
Добавляет новую строку в лист «Операции».
Подтверждает успешное сохранение.
Сбрасывает состояние и предлагает ввести новую операцию.
Вспомогательные функции
getArticlesByType(type)
Получает список статей для указанного типа операции.

Если статьи уже есть в кэше, возвращает их.
В противном случае читает данные из листа «Справочник», фильтруя по указанному типу.
Кэширует полученные результаты.
sendMessage(chatId, text)
Отправляет текстовое сообщение пользователю через Telegram API.

sendKeyboard(chatId, text, buttons)
Отправляет сообщение с кнопками для выбора.

logAction(action, data)
Записывает событие в лист «Логи» с датой и дополнительными данными.

Функции управления состоянием
Используется PropertiesService для сохранения данных между запросами:

setUserState(userId, state) – сохраняет текущий шаг диалога.
getUserState(userId) – получает текущий шаг.
setUserData(userId, data) – сохраняет данные о вводе пользователя.
getUserData(userId) – получает сохранённые данные.
clearUserData(userId) – очищает сохранённые данные после завершения операции.
