import React, { useState, useEffect } from 'react';
import {
  Menu, X, Building2, Calendar, LogOut, LayoutDashboard, School, Users,
  FileSpreadsheet, FileText, Download, UploadCloud, Settings, BookOpen,
  BarChart3, ChevronRight, Briefcase, Bell, CheckCircle2, AlertCircle, Info,
  ShieldCheck, Award
} from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({ escola, ano, activeTab, setActiveTab, onSair }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [notificacoesAberto, setNotificacoesAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const [periodoEstado, setPeriodoEstado] = useState('ABERTO');

  const isSDEJT = escola?.tipo === 'SDEJT';
  const isEP = escola?.tipo === 'EP';
  const isEB = escola?.tipo === 'EB';
  const isESG = escola?.tipo?.includes('ESG') || escola?.tipo === 'ETP';

  // Carregar notificações e prazo
  useEffect(() => {
    async function loadAlerts() {
      try {
        const [notifs, cfg] = await Promise.all([
          api.getNotificacoes(escola?.id, ano),
          api.getConfiguracoes()
        ]);
        setNotificacoes(notifs || []);
        if (cfg?.periodo?.estado) {
          setPeriodoEstado(cfg.periodo.estado);
        }
      } catch (e) {
        console.error('Erro ao carregar notificações:', e);
      }
    }
    loadAlerts();
  }, [escola?.id, ano]);

  const unreadCount = notificacoes.filter(n => !n.lida).length;

  const handleMarcarLida = async (id) => {
    try {
      await api.marcarNotificacaoLida(id);
      setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: 1 } : n));
    } catch (e) {
      console.error(e);
    }
  };

  // Menus dinâmicos por tipologia
  const getMenuItems = () => {
    if (isSDEJT) {
      return [
        { id: 'dashboard', label: '1. Painel Executivo Distrital', desc: '16 ZIPs, Prazos, Transferências e Senha', icon: LayoutDashboard },
        { id: 'auditoria', label: '2. Auditoria de Conformidade Legal', desc: 'Alertas em tempo real, sobrecargas e NUIT', icon: ShieldCheck },
        { id: 'escolas', label: '3. Catálogo Oficial das 56 Escolas', desc: 'Edição cadastral e nomes oficiais', icon: School },
        { id: 'matriz', label: '4. Plano Curricular & Matriz (MINEDH)', desc: 'Carga horária e recálculo automático', icon: BookOpen },
        { id: 'docentes_all', label: '5. Repositório Central de Docentes', desc: 'Professores de todo o distrito unificados', icon: Users },
        { id: 'funcionarios_nd', label: '6. Efectivo Não Docente Distrital', desc: 'Corpo Técnico Administrativo (CTA)', icon: Briefcase },
        { id: 'resumo', label: '7. Resumo Estatístico Distrital', desc: 'Gráficos de barras, circulares e síntese', icon: BarChart3 },
        { id: 'exportador', label: '8. Boletim & Mapas Oficiais', desc: 'Exportação Word e Excel com 1 clique', icon: Download },
        { id: 'importar_lote', label: '9. Importador em Lote', desc: 'Carregamento de pastas escolares', icon: UploadCloud }
      ];
    }

    if (isEP) {
      return [
        { id: 'menu_escola', label: '1. Menu Principal da Escola', desc: 'Fachada, Direcção, alunos e turmas', icon: School },
        { id: 'indicadores', label: '2. Indicadores & Rácios Oficiais', desc: 'Rácio Aluno/Prof, Aluno/Turma e Duplo Turno', icon: Award },
        { id: 'docentes_ep', label: '3. Cadastro de Docentes EP', desc: 'Monodocência, Turmas Mistas e Turnos', icon: Users },
        { id: 'funcionarios_nd', label: '4. Funcionários Não Docentes', desc: 'CTA, secretarias, guardas e auxiliares', icon: Briefcase },
        { id: 'resumo', label: '5. Resumo Estatístico & Gráficos', desc: 'Gráficos circulares, barras e rácios', icon: BarChart3 },
        { id: 'mapa_ep', label: '6. Mapa Oficial 1.1 e 2.1 EP', desc: 'Distribuição de turmas e necessidades', icon: FileSpreadsheet },
        { id: 'exportador', label: '7. Exportar Word e Excel', desc: 'Emissão oficial para homologação', icon: Download }
      ];
    }

    if (isEB) {
      return [
        { id: 'menu_escola', label: '1. Menu Principal da Escola', desc: 'Fachada, Direcção, alunos e turmas', icon: School },
        { id: 'indicadores', label: '2. Indicadores & Rácios Oficiais', desc: 'Rácio Aluno/Prof, Aluno/Turma e Duplo Turno', icon: Award },
        { id: 'docentes_ep', label: '3. Docentes Primário (1ª à 6ª)', desc: 'Monodocência, Turmas Mistas e Turnos', icon: Users },
        { id: 'docentes_es', label: '4. Docentes Secundário (7ª à 9ª)', desc: 'Disciplinas, turmas e cargos de gestão', icon: BookOpen },
        { id: 'funcionarios_nd', label: '5. Funcionários Não Docentes', desc: 'CTA, secretarias, guardas e auxiliares', icon: Briefcase },
        { id: 'resumo', label: '6. Resumo Estatístico & Gráficos', desc: 'Gráficos circulares, barras e síntese', icon: BarChart3 },
        { id: 'mapa_ep', label: '7. Mapas 1.1 e 2.1 EP', desc: 'Mapas de distribuição do primário', icon: FileSpreadsheet },
        { id: 'mapa_es', label: '8. Mapas 1.3 e 2.3 ESG/EB', desc: 'Mapas de carga do ensino secundário', icon: FileSpreadsheet },
        { id: 'exportador', label: '9. Exportar Word e Excel', desc: 'Emissão de documentos homologados', icon: Download }
      ];
    }

    // ESG / ETP
    return [
      { id: 'menu_escola', label: '1. Menu Principal da Escola', desc: 'Fachada, Direcção, alunos e turmas', icon: School },
      { id: 'indicadores', label: '2. Indicadores & Rácios Oficiais', desc: 'Rácio Aluno/Prof, Aluno/Turma e Duplo Turno', icon: Award },
      { id: 'docentes_es', label: '3. Docentes & Cargas (7ª à 12ª)', desc: 'Letras (A1..An), Ciências (B1..Bn), DIR/DAP', icon: Users },
      { id: 'funcionarios_nd', label: '4. Funcionários Não Docentes', desc: 'CTA, secretarias, guardas e apoio', icon: Briefcase },
      { id: 'resumo', label: '5. Resumo Estatístico & Gráficos', desc: 'Gráficos circulares, barras e indicadores', icon: BarChart3 },
      { id: 'matriz', label: '6. Matriz Curricular Oficial', desc: 'Grelha curricular de 7ª a 12ª classes', icon: BookOpen },
      { id: 'mapa_es', label: '7. Mapa Oficial 1.3 ESG/EB', desc: 'Distribuição da carga e horas extras', icon: FileSpreadsheet },
      { id: 'mapa_m23', label: '8. Mapa 2.3 por Disciplina', desc: 'Carga horária total por disciplina', icon: FileSpreadsheet },
      { id: 'exportador', label: '9. Exportar Word e Excel', desc: 'Emissão oficial pronta a imprimir', icon: Download }
    ];
  };

  const menus = getMenuItems();
  const menuActual = menus.find(m => m.id === activeTab) || menus[0];

  const handleSelectMenu = (id) => {
    setActiveTab(id);
    setMenuAberto(false);
  };

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
        <div className="app-container flex items-center justify-between py-3">
          {/* Lado Esquerdo: Botão 3 Barras (Hamburger) + Nome da Escola */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuAberto(true)}
              className="p-2 bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white rounded-xl flex items-center gap-2 font-bold text-xs shadow-md transition-all cursor-pointer transform hover:scale-105"
              title="Abrir Menu de Navegação (3 Barras)"
              aria-label="Abrir Menu de Navegação"
            >
              <Menu size={20} />
              <span className="hidden sm:inline">MENU</span>
            </button>

            <div className="h-6 w-px bg-slate-700 hidden sm:block" />

            {/* Emblema Nacional da República de Moçambique */}
            <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-500/30 flex items-center justify-center p-0.5 shadow-sm shrink-0">
              <img src="/emblema.png" alt="Emblema Nacional" className="w-full h-full object-contain" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm md:text-base text-white tracking-tight">
                  {escola?.nomeOficial}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSDEJT ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    isESG ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      isEB ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                  {isSDEJT ? 'Sede Distrital' : escola?.tipo}
                </span>

                {/* Pill do Estado do Período */}
                <span className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${periodoEstado === 'ABERTO' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                    periodoEstado === 'PRORROGADO' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                      'bg-red-500/20 text-red-300 border-red-500/40'
                  }`}>
                  Submissão: {periodoEstado}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Secção Atual: <strong className="text-blue-400 font-semibold">{menuActual?.label}</strong>
              </p>
            </div>
          </div>

          {/* Lado Direito: Notificações, Ano e Sair */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sino de Notificações */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificacoesAberto(!notificacoesAberto)}
                className="relative p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Notificações e Avisos Oficiais"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white font-bold text-[9px] flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Popover de Notificações */}
              {notificacoesAberto && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 text-left animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                      <Bell size={13} className="text-blue-400" />
                      Notificações da Instituição ({notificacoes.length})
                    </span>
                    <button
                      onClick={() => setNotificacoesAberto(false)}
                      className="text-slate-400 hover:text-white text-xs p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notificacoes.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 text-xs">
                        Nenhuma notificação no momento.
                      </div>
                    ) : (
                      notificacoes.map(n => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl border text-xs transition-all ${n.lida
                              ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                              : 'bg-blue-950/60 border-blue-700/60 text-white shadow-xs'
                            }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-blue-200 block">{n.titulo}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {n.criadoEm ? n.criadoEm.split('T')[0] : ''}
                            </span>
                          </div>
                          <p className="text-[11px] mt-1 text-slate-300 leading-relaxed">
                            {n.mensagem}
                          </p>
                          {!n.lida && (
                            <button
                              type="button"
                              onClick={() => handleMarcarLida(n.id)}
                              className="mt-2 text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 size={12} /> Marcar como lida
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300">
              <Calendar size={13} className="text-blue-400" />
              <span>{ano}</span>
            </div>

            <button
              onClick={onSair}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              title="Trocar de Escola / Voltar ao Início"
            >
              <LogOut size={13} className="text-red-400" />
              <span className="hidden md:inline">Trocar Instituição</span>
            </button>
          </div>
        </div>
      </header>

      {/* Menu Lateral Deslizante (Gaveta / Drawer) */}
      {menuAberto && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMenuAberto(false)}
          />

          <div className="relative w-80 sm:w-96 max-w-[85vw] bg-slate-900 border-r border-slate-800 text-white flex flex-col h-full shadow-2xl z-10">
            {/* Topo da Gaveta */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-500/30 flex items-center justify-center p-1 shadow-md shrink-0">
                  <img src="/emblema.png" alt="Emblema Nacional" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-extrabold text-sm text-white tracking-tight leading-tight truncate">
                    {escola?.nomeAbreviado}
                  </h2>
                  <p className="text-[11px] text-slate-400 truncate">
                    {escola?.codigoMEC ? `COD: ${escola.codigoMEC} • ` : ''}
                    {escola?.nomeZIP ? `ZIP: ${escola.nomeZIP}` : 'Distrito de Inhassoro'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setMenuAberto(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                title="Fechar Menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Lista de Menus */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-2">
                Navegação da Instituição
              </div>

              {menus.map((m) => {
                const Icon = m.icon;
                const isActive = activeTab === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMenu(m.id)}
                    className={`w-full text-left p-3 rounded-xl flex items-start gap-3 transition-all cursor-pointer ${isActive
                      ? 'bg-blue-700 text-white font-bold shadow-md shadow-blue-900/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                  >
                    <Icon size={18} className={`mt-0.5 shrink-0 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold">{m.label}</div>
                      <div className={`text-[10px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                        {m.desc}
                      </div>
                    </div>
                    {isActive && <ChevronRight size={14} className="mt-1 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Rodapé da Gaveta */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40">
              <button
                onClick={() => {
                  setMenuAberto(false);
                  onSair();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogOut size={14} className="text-red-400" />
                Trocar de Escola / Início
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
