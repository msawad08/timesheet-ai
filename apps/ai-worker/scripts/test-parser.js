// Test prompt parsing programmatically
const axios = require('axios');

async function testParse() {
  const workerUrl = process.env.AI_WORKER_URL || 'http://localhost:3002';
  const payload = {
    message: process.argv[2] || "spent 3.5 hours on replicon login UI refactoring",
    projectNames: ["Core Portal", "Billing Engine", "Replicon Auth"]
  };
  
  console.log(`Connecting to ${workerUrl}/api/ai/chat/stream ...`);
  try {
    const res = await axios.post(`${workerUrl}/api/ai/chat/stream`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.TEST_JWT ? { 'Authorization': `Bearer ${process.env.TEST_JWT}` } : {})
      },
      responseType: 'stream',
      timeout: 15000
    });

    res.data.on('data', (chunk) => {
      process.stdout.write(chunk.toString());
    });

    res.data.on('end', () => {
      console.log('\n--- Stream Complete ---');
    });
  } catch (err) {
    console.error('Error connecting to AI worker:', err.message);
  }
}

testParse();
