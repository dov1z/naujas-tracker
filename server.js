const express = require('express');
const app = express();
const track = require('./track');

app.get('/track', (req, res) => {
  track(req, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveris veikia ant http://localhost:${PORT}/track`);
});
