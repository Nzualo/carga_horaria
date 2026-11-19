import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2, 
  School, Users, Search, RefreshCw, FileText, Check, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

export default function AuditoriaConformidade({ ano, onSelectEscola }) {
  const [escolas, setEscolas] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [escList, docList] = await Promise.all([
        api.getEscolas ? api.getEscolas() : Promise.resolve([]),
        api.getTodosDocentesDistrito ? api.getTodosDocentesDistrito(ano) : Promise.resolve([])
      ]);
      setEscolas(escList || []);
      setDocentes(docList || []);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar dados de auditoria:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [ano]);

  // Auditoria Automática em Tempo Real
  const relatorioAuditoria = useMemo(() => {
    const alertas = [];

    // 1. Alerta: Docentes com mais de 2 turmas no EP
    const docentesEP = docentes.filter(d => (d.tipoEnsinoDocente || d.sub_nivel) === 'EP');
    docentesEP.forEach(d => {
      const totTurmas = (d.regimeGeral === 'DUPLO_TURNO' || (d.turma_2 && d.turma_2 !== 'Nenhuma')) ? 2 : 1;
      const totalHoras = Number(d.totalHoras || d.total_horas || 24);
      if (totalHoras > 48 || (d.turmasTexto && (d.turmasTexto.match(/Turma/g) || []).length > 2)) {
        alertas.push({
          id: `ep_turmas_${d.id || d.id_docente}`,
          tipo: 'EP_EXCESSO_TURMAS',
          nivel: 'CRITICO',
          titulo: 'Docente com Mais de 2 Turmas no EP',
          descricao: `O(A) professor(a) ${d.nomeCompleto || d.nome_docente} lecciona carga superior a 2 turmas regulares (${totalHoras}h semanais), violando o regime legal de monodocência do MINEDH.`,
          escolaId: d.idEscola || d.id_escola,
          escolaNome: d.nomeEscola || 'Escola do Distrito',
          docenteNome: d.nomeCompleto || d.nome_docente,
          nuit: d.nuit || 'Sem NUIT',
          detalhe: `${totalHoras} tempos semanais declarados`
        });
      }
    });

    // 2. Alerta: Sobrecarga excessiva (>30 tempos no Secundário sem parecer técnico)
    const docentesES = docentes.filter(d => (d.tipoEnsinoDocente || d.sub_nivel) !== 'EP');
    docentesES.forEach(d => {
      const tot = Number(d.totalHoras || d.total_horas || 0);
      const he = Number(d.horasExtras || d.he || 0);
      if (tot > 30 || he > 15) {
        alertas.push({
          id: `es_sobrecarga_${d.id || d.id_docente}`,
          tipo: 'SOBRECARGA_EXCESSIVA',
          nivel: 'CRITICO',
          titulo: 'Sobrecarga Excessiva (>30 Tempos Lectivos no Secundário)',
          descricao: `O(A) professor(a) ${d.nomeCompleto || d.nome_docente} acumula ${tot} tempos semanais (${he}h Horas Extras), excedendo o limite de segurança pedagógica do MINEDH.`,
          escolaId: d.idEscola || d.id_escola,
          escolaNome: d.nomeEscola || 'Escola Secundária / Básica',
          docenteNome: d.nomeCompleto || d.nome_docente,
          nuit: d.nuit || 'Sem NUIT',
          detalhe: `${tot}h Total (HE: ${he}h)`
        });
      }
    });

    // 3. Alerta: Duplicação indevida de NUIT em escolas diferentes
    const nuitMap = {};
    docentes.forEach(d => {
      const n = (d.nuit || '').trim();
      if (n && n.length >= 7) {
        if (!nuitMap[n]) nuitMap[n] = [];
        nuitMap[n].push(d);
      }
    });

    Object.entries(nuitMap).forEach(([nuitVal, docsComMesmoNuit]) => {
      // Filtrar se são escolas distintas
      const escolasDistintas = new Set(docsComMesmoNuit.map(x => x.idEscola || x.id_escola));
      if (escolasDistintas.size > 1) {
        const nomesEscolas = docsComMesmoNuit.map(x => x.nomeEscola || `Escola #${x.idEscola || x.id_escola}`).join(' e ');
        alertas.push({
          id: `nuit_duplicado_${nuitVal}`,
          tipo: 'DUPLICACAO_NUIT',
          nivel: 'CRITICO',
          titulo: 'Duplicação Indevida de NUIT em Escolas Distintas',
          descricao: `O NUIT ${nuitVal} (${docsComMesmoNuit[0].nomeCompleto || docsComMesmoNuit[0].nome_docente}) encontra-se cadastrado simultaneamente em: ${nomesEscolas}.`,
          escolaId: docsComMesmoNuit[0].idEscola || docsComMesmoNuit[0].id_escola,
          escolaNome: nomesEscolas,
          docenteNome: docsComMesmoNuit[0].nomeCompleto || docsComMesmoNuit[0].nome_docente,
          nuit: nuitVal,
          detalhe: `${docsComMesmoNuit.length} cadastros cruzados`
        });
      }
    });

    // 4. Relatório: Escolas com Mapas Pendentes de Validação pelo SDEJT
    escolas.forEach(esc => {
      const docEscola = docentes.filter(d => (d.idEscola || d.id_escola) === esc.id);
      if (docEscola.length === 0 || esc.statusValidacao === 'PENDENTE' || !esc.submetido) {
        alertas.push({
          id: `mapa_pendente_${esc.id}`,
          tipo: 'MAPA_PENDENTE',
          nivel: 'ADVERTENCIA',
          titulo: 'Escola com Mapa de Carga Horária Pendente',
          descricao: `A instituição ${esc.nomeOficial} (COD: ${esc.codigoMEC || esc.codigo}) ainda não concluiu ou submeteu o mapa oficial de carga horária para o ano lectivo ${ano}.`,
          escolaId: esc.id,
          escolaNome: esc.nomeOficial,
          docenteNome: esc.nomeDirector || 'Direcção da Escola',
          nuit: esc.contactoDirector || '-',
          detalhe: `Docentes inseridos: ${docEscola.length}`
        });
      }
    });

    return alertas;
  }, [docentes, escolas, ano]);

  // Filtragem
  const alertasFiltrados = useMemo(() => {
    return relatorioAuditoria.filter(a => {
      const matchTipo = filtroTipo === 'TODOS' || a.tipo === filtroTipo || (filtroTipo === 'CRITICOS' && a.nivel === 'CRITICO');
      const matchSearch = 
        a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.escolaNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.docenteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.nuit.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTipo && matchSearch;
    });
  }, [relatorioAuditoria, filtroTipo, searchTerm]);

  const criticosCount = relatorioAuditoria.filter(a => a.nivel === 'CRITICO').length;
  const epExcessoCount = relatorioAuditoria.filter(a => a.tipo === 'EP_EXCESSO_TURMAS').length;
  const sobrecargaCount = relatorioAuditoria.filter(a => a.tipo === 'SOBRECARGA_EXCESSIVA').length;
  const nuitDupCount = relatorioAuditoria.filter(a => a.tipo === 'DUPLICACAO_NUIT').length;
  const pendentesCount = relatorioAuditoria.filter(a => a.tipo === 'MAPA_PENDENTE').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner Principal Institucional do SDEJT */}
      <div className="card p-6 bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-xl border-l-4 border-l-blue-600">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center shrink-0">
              <ShieldCheck size={32} className="text-blue-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-800/60 border border-blue-600/40 text-[11px] font-semibold text-blue-200 mb-1">
                MINEDH • SDEJT INHASSORO • CONTROLO DA LEGALIDADE PEDAGÓGICA
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Auditor Automático de Conformidade Legal e Incompatibilidades
              </h1>
              <p className="text-slate-300 text-xs mt-0.5">
                Monitorização inteligente em tempo real: sobrecargas, duplicidade de NUIT e mapas escolares ({ano})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="btn-secondary text-xs flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20 cursor-pointer shrink-0"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Atualizar Auditoria</span>
          </button>
        </div>

        {/* 4 Cards de Métricas em Destaque */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Docentes c/ &gt;2 Turmas no EP</span>
            <div className="text-2xl font-black text-amber-400 mt-1">{epExcessoCount}</div>
            <span className="text-[10px] text-slate-400">Regime de monodocência</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Sobrecargas &gt;30 Tempos</span>
            <div className="text-2xl font-black text-red-400 mt-1">{sobrecargaCount}</div>
            <span className="text-[10px] text-slate-400">Ensino Secundário e EB</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Duplicações de NUIT</span>
            <div className="text-2xl font-black text-rose-400 mt-1">{nuitDupCount}</div>
            <span className="text-[10px] text-slate-400">Conflito entre escolas</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Mapas Pendentes SDEJT</span>
            <div className="text-2xl font-black text-yellow-300 mt-1">{pendentesCount}</div>
            <span className="text-[10px] text-slate-400">Aguardando validação</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="card p-4 bg-white shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'TODOS', label: `Todos (${relatorioAuditoria.length})` },
            { id: 'CRITICOS', label: `Incompatibilidades Críticas (${criticosCount})` },
            { id: 'EP_EXCESSO_TURMAS', label: `EP &gt;2 Turmas (${epExcessoCount})` },
            { id: 'SOBRECARGA_EXCESSIVA', label: `Sobrecarga &gt;30h (${sobrecargaCount})` },
            { id: 'DUPLICACAO_NUIT', label: `NUIT Duplicado (${nuitDupCount})` },
            { id: 'MAPA_PENDENTE', label: `Mapas Pendentes (${pendentesCount})` }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltroTipo(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filtroTipo === f.id
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por docente, escola ou NUIT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      {/* Lista de Alertas de Auditoria */}
      <div className="space-y-3">
        {loading ? (
          <div className="card p-12 text-center text-slate-500 bg-white">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-700" />
            <p className="text-xs font-semibold">Analisando base de dados distrital e verificando conformidade...</p>
          </div>
        ) : alertasFiltrados.length === 0 ? (
          <div className="card p-10 text-center bg-emerald-50/60 border border-emerald-200 rounded-2xl">
            <CheckCircle2 size={40} className="text-emerald-700 mx-auto mb-2" />
            <h3 className="text-base font-extrabold text-emerald-950">Nenhuma irregularidade detectada neste filtro</h3>
            <p className="text-xs text-emerald-800 mt-1 max-w-md mx-auto">
              Todas as alocações docentes analisadas cumprem rigorosamente as normas de carga horária e vinculação institucional do MINEDH.
            </p>
          </div>
        ) : (
          alertasFiltrados.map(a => {
            const isCritico = a.nivel === 'CRITICO';
            return (
              <div 
                key={a.id} 
                className={`p-4 rounded-xl border bg-white shadow-xs transition-all hover:shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isCritico ? 'border-l-4 border-l-red-600 border-slate-200' : 'border-l-4 border-l-amber-500 border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isCritico ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isCritico ? <AlertOctagon size={18} /> : <AlertTriangle size={18} />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isCritico ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {a.nivel}
                      </span>
                      <h4 className="text-xs font-extrabold text-slate-900">{a.titulo}</h4>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{a.descricao}</p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <School size={12} className="text-blue-700" />
                        {a.escolaNome}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users size={12} className="text-slate-400" />
                        {a.docenteNome} (NUIT: <strong className="font-mono">{a.nuit}</strong>)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-slate-400 block font-semibold">Estado de Alocação</span>
                    <span className="text-xs font-bold text-slate-800">{a.detalhe}</span>
                  </div>

                  {onSelectEscola && a.escolaId && (
                    <button
                      type="button"
                      onClick={() => onSelectEscola(a.escolaId)}
                      className="btn-secondary text-xs flex items-center gap-1 px-3 py-1.5 cursor-pointer hover:bg-blue-50 hover:text-blue-900 hover:border-blue-300"
                    >
                      <span>Abrir Escola</span>
                      <ChevronRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

