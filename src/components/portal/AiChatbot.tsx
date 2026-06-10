import { useState } from 'react';

export default function AiChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Olá! Sou o seu Personal Virtual. Como posso te ajudar com o treino hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setTyping(true);

    // MOCK AI RESPONSE
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [
        ...prev,
        { role: 'ai', text: 'Excelente pergunta! Pela sua ficha atual, hoje é dia de Superiores. Lembre-se de manter a postura reta no supino e descansar 60s entre as séries. Mais alguma dúvida?' }
      ]);
    }, 2000);
  };

  return (
    <>
      {/* Botão Flutuante */}
      <button 
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center text-white hover:scale-110 transition-transform z-40"
      >
        <span className="material-symbols-outlined text-3xl">smart_toy</span>
      </button>

      {/* Janela de Chat */}
      {open && (
        <div className="fixed inset-0 md:inset-auto md:bottom-24 md:right-4 md:w-96 md:h-[500px] bg-gray-950 md:rounded-2xl shadow-2xl border border-white/10 z-50 flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-white">smart_toy</span>
              <h3 className="font-bold text-white">AI Coach Virtual</h3>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-900">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-gray-800 p-3 rounded-2xl rounded-bl-none border border-gray-700 text-gray-400 text-xs flex gap-1 items-center">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-gray-950 border-t border-white/5 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Pergunte sobre seu treino..."
              className="flex-1 bg-gray-900 rounded-full px-4 text-sm text-white focus:outline-none border border-gray-800 focus:border-purple-500"
            />
            <button type="submit" disabled={typing} className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white disabled:opacity-50">
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>

        </div>
      )}
    </>
  );
}
