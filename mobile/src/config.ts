import { Platform } from 'react-native';

// Android emulator reaches your computer at 10.0.2.2; iOS simulator uses localhost
const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_URL ?? `http://${host}:8080`;