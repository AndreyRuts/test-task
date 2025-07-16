import WebSocket, { WebSocketServer } from 'ws';
import { getEnvVar } from '../utils/getEnvVar.js';
import { RawDataToBuffer } from '../streams/RawDataToBuffer.js';
import { WebmToPCMDecoder } from '../streams/WebmToPCMDecoder.js';
import { Base64Encoder } from '../streams/Base64Encoder.js';

const OPENAI_WS_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2025-06-03';
const OPENAI_TEST_TASK_API_KEY = getEnvVar('OPENAI_API_KEY');

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

    let audioBufferQueue = [];
    let bufferedAudioDurationMs = 0;

    function cleanup() {
      logger.info('🧹 Cleanup started');
      if (openaiSocket) {
        openaiSocket.close();
        openaiSocket = null;
      }
      [rawDataToBuffer, webmToPCMDecoder, base64Encoder].forEach((stream) => {
        if (stream) stream.destroy();
      });
      rawDataToBuffer = null;
      webmToPCMDecoder = null;
      base64Encoder = null;
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

    clientSocket.on('message', async (data) => {
      try {
        const msg = JSON.parse(data);
        logger.info('⬅️ Client message:', msg.type);

        if (msg.type === 'start') {
          logger.info('🚀 Start speech-to-text session');

          openaiSocket = new WebSocket(OPENAI_WS_URL, {
            headers: {
              Authorization: `Bearer ${OPENAI_TEST_TASK_API_KEY}`,
              'OpenAI-Beta': 'realtime=v1',
            },
          });

          rawDataToBuffer = new RawDataToBuffer();
          webmToPCMDecoder = new WebmToPCMDecoder();
          base64Encoder = new Base64Encoder();

          rawDataToBuffer.pipe(webmToPCMDecoder).pipe(base64Encoder);

          base64Encoder.on('data', (chunk) => {
            const base64Chunk = chunk.toString();
            const chunkSizeBytes = chunk.length;
            const chunkDurationMs = (chunkSizeBytes / (16000 * 2)) * 1000;

            audioBufferQueue.push(base64Chunk);
            bufferedAudioDurationMs += chunkDurationMs;

            if (isSafeToSendAudio && openaiSocket.readyState === WebSocket.OPEN) {
              sendToOpenAI({ type: 'input_audio_buffer.append', audio: base64Chunk });
              audioBufferQueue = [];
              bufferedAudioDurationMs = 0;
            } else {
              logger.info('🔁 Buffering audio');
            }
          });

          openaiSocket.on('open', () => {
            logger.info('🧠 OpenAI WS connected');
          });

          openaiSocket.on('message', (raw) => {
            let msg;
            try {
              msg = JSON.parse(raw.toString());
            } catch (err) {
              logger.error('💥 Failed to parse OpenAI message:', err);
              return;
            }

            logger.info('📩 Received OpenAI message:', msg.type);
            console.log('🧾 FULL MESSAGE:', JSON.stringify(msg, null, 2));

            if (msg.type === 'session.created') {
              sessionId = msg.id || msg.session_id || null;
              logger.info('🆔 Session ID:', sessionId);

              sendToOpenAI({
                type: 'session.update',
                event_id: `session-update-${Date.now()}`,
                session: {
                  modalities: ['text'],
                  instructions: 'Respond only with text. Use English.',
                  input_audio_transcription: {
                    model: 'whisper-1',
                    language: 'en',
                  },
                  turn_detection: {
                    type: 'server_vad',
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 500,
                    create_response: true,
                  },
                  max_response_output_tokens: 1024,
                },
              });

              isSafeToSendAudio = true;

              audioBufferQueue.forEach((audio) => {
                sendToOpenAI({ type: 'input_audio_buffer.append', audio });
              });
              audioBufferQueue = [];
              bufferedAudioDurationMs = 0;
            }

            if (msg.type === 'message.delta' && msg.message?.content) {
              clientSocket.send(JSON.stringify({ type: 'text-delta', text: msg.message.content }));
            }

            if (msg.type === 'message') {
              const finalText = msg.message?.content;
              if (finalText) {
                clientSocket.send(JSON.stringify({ type: 'text-final', text: finalText }));
              }
            }

            if (msg.type === 'response.output_item.done') {
              let finalText = '';
              const contentArray = msg.item?.content;
              if (Array.isArray(contentArray)) {
                const textItem = contentArray.find((c) => c.type === 'text');
                if (textItem?.text) finalText = textItem.text;
              }

              console.log('📘 FINAL TEXT >>>', finalText);
              if (finalText) {
                clientSocket.send(JSON.stringify({ type: 'text-final', text: finalText }));
              } else {
                logger.warn('⚠️ No content in response.output_item.done:', JSON.stringify(msg, null, 2));
              }
            }

            if (msg.type === 'error') {
              const errorMessage =
                msg.error?.message || msg.message || 'Unknown error from OpenAI';
              logger.error('🚨 OpenAI error:', errorMessage);
              clientSocket.send(JSON.stringify({ type: 'error', message: errorMessage }));
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
          logger.info('🎙️ Received audio_chunk from client');
          if (rawDataToBuffer) {
            rawDataToBuffer.write(Buffer.from(msg.chunk, 'base64'));
          }
        }

        if (msg.type === 'stop') {
          logger.info('🛑 Stop requested');

          // Ожидание, чтобы OpenAI мог отправить финал
          setTimeout(() => {
            cleanup();
          }, 1000);
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
