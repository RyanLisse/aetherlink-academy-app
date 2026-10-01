import { fileURLToPath } from 'node:url';
import path from 'node:path';
import readXlsxFile from 'read-excel-file/node';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { findTransaction, rowsToTransactions } from './transactions.mjs';

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultWorkbook = path.resolve(serverDirectory, '../data/transactions.xlsx');
const workbookPath = process.env.TRANSACTIONS_XLSX ?? defaultWorkbook;
const server = new McpServer({ name: 'transactions', version: '1.0.0' });

server.registerTool('get_transaction', {
  description: 'Look up one transaction by its transaction ID.',
  inputSchema: { transaction_id: z.string().regex(/^TX-\d{4}$/) },
}, async ({ transaction_id }) => {
  const sheets = await readXlsxFile(workbookPath);
  const rows = Array.isArray(sheets) && sheets[0]?.data ? sheets[0].data : sheets;
  const transaction = findTransaction(rowsToTransactions(rows), transaction_id);

  if (!transaction) {
    return {
      isError: true,
      content: [{ type: 'text', text: `No transaction ${transaction_id} in the data` }],
    };
  }

  return { content: [{ type: 'text', text: JSON.stringify(transaction) }] };
});

await server.connect(new StdioServerTransport());
