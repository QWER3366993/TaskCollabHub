import CryptoJS from 'crypto-js'

import jsSHA from 'jssha'

const CryptoSecret = '__CryptoJS_Secret__'

export function convertToHash(msg: string) {
  // eslint-disable-next-line new-cap

  const shaObj = new jsSHA('SHA-224', 'TEXT', { encoding: 'UTF8' })

  shaObj.update(msg)

  return shaObj.getHash('HEX')
}

/**

 * 加密数据

 * @param data - 数据

 */

export function encrypto(data: any) {
  const newData = JSON.stringify(data)

  return CryptoJS.AES.encrypt(newData, CryptoSecret).toString()
}

/**

 * 解密数据

 * @param cipherText - 密文

 */

export function decrypto(cipherText: string) {
  const bytes = CryptoJS.AES.decrypt(cipherText, CryptoSecret)

  const originalText = bytes.toString(CryptoJS.enc.Utf8)

  if (originalText) {
    return JSON.parse(originalText)
  }

  return null
}
