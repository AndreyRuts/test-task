import WebSocket, { WebSocketServer } from 'ws';
import { getEnvVar } from '../utils/getEnvVar.js';
import { createReadStream, unlink } from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';
import axios from 'axios';
import FormData from 'form-data';

const OPENAI_TEST_TASK_API_KEY = getEnvVar('OPENAI_TEST_TASK_API_KEY');
const TRANSCRIPTION_API_URL = 'https://api.openai.com/v1/audio/transcriptions';
const CHAT_API_URL = 'https://api.openai.com/v1/chat/completions';

// --- Добавляем функцию retry с экспоненциальным backoff ---
async function postWithRetry(url, data, config, retries = 3, delayMs = 1000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await axios.post(url, data, config);
    } catch (err) {
      if (err.response?.status === 429) {
        if (attempt === retries) {
          throw err; // исчерпаны попытки — выбрасываем ошибку дальше
        }
        console.warn(`⚠️ 429 Too Many Requests, retry #${attempt + 1} after ${delayMs} ms`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // экспоненциальный рост задержки
      } else {
        throw err; // ошибка не 429 — выбрасываем
      }
    }
  }
}

export function initWSS(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (clientSocket) => {
    console.log('🔗 Client WS connected');

    let audioChunks = [];
    let sessionId = Date.now();

    async function cleanup() {
      console.log('🧹 Cleanup started');
      audioChunks = [];
      console.log('🧹 Cleanup finished');
    }

    clientSocket.on('message', async (data) => {
      try {
        const msg = JSON.parse(data);
        console.log('⬅️ Client message:', msg.type);

        if (msg.type === 'start') {
          console.log('🚀 Start session:', sessionId);
        }

        if (msg.type === 'audio_chunk') {
          const buffer = Buffer.from(msg.chunk, 'base64');
          audioChunks.push(buffer);
        }

        if (msg.type === 'stop') {
          console.log('🛑 Stop received. Processing audio...');

          const tmpFilename = path.resolve('uploads', `${sessionId}.webm`);
          await writeFile(tmpFilename, Buffer.concat(audioChunks));

          // 1. Транскрипция с retry
          const formData = new FormData();
          formData.append('model', 'whisper-1');
          formData.append('file', createReadStream(tmpFilename));

          const whisperRes = await postWithRetry(
            TRANSCRIPTION_API_URL,
            formData,
            {
              headers: {
                Authorization: `Bearer ${OPENAI_TEST_TASK_API_KEY}`,
                ...formData.getHeaders(),
              },
            }
          );

          const userText = whisperRes.data.text;
          console.log('📝 Transcribed:', userText);

          // 2. GPT-ответ с retry
          const chatRes = await postWithRetry(
            CHAT_API_URL,
            {
              model: 'gpt-4',
              messages: [{ role: 'user', content: userText }],
            },
            {
              headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
              },
            }
          );

          const gptReply = chatRes.data.choices[0].message.content;
          console.log('🤖 GPT reply:', gptReply);

          // 3. Ответ клиенту
          clientSocket.send(
            JSON.stringify({
              type: 'final_response',
              transcript: userText,
              reply: gptReply,
            })
          );

          await unlink(tmpFilename);
          await cleanup();
        }
      } catch (err) {
        console.error('💥 Error handling message:', err);
        clientSocket.send(
          JSON.stringify({ type: 'error', message: 'Processing failed.' })
        );
        await cleanup();
      }
    });

    clientSocket.on('close', () => {
      cleanup();
      console.log('🔌 Client disconnected');
    });

    clientSocket.on('error', (err) => {
      console.error('💥 WS client error:', err);
    });
  });
}
