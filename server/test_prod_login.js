fetch('https://sih-project-y3vp.onrender.com/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'test@example.com',
    password: 'password123'
  })
})
.then(res => {
  console.log('Status:', res.status);
  res.headers.forEach((val, key) => console.log(key, ':', val));
  return res.text();
})
.then(text => console.log('Body:', text))
.catch(console.error);
