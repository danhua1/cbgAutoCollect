import { Injectable } from '@nestjs/common';
import CryptoJS from 'crypto-js';

@Injectable()
export class CryptoService {
  private readonly secret = process.env.ACCOUNT_CRYPTO_SECRET || 'cbg-auto-collect-secret';

  encrypt(plainText: string) {
    return CryptoJS.AES.encrypt(plainText, this.secret).toString();
  }

  decrypt(cipherText: string) {
    return CryptoJS.AES.decrypt(cipherText, this.secret).toString(CryptoJS.enc.Utf8);
  }

  isEncrypted(value: string) {
    return typeof value === 'string' && value.includes('U2FsdGVkX1');
  }

  ensureEncrypted(value: string) {
    return this.isEncrypted(value) ? value : this.encrypt(value);
  }
}
