import React, { useState, useEffect, useMemo } from 'react';
import {
  Plane,
  ArrowLeftRight,
  Calendar,
  Award,
  Target,
  Bell,
  BellRing,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Clock,
  Info,
  Copy,
  Check,
  X,
  RefreshCw,
  Smartphone
} from 'lucide-react';

const AIRPORTS = [
  { code: 'GRU', city: 'São Paulo', name: 'Guarulhos Intl', country: 'Brasil' },
  { code: 'CGH', city: 'São Paulo', name: 'Congonhas', country: 'Brasil' },
  { code: 'VCP', city: 'Campinas', name: 'Viracopos', country: 'Brasil' },
  { code: 'GIG', city: 'Rio de Janeiro', name: 'Galeão Intl', country: 'Brasil' },
  { code: 'SDU', city: 'Rio de Janeiro', name: 'Santos Dumont', country: 'Brasil' },
  { code: 'BSB', city: 'Brasília', name: 'Pres. Juscelino Kubitschek', country: 'Brasil' },
  { code: 'CNF', city: 'Belo Horizonte', name: 'Confins Intl', country: 'Brasil' },
  { code: 'REC', city: 'Recife', name: 'Guararapes Intl', country: 'Brasil' },
  { code: 'SSA', city: 'Salvador', name: 'Dep. Luís Eduardo Magalhães', country: 'Brasil' },
  { code: 'FOR', city: 'Fortaleza', name: 'Pinto Martins Intl', country: 'Brasil' },
  { code: 'POA', city: 'Porto Alegre', name: 'Salgado Filho Intl', country: 'Brasil' },
  { code: 'CWB', city: 'Curitiba', name: 'Afonso Pena Intl', country: 'Brasil' },
  { code: 'FLN', city: 'Florianópolis', name: 'Hercílio Luz Intl', country: 'Brasil' },
  { code: 'NAT', city: 'Natal', name: 'São Gonçalo do Amarante', country: 'Brasil' },
  { code: 'MCZ', city: 'Maceió', name: 'Zumbi dos Palmares', country: 'Brasil' },
  { code: 'MAO', city: 'Manaus', name: 'Eduardo Gomes Intl', country: 'Brasil' },
  { code: 'BEL', city: 'Belém', name: 'Val-de-Cans Intl', country: 'Brasil' },
  { code: 'GYN', city: 'Goiânia', name: 'Santa Genoveva', country: 'Brasil' },
  { code: 'VIX', city: 'Vitória', name: 'Eurico de Aguiar Salles', country: 'Brasil' },
  { code: 'IGU', city: 'Foz do Iguaçu', name: 'Cataratas Intl', country: 'Brasil' },
  { code: 'MII', city: 'Marília', name: 'Frank Miloye Milenkowichi', country: 'Brasil' },
  { code: 'RAO', city: 'Ribeirão Preto', name: 'Leite Lopes', country: 'Brasil' },
  { code: 'SJP', city: 'São José do Rio Preto', name: 'Prof. Eribelto Manoel Reino', country: 'Brasil' },
  { code: 'PPB', city: 'Presidente Prudente', name: 'Adhemar de Barros', country: 'Brasil' },
  { code: 'LDB', city: 'Londrina', name: 'Gov. José Richa', country: 'Brasil' },
  { code: 'MGF', city: 'Maringá', name: 'Silvio Name Júnior', country: 'Brasil' },
  { code: 'MIA', city: 'Miami', name: 'Miami International', country: 'EUA' },
  { code: 'MCO', city: 'Orlando', name: 'Orlando International', country: 'EUA' },
  { code: 'JFK', city: 'Nova York', name: 'John F. Kennedy Intl', country: 'EUA' },
  { code: 'LAX', city: 'Los Angeles', name: 'Los Angeles Intl', country: 'EUA' },
  { code: 'LIS', city: 'Lisboa', name: 'Humberto Delgado', country: 'Portugal' },
  { code: 'OPO', city: 'Porto', name: 'Francisco Sá Carneiro', country: 'Portugal' },
  { code: 'MAD', city: 'Madri', name: 'Adolfo Suárez Madrid-Barajas', country: 'Espanha' },
  { code: 'BCN', city: 'Barcelona', name: 'El Prat', country: 'Espanha' },
  { code: 'CDG', city: 'Paris', name: 'Charles de Gaulle', country: 'França' },
  { code: 'LHR', city: 'Londres', name: 'Heathrow', country: 'Reino Unido' },
  { code: 'FCO', city: 'Roma', name: 'Fiumicino', country: 'Itália' },
  { code: 'EZE', city: 'Buenos Aires', name: 'Ezeiza Intl', country: 'Argentina' },
  { code: 'SCL', city: 'Santiago', name: 'Arturo Merino Benítez', country: 'Chile' },
  { code: 'MVD', city: 'Montevidéu', name: 'Carrasco Intl', country: 'Uruguai' },
  { code: 'BOG', city: 'Bogotá', name: 'El Dorado Intl', country: 'Colômbia' },
  { code: 'LIM', city: 'Lima', name: 'Jorge Chávez Intl', country: 'Peru' },
  { code: 'CUN', city: 'Cancún', name: 'Cancún Intl', country: 'México' },
  { code: 'PUJ', city: 'Punta Cana', name: 'Punta Cana Intl', country: 'Rep. Dominicana' },
  { code: 'DXB', city: 'Dubai', name: 'Dubai International', country: 'Emirados Árabes' },
  { code: 'HND', city: 'Tóquio', name: 'Haneda Intl', country: 'Japão' }
];

const MONTHS = [
  'Dez/26', 'Jan/27', 'Fev/27', 'Mar/27', 'Abr/27', 'Mai/27',
  'Jun/27', 'Jul/27', 'Ago/27', 'Set/27', 'Out/27', 'Nov/27'
];

const PROGRAMS = [
  { id: 'tudoazul', name: 'TudoAzul', color: 'bg-sky-500' },
  { id: 'latam', name: 'LATAM Pass', color: 'bg-rose-600' },
  { id: 'smiles', name: 'Smiles (GOL)', color: 'bg-orange-500' },
  { id: 'tap', name: 'TAP Miles&Go', color: 'bg-emerald-600' },
  { id: 'iberia', name: 'Iberia Plus', color: 'bg-red-600' },
  { id: 'livelo', name: 'Livelo (Parceiros)', color: 'bg-pink-600' },
  { id: 'esfera', name: 'Esfera (Parceiros)', color: 'bg-red-500' }
];

function AirportSelector({ label, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return AIRPORTS;
    return AIRPORTS.filter(
      a =>
        a.code.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="relative flex-1">
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
        {label}
      </label>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setQuery('');
        }}
        className="w-full text-left bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 transition flex items-center justify-between"
      >
        <div>
          <div className="text-2xl font-black tracking-tight text-white font-mono">
            {selected.code}
          </div>
          <div className="text-xs text-slate-300 truncate max-w-[160px]">
            {selected.city}
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          IATA
        </span>
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-slate-800 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Digite código (GRU, LIS) ou cidade..."
              className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60">
            {filtered.map(airport => (
              <button
                key={airport.code}
                type="button"
                onClick={() => {
                  onSelect(airport);
                  setOpen(false);
                }}
                className="w-full px-3 py-2.5 text-left hover:bg-sky-500/10 flex items-center justify-between transition"
              >
                <div>
                  <div className="text-sm font-semibold text-white">{airport.city}</div>
                  <div className="text-xs text-slate-400">{airport.name}</div>
                </div>
                <span className="font-mono font-bold text-sm px-2 py-1 rounded bg-slate-800 text-sky-400">
                  {airport.code}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('search');
  const [origin, setOrigin] = useState(AIRPORTS[0]);
  const [destination, setDestination] = useState(AIRPORTS[7]);
  const [selectedMonths, setSelectedMonths] = useState(['Mar/27', 'Abr/27', 'Mai/27']);
  const [days, setDays] = useState(7);
  const [program, setProgram] = useState(PROGRAMS[0].name);
  const [targetPoints, setTargetPoints] = useState(45000);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [routeSummary, setRouteSummary] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [showInstallTip, setShowInstallTip] = useState(false);

  const [alerts, setAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem('milharadar_alerts_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [alertSavedToast, setAlertSavedToast] = useState(false);
  const [scanningAlerts, setScanningAlerts] = useState(false);

  useEffect(() => {
    localStorage.setItem('milharadar_alerts_v1', JSON.stringify(alerts));
  }, [alerts]);

  const toggleMonth = (m) => {
    setSelectedMonths(prev =>
      prev.includes(m)
        ? prev.length > 1 ? prev.filter(item => item !== m) : prev
        : [...prev, m]
    );
  };

  const swapAirports = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (origin.code === destination.code) {
      setError('Selecione aeroportos de origem e destino diferentes.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          months: selectedMonths,
          days,
          program,
          targetPoints: Number(targetPoints)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao consultar tarifas');

      const sorted = (data.options || []).sort((a, b) => a.totalPoints - b.totalPoints);
      setResults(sorted);
      setRouteSummary(data.routeSummary || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = () => {
    const newAlert = {
      id: Date.now().toString(),
      origin,
      destination,
      months: selectedMonths,
      days,
      program,
      targetPoints: Number(targetPoints),
      bestFound: results.length > 0 ? results[0].totalPoints : null,
      bestDate: results.length > 0 ? `${results[0].departureDate} - ${results[0].returnDate}` : null,
      lastChecked: 'Agora mesmo',
      status: results.length > 0 && results[0].totalPoints <= Number(targetPoints) ? 'hit' : 'monitoring'
    };

    setAlerts(prev => [newAlert, ...prev]);
    setAlertSavedToast(true);
    setTimeout(() => setAlertSavedToast(false), 3000);
  };

  const runAlertMonitorCycle = async () => {
    if (alerts.length === 0) return;
    setScanningAlerts(true);

    const updated = [...alerts];
    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: item.origin,
            destination: item.destination,
            months: item.months,
            days: item.days,
            program: item.program,
            targetPoints: item.targetPoints
          })
        });
        const data = await res.json();
        if (res.ok && data.options?.length > 0) {
          const sorted = data.options.sort((a, b) => a.totalPoints - b.totalPoints);
          const best = sorted[0];
          updated[i] = {
            ...item,
            bestFound: best.totalPoints,
            bestDate: `${best.departureDate} - ${best.returnDate}`,
            lastChecked: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            status: best.totalPoints <= item.targetPoints ? 'hit' : 'monitoring'
          };
        }
      } catch {
        // mantém estado anterior em caso de falha pontual
      }
    }

    setAlerts(updated);
    setScanningAlerts(false);
  };

  const copySummary = (ticket) => {
    const text = `✈️ MilhaRadar | ${origin.code} -> ${destination.code}
📅 ${ticket.departureDate} até ${ticket.returnDate} (${days} dias)
🏆 Programa: ${program}
💎 Total: ${ticket.totalPoints.toLocaleString('pt-BR')} pts (Ida: ${ticket.outboundPoints.toLocaleString('pt-BR')} | Volta: ${ticket.returnPoints.toLocaleString('pt-BR')})
🛫 ${ticket.airline} • ${ticket.stops}`;
    navigator.clipboard.writeText(text);
    setCopiedId(ticket.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hitCount = alerts.filter(a => a.status === 'hit').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* Top Airport Departure Board Header */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
              <Plane className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black tracking-tight text-lg text-white">MilhaRadar</h1>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  IA LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Monitoramento 3x/dia • 08h • 14h • 20h</p>
            </div>
          </div>

          <button
            onClick={() => setShowInstallTip(!showInstallTip)}
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition"
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
            <span>Instalar App</span>
          </button>
        </div>

        {showInstallTip && (
          <div className="max-w-4xl mx-auto px-4 pb-3">
            <div className="bg-sky-950/60 border border-sky-500/30 rounded-xl p-3 text-xs text-sky-200 flex items-start justify-between gap-3">
              <div>
                <strong className="text-white block mb-0.5">Instale na tela inicial do seu celular:</strong>
                No <strong>iPhone (Safari)</strong>, toque no ícone de Compartilhar e depois em <em>"Adicionar à Tela de Início"</em>. No <strong>Android (Chrome)</strong>, toque nos 3 pontinhos e em <em>"Instalar aplicativo"</em>.
              </div>
              <button onClick={() => setShowInstallTip(false)} className="text-sky-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="max-w-4xl mx-auto px-4 flex gap-2 pb-2">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition ${
              activeTab === 'search'
                ? 'bg-sky-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Buscar Emissões
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition relative ${
              activeTab === 'alerts'
                ? 'bg-sky-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Meus Alertas ({alerts.length})
            {hitCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-slate-950 font-black">
                {hitCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-5">
        {activeTab === 'search' ? (
          <div className="space-y-6">
            {/* Search Control Card */}
            <form onSubmit={handleSearch} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5 shadow-xl">
              {/* Origin & Destination */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5">
                <AirportSelector label="Aeroporto de Saída" selected={origin} onSelect={setOrigin} />
                <button
                  type="button"
                  onClick={swapAirports}
                  title="Inverter trechos"
                  className="self-center sm:mb-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-400 transition"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
                <AirportSelector label="Aeroporto de Chegada" selected={destination} onSelect={setDestination} />
              </div>

              {/* Multi-Month Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    Meses Pretendidos (selecione 1 ou mais)
                  </label>
                  <span className="text-xs text-sky-400 font-mono">{selectedMonths.length} selecionado(s)</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {MONTHS.map(m => {
                    const active = selectedMonths.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleMonth(m)}
                        className={`py-2 px-2 rounded-lg text-xs font-mono font-semibold border transition ${
                          active
                            ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Days, Program & Target Points */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Duração (Dias)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={days}
                    onChange={e => setDays(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-sky-400" />
                    Programa de Pontos
                  </label>
                  <select
                    value={program}
                    onChange={e => setProgram(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-400"
                  >
                    {PROGRAMS.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    Pontuação Target (Total)
                  </label>
                  <input
                    type="number"
                    step={1000}
                    min={3000}
                    value={targetPoints}
                    onChange={e => setTargetPoints(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg shadow-sky-500/20"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Consultando Agente IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Buscar Melhores Datas
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCreateAlert}
                  className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition"
                >
                  <BellRing className="w-4 h-4 text-amber-400" />
                  Criar Alerta 3x/dia
                </button>
              </div>

              {alertSavedToast && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Alerta criado! Monitoramento ativado 3x por dia (08h, 14h e 20h).
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('alerts')}
                    className="underline font-bold"
                  >
                    Ver alertas
                  </button>
                </div>
              )}
            </form>

            {/* AI Route Analysis Banner */}
            {routeSummary && (
              <div className="bg-slate-900/80 border border-sky-500/30 rounded-2xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-1">
                    Diagnóstico da Rota ({origin.code} → {destination.code})
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{routeSummary}</p>
                </div>
              </div>
            )}

            {/* Boarding Pass Results */}
            {results.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Melhores Oportunidades Encontradas ({results.length})
                  </h2>
                  <span className="text-xs text-slate-500 font-mono">Meta: ≤ {Number(targetPoints).toLocaleString('pt-BR')} pts</span>
                </div>

                {results.map((ticket, index) => {
                  const withinTarget = ticket.totalPoints <= Number(targetPoints);
                  return (
                    <div
                      key={ticket.id || index}
                      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 transition"
                    >
                      {/* Top Strip */}
                      <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-sky-400">#{index + 1}</span>
                          <span className="text-xs font-semibold text-slate-300">{ticket.airline}</span>
                          <span className="text-[11px] text-slate-500">• {ticket.stops}</span>
                        </div>
                        {withinTarget ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Dentro da Meta
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Acima da Meta
                          </span>
                        )}
                      </div>

                      {/* Main Boarding Pass Body */}
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="text-2xl font-black font-mono text-white">{origin.code}</div>
                            <div className="text-xs text-slate-400">{ticket.departureDate}</div>
                          </div>

                          <div className="flex flex-col items-center px-2">
                            <span className="text-[10px] font-mono text-slate-400 mb-1">{days} dias</span>
                            <div className="w-20 h-[1px] bg-slate-700 relative flex items-center justify-center">
                              <Plane className="w-3.5 h-3.5 text-sky-400 bg-slate-900 px-0.5" />
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1">{ticket.duration}</span>
                          </div>

                          <div>
                            <div className="text-2xl font-black font-mono text-white">{destination.code}</div>
                            <div className="text-xs text-slate-400">{ticket.returnDate}</div>
                          </div>
                        </div>

                        {/* Points & Action */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                          <div className="text-left sm:text-right">
                            <div className="text-[11px] uppercase tracking-wider text-slate-400">{program}</div>
                            <div className={`text-2xl font-black font-mono ${withinTarget ? 'text-emerald-400' : 'text-white'}`}>
                              {ticket.totalPoints.toLocaleString('pt-BR')} <span className="text-xs font-normal">pts</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              Ida {ticket.outboundPoints.toLocaleString('pt-BR')} + Volta {ticket.returnPoints.toLocaleString('pt-BR')}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => copySummary(ticket)}
                              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                              title="Copiar detalhes"
                            >
                              {copiedId === ticket.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedTicket(ticket)}
                              className="px-3.5 py-2 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 text-xs font-bold transition"
                            >
                              Ver Emissão
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Perforated Insight Footer */}
                      <div className="px-4 py-2.5 bg-slate-950/40 border-t border-dashed border-slate-800 flex items-center gap-2 text-xs text-slate-400">
                        <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span>{ticket.insight}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Alerts Tab */
          <div className="space-y-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  Radar Automático (08:00 • 14:00 • 20:00)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  O agente verifica seus trechos salvos 3x ao dia e sinaliza quando atingir sua meta de pontos.
                </p>
              </div>
              <button
                onClick={runAlertMonitorCycle}
                disabled={scanningAlerts || alerts.length === 0}
                className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${scanningAlerts ? 'animate-spin' : ''}`} />
                {scanningAlerts ? 'Varrendo Tarifas...' : 'Verificar Agora'}
              </button>
            </div>

            {alerts.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                <Bell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-300">Nenhum alerta monitorado ainda</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Configure uma rota na aba de busca e clique em "Criar Alerta 3x/dia".
                </p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-sky-400 text-xs font-bold"
                >
                  Ir para Busca
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`bg-slate-900 border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      alert.status === 'hit' ? 'border-emerald-500/50' : 'border-slate-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-lg text-white">
                          {alert.origin.code} → {alert.destination.code}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {alert.program}
                        </span>
                        {alert.status === 'hit' && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                            META ATINGIDA!
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        Meses: {alert.months.join(', ')} • {alert.days} dias
                      </div>
                      <div className="text-xs text-slate-500">
                        Última checagem: {alert.lastChecked}
                        {alert.bestDate && ` • Melhor janela: ${alert.bestDate}`}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                      <div className="text-left sm:text-right">
                        <div className="text-[11px] text-slate-400">
                          Target: <strong className="font-mono text-slate-200">{alert.targetPoints.toLocaleString('pt-BR')}</strong>
                        </div>
                        {alert.bestFound && (
                          <div className={`text-sm font-mono font-black ${alert.status === 'hit' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            Menor: {alert.bestFound.toLocaleString('pt-BR')} pts
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                        title="Excluir alerta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Ticket Checkout Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Plane className="w-4 h-4 text-sky-400" />
                Checklist de Emissão
              </h3>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 rounded-xl p-4 space-y-2 border border-slate-800">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Trecho:</span>
                <span className="font-mono font-bold text-white">{origin.code} ⇄ {destination.code}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Datas:</span>
                <span className="text-white">{selectedTicket.departureDate} - {selectedTicket.returnDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Programa:</span>
                <span className="text-sky-400 font-semibold">{program}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-800">
                <span className="text-slate-400">Total Estimado:</span>
                <span className="font-mono font-black text-emerald-400 text-base">
                  {selectedTicket.totalPoints.toLocaleString('pt-BR')} pts
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-white">Passos recomendados para emitir:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>Acesse o portal oficial do <strong>{program}</strong> e marque "Usar pontos/milhas".</li>
                <li>Pesquise exatamente as datas <strong>{selectedTicket.departureDate}</strong> e <strong>{selectedTicket.returnDate}</strong>.</li>
                <li>Antes de transferir pontos do cartão, confirme se há promoção de transferência bonificada ativa.</li>
              </ol>
            </div>

            <button
              onClick={() => setSelectedTicket(null)}
              className="w-full py-3 rounded-xl bg-sky-500 text-slate-950 font-black text-xs uppercase tracking-wider"
            >
              Concluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
