import { EnumStorageKey } from './enum'

import { setLocal, getLocal, removeLocal } from './local'

/** 设置token */

export function setToken(token: string) {
  setLocal(EnumStorageKey.token, token)
}

/** 获取token */

export function getToken() {
  return getLocal<string>(EnumStorageKey.token) || ''
}

/** 去除token */

export function removeToken() {
  removeLocal(EnumStorageKey.token)
}

/** 获取refresh token */

export function getRefreshToken() {
  return getLocal<string>(EnumStorageKey['refresh-token']) || ''
}

/** 设置refresh token */

export function setRefreshToken(token: string) {
  setLocal(EnumStorageKey['refresh-token'], token)
}
