import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dataDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data');

export const defaultWorkbookPath = path.join(dataDirectory, 'transactions.xlsx');
export const defaultStorePath = path.join(dataDirectory, 'transactions.working.json');
