const fs = require('fs');
const path = require('path');

const HISTORICO_PATH = path.join(__dirname, '../data/historico.json');

class HistoryRepository {
  constructor() {
    this.initializeStorage();
  }

  initializeStorage() {
    const dir = path.dirname(HISTORICO_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (!fs.existsSync(HISTORICO_PATH)) {
      fs.writeFileSync(HISTORICO_PATH, JSON.stringify([], null, 2));
    }
  }

  carregarHistorico() {
    try {
      const data = fs.readFileSync(HISTORICO_PATH, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      return [];
    }
  }

  salvarHistorico(historico) {
    try {
      fs.writeFileSync(HISTORICO_PATH, JSON.stringify(historico, null, 2));
      return true;
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
      return false;
    }
  }

  atualizarHistorico(novosIncidentes) {
    const historico = this.carregarHistorico();
    const idsExistentes = new Set(historico.map(item => item.id_mostra));
    
    const novosParaAdicionar = novosIncidentes.filter(
      incidente => !idsExistentes.has(incidente.id_mostra)
    );
    
    // Adiciona apenas campos necessários ao histórico
    const historicoAtualizado = [
      ...historico,
      ...novosParaAdicionar.map(incidente => ({
        id_mostra: incidente.id_mostra,
        data_processamento: new Date().toISOString()
      }))
    ];
    
    this.salvarHistorico(historicoAtualizado);
    return novosParaAdicionar.length;
  }

  limparHistorico() {
    return this.salvarHistorico([]);
  }
}

module.exports = new HistoryRepository();
