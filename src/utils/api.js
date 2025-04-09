// api.js - Funções para carregar dados JSON do GitHub Pages
import casesDB from './db';

// Definir o nome do cache usado pelo service worker
const CACHE_NAME = 'cases-llm-v2';

class CasesAPI {
  constructor() {
    // Determinar a URL base correta
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Em desenvolvimento local, acesse o GitHub Pages para os dados
      this.baseUrl = 'https://danilo-custodio.github.io/agile-trends-app';
    } else {
      // Em produção (GitHub Pages), use o caminho relativo
      this.baseUrl = process.env.PUBLIC_URL || '';
    }
    
    this.dataPath = '/data';
    console.log(`Base URL configurada como: ${this.baseUrl}`);
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
      console.log(`Tentando carregar de: ${this.baseUrl}${this.dataPath}/index.json`);
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
      
      // Adicionar opções de cache quando forceRefresh é true
      const fetchOptions = forceRefresh ? { 
        cache: 'no-cache',
        headers: { 'Pragma': 'no-cache' } 
      } : {};
      
      const response = await fetch(
        `${this.baseUrl}${this.dataPath}/cases/${caseId}.json`, 
        fetchOptions
      );
      
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
      const serverCases = data.cases || [];
      const cachedCases = await casesDB.getCasesIndex();
      
      // Verificar se algum case foi alterado, comparando propriedades relevantes
      let hasChanges = false;
      
      // Verificar se há diferenças na quantidade de cases
      if (serverCases.length !== cachedCases.length) {
        hasChanges = true;
      } else {
        // Para cada case no servidor, verificar se mudou
        for (const serverCase of serverCases) {
          const cachedCase = cachedCases.find(c => c.id === serverCase.id);
          
          // Se o case não existe no cache local ou tem propriedades diferentes
          if (!cachedCase) {
            hasChanges = true;
            break;
          }
          
          // Verificar propriedades importantes para detectar alterações
          // Comparar updatedAt (timestamp de atualização)
          if (serverCase.updatedAt !== cachedCase.updatedAt) {
            hasChanges = true;
            break;
          }
          
          // Comparar version (se existir)
          if (serverCase.version !== cachedCase.version) {
            hasChanges = true;
            break;
          }
          
          // Comparar outras propriedades críticas
          if (serverCase.title !== cachedCase.title || 
              serverCase.description !== cachedCase.description ||
              serverCase.timeReduction !== cachedCase.timeReduction ||
              serverCase.qualityImprovement !== cachedCase.qualityImprovement) {
            hasChanges = true;
            break;
          }
        }
      }
      
      return {
        hasUpdates: hasChanges,
        serverCases: hasChanges ? serverCases : null
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
        console.log('Não há atualizações necessárias');
        return {
          success: true,
          message: 'Dados já estão atualizados',
          updatedCases: []
        };
      }
      
      console.log('Encontradas atualizações, sincronizando dados...');
      
      // Limpar COMPLETAMENTE o cache do IndexedDB
      await casesDB.clearAllCases();
      
      // Salvar o novo índice
      await casesDB.saveCasesIndex(serverCases);
      
      // Atualizar o timestamp de sincronização
      await casesDB.saveSyncInfo({
        key: 'lastIndexSync',
        timestamp: new Date().toISOString()
      });
      
      // Limpar o cache do service worker para todos os arquivos JSON
      if ('caches' in window) {
        try {
          const cache = await caches.open(CACHE_NAME);
          const keys = await cache.keys();
          const jsonRequests = keys.filter(key => 
            key.url.includes('/data/') && key.url.endsWith('.json')
          );
          
          for (const request of jsonRequests) {
            await cache.delete(request);
          }
        } catch (err) {
          console.warn('Erro ao limpar cache do Service Worker:', err);
        }
      }
      
      // Forçar o carregamento dos dados completos de cada case diretamente do servidor
      for (const caseItem of serverCases) {
        try {
          // Usar fetch diretamente com opções no-cache para garantir dados atualizados
          const response = await fetch(`${this.baseUrl}${this.dataPath}/cases/${caseItem.id}.json`, {
            cache: 'no-cache',
            headers: { 'Pragma': 'no-cache' }
          });
          
          if (response.ok) {
            const caseData = await response.json();
            // Atualizar o case no IndexedDB
            await casesDB.saveCase(caseData);
            console.log(`Case ${caseItem.id} atualizado com sucesso`);
          } else {
            console.error(`Falha ao buscar case ${caseItem.id}: ${response.status}`);
          }
        } catch (error) {
          console.error(`Erro ao atualizar case ${caseItem.id}:`, error);
        }
      }
      
      return {
        success: true,
        message: 'Dados atualizados com sucesso',
        updatedCases: serverCases.map(c => c.id)
      };
    } catch (error) {
      console.error('Erro ao sincronizar cases:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  async clearCache() {
    // Limpar os dados do IndexedDB
    await casesDB.clearAllCases();
    
    // Também pode limpar o cache do Service Worker para recursos relacionados
    if ('caches' in window) {
      try {
        const cache = await caches.open(CACHE_NAME);
        
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