const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/recipes?q=popular',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Success! Received ' + (json.results ? json.results.length : 0) + ' recipes.');
            console.log('First item:', json.results[0].title);
            console.log('Last item:', json.results[json.results.length - 1].title);
        } catch (e) {
            console.error('Failed to parse JSON:', e.message);
            console.log('Raw data snippet:', data.substring(0, 100));
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
