const BOT_TOKEN = '8061900689:AAEf4s4fjCTkU8I-y0vsddZHBSFhKIbdI8k';
const SHEET_ID = '1UoTbOupUtjMKoivLuEPMqwvfYrBxz-_kzIisvtLlasw';
const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzlwBbfSrETF5iq12fZbAPv2lVHVhyqvZpL1ZP-3SyVLcC9lCKDGyU7MuF9TvRGL7Fl5w/exec';
const SS = SpreadsheetApp.openById(SHEET_ID);
const ARTICLE_CACHE = {}; // Кэш для статей

function setWebhook() {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${WEBHOOK_URL}`;
  const response = UrlFetchApp.fetch(url);
  console.log(response.getContentText());
}

function resetWebhook() {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook?drop_pending_updates=true`;
  const response = UrlFetchApp.fetch(url);
  console.log(response.getContentText());
}

function doPost(e) {
  const update = JSON.parse(e.postData.contents);
  const chatId = update.message.chat.id;
  const text = update.message.text;
  const userId = update.message.from.id;

  logAction('Новое сообщение', `Пользователь: ${userId}, Текст: ${text}`);

  if (text === '/start') {
    sendKeyboard(chatId, 'Выберите тип операции:', [['Доход', 'Расход']]);
    setUserState(userId, 'type');
    return;
  }

  // отмена операции
  if (text === '/cancel') {
    clearUserData(userId);
    sendMessage(chatId, 'Операция отменена');
    return;
  }

  const state = getUserState(userId);
  const userData = getUserData(userId);

  // обработчик состояний
  switch(state) {
    case 'type':
      handleType(chatId, userId, text);
      break;
    case 'article':
      handleArticle(chatId, userId, text);
      break;
    case 'amount':
      handleAmount(chatId, userId, text);
      break;
    case 'comment':
      handleComment(chatId, userId, text);
      break;
  }
}

function handleType(chatId, userId, type) {
  type = type.trim().toLowerCase();
  
  if (!['доход', 'расход'].includes(type)) {
    sendMessage(chatId, 'Выберите из предложенных вариантов');
    return;
  }

  const articles = getArticlesByType(type);
  
  if (articles.length === 0) {
    sendMessage(chatId, 'Нет доступных статей для этого типа');
    return;
  }

  const keyboard = articles.map(article => [article]);
  
  setUserData(userId, { type });
  sendKeyboard(chatId, 'Выберите статью:', keyboard);
  setUserState(userId, 'article');
}

function handleArticle(chatId, userId, article) {
  const type = getUserData(userId).type;
  const validArticles = getArticlesByType(type);

  if (!validArticles.includes(article.trim().toLowerCase())) {
    sendMessage(chatId, 'Статья не найдена');
    return;
  }

  setUserData(userId, { ...getUserData(userId), article });
  sendMessage(chatId, 'Введите сумму:');
  setUserState(userId, 'amount');
}

function handleAmount(chatId, userId, amount) {
  if (isNaN(amount)) {
    sendMessage(chatId, 'Введите число');
    return;
  }

  setUserData(userId, { ...getUserData(userId), amount: parseFloat(amount) });
  sendMessage(chatId, 'Введите комментарий (/skip для пропуска):');
  setUserState(userId, 'comment');
}

function handleComment(chatId, userId, comment) {
  const data = getUserData(userId);
  const sheet = SS.getSheetByName('Операции');
  
  sheet.appendRow([
    new Date(),
    data.article,
    data.amount,
    comment === '/skip' ? '' : comment
  ]);

  sendMessage(chatId, 'Операция сохранена!');
  sendKeyboard(chatId, 'Выберите тип операции:', [['Доход', 'Расход']]);
  clearUserData(userId);
  setUserState(userId, 'type');
}

function getArticlesByType(type) {
  if (ARTICLE_CACHE[type]) return ARTICLE_CACHE[type];

  const sheet = SS.getSheetByName('Справочник');
  const data = sheet.getDataRange().getValues();
  
  const filtered = data
    .slice(1)
    .filter(row => row[1]?.toString().trim().toLowerCase() === type)
    .map(row => row[0]?.toString().trim().toLowerCase());

  ARTICLE_CACHE[type] = filtered;
  return filtered;
}

function sendMessage(chatId, text) {
  UrlFetchApp.fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      chat_id: chatId,
      text: text
    })
  });
}

function sendKeyboard(chatId, text, buttons) {
  const payload = {
    chat_id: chatId,
    text: text,
    reply_markup: {
      keyboard: buttons,
      resize_keyboard: true,
      one_time_keyboard: true
    }
  };
  
  UrlFetchApp.fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  });
}

function logAction(action, data) {
  SS.getSheetByName('Логи').appendRow([new Date(), action, data]);
}

function setUserState(userId, state) {
  PropertiesService.getUserProperties().setProperty(userId, state);
}

function getUserState(userId) {
  return PropertiesService.getUserProperties().getProperty(userId) || '';
}

function setUserData(userId, data) {
  PropertiesService.getUserProperties().setProperty(`${userId}_data`, JSON.stringify(data));
}

function getUserData(userId) {
  const data = PropertiesService.getUserProperties().getProperty(`${userId}_data`);
  return data ? JSON.parse(data) : {};
}

function clearUserData(userId) {
  PropertiesService.getUserProperties().deleteProperty(`${userId}_data`);
}