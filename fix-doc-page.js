const fs = require('fs');
let c = fs.readFileSync('src/app/documentation/page.tsx', 'utf8');

// Fix table headers
c = c.replace(
  /<th>Name<\/th>[\s\S]*?<th>Nationality<\/th>[\s\S]*?<th>Contact<\/th>[\s\S]*?<th>Services<\/th>/,
  '<th>Customer</th><th>Contact</th><th>Services Requested</th><th>Status</th>'
);

// Fix view modal customer name
c = c.replace(
  "viewCustomer.name",
  "viewCustomer.customers?.name"
);

// Fix service_type -> service_ids in modal
c = c.replace(/viewCustomer\.service_type/g, 'viewCustomer.service_ids');

fs.writeFileSync('src/app/documentation/page.tsx', c);
console.log('Fixed');
