import Redis from "ioredis";
import { REDIS_URI_CONNECTION } from "../config/redis";
import * as crypto from "crypto";

const redis = new Redis(REDIS_URI_CONNECTION);

function encryptParams(params: any) {
  const str = JSON.stringify(params);
  return crypto.createHash("sha256").update(str).digest("base64");
}

export function setFromParams(
  key: string,
  params: any,
  value: string,
  option?: string,
  optionValue?: string | number
) {
  const finalKey = `${key}:${encryptParams(params)}`;
  if (option !== undefined && optionValue !== undefined) {
    return set(finalKey, value, option, optionValue);
  }
  return set(finalKey, value);
}

export function getFromParams(key: string, params: any) {
  const finalKey = `${key}:${encryptParams(params)}`;
  return get(finalKey);
}

export function delFromParams(key: string, params: any) {
  const finalKey = `${key}:${encryptParams(params)}`;
  return del(finalKey);
}

export function set(
  key: string,
  value: string,
  option?: string,
  optionValue?: string | number
) {
  if (option !== undefined && optionValue !== undefined) {
    // Manejar opciones específicas de Redis
    if (option.toLowerCase() === 'ex' && typeof optionValue === 'number') {
      // EX: tiempo de expiración en segundos
      return redis.set(key, value, 'EX', optionValue);
    } else if (option.toLowerCase() === 'px' && typeof optionValue === 'number') {
      // PX: tiempo de expiración en milisegundos
      return redis.set(key, value, 'PX', optionValue);
    } else {
      // Para otras opciones, usar setex si es numérico
      if (typeof optionValue === 'number') {
        return redis.setex(key, optionValue, value);
      }
    }
  }

  return redis.set(key, value);
}

export function get(key: string) {
  return redis.get(key);
}

export function getKeys(pattern: string) {
  return redis.keys(pattern);
}

export function del(key: string) {
  return redis.del(key);
}

export async function delFromPattern(pattern: string) {
  const all = await getKeys(pattern);
  for (let item of all) {
    del(item);
  }
}

export const cacheLayer = {
  set,
  setFromParams,
  get,
  getFromParams,
  getKeys,
  del,
  delFromParams,
  delFromPattern
};
