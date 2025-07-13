// import WebSocket from 'ws';
// import { getEnvVar } from '../utils/getEnvVar.js';

// const sessions = new Map(); // socket -> OpenAI WS

// const OPENAI_API_KEY = getEnvVar('OPENAI_API_KEY');
// const OPENAI_WS_URL = "wss://api.openai.com/v1/audio/speech-to-text/ws";

// export function createOpenAIStream(clientSocket) {
//   const openaiSocket = new WebSocket(OPENAI_WS_URL, {
//     headers: {
//       Authorization: `Bearer ${OPENAI_API_KEY}`,
//     },
//   });

//   openaiSocket.on('open', () => {
//     console.log('🔗 OpenAI WS connected');
//   });

//   openaiSocket.on('message', (data) => {
//     const message = JSON.parse(data);
//     console.log('📥 OpenAI:', message);

//     // Отправка текста клиенту
//     if (message.type === 'transcript' || message.text) {
//       clientSocket.send(JSON.stringify({
//         type: 'transcript',
//         text: message.text || '',
//       }));
//     }
//   });

//   openaiSocket.on('close', () => {
//     console.log('❌ OpenAI WS closed');
//   });

//   openaiSocket.on('error', (err) => {
//     console.error('💥 OpenAI WS error:', err);
//   });

//   sessions.set(clientSocket, openaiSocket);

//   return {
//     sendAudioChunk: (chunk) => {
//       if (openaiSocket.readyState === WebSocket.OPEN) {
//         openaiSocket.send(Buffer.from(chunk, 'base64'));
//       }
//     },
//     stop: () => {
//       openaiSocket.close();
//       sessions.delete(clientSocket);
//     },
//   };
// }

// export function getSession(clientSocket) {
//   return sessions.get(clientSocket);
// }
