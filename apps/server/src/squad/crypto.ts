import {createHash, randomBytes, randomUUID} from 'node:crypto';

export const mintSecret = (): string => randomBytes(32).toString('hex');
export const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');
export const newId = (): string => randomUUID();
export const newRoomCode = (): string => randomBytes(5).toString('hex').toUpperCase();
