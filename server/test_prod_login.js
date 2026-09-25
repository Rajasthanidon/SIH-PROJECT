fetch('https://sih-project-y3vp.onrender.com/api/auth/test-login', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(res => {
  console.log('Status:', res.status);
  res.headers.forEach((val, key) => console.log(key, ':', val));
  return res.text();
})
.then(text => console.log('Body:', text))
.catch(console.error);
