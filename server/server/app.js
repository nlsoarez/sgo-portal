const express = require('express');
const cors = require('cors');
const incidentController = require('./controllers/incidentController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rotas
app.get('/api/incidentes', incidentController.getIncidentes);
app.post('/api/atualizar', incidentController.atualizarIncidentes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});
