import WebSocket, { WebSocketServer } from 'ws';
import { getEnvVar } from '../utils/getEnvVar.js';
import { RawDataToBuffer } from '../streams/RawDataToBuffer.js';
import { WebmToPCMDecoder } from '../streams/WebmToPCMDecoder.js';
import { Base64Encoder } from '../streams/Base64Encoder.js';

const OPENAI_WS_URL = 'wss://api.openai.com/v1/realtime?intent=transcription'; // например: wss://api.openai.com/v1/realtime?intent=transcription
const OPENAI_API_KEY = getEnvVar('OPENAI_API_KEY');

export function initWSS(server, logger) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (clientSocket) => {
    logger.info('🔗 Client WS connected');

    let openaiSocket;
    let rawDataToBuffer;
    let webmToPCMDecoder;
    let base64Encoder;
    let canSendAudio = false;

    function cleanup() {
      if (openaiSocket && openaiSocket.readyState === WebSocket.OPEN) {
        openaiSocket.close();
      }
      if (rawDataToBuffer) rawDataToBuffer.destroy();
      if (webmToPCMDecoder) webmToPCMDecoder.destroy();
      if (base64Encoder) base64Encoder.destroy();
      logger.info('🧹 Cleanup finished');
    }

    clientSocket.on('message', async (data) => {
      try {
        const msg = JSON.parse(data);

        if (msg.type === 'start') {
          logger.info('Client requested start transcription session');

          openaiSocket = new WebSocket(OPENAI_WS_URL, {
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              'OpenAI-Beta': 'realtime=v1',
            },
          });

          rawDataToBuffer = new RawDataToBuffer();
          webmToPCMDecoder = new WebmToPCMDecoder();
          base64Encoder = new Base64Encoder();

          rawDataToBuffer.pipe(webmToPCMDecoder).pipe(base64Encoder);

          base64Encoder.on('data', (base64Chunk) => {
            if (canSendAudio && openaiSocket.readyState === WebSocket.OPEN) {
              openaiSocket.send(
                JSON.stringify({
                  type: 'audio_input',
                  audio: base64Chunk.toString(),
                })
              );
            }
          });

          openaiSocket.on('open', () => {
            logger.info('🧠 OpenAI WS connected');
            canSendAudio = true;
            clientSocket.send(JSON.stringify({ type: 'status', message: 'Started transcription session' }));
          });

          openaiSocket.on('message', (msg) => {
            logger.info('OpenAI raw message:', msg.toString());
            try {
              const openaiMsg = JSON.parse(msg);
              if (openaiMsg.type === 'transcript' && openaiMsg.text) {
                clientSocket.send(JSON.stringify({ type: 'transcript', text: openaiMsg.text }));
              } else if (openaiMsg.type === 'error') {
                logger.error('OpenAI WS error message:', openaiMsg);
                clientSocket.send(JSON.stringify({ type: 'error', message: openaiMsg.message || 'OpenAI error' }));
              }
            } catch (err) {
              logger.error('💥 Failed to parse OpenAI message:', err);
            }
          });

          openaiSocket.on('close', (code, reason) => {
            logger.info(`❌ OpenAI WS closed: code=${code}, reason=${reason}`);
            canSendAudio = false;
            clientSocket.send(JSON.stringify({ type: 'status', message: 'OpenAI connection closed' }));
            cleanup();
          });

          openaiSocket.on('error', (err) => {
            logger.error('💥 OpenAI WS error:', err);
            clientSocket.send(JSON.stringify({ type: 'error', message: 'OpenAI WS error' }));
          });

          clientSocket.send(JSON.stringify({ type: 'status', message: 'WebSocket connection to OpenAI initiated' }));
        }

        else if (msg.type === 'audio_chunk') {
          if (rawDataToBuffer) {
            const chunkBuffer = Buffer.from(msg.chunk, 'base64');
            rawDataToBuffer.write(chunkBuffer);
          } else {
            clientSocket.send(JSON.stringify({ type: 'error', message: 'Transcription session not started' }));
          }
        }

        else if (msg.type === 'stop') {
          logger.info('Client requested stop transcription session');
          cleanup();
          clientSocket.send(JSON.stringify({ type: 'status', message: 'Transcription session stopped' }));
        }

        else {
          clientSocket.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
        }
      } catch (e) {
        logger.error({ err: e }, '💥 WS message handling error');
        clientSocket.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    clientSocket.on('close', () => {
      cleanup();
      logger.info('🔌 Client WS disconnected');
    });

    clientSocket.on('error', (err) => {
      logger.error('💥 Client WS error:', err);
    });
  });
}
