import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import readXlsxFile from 'read-excel-file/node';
import { rowsToTransactions } from './transactions.mjs';

export async function loadTransactions({ workbookPath, storePath }) {
  if (existsSync(storePath)) {
    return JSON.parse(readFileSync(storePath, 'utf8'));
  }

  const sheets = await readXlsxFile(workbookPath);
  const rows = Array.isArray(sheets) && sheets[0]?.data ? sheets[0].data : sheets;
  return rowsToTransactions(rows);
}

export function saveTransactions(storePath, transactions) {
  const temporaryPath = `${storePath}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(transactions, null, 2)}\n`);
  renameSync(temporaryPath, storePath);
}
