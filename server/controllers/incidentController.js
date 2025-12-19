const incidentService = require('../services/incidentService');

class IncidentController {
  async getIncidentes(req, res) {
    try {
      const incidentes = await incidentService.processarIncidentes();
      res.json(incidentes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async atualizarIncidentes(req, res) {
    try {
      const incidentes = await incidentService.atualizarDados();
      res.json({ 
        success: true, 
        message: 'Dados atualizados com sucesso',
        data: incidentes 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new IncidentController();
