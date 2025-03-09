import React, { useState } from 'react';
import { ChevronRight, Code, Lightbulb, BarChart3, Clock, Zap, ArrowRight } from 'lucide-react';
import './App.css'; 
import UpdateNotification from './components/UpdateNotification';
import InstallPWA from './components/InstallPWA';



const CasesApp = () => {
  const [selectedCase, setSelectedCase] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const cases = [
    {
      id: 1,
      title: "Refinamento de Requisitos Ágeis",
      category: "Requisitos",
      description: "Como transformamos requisitos vagos em histórias de usuário detalhadas usando Claude",
      timeReduction: "70%",
      qualityImprovement: "85%",
      icon: Lightbulb,
      color: "bg-blue-100",
      highlights: [
        "Eliminação de 8 reuniões de refinamento",
        "Identificação de 12 casos de borda não considerados",
        "Redução de retrabalho em 65%"
      ],
      promptExample: "Analise os seguintes requisitos de negócio e transforme-os em histórias de usuário detalhadas com critérios de aceitação...",
      result: "24 histórias de usuário com critérios de aceitação claros e testáveis",
      videoLength: "6:42",
      videoViews: "342",
      productName: "RefineAI - Refinamento Automatizado de Requisitos"
    },
    {
      id: 2,
      title: "Geração de Código com Testes",
      category: "Desenvolvimento",
      description: "Acelerando a implementação de APIs RESTful com geração de código e testes automatizados",
      timeReduction: "60%",
      qualityImprovement: "75%",
      icon: Code,
      color: "bg-green-100",
      highlights: [
        "Criação de 5 endpoints em 1 dia (vs. 3 dias anteriormente)",
        "Cobertura de testes de 92% desde o primeiro commit",
        "Redução de bugs em produção em 40%"
      ],
      promptExample: "Crie uma API RESTful em Node.js para gerenciar um catálogo de produtos com os seguintes endpoints...",
      result: "Código funcional com testes unitários e de integração, pronto para revisão"
    },
    {
      id: 3,
      title: "Otimização de Performance",
      category: "Performance",
      description: "Identificação e resolução de gargalos de performance em aplicação React",
      timeReduction: "80%",
      qualityImprovement: "90%",
      icon: Zap,
      color: "bg-yellow-100",
      highlights: [
        "Tempo de carregamento reduzido de 4.5s para 1.2s",
        "Identificação de 7 problemas de renderização",
        "Melhoria de 65% na pontuação Lighthouse"
      ],
      promptExample: "Analise este código React que está causando problemas de performance e sugira otimizações específicas...",
      result: "Código refatorado com memoização, lazy loading e otimização de renderização"
    },
    {
      id: 4,
      title: "Automação de Documentação",
      category: "Documentação",
      description: "Criação automatizada de documentação técnica e de usuário a partir do código",
      timeReduction: "85%",
      qualityImprovement: "70%",
      icon: BarChart3,
      color: "bg-purple-100",
      highlights: [
        "Documentação completa gerada em 2 horas (vs. 2 dias)",
        "Consistência de 95% entre código e documentação",
        "Feedback positivo dos usuários sobre clareza"
      ],
      promptExample: "Gere documentação técnica para esta API baseada nos comentários de código e estrutura...",
      result: "Documentação técnica completa em formato Markdown com exemplos de uso"
    }
  ];
  
  const renderCaseList = () => {
    return (
      <div className="case-grid">
        {cases.map(caseItem => (
          <div 
            key={caseItem.id} 
            className={`case-card ${caseItem.color}`}
            onClick={() => setSelectedCase(caseItem)}
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
    if (!selectedCase) return null;
    
    return (
      <div className="case-detail">
        <button 
          className="back-button"
          onClick={() => setSelectedCase(null)}
        >
          ← Voltar para lista de cases
        </button>
        
        <div className="case-header">
          <div className={`icon-container ${selectedCase.color}`}>
            <selectedCase.icon className="icon" />
          </div>
          <div>
            <h1 className="case-title">{selectedCase.title}</h1>
            {selectedCase.productName && (
              <p className="product-name">Produto: {selectedCase.productName}</p>
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
                <p className="overview-description">{selectedCase.description}</p>
                <div className="metrics-grid">
                  <div className="metric-box">
                    <h3 className="metric-title">
                      <Clock className="small-icon" /> Redução de Tempo
                    </h3>
                    <p className="metric-value time-value">{selectedCase.timeReduction}</p>
                  </div>
                  <div className="metric-box">
                    <h3 className="metric-title">
                      <BarChart3 className="small-icon" /> Melhoria de Qualidade
                    </h3>
                    <p className="metric-value quality-value">{selectedCase.qualityImprovement}</p>
                  </div>
                </div>
              </div>
              
              <div className="highlights-card">
                <h2 className="content-title">Destaques</h2>
                <ul className="highlights-list">
                  {selectedCase.highlights.map((highlight, index) => (
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
                  <div className="video-placeholder">
                    <div className="play-button">
                      <div className="play-icon"></div>
                    </div>
                  </div>
                </div>
                <div className="video-info">
                  <h3 className="info-title">Neste vídeo você verá:</h3>
                  <ul className="info-list">
                    <li>Demonstração das principais funcionalidades</li>
                    <li>Interface e experiência do usuário</li>
                    <li>Como o produto resolve o problema proposto</li>
                    <li>Diferenciais em relação a soluções tradicionais</li>
                  </ul>
                </div>
                <div className="additional-resources">
                  <h3 className="resources-title">Recursos adicionais:</h3>
                  <div className="resources-tags">
                    <span className="tag blue-tag">Documentação técnica</span>
                    <span className="tag green-tag">Link para teste</span>
                    <span className="tag purple-tag">Caso de uso completo</span>
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
                    <pre>{selectedCase.promptExample}</pre>
                  </div>
                </div>
                
                <div className="process-steps">
                  <h3 className="steps-title">Etapas do Processo:</h3>
                  <ol className="steps-list">
                    <li>Definição clara do problema e objetivos desejados</li>
                    <li>Criação de prompts estruturados com contexto adequado</li>
                    <li>Iteração e refinamento com base no feedback do LLM</li>
                    <li>Validação dos resultados com stakeholders</li>
                    <li>Implementação e medição de resultados</li>
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
                  <p>{selectedCase.result}</p>
                </div>
                
                <h3 className="comparison-title">Comparação Antes vs. Depois:</h3>
                <div className="comparison-grid">
                  <div className="before-box">
                    <h4 className="before-title">Antes</h4>
                    <ul className="comparison-list">
                      <li className="negative">Processo manual demorado</li>
                      <li className="negative">Inconsistências entre documentos</li>
                      <li className="negative">Altos custos de retrabalho</li>
                    </ul>
                  </div>
                  <div className="after-box">
                    <h4 className="after-title">Depois</h4>
                    <ul className="comparison-list">
                      <li className="positive">Processo rápido e consistente</li>
                      <li className="positive">Documentação sempre atualizada</li>
                      <li className="positive">Qualidade superior desde o início</li>
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
                      <li>Fornecer contexto detalhado no início da conversa</li>
                      <li>Dividir tarefas complexas em etapas menores</li>
                      <li>Iterar sobre os resultados iniciais</li>
                    </ul>
                  </div>
                  
                  <div className="lesson-section">
                    <h3 className="section-title">O que poderia ser melhorado:</h3>
                    <ul className="section-list">
                      <li>Definir melhor os critérios de aceitação</li>
                      <li>Incluir mais exemplos no prompt</li>
                      <li>Estabelecer um processo de validação mais robusto</li>
                    </ul>
                  </div>
                  
                  <div className="lesson-section">
                    <h3 className="section-title">Dicas para replicar este sucesso:</h3>
                    <div className="tips-box">
                      <ol className="tips-list">
                        <li>Defina claramente o problema e o resultado esperado</li>
                        <li>Forneça exemplos concretos do que você espera</li>
                        <li>Use uma abordagem iterativa para refinar resultados</li>
                        <li>Combine a expertise humana com as sugestões do LLM</li>
                        <li>Documente os prompts eficazes para reutilização</li>
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
      <UpdateNotification />
      <header className="app-header">
        <h1 className="app-title">Cases de Co-criação com LLMs</h1>
        <p className="app-subtitle">Uma biblioteca de experiências práticas apresentadas no Agile Trends 2025</p>
      </header>
      
      {selectedCase ? renderCaseDetail() : renderCaseList()}
      
      <InstallPWA />
    </div>
    
  );
};

export default CasesApp;