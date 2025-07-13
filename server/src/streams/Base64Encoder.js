// server/src/streams/Base64Encoder.js
import { Transform } from 'stream';

export class Base64Encoder extends Transform {
  constructor() {
    super({ writableObjectMode: false, readableObjectMode: true });
    this.buffer = Buffer.alloc(0);
  }

  _transform(chunk, _encoding, callback) {
    try {
      this.buffer = Buffer.concat([this.buffer, chunk]);

      if (this.buffer.length >= 8192) {
        this.push(this.buffer.toString('base64'));
        this.buffer = Buffer.alloc(0);
      }

      callback();
    } catch (error) {
      callback(error);
    }
  }

  _flush(callback) {
    try {
      if (this.buffer.length > 0) {
        this.push(this.buffer.toString('base64'));
        this.buffer = Buffer.alloc(0);
      }
      callback();
    } catch (error) {
      callback(error);
    }
  }
}
