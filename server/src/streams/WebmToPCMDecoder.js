import { Transform } from 'stream';
import prism from 'prism-media';

export class WebmToPCMDecoder extends Transform {
  constructor() {
    super({ readableObjectMode: false, writableObjectMode: false });

    this.demuxer = new prism.opus.WebmDemuxer();
    this.decoder = new prism.opus.Decoder({
      rate: 24000,
      channels: 1,
      frameSize: 960,
    });

    // Pipe demuxer to decoder
    this.demuxer.pipe(this.decoder);

    // Когда decoder выдаёт данные, пушим дальше
    this.decoder.on('data', (chunk) => {
      const canContinue = this.push(chunk);
      if (!canContinue) {
        this.decoder.pause();
      }
    });

    // Если у нашего Transform поток пустеет — возобновляем декодер
    this.on('drain', () => {
      this.decoder.resume();
    });

    // Пробрасываем ошибки
    this.demuxer.on('error', (err) => this.emit('error', err));
    this.decoder.on('error', (err) => this.emit('error', err));
  }

  _transform(chunk, encoding, callback) {
    try {
      this.demuxer.write(chunk);
      callback();
    } catch (err) {
      callback(err instanceof Error ? err : new Error('Decoding error'));
    }
  }

  _flush(callback) {
    this.demuxer.end();
    this.decoder.end();
    callback();
  }
}
