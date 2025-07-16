import WebSocket, { WebSocketServer } from 'ws';

import { getEnvVar } from '../utils/getEnvVar.js';
import { RawDataToBuffer } from '../streams/RawDataToBuffer.js';
import { WebmToPCMDecoder } from '../streams/WebmToPCMDecoder.js';
import { Base64Encoder } from '../streams/Base64Encoder.js';

const OPENAI_WS_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2025-06-03';
const OPENAI_TEST_TASK_API_KEY = getEnvVar('OPENAI_TEST_TASK_API_KEY');

export function initWSS(server, logger) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (clientSocket) => {
    logger.info('🔗 Client connected');

    let openaiSocket = null;
    let rawDataToBuffer = null;
    let webmToPCMDecoder = null;
    let base64Encoder = null;
    let sessionId = null;
    let isSafeToSendAudio = false;

    let audioBufferQueue = [];

    function destroyStream(stream) {
      if (stream && typeof stream.destroy === 'function') {
        stream.destroy();
      }
    }

    function cleanup() {
      logger.info('🧹 Cleanup started');

      openaiSocket?.close();
      openaiSocket = null;

      [rawDataToBuffer, webmToPCMDecoder, base64Encoder].forEach(destroyStream);

      rawDataToBuffer = webmToPCMDecoder = base64Encoder = null;
      sessionId = null;
      isSafeToSendAudio = false;
      audioBufferQueue = [];

      logger.info('🧹 Cleanup finished');
    }

    function sendToOpenAI(payload) {
      if (openaiSocket?.readyState !== WebSocket.OPEN) return;
      if (sessionId && !payload.session) {
        payload.session = sessionId;
      }
      openaiSocket.send(JSON.stringify(payload));
      logger.info('➡️ Sent to OpenAI:', payload.type);
    }

    function generateEventId(prefix = 'event') {
      return `${prefix}-${Date.now()}`;
    }

    function handleOpenAIMessage(raw) {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch (err) {
        logger.error('💥 Failed to parse OpenAI message:', err);
        return;
      }

      logger.info('📩 OpenAI message:', msg.type);

      switch (msg.type) {
        case 'session.created':
          sessionId = msg.id || msg.session_id || null;
          logger.info('🆔 Session ID:', sessionId);

          sendToOpenAI({
            type: 'session.update',
            event_id: generateEventId('session-update'),
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
          break;

        case 'message.delta':
          if (msg.message?.content) {
            clientSocket.send(JSON.stringify({ type: 'text-delta', text: msg.message.content }));
          }
          break;

        case 'message':
          if (msg.message?.content) {
            clientSocket.send(JSON.stringify({ type: 'text-final', text: msg.message.content }));
          }
          break;

        case 'response.output_item.done':
          const contentArray = msg.item?.content;
          if (Array.isArray(contentArray)) {
            const textItem = contentArray.find((c) => c.type === 'text');
            const finalText = textItem?.text;
            if (finalText) {
              logger.info('📘 FINAL TEXT >>>', finalText);
              clientSocket.send(JSON.stringify({ type: 'text-final', text: finalText }));
            } else {
              logger.warn('⚠️ No text content in done message');
            }
          }
          break;

        case 'error':
          const errorMessage =
            msg.error?.message || msg.message || 'Unknown error from OpenAI';
          logger.error('🚨 OpenAI error:', errorMessage);
          clientSocket.send(JSON.stringify({ type: 'error', message: errorMessage }));
          break;

        default:
          logger.warn('⚠️ Unhandled OpenAI message type:', msg.type);
          break;
      }
    }

    function handleStartMessage() {
      logger.info('🚀 Starting new session');

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
        audioBufferQueue.push(base64Chunk);

        if (isSafeToSendAudio && openaiSocket.readyState === WebSocket.OPEN) {
          sendToOpenAI({ type: 'input_audio_buffer.append', audio: base64Chunk });
          audioBufferQueue = [];
        } else {
          logger.info('🔁 Buffering audio');
        }
      });

      openaiSocket.on('open', () => {
        logger.info('🧠 OpenAI WS connected');
      });

      openaiSocket.on('message', handleOpenAIMessage);

      openaiSocket.on('close', () => {
        logger.info('🔌 OpenAI socket closed');
        cleanup();
      });

      openaiSocket.on('error', (err) => {
        logger.error('💥 OpenAI socket error:', err);
        cleanup();
      });
    }

    function handleAudioChunkMessage(base64Chunk) {
      if (rawDataToBuffer) {
        logger.info('🎙️ Received audio_chunk');
        rawDataToBuffer.write(Buffer.from(base64Chunk, 'base64'));
      }
    }

    function handleStopMessage() {
      logger.info('🛑 Stop requested');
      setTimeout(cleanup, 1000);
    }

    clientSocket.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        logger.info('⬅️ Client message:', msg.type);

        switch (msg.type) {
          case 'start':
            handleStartMessage();
            break;
          case 'audio_chunk':
            handleAudioChunkMessage(msg.chunk);
            break;
          case 'stop':
            handleStopMessage();
            break;
          default:
            logger.warn('❓ Unknown message type:', msg.type);
            clientSocket.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
        }
      } catch (err) {
        logger.error('💥 WS client message parse error:', err);
        clientSocket.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    clientSocket.on('close', () => {
      cleanup();
      logger.info('🔌 Client disconnected');
    });

    clientSocket.on('error', (err) => {
      logger.error('💥 Client WS error:', err);
    });
  });
}
