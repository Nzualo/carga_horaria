import React, { useState, useEffect } from 'react';
import { School, Calendar, Filter, ArrowRight, ShieldCheck, Award, Layers, Building2, Sparkles, Lock, Eye, EyeOff, AlertCircle, X } from 'lucide-react';
import { api } from '../services/api';
import emblemaImg from '../assets/emblema.png';

// Gera anos lectivos a partir de 2025 até ao infinito de forma dinâmica
const GERAR_ANOS = () => {
  const anos = [];
  for (let a = 2025; a <= 2040; a++) {
    anos.push(a);
  }
  return anos;
};

export default function MenuPrincipal({ onEntrar, anoActual, setAnoActual }) {
  const [escolas, setEscolas] = useState([]);
  const [zips, setZips] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [filtroZip, setFiltroZip] = useState('');
  const [selectedEscolaId, setSelectedEscolaId] = useState('sdejt');
  const [selectedEscola, setSelectedEscola] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anosList, setAnosList] = useState(GERAR_ANOS());
  const [showOutroAno, setShowOutroAno] = useState(false);

  // Estados de Segurança / Autenticação do Administrador SDEJT
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Carregar escolas e ZIPs
  useEffect(() => {
    async function loadData() {
      try {
        const [listaEscolas, listaZips] = await Promise.all([
          api.getEscolas(),
          api.getZips()
        ]);
        setEscolas(listaEscolas || []);
        setZips(listaZips || []);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar escolas:', err);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Atualizar a escola selecionada
  useEffect(() => {
    if (selectedEscolaId === 'sdejt') {
      setSelectedEscola({
        id: 'sdejt',
        nomeOficial: 'Serviço Distrital de Educação, Juventude e Tecnologia de Inhassoro',
        nomeAbreviado: 'SDEJT Inhassoro (Sede Distrital)',
        codigoMEC: 'SEDE-01',
        tipo: 'SDEJT',
        nomeZIP: 'Sede Distrital',
        sedeZIP: 'Vila de Inhassoro'
      });
    } else {
      const esc = escolas.find(e => String(e.id) === String(selectedEscolaId));
      setSelectedEscola(esc || null);
    }
  }, [selectedEscolaId, escolas]);

  // Filtrar lista de escolas exibidas no seletor
  const escolasFiltradas = escolas.filter(e => {
    if (filtroTipo !== 'TODOS' && !e.tipo.includes(filtroTipo)) return false;
    if (filtroZip && String(e.idZip) !== String(filtroZip)) return false;
    return true;
  });

  const handleEntrar = () => {
    if (!selectedEscola) return;

    // Se for o SDEJT, exige autenticação de Administrador
    if (selectedEscola.id === 'sdejt' || selectedEscola.tipo === 'SDEJT') {
      setAdminPassword('');
      setAuthError('');
      setShowAuthModal(true);
      return;
    }

    onEntrar({
      escola: selectedEscola,
      ano: anoActual
    });
  };

  const handleVerificarSenhaSDEJT = async (e) => {
    if (e) e.preventDefault();
    if (!adminPassword) {
      setAuthError('Por favor digite o código/senha de acesso');
      return;
    }
    setAuthLoading(true);
    setAuthError('');

    try {
      await api.loginSDEJT(adminPassword);
      setShowAuthModal(false);
      onEntrar({
        escola: selectedEscola,
        ano: anoActual
      });
    } catch (err) {
      setAuthError(err.message || 'Código/Senha incorreta. Acesso não autorizado.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCustomAno = (e) => {
    const val = Number(e.target.value);
    if (val >= 2025) {
      setAnoActual(val);
      if (!anosList.includes(val)) {
        setAnosList(prev => [...prev, val].sort((a, b) => a - b));
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between py-8 px-4 relative overflow-hidden" style={{
      background: 'radial-gradient(ellipse at 50% 10%, #1e3a8a 0%, #0f172a 50%, #020617 100%)'
    }}>
      {/* Efeito de iluminação decorativa de fundo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-blue-600/10 blur-3xl pointer-events-none rounded-full" />

      {/* Topo Institucional com Emblema da República no Canto Superior Esquerdo */}
      <div className="max-w-4xl mx-auto w-full mb-6 z-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center gap-5 text-center sm:text-left">
          {/* Emblema no canto superior esquerdo com efeito flutuante */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-white/10 p-2.5 rounded-2xl border border-white/20 backdrop-blur-md shadow-2xl flex items-center justify-center transform hover:scale-105 transition-all duration-300">
            <img
              src={emblemaImg}
              alt="Emblema Oficial da República de Moçambique"
              className="w-full h-full object-contain filter drop-shadow-md"
            />
          </div>

          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-900/60 border border-blue-700/50 text-blue-200 text-xs font-semibold mb-2 shadow-sm">
              <ShieldCheck size={14} className="text-blue-400" />
              REPÚBLICA DE MOÇAMBIQUE • MINEDH • GOVERNO DO DISTRITO DE INHASSORO
            </div>
            {/* Título Principal Exigido pelo Usuário */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight uppercase leading-tight drop-shadow-md">
              SISTEMA DE GESTAO DE CARGA HORARIA
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Serviço Distrital de Educação, Juventude e Tecnologia (SDEJT) — Inhassoro 2026
            </p>
          </div>
        </div>
      </div>

      {/* Caixa Principal de Entrada (Estilo Software Executivo) */}
      <div className="max-w-2xl mx-auto w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl z-10 transform hover:border-blue-500/50 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="text-blue-400" size={20} />
              Portal de Acesso e Seleção de Instituição
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Filtre a instituição e selecione o ano lectivo de referência
            </p>
          </div>

          {/* Seletor Dinâmico de Anos (2025 a Infinito) */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700 px-3 py-1.5 rounded-xl shadow-inner">
            <Calendar size={15} className="text-blue-400 shrink-0" />
            <select
              value={anoActual}
              onChange={(e) => {
                if (e.target.value === 'OUTRO') {
                  setShowOutroAno(true);
                } else {
                  setShowOutroAno(false);
                  setAnoActual(Number(e.target.value));
                }
              }}
              aria-label="Ano Lectivo"
              className="bg-transparent text-white font-bold text-xs sm:text-sm cursor-pointer border-none focus:outline-none"
            >
              {anosList.map(a => (
                <option key={a} value={a} className="bg-slate-900 text-white">
                  Ano Lectivo {a}
                </option>
              ))}
              <option value="OUTRO" className="bg-slate-800 text-amber-300 font-bold">
                + Outro Ano Futuro...
              </option>
            </select>
          </div>
        </div>

        {/* Input para Ano Futuro Personalizado */}
        {showOutroAno && (
          <div className="mb-4 p-3 bg-blue-950/60 border border-blue-800 rounded-xl flex items-center justify-between gap-3">
            <span className="text-xs text-blue-200 font-medium">Indique o ano lectivo desejado (≥ 2025):</span>
            <input
              type="number"
              min="2025"
              max="2100"
              value={anoActual}
              onChange={handleCustomAno}
              className="w-24 text-center font-bold text-white bg-slate-900 border border-blue-500 rounded-lg py-1 text-sm"
            />
          </div>
        )}

        {/* Filtros em Linha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Filtro por Tipo */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Filter size={13} className="text-blue-400" />
              1. Filtrar por Tipo de Ensino:
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:border-blue-500"
            >
              <option value="TODOS">Todos os Estabelecimentos (56)</option>
              <option value="SDEJT">⭐ SDEJT — Sede Distrital (Acesso Total)</option>
              <option value="EP">Escolas Primárias (EP)</option>
              <option value="EB">Escolas Básicas (EB)</option>
              <option value="ESG">Escolas Secundárias (ESG 1 e 2)</option>
              <option value="ETP">Ensino Técnico (IICEM)</option>
            </select>
          </div>

          {/* Filtro por ZIP */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers size={13} className="text-blue-400" />
              2. Filtrar por ZIP (16 Zonas):
            </label>
            <select
              value={filtroZip}
              onChange={(e) => setFiltroZip(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:border-blue-500"
            >
              <option value="">Todas as 16 ZIPs</option>
              {zips.map(z => (
                <option key={z.id} value={z.id}>ZIP #{z.id}: {z.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Seletor da Instituição */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <School size={14} className="text-blue-400" />
            3. Selecione a Instituição / Escola:
          </label>
          <select
            value={selectedEscolaId}
            onChange={(e) => setSelectedEscolaId(e.target.value)}
            className="w-full bg-slate-950 border-2 border-blue-600/80 text-white rounded-xl px-3.5 py-3 text-sm font-semibold shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="sdejt" className="font-bold text-amber-300">
              ⭐ SERVIÇO DISTRITAL DE EDUCAÇÃO, JUVENTUDE E TECNOLOGIA (SDEJT) — Acesso Total
            </option>
            <optgroup label="── 56 Escolas Oficiais de Inhassoro ──">
              {escolasFiltradas.map(e => (
                <option key={e.id} value={e.id}>
                  [{e.tipo}] {e.nomeOficial} {e.codigoMEC ? `(COD: ${e.codigoMEC})` : ''}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Card de Ficha Informativa da Instituição */}
        {selectedEscola && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-6 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award size={14} className="text-emerald-400" />
                Ficha Cadastral da Instituição
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${selectedEscola.tipo === 'SDEJT' ? 'bg-amber-900/60 text-amber-300 border border-amber-700/60' :
                selectedEscola.tipo.includes('ESG') ? 'bg-blue-900/60 text-blue-300 border border-blue-700/60' :
                  selectedEscola.tipo === 'EB' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60' :
                    'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                {selectedEscola.tipo === 'SDEJT' ? 'Nível Distrital' : `Tipologia: ${selectedEscola.tipo}`}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Nome Abreviado:</span>
                <span className="text-white font-semibold">{selectedEscola.nomeAbreviado}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Código da Escola (COD):</span>
                <span className="text-blue-300 font-mono font-bold">{selectedEscola.codigoMEC || 'S/N'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Zona Pedagógica (ZIP):</span>
                <span className="text-white font-semibold">{selectedEscola.nomeZIP || 'Sede'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Acesso Permitido:</span>
                <span className="text-emerald-400 font-bold">
                  {selectedEscola.tipo === 'SDEJT' ? 'Total (Distrital)' : `Módulos de ${selectedEscola.tipo}`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Botão de Entrar com Efeito Flutuante */}
        <button
          onClick={handleEntrar}
          className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-blue-900/50 text-sm sm:text-base cursor-pointer transform hover:-translate-y-0.5 transition-all duration-200"
        >
          <span>Entrar no Sistema</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Modal de Autenticação Segura do SDEJT */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                <Lock size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Autenticação do Administrador SDEJT
                </h3>
                <p className="text-xs text-slate-400">
                  Acesso Restrito à Direcção Distrital e Chefias
                </p>
              </div>
            </div>

            <form onSubmit={handleVerificarSenhaSDEJT} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Digite a Senha / Código de Acesso:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Código do Administrador..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <span className="block text-[11px] text-slate-400 mt-1.5">
                  Código padrão inicial: <strong className="text-blue-300 font-mono">SDEJT012345</strong>
                </span>
              </div>

              {authError && (
                <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-900/40 cursor-pointer disabled:opacity-50"
                >
                  {authLoading ? 'Verificando...' : 'Entrar no Painel SDEJT'}
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rodapé */}
      <div className="max-w-4xl mx-auto w-full text-center text-slate-500 text-[11px] mt-6 z-10">
        Governo do Distrito de Inhassoro • Província de Inhambane • Ministério da Educação e Desenvolvimento Humano
      </div>
    </div>
  );
}
