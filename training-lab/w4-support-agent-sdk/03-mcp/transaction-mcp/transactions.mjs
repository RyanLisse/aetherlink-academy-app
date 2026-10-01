const fields = new Map([
  ['Transaction ID', 'transactionId'],
  ['Customer', 'customer'],
  ['Amount', 'amount'],
  ['Status', 'status'],
  ['Date', 'date'],
  ['Currency', 'currency'],
  ['Issue Details', 'issueDetails'],
  ['Fraud Flag', 'fraudFlag'],
]);

export function rowsToTransactions(rows) {
  const headers = rows[0] ?? [];
  const columns = headers.map((header) => fields.get(header));

  return rows.slice(1).map((row) => Object.fromEntries(
    columns.flatMap((key, index) => (key ? [[key, row[index]]] : [])),
  ));
}

export function findTransaction(transactions, id) {
  return transactions.find((transaction) => transaction.transactionId === id) ?? null;
}
