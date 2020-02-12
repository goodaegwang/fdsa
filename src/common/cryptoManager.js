const crypto = require("crypto");
const config = require("config");
const logger = require("./logManager")(__filename);

class CryptoManager {

    constructor() {

        this.aesKey = Buffer.from(config.get("cipher.pass_phrase"));
        this.ivLength = config.get("cipher.iv_length");
    }

    encrypt(message) {

        logger.debug("cryptoModel.encrypt()");

        // 메시지가 한글인 경우 URI 인코딩
        const regexKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;

        if (regexKorean.test(message)) {
            message = encodeURIComponent(message);
        }

        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipheriv("aes-256-cbc", this.aesKey, iv);
        const encrypted = [cipher.update(message)];

        encrypted.push(cipher.final());

        return {
            data: Buffer.concat([iv, Buffer.concat(encrypted)]).toString("base64"),
        };
    }

    decrypt(message) {

        logger.debug("cryptoModel.decrypt()");

        const cipher = Buffer.from(message.data, "base64");
        const iv = cipher.slice(0, 16);
        const ciphertext = cipher.slice(16);

        const decipher = crypto.createDecipheriv("aes-256-cbc", this.aesKey, iv);

        let decrypted = decipher.update(ciphertext);

        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return JSON.parse(decodeURIComponent(decrypted.toString()));
    }
}

module.exports = new CryptoManager();