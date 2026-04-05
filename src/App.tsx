import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, FileText, Layout, Send, Loader2, ChevronRight, Download, 
  Share2, Key, Eye, EyeOff, PanelLeftClose, PanelLeftOpen, 
  History, Settings, Plus, Trash2, Clock, Save, X
} from 'lucide-react';
import { processContent, StructuredContent } from './services/geminiService';
import MindMap from './components/MindMap';
import Markdown from 'react-markdown';

interface HistoryItem {
  id: string;
  timestamp: number;
  data: StructuredContent;
}

export default function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StructuredContent | null>(null);
  const [activeTab, setActiveTab] = useState<'structured' | 'mindmap'>('structured');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isApiKeySaved, setIsApiKeySaved] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('user_gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setIsApiKeySaved(true);
    }

    const savedHistory = localStorage.getItem('mindmap_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mindmap_history', JSON.stringify(history));
  }, [history]);

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    localStorage.setItem('user_gemini_api_key', val);
    setIsApiKeySaved(!!val);
  };

  const handleProcess = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const data = await processContent(input, apiKey);
      setResult(data);
      
      // Add to history
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        data: data
      };
      setHistory(prev => [newItem, ...prev].slice(0, 20)); // Keep last 20 items
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Có lỗi xảy ra khi xử lý nội dung. Vui lòng kiểm tra API Key và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setResult(item.data);
    setActiveTab('mindmap');
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearAllHistory = () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử?")) {
      setHistory([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
              title={isSidebarOpen ? "Ẩn thanh công cụ" : "Hiện thanh công cụ"}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold tracking-tight hidden sm:block">Đình Hiển MindMap</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsConfigModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Cấu hình API</span>
            </button>
            <button className="text-slate-500 hover:text-slate-700 transition-colors p-2">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all">
              Pro
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: History & Input */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 350, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="h-full bg-white border-r border-slate-200 overflow-hidden shrink-0 z-20 flex flex-col"
            >
              <div className="w-[350px] flex flex-col h-full">
                {/* Tabs for Sidebar */}
                <div className="p-4 border-b border-slate-100 flex gap-2">
                  <button 
                    onClick={() => setInput('')}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Tạo mới
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* History Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2 text-slate-500">
                        <History className="w-4 h-4" />
                        <h2 className="text-xs font-bold uppercase tracking-wider">Lịch sử gần đây</h2>
                      </div>
                      {history.length > 0 && (
                        <button 
                          onClick={clearAllHistory}
                          className="text-[10px] text-red-500 hover:underline"
                        >
                          Xóa hết
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {history.length === 0 ? (
                        <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs text-slate-400">Chưa có lịch sử</p>
                        </div>
                      ) : (
                        history.map((item) => (
                          <div 
                            key={item.id}
                            onClick={() => loadFromHistory(item)}
                            className={`group relative p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                              result?.title === item.data.title 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'bg-white border-slate-100 hover:border-blue-200'
                            }`}
                          >
                            <div className="text-sm font-semibold text-slate-800 truncate pr-6">
                              {item.data.title}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(item.timestamp).toLocaleString('vi-VN')}
                            </div>
                            <button 
                              onClick={(e) => deleteHistoryItem(e, item.id)}
                              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Input Section */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 px-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <h2 className="text-xs font-bold uppercase tracking-wider">Nội dung đầu vào</h2>
                    </div>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Dán nội dung văn bản của bạn vào đây..."
                      className="w-full h-[300px] p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm leading-relaxed"
                    />
                    <button
                      onClick={handleProcess}
                      disabled={loading || !input.trim()}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-100"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      {loading ? 'Đang xử lý...' : 'Tạo Sơ Đồ Tư Duy'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content: Visualization */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          <div className="max-w-[1200px] mx-auto p-6 md:p-8">
            {!result && !loading && (
              <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <div className="bg-slate-50 p-6 rounded-full mb-6">
                  <Layout className="w-16 h-16 text-slate-300" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Sẵn sàng tạo sơ đồ</h3>
                <p className="text-slate-500 max-w-sm mt-3 leading-relaxed">
                  Nhập nội dung ở thanh công cụ bên trái và nhấn nút để bắt đầu hành trình tư duy của bạn.
                </p>
              </div>
            )}

            {loading && (
              <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20" />
                  <Loader2 className="w-16 h-16 text-blue-600 animate-spin relative z-10" />
                </div>
                <p className="text-slate-600 font-medium mt-6">AI đang phân tích và vẽ sơ đồ...</p>
                <p className="text-slate-400 text-sm mt-2">Quá trình này có thể mất vài giây</p>
              </div>
            )}

            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex p-1 bg-slate-100 rounded-xl">
                    <button
                      onClick={() => setActiveTab('structured')}
                      className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                        activeTab === 'structured'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Nội dung chi tiết
                    </button>
                    <button
                      onClick={() => setActiveTab('mindmap')}
                      className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                        activeTab === 'mindmap'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Sơ đồ tư duy
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200">
                      <Download className="w-4 h-4" />
                      Xuất file
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[700px]">
                  <AnimatePresence mode="wait">
                    {activeTab === 'structured' ? (
                      <motion.div
                        key="structured"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-8 md:p-12"
                      >
                        <h2 className="text-4xl font-extrabold text-slate-900 mb-10 tracking-tight">{result.title}</h2>
                        <div className="space-y-12">
                          {result.sections.map((section, idx) => (
                            <div key={idx} className="relative pl-10 border-l-2 border-blue-100 group">
                              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-md group-hover:scale-125 transition-transform" />
                              <h3 className="text-2xl font-bold text-slate-800 mb-4">{section.heading}</h3>
                              <div className="prose prose-slate max-w-none text-slate-600 text-lg leading-relaxed">
                                <Markdown>{section.content}</Markdown>
                              </div>
                              {section.items && section.items.length > 0 && (
                                <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {section.items.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-base hover:border-blue-200 transition-colors">
                                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="mindmap"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="p-6"
                      >
                        <MindMap 
                          data={result.mindMapData} 
                          onUpdate={(newData) => setResult({ ...result, mindMapData: newData })}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* API Config Modal */}
      <AnimatePresence>
        {isConfigModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfigModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-xl">
                    <Key className="w-5 h-5 text-amber-600" />
                  </div>
                  <h2 className="text-lg font-bold">Cấu hình API Key</h2>
                </div>
                <button 
                  onClick={() => setIsConfigModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">Gemini API Key</label>
                    {isApiKeySaved && apiKey && (
                      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <div className="w-1 h-1 bg-green-600 rounded-full animate-pulse" />
                        Đã lưu
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => handleApiKeyChange(e.target.value)}
                      placeholder="Nhập API Key của bạn..."
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Key của bạn được lưu cục bộ trên trình duyệt này và không bao giờ được gửi đi nơi khác ngoại trừ API của Google.
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg h-fit">
                    <Brain className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-xs text-blue-700 leading-relaxed">
                    Bạn có thể lấy API Key miễn phí tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="font-bold underline">Google AI Studio</a>.
                  </div>
                </div>

                <button 
                  onClick={() => setIsConfigModalOpen(false)}
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  Hoàn tất
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
