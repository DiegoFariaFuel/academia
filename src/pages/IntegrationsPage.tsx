import { useState } from 'react';

export default function IntegrationsPage() {
  const [whatsappKey, setWhatsappKey] = useState('');
  const [catracaUrl, setCatracaUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // MOCK: Saving to database or localstorage
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Integrações & Webhooks</h1>
          <p className="text-gray-400">Configure as comunicações externas do sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center text-green-500">
              <span className="material-symbols-outlined">chat</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">WhatsApp API</h2>
              <p className="text-sm text-gray-400">Evolution API / Z-API</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-400 mb-6">
            Conecte seu provedor de WhatsApp para envio automático de boletos, alertas de vencimento e mensagens de aniversário.
          </p>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">API Token / Chave de Acesso</label>
              <input 
                type="password" 
                value={whatsappKey}
                onChange={e => setWhatsappKey(e.target.value)}
                placeholder="sk_live_..."
                className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50"
              />
            </div>
            <button disabled={saving} type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors">
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </button>
          </form>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-500">
              <span className="material-symbols-outlined">meeting_room</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Catraca Física</h2>
              <p className="text-sm text-gray-400">Control iD / Henry / TopData</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-400 mb-6">
            Configure o IP ou o Endpoint da catraca física para liberação automática após leitura do QR Code do Aluno.
          </p>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Webhook URL da Catraca</label>
              <input 
                type="text" 
                value={catracaUrl}
                onChange={e => setCatracaUrl(e.target.value)}
                placeholder="http://192.168.1.100/api/liberar"
                className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <button disabled={saving} type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-colors">
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </button>
          </form>
        </div>
      </div>
      
      {saved && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined">check_circle</span>
          Configurações salvas com sucesso!
        </div>
      )}
    </div>
  );
}
