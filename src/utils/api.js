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
  
      // Obter o índice atual do servidor com cabeçalho para evitar cache
      const response = await fetch(`${this.baseUrl}${this.dataPath}/index.json`, {
        cache: 'no-cache',
        headers: {
          'If-Modified-Since': lastSyncTime || ''
        }
      });
      
      // Se o status for 304 (Not Modified), não há atualizações
      if (response.status === 304) {
        return { hasUpdates: false };
      }
      
      // Se a resposta não for ok e não for 304, tratar como erro
      if (!response.ok) {
        throw new Error(`Falha ao verificar atualizações: ${response.status}`);
      }
  
      const data = await response.json();
      
      // Comparar IDs dos cases do servidor com os do cache
      const serverCases = data.cases || [];
      const cachedCases = await casesDB.getCasesIndex();
      
      // Verificar se há diferenças nos IDs (adições, remoções, etc.)
      const serverIds = new Set(serverCases.map(c => c.id));
      const cachedIds = new Set(cachedCases.map(c => c.id));
      
      // Se o número de cases ou os IDs forem diferentes, há atualizações
      const hasChanges = 
        serverIds.size !== cachedIds.size || 
        serverCases.some(c => !cachedIds.has(c.id)) ||
        cachedCases.some(c => !serverIds.has(c.id));
      
      return {
        hasUpdates: hasChanges,
        serverCases
      };
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      return {
        hasUpdates: false,
        error: error.message
      };
    }
  }

  // Sincroniza todos os cases que precisam de atualização
  async syncAllCases() {
    try {
      const { hasUpdates, serverCases } = await this.checkForUpdates();
      
      if (!hasUpdates || !serverCases) {
        return {
          success: true,
          message: 'Não há atualizações necessárias',
          updatedCases: []
        };
      }
      
      // Limpar todos os dados locais
      await this.clearCache();
      
      // Salvar os novos dados do índice
      await casesDB.saveCasesIndex(serverCases);
      
      // Salvar informação de última sincronização
      await casesDB.saveSyncInfo({
        key: 'lastIndexSync',
        timestamp: new Date().toISOString()
      });
      
      // Carregar os detalhes de cada case
      for (const caseItem of serverCases) {
        await this.loadCase(caseItem.id, true);
      }
      
      return {
        success: true,
        message: `Dados atualizados com sucesso`,
        updatedCases: serverCases.map(c => c.id)
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
  async clearCache() {
    // Limpar os dados do IndexedDB
    await casesDB.clearAllCases();
    
    // Também pode limpar o cache do Service Worker para recursos relacionados
    if ('caches' in window) {
      try {
        const cache = await caches.open('cases-llm-v2');
        
        // Obter todas as chaves de cache que contêm '/data/'
        const keys = await cache.keys();
        const dataKeys = keys.filter(key => key.url.includes('/data/'));
        
        // Deletar cada chave de cache relacionada aos dados
        for (const key of dataKeys) {
          await cache.delete(key);
        }
      } catch (err) {
        console.warn('Erro ao limpar cache do Service Worker:', err);
      }
    }
  }
}

// Exporta uma instância única da API
const casesAPI = new CasesAPI();
export default casesAPI;