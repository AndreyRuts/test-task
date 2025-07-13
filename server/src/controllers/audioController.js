// import fs from 'fs/promises';
// import path from 'path';
// import { v4 as uuidv4 } from 'uuid';
// import { transcribeAudio } from '../services/transcribeAudio.js';

// const sessions = new Map(); // socket -> { chunks: [], startTime: number }

// const MAX_RECORDING_TIME_MS = 30 * 1000; // 30 секунд
// const MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024; // 25 МБ

// export const handleStartConversation = async (socket) => {
//   sessions.set(socket, { chunks: [], startTime: Date.now() });
//   socket.send(JSON.stringify({ type: 'status', message: '🎤 Запись началась' }));
// };

// export const handleStopConversation = async (socket) => {
//   const session = sessions.get(socket);
//   if (!session || session.chunks.length === 0) {
//     socket.send(JSON.stringify({ type: 'error', message: '🛑 Нет аудио данных' }));
//     return;
//   }

//   const buffer = Buffer.concat(session.chunks);

//   if (buffer.length > MAX_AUDIO_SIZE_BYTES) {
//     socket.send(JSON.stringify({ type: 'error', message: 'Размер аудио превышает 25 МБ' }));
//     sessions.delete(socket);
//     return;
//   }

//   const filename = `${uuidv4()}.webm`;
//   const filePath = path.join('./temp', filename);

//   try {
//     await fs.mkdir('./temp', { recursive: true });
//     await fs.writeFile(filePath, buffer);

//     // Передаём язык 'ru' для распознавания
//     const text = await transcribeAudio(filePath, 'ru');

//     socket.send(JSON.stringify({ type: 'transcript', text }));
//   } catch (err) {
//     console.error('💥 Ошибка при обработке остановки:', err);
//     socket.send(JSON.stringify({ type: 'error', message: 'Ошибка распознавания' }));
//   } finally {
//     sessions.delete(socket);
//     try {
//       await fs.unlink(filePath);
//       console.log(`🧹 Временный файл удалён: ${filePath}`);
//     } catch (e) {
//       console.warn('🧹 Не удалось удалить временный файл:', e.message);
//     }
//   }
// };

// export const handleAudioChunk = async (socket, data) => {
//   const session = sessions.get(socket);
//   if (!session) {
//     return socket.send(JSON.stringify({ type: 'error', message: 'Нет активной сессии' }));
//   }

//   // Проверяем лимит времени записи
//   if (Date.now() - session.startTime > MAX_RECORDING_TIME_MS) {
//     socket.send(JSON.stringify({ type: 'error', message: 'Превышено максимальное время записи (30 секунд)' }));
//     sessions.delete(socket);
//     return;
//   }

//   const { chunk } = data;
//   if (!chunk) {
//     return socket.send(JSON.stringify({ type: 'error', message: 'Не предоставлен аудио чанк' }));
//   }

//   try {
//     const chunkBuffer = Buffer.from(chunk, 'base64');

//     // Проверка размера накопленных данных
//     const currentSize = session.chunks.reduce((acc, buf) => acc + buf.length, 0);
//     if (currentSize + chunkBuffer.length > MAX_AUDIO_SIZE_BYTES) {
//       socket.send(JSON.stringify({ type: 'error', message: 'Превышен лимит размера аудио (25 МБ)' }));
//       sessions.delete(socket);
//       return;
//     }

//     session.chunks.push(chunkBuffer);
//   } catch (err) {
//     console.error('💥 Ошибка при сохранении чанка:', err);
//     socket.send(JSON.stringify({ type: 'error', message: 'Не удалось обработать аудио чанк' }));
//   }
// };
