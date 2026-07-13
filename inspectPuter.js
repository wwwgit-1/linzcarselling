const https = require("https");
https.get('https://js.puter.com/v2/', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('window.puter index', data.indexOf('window.puter'));
    console.log('setAuthToken index', data.indexOf('setAuthToken'));
    console.log('authToken index', data.indexOf('authToken'));
    const matches = data.match(/window\.puter|setAuthToken|authToken|puter\.ai|\.ai\.chat/g);
    console.log(matches && matches.slice(0,20));
    if (matches) {
      matches.forEach(m => console.log(m));
    }
  });
}).on('error', e => console.error('error', e.message));
