import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, FileText, Layout, Send, Loader2, ChevronRight, Download, Share2, Key, Eye, EyeOff, ChevronLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { processContent, StructuredContent } from './services/geminiService';
import MindMap from './components/MindMap';
import Markdown from 'react-markdown';

export default function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StructuredContent | null>(null);
  const [activeTab, setActiveTab] = useState<'structured' | 'mindmap'>('structured');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('user_gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    localStorage.setItem('user_gemini_api_key', val);
  };

  const handleProcess = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const data = await processContent(input, apiKey);
      setResult(data);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Có lỗi xảy ra khi xử lý nội dung. Vui lòng kiểm tra API Key và thử lại.');
    } finally {
      setLoading(false);
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
          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-slate-700 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all">
              Nâng cấp Pro
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Input & Config */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="h-full bg-white border-r border-slate-200 overflow-y-auto shrink-0 z-20"
            >
              <div className="w-[400px] p-6 space-y-6">
                {/* API Key Section */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Key className="w-4 h-4 text-amber-500" />
                    <h2 className="text-sm font-semibold">Cấu hình API</h2>
                  </div>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => handleApiKeyChange(e.target.value)}
                      placeholder="Nhập Gemini API Key..."
                      className="w-full pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <h2 className="text-sm font-semibold">Nội dung đầu vào</h2>
                  </div>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Dán nội dung văn bản của bạn vào đây..."
                    className="w-full h-[400px] p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm leading-relaxed"
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

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h3 className="text-blue-900 font-semibold mb-2 text-xs">Mẹo nhỏ:</h3>
                  <ul className="text-blue-700 text-[11px] space-y-1.5">
                    <li className="flex gap-2">
                      <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />
                      Nội dung càng chi tiết, sơ đồ càng chính xác.
                    </li>
                    <li className="flex gap-2">
                      <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />
                      Sử dụng các đoạn văn rõ ràng để AI dễ phân tích.
                    </li>
                  </ul>
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
    </div>
  );
}
