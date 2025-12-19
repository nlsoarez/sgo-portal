class PortalSGO {
    constructor() {
        this.apiBaseUrl = window.location.origin;
        this.currentTab = 'gpon';
        this.initialize();
    }

    initialize() {
        this.bindEvents();
        this.carregarIncidentes();
        this.iniciarAtualizacaoAutomatica();
    }

    bindEvents() {
        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.mudarTab(e));
        });

        // Botão de atualização
        const btnAtualizar = document.getElementById('btnAtualizar');
        btnAtualizar.addEventListener('click', () => this.atualizarDados());

        // Inicializar status da última atualização
        this.atualizarStatusTempo();
    }

    async carregarIncidentes() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/incidentes`);
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.atualizarUI(data);
        } catch (error) {
            this.mostrarErro(error.message);
        }
    }

    async atualizarDados() {
        const btnAtualizar = document.getElementById('btnAtualizar');
        const icon = btnAtualizar.querySelector('i');
        
        // Adicionar classe de loading
        btnAtualizar.classList.add('loading');
        btnAtualizar.disabled = true;

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/atualizar`, {
                method: 'POST'
            });
            
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.atualizarUI(result.data);
                this.mostrarNotificacao('Dados atualizados com sucesso!', 'success');
            } else {
                throw new Error(result.error || 'Erro ao atualizar dados');
            }
        } catch (error) {
            this.mostrarErro(error.message);
            this.mostrarNotificacao('Erro ao atualizar dados', 'error');
        } finally {
            // Remover classe de loading
            btnAtualizar.classList.remove('loading');
            btnAtualizar.disabled = false;
        }
    }

    atualizarUI(data) {
        // Atualizar cards
        document.getElementById('totalIncidentes').textContent = data.totais.total;
        document.getElementById('novosIncidentes').textContent = data.totais.novos;
        document.getElementById('totalGPON').textContent = data.totais.gpon;
        document.getElementById('totalHFC').textContent = data.totais.hfc;

        // Atualizar badges das tabs
        document.getElementById('badgeGpon').textContent = data.totais.gpon;
        document.getElementById('badgeHfc').textContent = data.totais.hfc;

        // Atualizar tabelas
        this.atualizarTabela('gpon', data.gpon);
        this.atualizarTabela('hfc', data.hfc);

        // Atualizar status da última atualização
        this.atualizarStatusTempo(data.ultimaAtualizacao);
    }

    atualizarTabela(tipo, incidentes) {
        const tabela = document.getElementById(`tabela${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
        
        if (incidentes.length === 0) {
            tabela.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-message">
                        <i class="fas fa-inbox"></i> Nenhum incidente ${tipo.toUpperCase()} encontrado
                    </td>
                </tr>
            `;
            return;
        }

        const linhas = incidentes.map(incidente => this.criarLinhaTabela(incidente)).join('');
        tabela.innerHTML = linhas;
    }

    criarLinhaTabela(incidente) {
        const dataFormatada = this.formatarData(incidente.data_entrada);
        const isNovo = incidente.isNovo;
        
        return `
            <tr class="${isNovo ? 'novo-caso' : ''}">
                <td><strong>${incidente.id_mostra}</strong></td>
                <td>${this.escapeHTML(incidente.nm_tipo)}</td>
                <td>${this.escapeHTML(incidente.subcluster)}</td>
                <td>
                    <span class="topologia-badge ${incidente.tp_topologia.toLowerCase()}">
                        ${incidente.tp_topologia}
                    </span>
                </td>
                <td>${dataFormatada}</td>
                <td>${this.escapeHTML(incidente.equipe)}</td>
                <td>
                    ${isNovo ? 
                        '<span class="status-novo"><i class="fas fa-star"></i> Novo</span>' : 
                        '<span class="status-existente">Processado</span>'
                    }
                </td>
            </tr>
        `;
    }

    formatarData(dataString) {
        try {
            const data = new Date(dataString);
            if (isNaN(data.getTime())) {
                return dataString;
            }
            
            return data.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dataString;
        }
    }

    atualizarStatusTempo(ultimaAtualizacao) {
        const elemento = document.getElementById('ultimaAtualizacao');
        
        if (ultimaAtualizacao) {
            elemento.textContent = this.formatarData(ultimaAtualizacao);
        } else {
            elemento.textContent = '--:--';
        }
    }

    mudarTab(event) {
        const tabBtn = event.currentTarget;
        const tabId = tabBtn.dataset.tab;
        
        // Atualizar botões da tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        tabBtn.classList.add('active');
        
        // Atualizar conteúdo da tab
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`tab-${tabId}`).classList.add('active');
        
        this.currentTab = tabId;
    }

    iniciarAtualizacaoAutomatica() {
        // Atualizar a cada 5 minutos
        setInterval(() => {
            this.atualizarDados();
        }, 5 * 60 * 1000);
    }

    mostrarErro(mensagem) {
        console.error('Erro:', mensagem);
        
        // Atualizar tabelas com mensagem de erro
        ['Gpon', 'Hfc'].forEach(tipo => {
            const tabela = document.getElementById(`tabela${tipo}`);
            tabela.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-message" style="color: var(--danger-color);">
                        <i class="fas fa-exclamation-triangle"></i> Erro ao carregar dados: ${mensagem}
                    </td>
                </tr>
            `;
        });
    }

    mostrarNotificacao(mensagem, tipo = 'info') {
        // Criar elemento de notificação
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao ${tipo}`;
        notificacao.innerHTML = `
            <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${mensagem}</span>
        `;
        
        // Adicionar ao body
        document.body.appendChild(notificacao);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notificacao.remove();
        }, 3000);
    }

    escapeHTML(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }
}

// Inicializar o portal quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.portalSGO = new PortalSGO();
});
