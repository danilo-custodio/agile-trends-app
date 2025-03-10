// api.js - Funções para carregar dados JSON do GitHub Pages
import casesDB from './db';

class CasesAPI {
  constructor() {
    // A URL base será o domínio onde está hospedado o site
    this.baseUrl = process.env.PUBLIC_URL || '';
    this.dataPath = '/data';
  }

  // Carrega o índice de cases do servidor ou do cache
  async loadCasesIndex(forceRefresh = false) {
    try {
      // Verificar se já temos os dados no IndexedDB e se não estamos forçando refresh
      if (!forceRefresh) {
        const cachedCases = await casesDB.getCasesIndex();
        if (cachedCases && cachedCases.length > 0) {
          console.log('Casos carregados do cache IndexedDB');
          return cachedCases;
        }
      }

      // Se forçar refresh ou não tiver cache, buscar do servidor
      console.log('Buscando índice de casos do servidor...');
      const response = await fetch(`${this.baseUrl}${this.dataPath}/index.json`);
      
      if (!response.ok) {
        throw new Error(`Falha ao buscar índice de casos: ${response.status}`);
      }

      const data = await response.json();
      const cases = data.cases || [];

      // Salvar no IndexedDB para uso offline
      await casesDB.saveCasesIndex(cases);
      
      // Salvar informação de última sincronização
      await casesDB.saveSyncInfo({
        key: 'lastIndexSync',
        timestamp: new Date().toISOString()
      });

      console.log('Índice de casos carregado e cacheado do servidor');
      return cases;
    } catch (error) {
      console.error('Erro ao carregar índice de casos:', error);
      
      // Em caso de erro, tentar retornar o que temos em cache mesmo assim
      const cachedCases = await casesDB.getCasesIndex();
      if (cachedCases && cachedCases.length > 0) {
        console.log('Retornando índice em cache devido a erro');
        return cachedCases;
      }
      
      // Se nem isso funcionar, retornar array vazio
      return [];
    }
  }

  // Carrega um case específico pelo ID
  async loadCase(caseId, forceRefresh = false) {
    try {
      // Verificar se já temos o case no IndexedDB e se não estamos forçando refresh
      if (!forceRefresh) {
        const cachedCase = await casesDB.getCase(caseId);
        if (cachedCase) {
          console.log(`Case ${caseId} carregado do cache IndexedDB`);
          return cachedCase;
        }
      }

      // Se forçar refresh ou não tiver cache, buscar do servidor
      console.log(`Buscando case ${caseId} do servidor...`);
      const response = await fetch(`${this.baseUrl}${this.dataPath}/cases/${caseId}.json`);
      
      if (!response.ok) {
        throw new Error(`Falha ao buscar case ${caseId}: ${response.status}`);
      }

      const caseData = await response.json();

      // Salvar no IndexedDB para uso offline
      await casesDB.saveCase(caseData);

      console.log(`Case ${caseId} carregado e cacheado do servidor`);
      return caseData;
    } catch (error) {
      console.error(`Erro ao carregar case ${caseId}:`, error);
      
      // Em caso de erro, tentar retornar o que temos em cache
      const cachedCase = await casesDB.getCase(caseId);
      if (cachedCase) {
        console.log(`Retornando case ${caseId} em cache devido a erro`);
        return cachedCase;
      }
      
      // Se nem isso funcionar, retornar null
      return null;
    }
  }

  // Verifica se há atualizações disponíveis
  async checkForUpdates() {
    try {
      // Obter timestamp da última sincronização
      const lastSync = await casesDB.getSyncInfo('lastIndexSync');
      const lastSyncTime = lastSync ? lastSync.timestamp : null;

      // Obter o índice atual do servidor
      console.log('Verificando atualizações...');
      const response = await fetch(`${this.baseUrl}${this.dataPath}/index.json`, {
        cache: 'no-cache' // Forçar requisição recente
      });
      
      if (!response.ok) {
        throw new Error(`Falha ao verificar atualizações: ${response.status}`);
      }

      const data = await response.json();
      const serverCases = data.cases || [];
      
      // Obter o índice atual do cache
      const cachedCases = await casesDB.getCasesIndex();
      
      // Identificar cases que precisam ser atualizados
      const casesToUpdate = [];
      
      for (const serverCase of serverCases) {
        const cachedCase = cachedCases.find(c => c.id === serverCase.id);
        
        // Se não existe no cache ou a versão do servidor é mais recente
        if (!cachedCase || serverCase.version > cachedCase.version) {
          casesToUpdate.push(serverCase.id);
        }
      }
      
      return {
        hasUpdates: casesToUpdate.length > 0,
        casesToUpdate,
        lastSyncTime
      };
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      return {
        hasUpdates: false,
        casesToUpdate: [],
        error: error.message
      };
    }
  }

  // Sincroniza todos os cases que precisam de atualização
  async syncAllCases() {
    try {
      const { hasUpdates, casesToUpdate } = await this.checkForUpdates();
      
      if (!hasUpdates) {
        return {
          success: true,
          message: 'Não há atualizações necessárias',
          updatedCases: []
        };
      }
      
      console.log(`Sincronizando ${casesToUpdate.length} cases...`);
      
      // Atualizar o índice primeiro
      await this.loadCasesIndex(true);
      
      // Atualizar cada case individualmente
      const updatedCases = [];
      for (const caseId of casesToUpdate) {
        await this.loadCase(caseId, true);
        updatedCases.push(caseId);
      }
      
      return {
        success: true,
        message: `Atualizados ${updatedCases.length} cases`,
        updatedCases
      };
    } catch (error) {
      console.error('Erro ao sincronizar cases:', error);
      return {
        success: false,
        message: error.message,
        updatedCases: []
      };
    }
  }
}

// Exporta uma instância única da API
const casesAPI = new CasesAPI();
export default casesAPI;