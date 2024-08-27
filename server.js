const express = require('express');
const axios = require('axios');
const app = express();
const port = 9876;

// Configuration
const WINDOW_SIZE = 10;
const API_BASE_URL = 'http://20.244.56.144/test';

// Store numbers in memory
let numberStore = [];

// Helper function to fetch numbers from the test server
async function fetchNumbers(type) {
  const urls = {
    p: `${API_BASE_URL}/primes`,
    f: `${API_BASE_URL}/fibo`,
    e: `${API_BASE_URL}/even`,
    r: `${API_BASE_URL}/rand`
  };

  const url = urls[type];
  if (!url) {
    throw new Error('Invalid number ID');
  }

  try {
    const response = await axios.get(url, { timeout: 500 });
    return response.data.numbers || [];
  } catch (error) {
    console.error('Error fetching numbers:', error);
    return [];
  }
}

// Route to handle number requests
app.get('/numbers/:numberid', async (req, res) => {
  const { numberid } = req.params;

  // Validate numberid
  if (!['p', 'f', 'e', 'r'].includes(numberid)) {
    return res.status(400).json({ error: 'Invalid number ID' });
  }

  try {
    // Fetch new numbers from the test server
    const newNumbers = await fetchNumbers(numberid);

    // Update numberStore with new numbers and maintain window size
    const newSet = new Set([...numberStore, ...newNumbers]);
    numberStore = Array.from(newSet);

    if (numberStore.length > WINDOW_SIZE) {
      numberStore = numberStore.slice(-WINDOW_SIZE);
    }

    // Calculate the average
    const avg = numberStore.length > 0 
      ? (numberStore.reduce((sum, num) => sum + num, 0) / numberStore.length).toFixed(2) 
      : '0.00';

    // Determine previous and current window states
    const windowPrevState = numberStore.slice(0, numberStore.length - newNumbers.length);
    const windowCurrState = numberStore;

    res.json({
      numbers: newNumbers,
      windowPrevState: windowPrevState,
      windowCurrState: windowCurrState,
      avg: parseFloat(avg)
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
