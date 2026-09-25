const express = require('express');
const session = require('express-session');
const app = express();

app.set('trust proxy', 1);

app.use(session({
  secret: 'test',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true } // FORCE secure
}));

app.get('/login', (req, res) => {
  req.session.user = { id: 1 };
  req.session.save((err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ ok: true });
  });
});

app.listen(4001, () => console.log('Listening on 4001'));
