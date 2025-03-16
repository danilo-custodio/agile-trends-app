// db.js - Gerenciamento do IndexedDB para cases de co-criação com LLMs

class CasesDatabase {
    constructor() {
      this.dbName = 'casesCoCreationDb';
      this.dbVersion = 1;
      this.db = null;
      this.ready = this.initDatabase();
    }
  
    // Inicializa o banco de dados
    async initDatabase() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.dbVersion);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          // Store para os metadados dos cases (lista resumida)
          if (!db.objectStoreNames.contains('casesIndex')) {
            const casesIndexStore = db.createObjectStore('casesIndex', { keyPath: 'id' });
            casesIndexStore.createIndex('byCategory', 'category', { unique: false });
            casesIndexStore.createIndex('byDate', 'updatedAt', { unique: false });
          }
          
          // Store para os cases completos
          if (!db.objectStoreNames.contains('casesData')) {
            db.createObjectStore('casesData', { keyPath: 'id' });
          }
  
          // Store para metadados de sincronização
          if (!db.objectStoreNames.contains('syncInfo')) {
            db.createObjectStore('syncInfo', { keyPath: 'key' });
          }
        };
        
        request.onsuccess = (event) => {
          this.db = event.target.result;
          console.log('IndexedDB inicializado com sucesso');
          resolve(true);
        };
        
        request.onerror = (event) => {
          console.error('Erro ao abrir IndexedDB:', event.target.error);
          reject(event.target.error);
        };
      });
    }
  
    // Salva a lista de cases no store de índice
    async saveCasesIndex(cases) {
      await this.ready;
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction('casesIndex', 'readwrite');
        const store = transaction.objectStore('casesIndex');
        
        // Limpar store atual antes de adicionar novos itens
        store.clear();
        
        // Adicionar cada case
        let count = 0;
        cases.forEach(caseItem => {
          const request = store.add(caseItem);
          request.onsuccess = () => {
            count++;
            if (count === cases.length) {
              resolve(true);
            }
          };
          request.onerror = (event) => reject(event.target.error);
        });
        
        transaction.onerror = (event) => reject(event.target.error);
      });
    }
  
    // Salva um case completo
    async saveCase(caseData) {
      await this.ready;
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction('casesData', 'readwrite');
        const store = transaction.objectStore('casesData');
        
        const request = store.put(caseData);
        
        request.onsuccess = () => resolve(true);
        request.onerror = (event) => reject(event.target.error);
      });
    }
  
    // Obtém a lista de cases
    async getCasesIndex() {
      await this.ready;
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction('casesIndex', 'readonly');
        const store = transaction.objectStore('casesIndex');
        
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
      });
    }
  
    // Obtém um case específico pelo ID
    async getCase(caseId) {
      await this.ready;
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction('casesData', 'readonly');
        const store = transaction.objectStore('casesData');
        
        const request = store.get(caseId);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
      });
    }
  
    // Salva informações de sincronização
    async saveSyncInfo(info) {
      await this.ready;
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction('syncInfo', 'readwrite');
        const store = transaction.objectStore('syncInfo');
        
        const request = store.put(info);
        
        request.onsuccess = () => resolve(true);
        request.onerror = (event) => reject(event.target.error);
      });
    }
  
    // Obtém informações de sincronização
    async getSyncInfo(key) {
      await this.ready;
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction('syncInfo', 'readonly');
        const store = transaction.objectStore('syncInfo');
        
        const request = store.get(key);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
      });
    }
    async clearAllCases() {
      await this.ready;
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['casesIndex', 'casesData'], 'readwrite');
        
        // Limpar store de índice
        const indexStore = transaction.objectStore('casesIndex');
        indexStore.clear();
        
        // Limpar store de dados
        const dataStore = transaction.objectStore('casesData');
        dataStore.clear();
        
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = (event) => reject(event.target.error);
      });
    }
  }
  
  // Exporta uma instância única do banco de dados
  const casesDB = new CasesDatabase();
  export default casesDB;