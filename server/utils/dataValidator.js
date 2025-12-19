const moment = require('moment');

class DataValidator {
  static validarRegistro(registro) {
    // Campos obrigatórios
    const camposObrigatorios = [
      'id_mostra',
      'nm_tipo',
      'subcluster',
      'tp_topologia',
      'data_entrada',
      'equipe'
    ];
    
    // Verifica se todos os campos obrigatórios existem e não estão vazios
    for (const campo of camposObrigatorios) {
      if (!registro[campo] || registro[campo].toString().trim() === '') {
        return false;
      }
    }
    
    return true;
  }

  static normalizarData(dataString) {
    try {
      // Tenta diferentes formatos de data
      const formatos = [
        'YYYY-MM-DD HH:mm:ss',
        'DD/MM/YYYY HH:mm:ss',
        'DD/MM/YYYY',
        'YYYY/MM/DD'
      ];
      
      const dataMoment = moment(dataString, formatos, true);
      
      if (dataMoment.isValid()) {
        return dataMoment.format('YYYY-MM-DD HH:mm:ss');
      }
      
      // Se não conseguir parsear, retorna a string original
      return dataString;
    } catch (error) {
      return dataString;
    }
  }

  static formatarDataParaExibicao(dataISO) {
    try {
      return moment(dataISO).format('DD/MM/YYYY HH:mm');
    } catch (error) {
      return dataISO;
    }
  }
}

module.exports = DataValidator;
