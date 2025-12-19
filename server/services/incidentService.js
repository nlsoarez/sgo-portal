const axios = require('axios');
const historyRepository = require('../repositories/historyRepository');
const { validarRegistro, normalizarData } = require('../utils/dataValidator');

class IncidentService {
  constructor() {
    this.API_URL = 'http://10.29.5.216/scr/sgo_incidentes_abertos.php';
  }

  async fetchIncidentesAPI() {
    try {
      const response = await axios.get(this.API_URL, { timeout: 10000 });
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao acessar API: ${error.message}`);
    }
  }

  filtrarIncidentes(registros) {
    return registros.filter(registro => {
      // Verificar se é FIBRA e tem topologia GPON ou HFC
      const equipeValida = registro.equipe && 
        registro.equipe.toUpperCase() === 'FIBRA';
      
      const topologiaValida = registro.tp_topologia && 
        ['GPON', 'HFC'].includes(registro.tp_topologia.toUpperCase());
      
      return equipeValida && topologiaValida && validarRegistro(registro);
    });
  }

  processarNovosIncidentes(incidentesFiltrados) {
    const historico = historyRepository.carregarHistorico();
    const idsExistentes = new Set(historico.map(item => item.id_mostra));
    
    const novosIncidentes = incidentesFiltrados.filter(
      incidente => !idsExistentes.has(incidente.id_mostra)
    );

    return {
      novos: novosIncidentes,
      existentes: incidentesFiltrados.filter(
        incidente => idsExistentes.has(incidente.id_mostra)
      )
    };
  }

  formatarIncidentes(incidentes) {
    return incidentes.map(incidente => ({
      id_mostra: incidente.id_mostra,
      nm_tipo: incidente.nm_tipo || 'Não informado',
      subcluster: incidente.subcluster || 'Não informado',
      tp_topologia: incidente.tp_topologia,
      data_entrada: normalizarData(incidente.data_entrada),
      equipe: incidente.equipe,
      isNovo: true
    }));
  }

  async processarIncidentes() {
    try {
      const dadosAPI = await this.fetchIncidentesAPI();
      
      if (!Array.isArray(dadosAPI)) {
        throw new Error('Resposta da API não é um array');
      }

      const incidentesFiltrados = this.filtrarIncidentes(dadosAPI);
      const { novos, existentes } = this.processarNovosIncidentes(incidentesFiltrados);
      
      const incidentesFormatados = this.formatarIncidentes([...novos, ...existentes]);
      
      // Separar por topologia
      const gpon = incidentesFormatados.filter(i => 
        i.tp_topologia.toUpperCase() === 'GPON'
      );
      const hfc = incidentesFormatados.filter(i => 
        i.tp_topologia.toUpperCase() === 'HFC'
      );

      return {
        gpon,
        hfc,
        totais: {
          novos: novos.length,
          total: incidentesFiltrados.length,
          gpon: gpon.length,
          hfc: hfc.length
        },
        ultimaAtualizacao: new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }

  async atualizarDados() {
    try {
      const resultado = await this.processarIncidentes();
      
      // Atualizar histórico com novos incidentes
      const todosIncidentes = [...resultado.gpon, ...resultado.hfc];
      historyRepository.atualizarHistorico(todosIncidentes);
      
      return resultado;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new IncidentService();
