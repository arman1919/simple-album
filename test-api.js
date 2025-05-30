const axios = require('axios');

const albumId = '10253332-c298-41bb-9c44-c6a63285f254';
const apiUrl = `http://localhost:5000/api/albums/${albumId}/public`;

async function testApi() {
  try {
    console.log(`Отправка запроса на: ${apiUrl}`);
    const response = await axios.get(apiUrl);
    console.log('Статус ответа:', response.status);
    console.log('Данные ответа:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Ошибка при запросе API:');
    if (error.response) {
      // Сервер ответил с кодом состояния, отличным от 2xx
      console.error('Статус ошибки:', error.response.status);
      console.error('Данные ошибки:', error.response.data);
    } else if (error.request) {
      // Запрос был сделан, но ответа не получено
      console.error('Запрос был отправлен, но ответа не получено');
      console.error(error.request);
    } else {
      // Произошла ошибка при настройке запроса
      console.error('Ошибка при настройке запроса:', error.message);
    }
  }
}

testApi();
