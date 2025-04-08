import React, { useState, useEffect } from 'react';
import { ChevronRight, Code, Lightbulb, BarChart3, Clock, Zap, ArrowRight } from 'lucide-react';

import './App.css';
import './styles/StatusIndicators.css';
import './styles/CaseDetail.css';

import UpdateNotification from './components/UpdateNotification';
import InstallPWA from './components/InstallPWA';
import casesAPI from './utils/api';

// Mapeamento de strings de ícones para componentes Lucide
const iconMap = {
  'Lightbulb': Lightbulb,
  'Code': Code,
  'Zap': Zap,
  'BarChart3': BarChart3
};

const CasesApp = () => {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [caseDetails, setCaseDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  

  // Verificar status de conexão
  useEffect(() => {
    const handleOnline = () => {
      setOfflineMode(false);
      // Adicione esta linha para sincronizar quando ficar online
      syncCases();
    };
    const handleOffline = () => setOfflineMode(true);
  
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      await loadCases();
      
      // Adicione estas linhas para sincronizar no início se estiver online
      if (navigator.onLine) {
        syncCases();
      }
    };
    
    initializeApp();
    
    const checkInterval = setInterval(checkForUpdates, 30 * 60 * 1000);
    return () => clearInterval(checkInterval);
  }, []);

  // Ouvir mensagens do Service Worker
  useEffect(() => {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'SYNC_CASES') {
          syncCases();
        }
      });
    }
  }, []);

  // Carregar detalhes do case quando selecionado
  useEffect(() => {
    if (selectedCaseId) {
      loadCaseDetails(selectedCaseId);
    }
  }, [selectedCaseId]);

  // Carregar lista de cases
  const loadCases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const casesData = await casesAPI.loadCasesIndex();
      
      // Processar os casos para incluir o componente de ícone
      const processedCases = casesData.map(caseItem => ({
        ...caseItem,
        icon: iconMap[caseItem.iconName] || BarChart3 // Fallback para BarChart3 se o ícone não for encontrado
      }));
      
      setCases(processedCases);
      
      // Verificar atualizações após carregar os casos
      checkForUpdates();
    } catch (err) {
      console.error('Erro ao carregar cases:', err);
      setError('Falha ao carregar os cases. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Carregar detalhes de um case específico
  const loadCaseDetails = async (caseId) => {
    try {
      setLoading(true);
      
      const caseData = await casesAPI.loadCase(caseId);
      console.log("Dados do case carregado:", caseData);
      
      if (caseData) {
        // Adicionar o componente de ícone
        const CaseIcon = iconMap[caseData.iconName] || BarChart3;
        
        setCaseDetails({
          ...caseData,
          icon: CaseIcon
        });
      }
    } catch (err) {
      console.error(`Erro ao carregar detalhes do case ${caseId}:`, err);
      setError('Falha ao carregar detalhes do case. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Verificar se há atualizações disponíveis
  const checkForUpdates = async () => {
    if (navigator.onLine) {
      try {
        const { hasUpdates } = await casesAPI.checkForUpdates();
        setUpdateAvailable(hasUpdates);
      } catch (err) {
        console.error('Erro ao verificar atualizações:', err);
      }
    }
  };

  // Sincronizar cases
  const syncCases = async () => {
    if (navigator.onLine) {
      try {
        setLoading(true);
        
        const result = await casesAPI.syncAllCases();
        
        if (result.success && result.updatedCases.length > 0) {
          // Recarregar a lista de cases após sincronização
          await loadCases();
          
          // Se o case atual foi atualizado, recarregar seus detalhes
          if (selectedCaseId && result.updatedCases.includes(selectedCaseId)) {
            await loadCaseDetails(selectedCaseId);
          }
          
          setUpdateAvailable(false);
        }
      } catch (err) {
        console.error('Erro ao sincronizar cases:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateClick = () => {
    syncCases();
  };

  const renderCaseList = () => {
    if (loading && cases.length === 0) {
      return <div className="loading-indicator">Carregando cases...</div>;
    }

    if (error && cases.length === 0) {
      return <div className="error-message">{error}</div>;
    }

    if (cases.length === 0) {
      return <div className="empty-state">Nenhum case disponível no momento.</div>;
    }

    return (
      <div className="case-grid">
        {cases.map(caseItem => (
          <div 
            key={caseItem.id} 
            className={`case-card ${caseItem.color}`}
            onClick={() => setSelectedCaseId(caseItem.id)}
          >
            <div className="card-header">
              <div className="icon-container">
                <caseItem.icon className="icon" />
              </div>
              <div>
                <h3 className="card-title">{caseItem.title}</h3>
                <p className="card-category">{caseItem.category}</p>
              </div>
            </div>
            <div className="card-content">
              <p>{caseItem.description}</p>
            </div>
            <div className="card-footer">
              <div className="metrics">
                <div className="time-reduction">
                  <Clock className="small-icon" />
                  <span>Redução: {caseItem.timeReduction}</span>
                </div>
                {caseItem.videoLength && (
                  <div className="video-badge">
                    <span>Vídeo: {caseItem.videoLength}</span>
                  </div>
                )}
              </div>
              <ChevronRight className="arrow-icon" />
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderCaseDetail = () => {
    if (!caseDetails) return null;
    
    if (loading) {
      return <div className="loading-indicator">Carregando detalhes do case...</div>;
    }

    if (error) {
      return <div className="error-message">{error}</div>;
    }
    
    return (
      <div className="case-detail">
        <button 
          className="back-button"
          onClick={() => {
            setSelectedCaseId(null);
            setCaseDetails(null);
          }}
        >
          ← Voltar para lista de cases
        </button>
        
        <div className="case-header">
          <div className={`icon-container ${caseDetails.color}`}>
            <caseDetails.icon className="icon" />
          </div>
          <div>
            <h1 className="case-title">{caseDetails.title}</h1>
            {caseDetails.productName && (
              <p className="product-name">Produto: {caseDetails.productName}</p>
            )}
          </div>
        </div>
        
        <div className="tabs">
          <div className="tabs-list">
            <button 
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Visão Geral
            </button>
            <button 
              className={`tab ${activeTab === 'video' ? 'active' : ''}`}
              onClick={() => setActiveTab('video')}
            >
              Vídeo
            </button>
            <button 
              className={`tab ${activeTab === 'process' ? 'active' : ''}`}
              onClick={() => setActiveTab('process')}
            >
              Processo
            </button>
            <button 
              className={`tab ${activeTab === 'results' ? 'active' : ''}`}
              onClick={() => setActiveTab('results')}
            >
              Resultados
            </button>
            <button 
              className={`tab ${activeTab === 'lessons' ? 'active' : ''}`}
              onClick={() => setActiveTab('lessons')}
            >
              Lições Aprendidas
            </button>
          </div>
          
          {activeTab === 'overview' && (
            <div className="tab-content">
              <div className="overview-card">
                <h2 className="content-title">Sobre este Case</h2>
                <p className="overview-description">
                  {caseDetails.tabs?.overview?.description || caseDetails.description}
                </p>
                <div className="metrics-grid">
                  <div className="metric-box">
                    <h3 className="metric-title">
                      <Clock className="small-icon" /> Redução de Tempo
                    </h3>
                    <p className="metric-value time-value">{caseDetails.timeReduction}</p>
                  </div>
                  <div className="metric-box">
                    <h3 className="metric-title">
                      <BarChart3 className="small-icon" /> Melhoria de Qualidade
                    </h3>
                    <p className="metric-value quality-value">{caseDetails.qualityImprovement}</p>
                  </div>
                </div>
              </div>
              
              <div className="highlights-card">
                <h2 className="content-title">Destaques</h2>
                <ul className="highlights-list">
                  {caseDetails.highlights?.map((highlight, index) => (
                    <li key={index} className="highlight-item">
                      <ArrowRight className="highlight-icon" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {activeTab === 'video' && (
            <div className="tab-content">
              <div className="video-card">
                <h2 className="content-title">Demo do Produto Final</h2>
                <p className="content-subtitle">Veja em ação o produto digital que foi desenvolvido</p>
                <div className="video-container">
                  <div 
                    className="video-placeholder"
                    onClick={() => setShowVideoModal(true)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="play-button">
                      <div className="play-icon"></div>
                    </div>
                  </div>
                </div>
                <div className="video-info">
                  <h3 className="info-title">Neste vídeo você verá:</h3>
                  <ul className="info-list">
                    {caseDetails.tabs?.video?.highlights?.map((item, index) => (
                      <li key={index}>{item}</li>
                    )) || (
                      <>
                        <li>Demonstração das principais funcionalidades</li>
                        <li>Interface e experiência do usuário</li>
                        <li>Como o produto resolve o problema proposto</li>
                        <li>Diferenciais em relação a soluções tradicionais</li>
                      </>
                    )}
                  </ul>
                </div>
                <div className="additional-resources">
                  <h3 className="resources-title">Recursos adicionais:</h3>
                  <div className="resources-tags">
                    {caseDetails.tabs?.video?.resources?.map((resource, index) => (
                      <span key={index} className={`tag ${resource.type}`}>{resource.name}</span>
                    )) || (
                      <>
                        <span className="tag blue-tag">Documentação técnica</span>
                        <span className="tag green-tag">Link para teste</span>
                        <span className="tag purple-tag">Caso de uso completo</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'process' && (
            <div className="tab-content">
              <div className="process-card">
                <h2 className="content-title">Processo de Co-criação com LLM</h2>
                <div className="prompt-example">
                  <h3 className="example-title">Exemplo de Prompt Utilizado:</h3>
                  <div className="example-code">
                    <pre>{caseDetails.promptExample}</pre>
                  </div>
                </div>
                
                <div className="process-steps">
                  <h3 className="steps-title">Etapas do Processo:</h3>
                  <ol className="steps-list">
                    {caseDetails.tabs?.process?.steps?.map((step, index) => (
                      <li key={index}>{step}</li>
                    )) || (
                      <>
                        <li>Definição clara do problema e objetivos desejados</li>
                        <li>Criação de prompts estruturados com contexto adequado</li>
                        <li>Iteração e refinamento com base no feedback do LLM</li>
                        <li>Validação dos resultados com stakeholders</li>
                        <li>Implementação e medição de resultados</li>
                      </>
                    )}
                  </ol>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'results' && (
            <div className="tab-content">
              <div className="results-card">
                <h2 className="content-title">Resultados Obtidos</h2>
                <p className="result-label">Resultado Final:</p>
                <div className="result-box">
                  <p>{caseDetails.result}</p>
                </div>
                
                <h3 className="comparison-title">Comparação Antes vs. Depois:</h3>
                <div className="comparison-grid">
                  <div className="before-box">
                    <h4 className="before-title">Antes</h4>
                    <ul className="comparison-list">
                      {caseDetails.tabs?.results?.before?.map((item, index) => (
                        <li key={index} className="negative">{item}</li>
                      )) || (
                        <>
                          <li className="negative">Processo manual demorado</li>
                          <li className="negative">Inconsistências entre documentos</li>
                          <li className="negative">Altos custos de retrabalho</li>
                        </>
                      )}
                    </ul>
                  </div>
                  <div className="after-box">
                    <h4 className="after-title">Depois</h4>
                    <ul className="comparison-list">
                      {caseDetails.tabs?.results?.after?.map((item, index) => (
                        <li key={index} className="positive">{item}</li>
                      )) || (
                        <>
                          <li className="positive">Processo rápido e consistente</li>
                          <li className="positive">Documentação sempre atualizada</li>
                          <li className="positive">Qualidade superior desde o início</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'lessons' && (
            <div className="tab-content">
              <div className="lessons-card">
                <h2 className="content-title">Lições Aprendidas</h2>
                <div className="lessons-content">
                  <div className="lesson-section">
                    <h3 className="section-title">O que funcionou bem:</h3>
                    <ul className="section-list">
                      {caseDetails.tabs?.lessons?.whatWorked?.map((item, index) => (
                        <li key={index}>{item}</li>
                      )) || (
                        <>
                          <li>Fornecer contexto detalhado no início da conversa</li>
                          <li>Dividir tarefas complexas em etapas menores</li>
                          <li>Iterar sobre os resultados iniciais</li>
                        </>
                      )}
                    </ul>
                  </div>
                  
                  <div className="lesson-section">
                    <h3 className="section-title">O que poderia ser melhorado:</h3>
                    <ul className="section-list">
                      {caseDetails.tabs?.lessons?.improvementAreas?.map((item, index) => (
                        <li key={index}>{item}</li>
                      )) || (
                        <>
                          <li>Definir melhor os critérios de aceitação</li>
                          <li>Incluir mais exemplos no prompt</li>
                          <li>Estabelecer um processo de validação mais robusto</li>
                        </>
                      )}
                    </ul>
                  </div>
                  
                  <div className="lesson-section">
                    <h3 className="section-title">Dicas para replicar este sucesso:</h3>
                    <div className="tips-box">
                      <ol className="tips-list">
                        {caseDetails.tabs?.lessons?.tips?.map((tip, index) => (
                          <li key={index}>{tip}</li>
                        )) || (
                          <>
                            <li>Defina claramente o problema e o resultado esperado</li>
                            <li>Forneça exemplos concretos do que você espera</li>
                            <li>Use uma abordagem iterativa para refinar resultados</li>
                            <li>Combine a expertise humana com as sugestões do LLM</li>
                            <li>Documente os prompts eficazes para reutilização</li>
                          </>
                        )}
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      {updateAvailable && (
        <UpdateNotification onUpdate={handleUpdateClick} />
      )}
      
      {offlineMode && (
        <div className="offline-indicator">
          Você está offline. Alguns recursos podem estar indisponíveis.
        </div>
      )}
      
      <header className="app-header">
        <h1 className="app-title">Cases de Co-criação com LLMs</h1>
        <p className="app-subtitle">Uma biblioteca de experiências práticas apresentadas no Agile Trends 2025</p>
      </header>
      
      {selectedCaseId ? renderCaseDetail() : renderCaseList()}

      {showVideoModal && (
        <div 
          className="video-modal"
          onClick={(e) => {
            // Fechar o modal quando clicar fora do conteúdo
            if (e.target.className === 'video-modal') {
              setShowVideoModal(false);
            }
          }}
        >
          <div className="modal-content">
            <button 
              className="close-modal" 
              onClick={() => setShowVideoModal(false)}
            >
              &times;
            </button>
            <iframe 
              width="100%" 
              height="480" 
              src={caseDetails?.tabs?.video?.url ? 
                (caseDetails.tabs.video.url.replace('youtu.be/', 'youtube.com/embed/').replace('youtube.com/watch?v=', 'youtube.com/embed/') + 
                 (caseDetails.tabs.video.url.includes('?') ? '&' : '?') + 'autoplay=1&mute=1')
                : ''}
              style={{ border: 'none' }} // Substituir frameBorder por style
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
      
      <InstallPWA />
    </div>
  );
};

export default CasesApp;