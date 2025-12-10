import { useState, useEffect, useContext } from 'react';
import { Card, Button, Spinner, Nav, Badge, Collapse } from 'react-bootstrap';
import { BsRobot, BsGraphUpArrow, BsGraphDownArrow, BsDashCircle, BsArrowRepeat, BsNewspaper, BsLink45Deg } from 'react-icons/bs';
import { CurrencyDataContext } from '../contexts/CurrencyDataContext';

export default function AIInsights() {
  const { fetchAIInsights } = useContext(CurrencyDataContext);
  
  const TABS = ['USD', 'EUR', 'GBP', 'JPY']; 
  const [activeTab, setActiveTab] = useState('USD');
  
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showSources, setShowSources] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      setInsight(null); 
      setShowSources(false); 
      
      await new Promise(r => setTimeout(r, 400)); 
      
      const data = await fetchAIInsights(activeTab);
      
      if (isMounted) {
        setInsight(data);
        setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [activeTab, fetchAIInsights, retryCount]);

  // --- Visual Config ---
  const getConfig = (sentiment) => {
    if (sentiment === 'Bullish') return { 
      color: '#198754', 
      bgGradient: 'linear-gradient(135deg, rgba(25, 135, 84, 0.25) 0%, rgba(33, 37, 41, 0) 100%)', // Increased opacity
      border: '1px solid rgba(25, 135, 84, 0.5)',
      icon: <BsGraphUpArrow size={24} />,
      label: 'Bullish'
    };
    if (sentiment === 'Bearish') return { 
      color: '#dc3545', 
      bgGradient: 'linear-gradient(135deg, rgba(220, 53, 69, 0.25) 0%, rgba(33, 37, 41, 0) 100%)', // Increased opacity
      border: '1px solid rgba(220, 53, 69, 0.5)',
      icon: <BsGraphDownArrow size={24} />,
      label: 'Bearish'
    };
    return { 
      color: '#adb5bd', 
      bgGradient: 'linear-gradient(135deg, rgba(173, 181, 189, 0.15) 0%, rgba(33, 37, 41, 0) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      icon: <BsDashCircle size={24} />,
      label: 'Neutral'
    };
  };

  return (
    <Card className="shadow-lg mb-4 h-100" style={{ background: '#212529', border: '1px solid #495057' }}>
      
      {/* Tabs */}
      <Card.Header className="border-secondary p-0">
        <Nav variant="tabs" activeKey={activeTab} className="border-0">
          {TABS.map(curr => (
            <Nav.Item key={curr} className="flex-grow-1 text-center">
              <Nav.Link 
                eventKey={curr} 
                onClick={() => setActiveTab(curr)}
                className={`rounded-0 py-3 text-white ${activeTab === curr ? 'bg-dark border-bottom-0 fw-bold' : 'bg-transparent border-0 opacity-50'}`}
                style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}
              >
                {curr}
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
      </Card.Header>

      <Card.Body className="position-relative p-4">
        
        {/* Loading */}
        {loading && (
          <div className="d-flex flex-column align-items-center justify-content-center py-5" style={{ minHeight: '300px' }}>
            <Spinner animation="grow" variant="info" role="status" className="mb-3" />
            <div className="text-info small animate-pulse">Analyzing {activeTab} market data...</div>
          </div>
        )}

        {/* Error */}
        {!loading && (!insight || insight.sentiment === 'Unavailable') && (
           <div className="text-center py-5" style={{ minHeight: '300px' }}>
             <BsRobot size={40} className="text-secondary mb-3 opacity-50" />
             <h5 className="text-white">Analysis Unavailable</h5>
             <Button variant="outline-primary" size="sm" onClick={() => setRetryCount(c => c + 1)} className="mt-3">
               <BsArrowRepeat /> Retry
             </Button>
           </div>
        )}

        {/* Success State */}
        {!loading && insight && insight.sentiment !== 'Unavailable' && (() => {
           const config = getConfig(insight.sentiment);
           return (
             <>
               {/* Background Gradient */}
               <div style={{ 
                 position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                 background: config.bgGradient, 
                 zIndex: 0, 
                 pointerEvents: 'none',
                 borderRadius: '0.375rem' // Match Card border radius
               }} />

               <div className="position-relative d-flex flex-column gap-3" style={{ zIndex: 1 }}>
                 
                 {/* Header */}
                 <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                        <div className="p-2 rounded-circle shadow-sm" style={{ border: `1px solid ${config.color}`, color: config.color, background: 'rgba(33,37,41,0.9)' }}>
                            {config.icon}
                        </div>
                        <div>
                            <div className="text-uppercase small fw-bold text-info" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>AI Sentiment</div>
                            <h1 className="mb-0 fw-bold text-white">{config.label}</h1>
                        </div>
                    </div>
                 </div>

                 {/* Analysis Text Box */}
                 <div className="p-3 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderLeft: `4px solid ${config.color}` }}>
                   <p className="mb-0 text-white" style={{ lineHeight: '1.8', fontSize: '1.05rem' }}>
                     {insight.summary}
                   </p>
                 </div>

                 {/* Sources Toggle */}
                 <div className="d-flex justify-content-end mt-2">
                    <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        className="text-white d-flex align-items-center gap-2 border-secondary"
                        onClick={() => setShowSources(!showSources)}
                    >
                        <BsNewspaper /> {showSources ? 'Hide Sources' : `View ${insight.articles?.length || 0} Sources`}
                    </Button>
                 </div>

                 {/* Sources List */}
                 <Collapse in={showSources}>
                    <div className="mt-2 pt-3 border-top border-secondary">
                        <small className="text-info fw-bold d-block mb-2">NEWS SOURCES:</small>
                        <div className="d-flex flex-column gap-2">
                            {insight.articles && insight.articles.map((article, idx) => (
                                <a 
                                    key={idx} 
                                    href={article.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-decoration-none text-light d-flex align-items-start gap-2 small p-2 rounded"
                                    style={{ background: 'rgba(255,255,255,0.1)' }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                >
                                    <BsLink45Deg size={18} className="flex-shrink-0 text-info mt-1" />
                                    <div>
                                        <div className="fw-bold">{article.title}</div>
                                        <div className="text-white-50" style={{ fontSize: '0.75rem' }}>
                                            {article.source.name} • {new Date(article.publishedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                 </Collapse>
               </div>
             </>
           );
        })()}
      </Card.Body>
    </Card>
  );
}