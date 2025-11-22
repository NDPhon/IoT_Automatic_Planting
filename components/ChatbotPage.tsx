import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Bot, 
  User, 
  Droplets, 
  Thermometer, 
  Zap, 
  Wind, 
  RefreshCw 
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock Real-time Data (In a real app, this would come from Context or Redux)
const SYSTEM_DATA = {
  soilMoisture: 64,
  pumpStatus: false, // Off
  temperature: 29,
  humidity: 71,
  mode: 'Auto',
  lastWatered: '10:30 AM'
};

interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'bot',
      text: 'Chào bạn! Tôi là PlantCare AI, trợ lý chăm sóc cây trồng của bạn. Tôi có thể tư vấn về độ ẩm, lịch tưới, và hỗ trợ xử lý sự cố thiết bị. \n\nDữ liệu hiện tại: Độ ẩm **' + SYSTEM_DATA.soilMoisture + '%**. Tôi có thể giúp gì cho bạn?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "Nên tưới lúc nào?",
    "Ngưỡng độ ẩm hợp lý?",
    "Kiểm tra tình trạng bơm",
    "Cây đang thiếu nước không?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simulated AI Logic
  const generateResponse = (query: string) => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('độ ẩm') || lowerQuery.includes('nước') || lowerQuery.includes('thiếu nước')) {
      if (SYSTEM_DATA.soilMoisture < 50) {
        return `Độ ẩm đất hiện tại là **${SYSTEM_DATA.soilMoisture}%**, mức này khá thấp. Bạn nên cân nhắc bật bơm tưới ngay hoặc kiểm tra xem chế độ Tự động có hoạt động đúng không.`;
      } else if (SYSTEM_DATA.soilMoisture > 80) {
        return `Độ ẩm đất đang rất cao (**${SYSTEM_DATA.soilMoisture}%**). Đừng tưới thêm nước để tránh úng rễ.`;
      }
      return `Độ ẩm đất đang ở mức ổn định (**${SYSTEM_DATA.soilMoisture}%**). Cây đang phát triển tốt.`;
    }

    if (lowerQuery.includes('bơm') || lowerQuery.includes('tình trạng')) {
      return `Máy bơm hiện đang **${SYSTEM_DATA.pumpStatus ? 'BẬT' : 'TẮT'}**. Hệ thống đang chạy ở chế độ **${SYSTEM_DATA.mode}**. Lần tưới gần nhất là lúc ${SYSTEM_DATA.lastWatered}.`;
    }

    if (lowerQuery.includes('nhiệt độ') || lowerQuery.includes('nóng')) {
      return `Nhiệt độ môi trường là **${SYSTEM_DATA.temperature}°C**. ${SYSTEM_DATA.temperature > 35 ? 'Trời khá nóng, hãy chú ý cấp đủ nước.' : 'Nhiệt độ này phù hợp cho cây phát triển.'}`;
    }

    if (lowerQuery.includes('lúc nào') || lowerQuery.includes('khi nào')) {
      return "Với loại cây trồng hiện tại, bạn nên tưới vào sáng sớm (6h-8h) hoặc chiều mát (17h-18h) để tránh sốc nhiệt và nấm bệnh.";
    }

    return "Tôi chỉ có thể trả lời các câu hỏi liên quan đến thông số môi trường, trạng thái thiết bị (Bơm, Cảm biến) và kỹ thuật chăm sóc cây cơ bản trong hệ thống EcoWater.";
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    // Add User Message
    const userMsg: Message = {
      id: messages.length + 1,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI Delay
    setTimeout(() => {
      const botResponse = generateResponse(text);
      const botMsg: Message = {
        id: messages.length + 2,
        sender: 'bot',
        text: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg text-white shadow-sm">
               <Bot size={20} />
            </div>
            <div>
              <h1 className="font-bold text-gray-800">PlantCare AI Assistant</h1>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs text-green-600 font-medium">Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-7xl mx-auto w-full">
        
        {/* Left: Chat Interface */}
        <div className="flex-1 flex flex-col bg-white md:border-r border-gray-200">
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
                  ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                  {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed
                  ${msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'}`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span className={`text-[10px] mt-1 block opacity-70 ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-4 py-2 bg-white border-t border-gray-100 overflow-x-auto flex gap-2 no-scrollbar">
            {quickPrompts.map((prompt, index) => (
              <button 
                key={index}
                onClick={() => handleSendMessage(prompt)}
                className="flex-shrink-0 text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-center gap-2 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-full focus:ring-emerald-500 focus:border-emerald-500 block w-full p-3 pl-5 pr-12 shadow-sm"
              />
              <button 
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim()}
                className="absolute right-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white p-2 rounded-full transition-all shadow-md transform active:scale-95"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
              AI có thể đưa ra thông tin chưa chính xác, vui lòng kiểm tra lại thực tế.
            </p>
          </div>

        </div>

        {/* Right: Context/Real-time Data Panel (Hidden on mobile, visible on md+) */}
        <div className="hidden md:block w-80 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <RefreshCw size={18} className="text-gray-500" />
            Dữ liệu Thời Gian Thực
          </h2>

          <div className="space-y-4">
            
            {/* Moisture Card */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-500 font-medium">Độ ẩm Đất Hiện Tại</span>
                <Droplets size={16} className="text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {SYSTEM_DATA.soilMoisture}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${SYSTEM_DATA.soilMoisture}%` }}></div>
              </div>
            </div>

            {/* Pump Status */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
               <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Trạng Thái Bơm</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${SYSTEM_DATA.pumpStatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {SYSTEM_DATA.pumpStatus ? 'Đang Bật' : 'Đang Tắt'}
                  </span>
               </div>
            </div>

            {/* Mode */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
               <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Chế Độ</span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-700">
                    {SYSTEM_DATA.mode}
                  </span>
               </div>
            </div>

            {/* Env Sensors */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-red-50 flex flex-col items-center text-center">
                <Thermometer size={20} className="text-red-500 mb-1" />
                <span className="text-xs text-gray-400">Nhiệt Độ</span>
                <span className="text-lg font-bold text-gray-700">{SYSTEM_DATA.temperature}°C</span>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-sm border border-cyan-50 flex flex-col items-center text-center">
                <Wind size={20} className="text-cyan-500 mb-1" />
                <span className="text-xs text-gray-400">Độ Ẩm KK</span>
                <span className="text-lg font-bold text-gray-700">{SYSTEM_DATA.humidity}%</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
               <p className="text-xs text-gray-400 text-center">
                 Dữ liệu được cập nhật qua MQTT/API
               </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
