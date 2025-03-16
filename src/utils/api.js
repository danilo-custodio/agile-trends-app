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
      // Obter informações da última sincronização
      const lastSync = await casesDB.getSyncInfo('lastIndexSync');
      const lastSyncTime = lastSync ? lastSync.timestamp : null;
  
      // Obter o índice atual do servidor com cache desabilitado
      const response = await fetch(`${this.baseUrl}${this.dataPath}/index.json`, {
        cache: 'no-cache',
        headers: { 'Pragma': 'no-cache' }
      });
      
      if (!response.ok) {
        throw new Error(`Falha ao verificar atualizações: ${response.status}`);
      }
  
      const data = await response.json();
      const serverLastUpdated = data.lastUpdated || new Date().toISOString();
      const serverCases = data.cases || [];
      
      // Se não há registro de última sincronização, considerar como atualização
      if (!lastSyncTime) {
        return { hasUpdates: true, serverCases, serverLastUpdated };
      }
      
      // Verificar se a data de atualização do servidor é mais recente
      const isNewer = new Date(serverLastUpdated) > new Date(lastSyncTime);
      
      // Mesmo que a data não seja mais recente, comparar o conteúdo
      if (!isNewer) {
        const cachedCases = await casesDB.getCasesIndex();
        
        // Verificar se o número de cases é diferente
        if (serverCases.length !== cachedCases.length) {
          return { hasUpdates: true, serverCases, serverLastUpdated };
        }
        
        // Comparar IDs para detectar exclusões
        const serverIds = new Set(serverCases.map(c => c.id));
        const cachedIds = new Set(cachedCases.map(c => c.id));
        const hasChangedIds = 
          [...serverIds].some(id => !cachedIds.has(id)) || 
          [...cachedIds].some(id => !serverIds.has(id));
        
        if (hasChangedIds) {
          return { hasUpdates: true, serverCases, serverLastUpdated };
        }
        
        // Comparar conteúdo de cada case para detectar atualizações
        for (const serverCase of serverCases) {
          const cachedCase = cachedCases.find(c => c.id === serverCase.id);
          // Se o case foi atualizado depois da última sincronização
          if (cachedCase && new Date(serverCase.updatedAt) > new Date(lastSyncTime)) {
            return { hasUpdates: true, serverCases, serverLastUpdated };
          }
        }
      }
      
      return { 
        hasUpdates: isNewer, 
        serverCases: isNewer ? serverCases : null,
        serverLastUpdated
      };
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      return { hasUpdates: false };
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