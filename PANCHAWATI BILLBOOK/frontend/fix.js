const fs = require('fs');

const map = {
  'src/pages/Sales.tsx': [[/axios\.get\(\`http:\/\/:5555\/api\//g, 'api.get(\`/sales/invoices`']],
  'src/pages/Customers.tsx': [[/axios\.get\(\`http:\/\/:5555\/api\//g, 'api.get(\`/parties/customers`']],
  'src/pages/Billing.tsx': [
    [/axios\.get\(\`http:\/\/:5555\/api\/, \{ headers: \{ Authorization: \`Bearer \$\{token\}\` \} \}\),/g, 'api.get(`/inventory/products`),'],
    [/axios\.get\(\`http:\/\/:5555\/api\/, \{ headers: \{ Authorization: \`Bearer \$\{token\}\` \} \}\)/g, 'api.get(`/inventory/categories`)'],
    [/axios\.post\(\`http:\/\/:5555\/api\//g, 'api.post(`/billing/customers`'],
    [/return axios\.get\(\`http:\/\/:5555\/api\//g, 'return api.get(`/billing/customers`'],
    [/const invRes = await axios\.post\(\`http:\/\/:5555\/api\//g, 'const invRes = await api.post(`/billing/invoices`']
  ],
  'src/pages/Inventory.tsx': [
    [/axios\.get\(\`http:\/\/:5555\/api\//g, 'api.get(`/inventory/products`'], // Wait, this matches both products and categories. I'll just use manual replacements in Inventory.tsx
  ]
};

// Actually, let's just restore the entire files or just rewrite them. They are small.
