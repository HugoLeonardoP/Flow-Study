import { Platform } from 'react-native';

const PORTA_BACKEND = 3000;

// Descobre o endereço do backend:
//  1. EXPO_PUBLIC_API_URL (arquivo .env), se definida — ex.: http://192.168.0.10:3000
//  2. mesmo IP do computador que serve o app (Expo Go na rede local), porta 3000
//  3. emulador Android → 10.0.2.2; demais → localhost
function detectarApiUrl(): string {
  const definida = process.env.EXPO_PUBLIC_API_URL;
  if (definida) return definida.replace(/\/+$/, '');

  try {
    // Mesma fonte que o próprio Expo usa para saber de onde veio o bundle.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SourceCode = require('react-native/Libraries/NativeModules/specs/NativeSourceCode').default;
    const scriptURL: string | null = SourceCode.getConstants().scriptURL;
    const host = scriptURL?.match(/^https?:\/\/([^/:]+)/)?.[1];
    if (host && /^\d{1,3}(\.\d{1,3}){3}$/.test(host) && host !== '127.0.0.1') {
      return `http://${host}:${PORTA_BACKEND}`;
    }
  } catch {
    /* sem acesso à URL do bundle: usa o padrão abaixo */
  }

  return Platform.OS === 'android'
    ? `http://10.0.2.2:${PORTA_BACKEND}`
    : `http://localhost:${PORTA_BACKEND}`;
}

export const API_URL = detectarApiUrl();
