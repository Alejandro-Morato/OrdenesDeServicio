require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/ordenes', require('./ordenes'));
app.use('/api/piezas', require('./piezas'));
app.use('/api/gastos', require('./gastos'));
app.use('/api/reportes', require('./reportes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error del servidor' });
});

module.exports = app;