import WebSocket, { WebSocketServer } from 'ws';
import { getEnvVar } from '../utils/getEnvVar.js';
import { RawDataToBuffer } from '../streams/RawDataToBuffer.js';
import { WebmToPCMDecoder } from '../streams/WebmToPCMDecoder.js';
import { Base64Encoder } from '../streams/Base64Encoder.js';

const OPENAI_WS_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2025-06-03';
const OPENAI_API_KEY = getEnvVar('OPENAI_API_KEY');

export function initWSS(server, logger) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (clientSocket) => {
    logger.info('🔗 Client WS connected');

    let openaiSocket = null;
    let rawDataToBuffer = null;
    let webmToPCMDecoder = null;
    let base64Encoder = null;
    let isSafeToSendAudio = false;
    let sessionId = null;

    // Хранит base64 chunks и суммарное время аудио в мс
    let audioBufferQueue = [];
    let bufferedAudioDurationMs = 0;

    // Для контроля commit-а
    let commitTimeout = null;
    let commitInterval = null;
    const COMMIT_DEBOUNCE_MS = 200;
    const MIN_AUDIO_DURATION_MS = 100; // Минимум 100 мс аудио для commit

    function cleanup() {
      logger.info('🧹 Cleanup started');

      if (openaiSocket) {
        openaiSocket.close();
        openaiSocket = null;
      }
      if (rawDataToBuffer) {
        rawDataToBuffer.destroy();
        rawDataToBuffer = null;
      }
      if (webmToPCMDecoder) {
        webmToPCMDecoder.destroy();
        webmToPCMDecoder = null;
      }
      if (base64Encoder) {
        base64Encoder.destroy();
        base64Encoder = null;
      }
      if (commitInterval) {
        clearInterval(commitInterval);
        commitInterval = null;
      }
      if (commitTimeout) {
        clearTimeout(commitTimeout);
        commitTimeout = null;
      }

      isSafeToSendAudio = false;
      sessionId = null;
      audioBufferQueue = [];
      bufferedAudioDurationMs = 0;

      logger.info('🧹 Cleanup finished');
    }

    function sendToOpenAI(obj) {
      if (openaiSocket?.readyState === WebSocket.OPEN) {
        if (sessionId && !obj.session) obj.session = sessionId;
        openaiSocket.send(JSON.stringify(obj));
        logger.info('➡️ Sent to OpenAI:', obj.type);
      }
    }

    function hasBufferedAudio() {
      return bufferedAudioDurationMs >= MIN_AUDIO_DURATION_MS;
    }

    // Отправка commit с дебаунсом, если накоплено достаточно аудио
    function scheduleCommit() {
      if (commitTimeout) clearTimeout(commitTimeout);

      commitTimeout = setTimeout(() => {
        if (isSafeToSendAudio && hasBufferedAudio()) {
          logger.info(`⏳ Commit audio buffer (duration: ${bufferedAudioDurationMs} ms)`);

          sendToOpenAI({ type: 'input_audio_buffer.commit' });

          // Очистка буфера после commit-а
          audioBufferQueue = [];
          bufferedAudioDurationMs = 0;
        }
      }, COMMIT_DEBOUNCE_MS);
    }

    clientSocket.on('message', async (data) => {
      try {
        const msg = JSON.parse(data);
        logger.info('⬅️ Client message:', msg.type);

        if (msg.type === 'start') {
          logger.info('🚀 Start speech-to-text session');

          openaiSocket = new WebSocket(OPENAI_WS_URL, {
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              'OpenAI-Beta': 'realtime=v1',
            },
          });

          rawDataToBuffer = new RawDataToBuffer();
          webmToPCMDecoder = new WebmToPCMDecoder();
          base64Encoder = new Base64Encoder();

          rawDataToBuffer
            .pipe(webmToPCMDecoder)
            .pipe(base64Encoder);

          base64Encoder.on('data', (chunk) => {
            const base64Chunk = chunk.toString();

            // Предполагается, что chunk - PCM аудио с частотой 16000 Гц, моно, 16-bit,
            // 1 байт = 8 бит, 2 байта на сэмпл.
            // Длина в ms = (байты / (частота * bytesPerSample)) * 1000
            // Здесь bytesPerSample = 2 (16-bit PCM)
            const chunkSizeBytes = chunk.length;
            const chunkDurationMs = (chunkSizeBytes / (16000 * 2)) * 1000;

            audioBufferQueue.push(base64Chunk);
            bufferedAudioDurationMs += chunkDurationMs;

            if (isSafeToSendAudio && openaiSocket.readyState === WebSocket.OPEN) {
              sendToOpenAI({ type: 'input_audio_buffer.append', audio: base64Chunk });
              scheduleCommit();
            } else {
              logger.info('🔁 Buffering audio');
            }
          });

          openaiSocket.on('open', () => {
            logger.info('🧠 OpenAI WS connected');
          });

          openaiSocket.on('message', (raw) => {
            const text = raw.toString();
            logger.info('🧾 Raw OpenAI response:', text);

            try {
              const msg = JSON.parse(text);
              logger.info('📨 OpenAI message:', msg.type);

              if (msg.type === 'session.created') {
                sessionId = msg.id || msg.session_id || null;
                logger.info('🆔 Session ID:', sessionId);

                // Отправляем настройки сессии
                sendToOpenAI({
                  type: 'session.update',
                  event_id: `session-update-${Date.now()}`,
                  session: {
                    modalities: ['text'],
                    instructions: 'Respond only with text. Use English.',
                    input_audio_transcription: {
                      model: 'whisper-1',
                      language: 'en'
                    },
                    turn_detection: {
                      type: 'server_vad',
                      threshold: 0.5,
                      prefix_padding_ms: 300,
                      silence_duration_ms: 500,
                      create_response: true
                    },
                    max_response_output_tokens: 1024
                  }
                });

                isSafeToSendAudio = true;

                // Отправляем все буферизованные аудио чанки
                audioBufferQueue.forEach((audio) => {
                  sendToOpenAI({ type: 'input_audio_buffer.append', audio });
                });

                // Не очищаем тут audioBufferQueue и bufferedAudioDurationMs,
                // так как не было commit-а

                // Запускаем commit интервал для регулярной отправки, если есть аудио
                commitInterval = setInterval(() => {
                  if (isSafeToSendAudio && hasBufferedAudio()) {
                    logger.info(`⏳ Periodic commit audio buffer (duration: ${bufferedAudioDurationMs} ms)`);

                    sendToOpenAI({ type: 'input_audio_buffer.commit' });
                    audioBufferQueue = [];
                    bufferedAudioDurationMs = 0;
                  }
                }, 1000);
              }

              if (msg.type === 'message.delta' && msg.message?.content) {
                console.log('📝 AI partial response:', msg.message.content);
                clientSocket.send(JSON.stringify({ type: 'text-delta', text: msg.message.content }));
              }

              if (msg.type === 'message' && msg.message?.content) {
                console.log('📝 AI final response:', msg.message.content);
                clientSocket.send(JSON.stringify({ type: 'text-final', text: msg.message.content }));
              }

              if (msg.type === 'error') {
                logger.error('🚨 OpenAI error (full):', JSON.stringify(msg, null, 2));
                clientSocket.send(JSON.stringify({ type: 'error', message: msg }));
              }
            } catch (err) {
              logger.error('💥 Failed to parse OpenAI message:', err);
            }
          });

          openaiSocket.on('close', () => {
            logger.info('🔌 OpenAI socket closed');
            cleanup();
          });

          openaiSocket.on('error', (err) => {
            logger.error('💥 OpenAI WS error:', err);
            cleanup();
          });
        }

        if (msg.type === 'audio_chunk') {
          if (rawDataToBuffer) {
            rawDataToBuffer.write(Buffer.from(msg.chunk, 'base64'));
          }
        }

        if (msg.type === 'stop') {
          logger.info('🛑 Stop requested');
          cleanup();
        }
      } catch (e) {
        logger.error('💥 Client WS error:', e);
        clientSocket.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    clientSocket.on('close', () => {
      cleanup();
      logger.info('🔌 Client disconnected');
    });

    clientSocket.on('error', (err) => {
      logger.error('💥 WS client error:', err);
    });
  });
}
