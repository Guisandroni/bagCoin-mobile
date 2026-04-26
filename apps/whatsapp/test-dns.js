const dns = require('dns');
dns.lookup('mongo', (err, address) => {
  if (err) {
    console.error('DNS lookup failed:', err.message);
  } else {
    console.log('mongo resolves to:', address);
  }
});
