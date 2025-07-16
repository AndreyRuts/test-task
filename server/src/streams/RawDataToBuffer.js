import { Transform } from 'stream';

export class RawDataToBuffer extends Transform {
  constructor() {
    super({
      writableObjectMode: true,
      readableObjectMode: false,
    });
  }

  _transform(chunk, _encoding, callback) {
    try {
      let buff;

      if (Buffer.isBuffer(chunk)) {
        buff = chunk;
      } else if (
        chunk instanceof ArrayBuffer ||
        (typeof chunk === 'string' && chunk !== 'DONE')
      ) {
        buff = Buffer.from(chunk);
      } else if (Array.isArray(chunk)) {
        buff = Buffer.concat(chunk);
      } else {
        throw new Error(`Unsupported chunk type: ${typeof chunk}`);
      }

      this.push(buff);
      callback();
    } catch (error) {
      callback(error);
    }
  }
}
