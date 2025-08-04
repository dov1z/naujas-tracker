const express = require('express');
const app = express();

// Importuojam track handlerį
const trackHandler = require('./track');

// Priskiriam endpoint'ą
app.get('/track', trackHandler);

// Naudojam dinaminį portą, kurį Render priskiria
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveris veikia ant porto ${PORT}`);
});
