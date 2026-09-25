const express = require('express');
const { testDatabaseConnection } = require('../config/database');

const router = express.Router();

router.get('/', async (req, res) => {
  const dbStatus = await testDatabaseConnection();

  res.json({
    status: 'ok',
    service: 'academia-industry-portal-api',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

module.exports = router;
