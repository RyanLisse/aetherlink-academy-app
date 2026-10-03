import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const transactionId = process.argv[2] ?? 'TX-1014';
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [path.join(serverDirectory, 'server.js')],
  env: { ...process.env, TRANSACTIONS_XLSX: path.resolve(serverDirectory, '../data/transactions.xlsx') },
});
const client = new Client({ name: 'transaction-smoke', version: '1.0.0' });

await client.connect(transport);

try {
  const result = await client.callTool({ name: 'get_transaction', arguments: { transaction_id: transactionId } });
  const text = result.content.map((block) => block.text ?? '').join('\n');

  if (result.isError) {
    console.error(text);
    process.exitCode = 1;
  } else {
    console.log(`get_transaction ${transactionId}:`);
    console.log(JSON.stringify(JSON.parse(text), null, 2));
    console.log('MCP server OK — no model was called.');
  }
} finally {
  await client.close();
}
