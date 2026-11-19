import React, { useState, useEffect } from 'react';
import { 
  School, Users, Clock, AlertTriangle, CheckCircle2, ChevronRight, Layers, 
  ArrowUpRight, Calendar, Lock, Key, RefreshCw, Send, ArrowRightLeft, 
  ShieldCheck, AlertCircle, Edit3, Save, UserCheck, Briefcase, FileSpreadsheet,
  Check, Info, Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function DashboardSDEJT({ ano, onSelectEscola }) {
  const [activeSubTab, setActiveSubTab] = useState('geral');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configurações do Sistema
  const [config, setConfig] = useState(null);
  const [periodo, setPeriodo] = useState({
    estado: 'ABERTO',
    inicio: '2026-01-05',
    fim: '2026-03-31'
  });
  const [estruturaSDEJT, setEstruturaSDEJT] = useState({
    directorDistrital: { cargo: 'Director dos Serviços Distritais de Educação, Juventude e Tecnologia', nome: 'Director Distrital de Educação', contacto: '840000000' },
    chefeRRH: { cargo: 'Chefe da Repartição de Recursos Humanos (RRH)', nome: 'Chefe da Repartição RRH', contacto: '840000001' },
    chefeREG: { cargo: 'Chefe da Repartição de Educação Geral (REG)', nome: 'Chefe da Repartição REG', contacto: '840000002' },
    chefeRAP: { cargo: 'Chefe da Repartição de Administração e Planeamento (RAP)', nome: 'Chefe da Repartição RAP', contacto: '840000003' },
    chefeRETP: { cargo: 'Chefe da Repartição de Educação Técnico-Profissional (RETP)', nome: 'Chefe da Repartição RETP', contacto: '840000004' }
  });

  // Estados de Transição de Ano Lectivo (Roll-over)
  const [transAnoOrigem, setTransAnoOrigem] = useState(ano);
  const [transAnoDestino, setTransAnoDestino] = useState(ano + 1);
  const [transLoading, setTransLoading] = useState(false);
  const [transMessage, setTransMessage] = useState('');
  const [transError, setTransError] = useState('');

  // Estados de Transferência de FAEs
  const [escolas, setEscolas] = useState([]);
  const [tipoFAETransf, setTipoFAETransf] = useState('DOCENTE');
  const [faesOrigem, setFaesOrigem] = useState([]);
  const [selectedEscolaOrigem, setSelectedEscolaOrigem] = useState('');
  const [selectedFAEId, setSelectedFAEId] = useState('');
  const [selectedEscolaDestino, setSelectedEscolaDestino] = useState('');
  const [despachoTransf, setDespachoTransf] = useState('');
  const [transfLoading, setTransfLoading] = useState(false);
  const [transfMessage, setTransfMessage] = useState('');
  const [transfError, setTransfError] = useState('');
  const [historicoTransferencias, setHistoricoTransferencias] = useState([]);

  // Estados de Alteração de Senha
  const [novaSenhaAdmin, setNovaSenhaAdmin] = useState('');
  const [confirmaSenhaAdmin, setConfirmaSenhaAdmin] = useState('');
  const [senhaMestre, setSenhaMestre] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState('');
  const [pwdError, setPwdError] = useState('');

  // Edição das Chefias do SDEJT
  const [editandoChefias, setEditandoChefias] = useState(false);
  const [chefiasSalvasMsg, setChefiasSalvasMsg] = useState('');

  useEffect(() => {
    loadAllData();
  }, [ano]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resumo, cfg, escList, hist] = await Promise.all([
        api.getDistritoResumo(ano),
        api.getConfiguracoes(),
        api.getEscolas(),
        api.getTransferencias(ano)
      ]);
      setData(resumo);
      setConfig(cfg);
      if (cfg?.periodo) setPeriodo(cfg.periodo);
      if (cfg?.estruturaSDEJT && Object.keys(cfg.estruturaSDEJT).length > 0) {
        setEstruturaSDEJT(cfg.estruturaSDEJT);
      }
      setEscolas(escList || []);
      setHistoricoTransferencias(hist || []);
    } catch (err) {
      console.error('Erro ao carregar dados do SDEJT:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar FAEs quando a escola de origem for selecionada
  useEffect(() => {
    async function loadFaes() {
      if (!selectedEscolaOrigem) {
        setFaesOrigem([]);
        return;
      }
      try {
        if (tipoFAETransf === 'DOCENTE') {
          const docs = await api.getDocentes(selectedEscolaOrigem, ano);
          setFaesOrigem(docs || []);
        } else {
          const nds = await api.getFuncionarios(selectedEscolaOrigem, ano);
          setFaesOrigem(nds || []);
        }
      } catch (err) {
        console.error('Erro ao listar FAEs da escola:', err);
      }
    }
    loadFaes();
  }, [selectedEscolaOrigem, tipoFAETransf, ano]);

  // Salvar Configurações de Prazo/Período
  const handleSalvarPeriodo = async () => {
    try {
      await api.salvarConfiguracoes({ periodo });
      alert('Prazo e estado do período de submissão atualizados com sucesso!');
    } catch (err) {
      alert('Erro ao atualizar prazos: ' + err.message);
    }
  };

  // Salvar Chefias do SDEJT
  const handleSalvarChefias = async () => {
    try {
      await api.salvarConfiguracoes({ estruturaSDEJT });
      setEditandoChefias(false);
      setChefiasSalvasMsg('Estrutura de Direcção e Chefias do SDEJT atualizada!');
      setTimeout(() => setChefiasSalvasMsg(''), 4000);
    } catch (err) {
      alert('Erro ao guardar chefias: ' + err.message);
    }
  };

  // Executar Transição de Ano Lectivo (Roll-over)
  const handleExecutarTransicao = async () => {
    if (!window.confirm(`Confirma a transição inteligente de todos os docentes e funcionários do Ano ${transAnoOrigem} para o Ano ${transAnoDestino}? As turmas e cargas serão zeradas para nova atribuição no ano letivo de destino.`)) {
      return;
    }
    setTransLoading(true);
    setTransMessage('');
    setTransError('');
    try {
      const res = await api.transicaoAnoLectivo(transAnoOrigem, transAnoDestino);
      setTransMessage(res.message);
    } catch (err) {
      setTransError(err.message || 'Erro durante a transição');
    } finally {
      setTransLoading(false);
    }
  };

  // Executar Transferência de FAE
  const handleExecutarTransferencia = async (e) => {
    e.preventDefault();
    if (!selectedFAEId || !selectedEscolaDestino) {
      setTransfError('Selecione o funcionário e a escola de destino!');
      return;
    }
    if (selectedEscolaOrigem === selectedEscolaDestino) {
      setTransfError('A escola de destino não pode ser igual à escola de origem!');
      return;
    }

    setTransfLoading(true);
    setTransfMessage('');
    setTransfError('');

    try {
      const res = await api.transferirFAE({
        tipoFAE: tipoFAETransf,
        idRegistroFAE: selectedFAEId,
        idEscolaOrigem: selectedEscolaOrigem,
        idEscolaDestino: selectedEscolaDestino,
        anoLectivo: ano,
        despacho: despachoTransf
      });
      setTransfMessage(res.message);
      setSelectedFAEId('');
      setDespachoTransf('');
      // Recarregar histórico e FAEs
      const hist = await api.getTransferencias(ano);
      setHistoricoTransferencias(hist || []);
    } catch (err) {
      setTransfError(err.message || 'Erro ao efetuar transferência');
    } finally {
      setTransfLoading(false);
    }
  };

  // Alterar Senha do Administrador com Senha Mestre
  const handleAlterarSenhaAdmin = async (e) => {
    e.preventDefault();
    if (novaSenhaAdmin.length < 6) {
      setPwdError('A nova senha deve ter no mínimo 6 caracteres!');
      return;
    }
    if (novaSenhaAdmin !== confirmaSenhaAdmin) {
      setPwdError('A confirmação da nova senha não coincide!');
      return;
    }
    if (!senhaMestre) {
      setPwdError('É obrigatório introduzir a Chave Mestre de Segurança!');
      return;
    }

    setPwdLoading(true);
    setPwdMessage('');
    setPwdError('');

    try {
      const res = await api.alterarSenhaSDEJT(novaSenhaAdmin, senhaMestre);
      setPwdMessage(res.message);
      setNovaSenhaAdmin('');
      setConfirmaSenhaAdmin('');
      setSenhaMestre('');
    } catch (err) {
      setPwdError(err.message || 'Erro ao alterar a senha');
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 text-xs animate-pulse">
        Carregando painel executivo do SDEJT Inhassoro...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Topo Oficial com Cores Moçambicanas & Efeito Flutuante */}
      <div className="card p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border border-slate-700 shadow-xl relative overflow-hidden">
        {/* Faixa decorativa com as cores da Bandeira Nacional: Verde, Vermelho, Amarelo */}
        <div className="absolute top-0 left-0 right-0 h-1.5 flex">
          <div className="w-1/3 bg-emerald-600" />
          <div className="w-1/3 bg-amber-400" />
          <div className="w-1/3 bg-red-600" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-1">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-lg p-1.5 transform hover:scale-105 transition-all">
              <img src="/emblema.png" alt="Emblema Nacional" className="w-full h-full object-contain filter drop-shadow-md" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  SEDE DISTRITAL • COD: SEDE-01
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Ano Lectivo {ano}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                  periodo.estado === 'ABERTO' ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400' :
                  periodo.estado === 'PRORROGADO' ? 'bg-amber-500/30 text-amber-200 border-amber-400' :
                  'bg-red-500/30 text-red-200 border-red-400'
                }`}>
                  Período de Submissão: {periodo.estado}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white uppercase drop-shadow-sm">
                Serviço Distrital de Educação, Juventude e Tecnologia de Inhassoro
              </h1>
              <p className="text-slate-300 text-xs mt-1">
                Gabinete do Director Distrital & Chefias das 4 Repartições (RRH, REG, RAP, RETP) • Controlo Total das 56 Escolas e 16 ZIPs
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Sub-Navegação Executiva do SDEJT */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('geral')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'geral'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers size={14} />
            Visão Geral & 16 ZIPs
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('chefias')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'chefias'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users size={14} />
            Chefias do SDEJT (RRH/REG/RAP/RETP)
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('prazos')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'prazos'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Calendar size={14} />
            Prazos & Controlo de Submissão
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('transicao')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'transicao'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <RefreshCw size={14} />
            Transição Inteligente de Ano (Roll-Over)
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('transferencias')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'transferencias'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ArrowRightLeft size={14} />
            Transferência de FAEs
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('seguranca')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'seguranca'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Lock size={14} />
            Segurança & Senhas
          </button>
        </div>
      </div>

      {/* -------------------- ABA 1: VISÃO GERAL & KPIS -------------------- */}
      {activeSubTab === 'geral' && (
        <div className="space-y-6">
          {/* 4 Cards de Indicadores Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 border-l-4 border-l-blue-800 bg-white hover:-translate-y-1 transition-transform duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Escolas Monitoradas</span>
                <div className="p-2.5 bg-blue-50 text-blue-800 rounded-xl"><School size={18} /></div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{data?.totalEscolas || 56}</span>
                <span className="text-xs font-semibold text-slate-500">em 16 ZIPs</span>
              </div>
            </div>

            <div className="card p-5 border-l-4 border-l-slate-700 bg-white hover:-translate-y-1 transition-transform duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Docentes em Exercício</span>
                <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl"><Users size={18} /></div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{data?.totalDocentes || 0}</span>
                <span className="text-xs font-semibold text-slate-500">professores</span>
              </div>
            </div>

            <div className="card p-5 border-l-4 border-l-emerald-600 bg-white hover:-translate-y-1 transition-transform duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Carga Horária Distrital</span>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Clock size={18} /></div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{data?.totalHoras || 0} h</span>
                <span className="text-xs font-semibold text-slate-500">({data?.totalHL || 0}h lectivas)</span>
              </div>
            </div>

            <div className="card p-5 border-l-4 border-l-amber-500 bg-white hover:-translate-y-1 transition-transform duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Horas Extras Distritais</span>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle size={18} /></div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-600">{data?.totalHE || 0} h</span>
                <span className="text-xs font-semibold text-slate-500">a liquidar</span>
              </div>
            </div>
          </div>

          {/* Tabela das 16 ZIPs */}
          <div className="card overflow-hidden shadow-sm border border-slate-200">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Quadro Consolidado das 16 ZIPs de Inhassoro</h3>
                <p className="text-slate-500 text-xs">Acompanhamento e carga atribuída por zona de influência pedagógica</p>
              </div>
              <span className="badge badge-green text-[10px]">Atualização em Tempo Real</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <th className="py-3 px-3 w-16 text-center">ZIP Nº</th>
                    <th className="py-3 px-4 min-w-[180px]">Designação da ZIP</th>
                    <th className="py-3 px-4 min-w-[200px]">Escola Sede da ZIP</th>
                    <th className="py-3 px-3 text-center">Escolas</th>
                    <th className="py-3 px-3 text-center">Docentes</th>
                    <th className="py-3 px-3 text-center">Carga Total</th>
                    <th className="py-3 px-3 text-center">Horas Extras</th>
                    <th className="py-3 px-4 text-right">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {data?.resumoZIPs?.map((z) => (
                    <tr key={z.idZip} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-700 text-center">#{z.idZip}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{z.nomeZIP}</td>
                      <td className="py-3 px-4 text-slate-600">{z.sedeAbreviada}</td>
                      <td className="py-3 px-3 text-center font-bold text-blue-900">{z.escolas}</td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-800">{z.docentes}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-900">{z.horas}h</td>
                      <td className="py-3 px-3 text-center">
                        <span className={z.horasExtras > 0 ? "font-bold text-amber-600" : "text-slate-400"}>
                          {z.horasExtras}h
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {z.docentes > 0 ? (
                          <span className="badge badge-green inline-flex items-center gap-1">
                            <CheckCircle2 size={11} /> Regular
                          </span>
                        ) : (
                          <span className="badge badge-yellow">Sem registos</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- ABA 2: ESTRUTURA DE CHEFIAS DO SDEJT -------------------- */}
      {activeSubTab === 'chefias' && (
        <div className="card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="text-blue-800" size={20} />
                Estrutura de Direcção e Chefias do SDEJT de Inhassoro
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                O SDEJT é o órgão de supervisão distrital, composto pelo Director Distrital e Chefes das 4 Repartições
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!editandoChefias ? (
                <button
                  type="button"
                  onClick={() => setEditandoChefias(true)}
                  className="btn-primary text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Edit3 size={15} />
                  Editar Nomes e Contactos
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditandoChefias(false)}
                    className="btn-secondary text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSalvarChefias}
                    className="btn-primary text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Save size={15} />
                    Salvar Chefias
                  </button>
                </div>
              )}
            </div>
          </div>

          {chefiasSalvasMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              {chefiasSalvasMsg}
            </div>
          )}

          {/* Cartão de Destaque: Director Distrital */}
          <div className="p-5 bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-2xl shadow-md border border-blue-800">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950 inline-block mb-2">
              Autoridade Máxima Distrital
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <h3 className="text-base font-bold text-white">
                  Director(a) dos Serviços Distritais de Educação, Juventude e Tecnologia
                </h3>
                <p className="text-slate-300 text-xs mt-0.5">
                  Gabinete de Coordenação Executiva Distrital
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-[11px]">Nome Completo:</label>
                  {editandoChefias ? (
                    <input
                      type="text"
                      value={estruturaSDEJT.directorDistrital?.nome || ''}
                      onChange={(e) => setEstruturaSDEJT({
                        ...estruturaSDEJT,
                        directorDistrital: { ...estruturaSDEJT.directorDistrital, nome: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs"
                    />
                  ) : (
                    <span className="font-bold text-white text-sm block">
                      {estruturaSDEJT.directorDistrital?.nome || 'Director Distrital de Educação'}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-[11px]">Contacto Telefónico:</label>
                  {editandoChefias ? (
                    <input
                      type="text"
                      value={estruturaSDEJT.directorDistrital?.contacto || ''}
                      onChange={(e) => setEstruturaSDEJT({
                        ...estruturaSDEJT,
                        directorDistrital: { ...estruturaSDEJT.directorDistrital, contacto: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs"
                    />
                  ) : (
                    <span className="font-mono text-amber-300 font-semibold text-xs block">
                      {estruturaSDEJT.directorDistrital?.contacto || '84xxxxxxx'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4 Repartições Oficiais do SDEJT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Repartição 1: RRH */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px]">
                    RRH
                  </div>
                  Repartição de Recursos Humanos
                </span>
                <span className="badge badge-blue text-[10px]">Docentes & CTA</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Chefe da Repartição:</label>
                  {editandoChefias ? (
                    <input
                      type="text"
                      value={estruturaSDEJT.chefeRRH?.nome || ''}
                      onChange={(e) => setEstruturaSDEJT({
                        ...estruturaSDEJT,
                        chefeRRH: { ...estruturaSDEJT.chefeRRH, nome: e.target.value }
                      })}
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                    />
                  ) : (
                    <span className="font-bold text-slate-900 block">{estruturaSDEJT.chefeRRH?.nome}</span>
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Contacto:</label>
                  {editandoChefias ? (
                    <input
                      type="text"
                      value={estruturaSDEJT.chefeRRH?.contacto || ''}
                      onChange={(e) => setEstruturaSDEJT({
                        ...estruturaSDEJT,
                        chefeRRH: { ...estruturaSDEJT.chefeRRH, contacto: e.target.value }
                      })}
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                    />
                  ) : (
                    <span className="font-mono text-slate-700 font-semibold block">{estruturaSDEJT.chefeRRH?.contacto}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Repartição 2: REG */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                    REG
                  </div>
                  Repartição de Educação Geral
                </span>
                <span className="badge badge-green text-[10px]">Pedagógico & Currículo</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Chefe da Repartição:</label>
                  {editandoChefias ? (
                    <input
                      type="text"
                      value={estruturaSDEJT.chefeREG?.nome || ''}
                      onChange={(e) => setEstruturaSDEJT({
                        ...estruturaSDEJT,
                        chefeREG: { ...estruturaSDEJT.chefeREG, nome: e.target.value }
                      })}
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                    />
                  ) : (
                    <span className="font-bold text-slate-900 block">{estruturaSDEJT.chefeREG?.nome}</span>
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Contacto:</label>
                  {editandoChefias ? (
                    <input
                      type="text"
                      value={estruturaSDEJT.chefeREG?.contacto || ''}
                      onChange={(e) => setEstruturaSDEJT({
                        ...estruturaSDEJT,
                        chefeREG: { ...estruturaSDEJT.chefeREG, contacto: e.target.value }
                      })}
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                    />
                  ) : (
                    <span className="font-mono text-slate-700 font-semibold block">{estruturaSDEJT.chefeREG?.contacto}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Repartição 3: RAP */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">
                    RAP
                  </div>
                  Repartição de Administração e Planeamento
                </span>
                <span className="badge badge-yellow text-[10px]">Logística & Orçamento</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Chefe da Repartição:</label>
                  {editandoChefias ? (
                    <input
                      type="text"
                      value={estruturaSDEJT.chefeRAP?.nome || ''}
                      onChange={(e) => setEstruturaSDEJT({
                        ...estruturaSDEJT,
                        chefeRAP: { ...estruturaSDEJT.chefeRAP, nome: e.target.value }
                      })}
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                    />
                  ) : (
                    <span className="font-bold text-slate-900 block">{estruturaSDEJT.chefeRAP?.nome}</span>
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Contacto:</label>
                  {editandoChefias ? (
                    <input
                      type="text"
                      value={estruturaSDEJT.chefeRAP?.contacto || ''}
                      onChange={(e) => setEstruturaSDEJT({
                        ...estruturaSDEJT,
                        chefeRAP: { ...estruturaSDEJT.chefeRAP, contacto: e.target.value }
                      })}
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                    />
                  ) : (
                    <span className="font-mono text-slate-700 font-semibold block">{estruturaSDEJT.chefeRAP?.contacto}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Repartição 4: RETP */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px]">
                    RETP
                  </div>
                  Repartição de Ed. Técnico-Profissional
                </span>
                <span className="badge badge-slate text-[10px]">Institutos & Cursos</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Chefe da Repartição:</label>
                  {editandoChefias ? (
                    <input
                      type="text"
                      value={estruturaSDEJT.chefeRETP?.nome || ''}
                      onChange={(e) => setEstruturaSDEJT({
                        ...estruturaSDEJT,
                        chefeRETP: { ...estruturaSDEJT.chefeRETP, nome: e.target.value }
                      })}
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                    />
                  ) : (
                    <span className="font-bold text-slate-900 block">{estruturaSDEJT.chefeRETP?.nome}</span>
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Contacto:</label>
                  {editandoChefias ? (
                    <input
                      type="text"
                      value={estruturaSDEJT.chefeRETP?.contacto || ''}
                      onChange={(e) => setEstruturaSDEJT({
                        ...estruturaSDEJT,
                        chefeRETP: { ...estruturaSDEJT.chefeRETP, contacto: e.target.value }
                      })}
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                    />
                  ) : (
                    <span className="font-mono text-slate-700 font-semibold block">{estruturaSDEJT.chefeRETP?.contacto}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- ABA 3: PRAZOS & CONTROLO DE SUBMISSÃO -------------------- */}
      {activeSubTab === 'prazos' && (
        <div className="card p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="text-blue-800" size={20} />
              Controlo de Prazos e Período de Registo da Carga Horária
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Defina as datas oficiais e o estado da submissão. Quando encerrado, as escolas só podem consultar em modo de leitura.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Estado do Período de Submissão:
              </label>
              <select
                value={periodo.estado}
                onChange={(e) => setPeriodo({ ...periodo, estado: e.target.value })}
                className={`w-full text-xs font-bold border rounded-xl px-3.5 py-2.5 ${
                  periodo.estado === 'ABERTO' ? 'bg-emerald-50 border-emerald-400 text-emerald-900' :
                  periodo.estado === 'PRORROGADO' ? 'bg-amber-50 border-amber-400 text-amber-900' :
                  'bg-red-50 border-red-400 text-red-900'
                }`}
              >
                <option value="ABERTO">🟢 ABERTO (Escolas podem cadastrar e editar)</option>
                <option value="PRORROGADO">🟡 PRORROGADO (Prazo estendido pelo SDEJT)</option>
                <option value="ENCERRADO">🔴 ENCERRADO (Bloqueio total de edição para escolas)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Data Oficial de Abertura:
              </label>
              <input
                type="date"
                value={periodo.inicio}
                onChange={(e) => setPeriodo({ ...periodo, inicio: e.target.value })}
                className="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Data Limite de Encerramento:
              </label>
              <input
                type="date"
                value={periodo.fim}
                onChange={(e) => setPeriodo({ ...periodo, fim: e.target.value })}
                className="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <Info size={16} className="text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Impacto da alteração de estado:</span>
              <span>
                Ao selecionar <strong>ENCERRADO</strong>, nenhuma escola primária, básica ou secundária poderá criar ou alterar docentes ou funcionários. O SDEJT mantém sempre o controlo administrativo direto.
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSalvarPeriodo}
              className="btn-primary text-xs flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Save size={15} />
              Guardar Prazos e Estado de Submissão
            </button>
          </div>
        </div>
      )}

      {/* -------------------- ABA 4: TRANSIÇÃO INTELIGENTE DE ANO (ROLL-OVER) -------------------- */}
      {activeSubTab === 'transicao' && (
        <div className="card p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="text-blue-800" size={20} />
              Transição Inteligente de Ano Lectivo (Roll-over Automático)
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Evita recadastrar docentes e funcionários no novo ano. O sistema importa todos os registos mantendo vínculos e dados cadastrais, mas com as <strong>cargas horárias zeradas</strong> para nova atribuição.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                1. Ano Lectivo de Origem (Base Existente):
              </label>
              <input
                type="number"
                min="2025"
                max="2100"
                value={transAnoOrigem}
                onChange={(e) => setTransAnoOrigem(Number(e.target.value))}
                className="w-full text-xs font-bold border border-slate-300 rounded-lg px-3 py-2 bg-white"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Ano de onde os professores e funcionários serão lidos
              </span>
            </div>

            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl">
              <label className="block text-xs font-bold text-blue-900 mb-1.5">
                2. Ano Lectivo de Destino (Novo Ano Escolar):
              </label>
              <input
                type="number"
                min="2025"
                max="2100"
                value={transAnoDestino}
                onChange={(e) => setTransAnoDestino(Number(e.target.value))}
                className="w-full text-xs font-bold border border-blue-400 rounded-lg px-3 py-2 bg-white text-blue-950"
              />
              <span className="text-[11px] text-blue-700 mt-1 block">
                Ano novo que receberá os efectivos com carga zerada
              </span>
            </div>
          </div>

          {transMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2.5 shadow-xs">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{transMessage}</span>
            </div>
          )}

          {transError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-900 text-xs font-bold rounded-xl flex items-center gap-2.5 shadow-xs">
              <AlertCircle size={18} className="text-red-600 shrink-0" />
              <span>{transError}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Esta operação não substitui docentes já cadastrados no ano de destino.
            </span>
            <button
              type="button"
              disabled={transLoading}
              onClick={handleExecutarTransicao}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {transLoading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  Importando Efectivos...
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Executar Transição para {transAnoDestino}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* -------------------- ABA 5: TRANSFERÊNCIA DE FAES E NOTIFICAÇÕES -------------------- */}
      {activeSubTab === 'transferencias' && (
        <div className="space-y-6">
          <div className="card p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="text-blue-800" size={20} />
                Transferência de Funcionários e Agentes do Estado (FAEs)
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Transfira docentes ou funcionários não docentes entre as escolas de Inhassoro. A escola receptora recebe <strong>notificação automática imediata</strong> para alocação de horários ou funções.
              </p>
            </div>

            <form onSubmit={handleExecutarTransferencia} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Tipo de FAE */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Funcionário:</label>
                  <select
                    value={tipoFAETransf}
                    onChange={(e) => {
                      setTipoFAETransf(e.target.value);
                      setSelectedFAEId('');
                    }}
                    className="w-full text-xs font-bold border border-slate-300 rounded-lg px-3 py-2 bg-slate-50"
                  >
                    <option value="DOCENTE">Professor (Docente)</option>
                    <option value="NAO_DOCENTE">Funcionário Não Docente (CTA)</option>
                  </select>
                </div>

                {/* Escola de Origem */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Escola de Origem (Actual):</label>
                  <select
                    value={selectedEscolaOrigem}
                    onChange={(e) => {
                      setSelectedEscolaOrigem(e.target.value);
                      setSelectedFAEId('');
                    }}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 bg-slate-50"
                  >
                    <option value="">-- Selecione a Escola de Origem --</option>
                    {escolas.map(e => (
                      <option key={e.id} value={e.id}>[{e.tipo}] {e.nomeAbreviado}</option>
                    ))}
                  </select>
                </div>

                {/* Funcionário a Transferir */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Funcionário / Docente:
                  </label>
                  <select
                    disabled={!selectedEscolaOrigem}
                    value={selectedFAEId}
                    onChange={(e) => setSelectedFAEId(e.target.value)}
                    className="w-full text-xs font-semibold border border-blue-400 rounded-lg px-3 py-2 bg-white text-blue-950 disabled:bg-slate-100 disabled:border-slate-200"
                  >
                    <option value="">-- Selecione o Funcionário ({faesOrigem.length} listados) --</option>
                    {faesOrigem.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.nomeCompleto} {f.nuit ? `(NUIT: ${f.nuit})` : ''} - {f.disciplinas || f.cargoFuncao}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Escola de Destino */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nova Escola de Afectação (Destino):</label>
                  <select
                    value={selectedEscolaDestino}
                    onChange={(e) => setSelectedEscolaDestino(e.target.value)}
                    className="w-full text-xs font-bold border border-emerald-400 rounded-lg px-3 py-2 bg-white text-emerald-950"
                  >
                    <option value="">-- Selecione a Escola de Destino --</option>
                    {escolas.filter(e => String(e.id) !== String(selectedEscolaOrigem)).map(e => (
                      <option key={e.id} value={e.id}>[{e.tipo}] {e.nomeAbreviado} (COD: {e.codigoMEC || 'S/N'})</option>
                    ))}
                  </select>
                </div>

                {/* Despacho ou Justificação */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nº do Despacho / Fundamentação:</label>
                  <input
                    type="text"
                    value={despachoTransf}
                    onChange={(e) => setDespachoTransf(e.target.value)}
                    placeholder="ex: Despacho nº 42/SDEJT/2026 de 15 de Fevereiro"
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              {transfMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  {transfMessage}
                </div>
              )}

              {transfError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-900 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600" />
                  {transfError}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={transfLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Send size={15} />
                  {transfLoading ? 'Processando Transferência...' : 'Efectuar Transferência e Notificar Destino'}
                </button>
              </div>
            </form>
          </div>

          {/* Histórico de Transferências Registadas */}
          <div className="card overflow-hidden shadow-sm border border-slate-200">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Registo Oficial de Transferências do Ano Lectivo {ano}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-4">Nome do FAE</th>
                    <th className="py-2.5 px-3">Origem</th>
                    <th className="py-2.5 px-3">Destino</th>
                    <th className="py-2.5 px-4">Despacho</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {historicoTransferencias.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        Nenhuma transferência registada no presente ano lectivo.
                      </td>
                    </tr>
                  ) : (
                    historicoTransferencias.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-slate-600 font-mono">{t.dataTransferencia}</td>
                        <td className="py-2.5 px-3 font-semibold text-blue-900">{t.tipoFAE}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{t.nomeFAE}</td>
                        <td className="py-2.5 px-3 text-slate-600">{t.nomeEscolaOrigem || `#${t.idEscolaOrigem}`}</td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-800">{t.nomeEscolaDestino || `#${t.idEscolaDestino}`}</td>
                        <td className="py-2.5 px-4 text-slate-500 italic">{t.despacho || 'Sem despacho especificado'}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="badge badge-green text-[10px]">Concluída</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- ABA 6: SEGURANÇA & ALTERAÇÃO DE SENHA -------------------- */}
      {activeSubTab === 'seguranca' && (
        <div className="card p-6 space-y-6 max-w-2xl mx-auto">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="text-blue-800" size={22} />
              Gestão de Acesso e Alteração de Senha do Administrador SDEJT
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Por segurança, a alteração da senha do Administrador exige a validação prévia da <strong>Chave Mestre de Segurança</strong>.
            </p>
          </div>

          <form onSubmit={handleAlterarSenhaAdmin} className="space-y-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Informação de Acesso Atual:</span>
              <div className="text-xs text-slate-600">
                Código de entrada inicial padrão: <strong className="font-mono text-blue-900">SDEJT012345</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nova Senha do Administrador SDEJT *
              </label>
              <input
                type="password"
                required
                value={novaSenhaAdmin}
                onChange={(e) => setNovaSenhaAdmin(e.target.value)}
                placeholder="Introduza a nova senha (mínimo 6 caracteres)..."
                className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirmar a Nova Senha *
              </label>
              <input
                type="password"
                required
                value={confirmaSenhaAdmin}
                onChange={(e) => setConfirmaSenhaAdmin(e.target.value)}
                placeholder="Repita a nova senha..."
                className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white font-mono"
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                <Key size={14} className="text-amber-600" />
                Chave Mestre de Segurança (Obrigatória para autorizar a troca) *
              </label>
              <input
                type="password"
                required
                value={senhaMestre}
                onChange={(e) => setSenhaMestre(e.target.value)}
                placeholder="Introduza a Chave Mestre de Segurança..."
                className="w-full text-xs border border-amber-300 rounded-xl px-3.5 py-2.5 bg-amber-50/50 focus:bg-white font-mono text-amber-950"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Chave Mestre oficial atribuída ao responsável técnico do sistema.
              </span>
            </div>

            {pwdMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                {pwdMessage}
              </div>
            )}

            {pwdError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-900 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="text-red-600 shrink-0" />
                {pwdError}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={pwdLoading}
                className="btn-primary text-xs flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                <Lock size={15} />
                {pwdLoading ? 'A validar...' : 'Validar Chave Mestre e Actualizar Senha'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
