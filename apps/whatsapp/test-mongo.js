const { MongoClient } = require('mongodb');

const baseUrl = 'mongodb://admin:password@172.23.0.3:27017/whatsapp_sessions?authSource=admin';
console.log('Testing connection to:', baseUrl.replace(/:\/\/[^:]+:[^@]+@/, '://****:****@'));

const client = new MongoClient(baseUrl, { serverSelectionTimeoutMS: 5000 });
client.connect()
  .then(() => {
    console.log('Connected successfully!');
    const db = client.db('whatsapp_sessions');
    return db.collection('test').findOne({});
  })
  .then(() => {
    console.log('Query successful!');
    client.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    console.error('Code:', err.code);
    client.close();
    process.exit(1);
  });
