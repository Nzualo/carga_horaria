import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserPlus, Search, Edit2, Trash2, CheckCircle, AlertTriangle, AlertCircle, 
  Save, X, School, Users, Phone, ShieldCheck, ArrowUpDown, ChevronUp, ChevronDown, 
  BookOpen, Sparkles, Filter 
} from 'lucide-react';
import { api } from '../services/api';

const TODAS_CLASSES_EP = ['1ª', '2ª', '3ª', '4ª', '5ª', '6ª'];
const ANOS_AEA = ['1º Ano AEA', '2º Ano AEA', '3º Ano AEA', '4º Ano AEA'];

export default function CadastroDocentesEP({ escola, ano }) {
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroVinculo, setFiltroVinculo] = useState('TODOS');
  const [filtroRegime, setFiltroRegime] = useState('TODOS');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [passoModal, setPassoModal] = useState(1);

  // Ordenação dinâmica de colunas
  const [sortField, setSortField] = useState('nomeCompleto');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' ou 'desc'

  // Form State
  const [form, setForm] = useState({
    nomeCompleto: '',
    celular: '',
    nuit: '',
    sexo: 'M',
    codCarreira: 'DN4',
    vinculo: 'Quadro', // Estritamente 'Quadro' ou 'Contratado'
    codCargoGestao: '',
    regimeGeral: 'REGULAR', // 'REGULAR', 'MISTA', 'AEA', 'DUPLO_TURNO'

    // Se REGULAR (1 turma normal)
    regularClasse: '1ª Classe',
    regularTurma: 'Turma A',

    // Se MISTA (1 turma mista)
    mistaClasses: ['1ª', '2ª'],
    mistaTurmaNome: 'Turma Única Mista',

    // Se AEA (Centro de Alfabetização e Educação de Adultos - 1º ao 4º Ano)
    anoAea: '1º Ano AEA',
    turmaAeaNome: 'Turma AEA 1',

    // Se DUPLO TURNO: 1ª Turma
    duplo1Tipo: 'REGULAR', // 'REGULAR', 'MISTA' ou 'AEA'
    duplo1ClasseReg: '1ª Classe',
    duplo1TurmaReg: 'Turma A',
    duplo1ClassesMista: ['1ª', '2ª'],
    duplo1TurmaMistaNome: 'Turma Mista A',
    duplo1AnoAea: '1º Ano AEA',
    duplo1TurmaAeaNome: 'Turma AEA A',

    // Se DUPLO TURNO: 2ª Turma
    duplo2Tipo: 'REGULAR', // 'REGULAR', 'MISTA' ou 'AEA'
    duplo2ClasseReg: '2ª Classe',
    duplo2TurmaReg: 'Turma B',
    duplo2ClassesMista: ['3ª', '4ª'],
    duplo2TurmaMistaNome: 'Turma Mista B',
    duplo2AnoAea: '2º Ano AEA',
    duplo2TurmaAeaNome: 'Turma AEA B',

    observacoes: ''
  });

  const isSedeZip = !!escola?.ehSedeZip;

  const loadDocentes = async () => {
    setLoading(true);
    try {
      const data = await api.getDocentes(escola?.id, ano);
      setDocentes(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar docentes EP:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (escola?.id) loadDocentes();
  }, [escola?.id, ano]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setPassoModal(1);
    setForm({
      nomeCompleto: '',
      celular: '',
      nuit: '',
      sexo: 'M',
      codCarreira: 'DN4',
      vinculo: 'Quadro',
      codCargoGestao: '',
      regimeGeral: 'REGULAR',

      regularClasse: '1ª Classe',
      regularTurma: 'Turma A',

      mistaClasses: ['1ª', '2ª'],
      mistaTurmaNome: 'Turma Única Mista',

      anoAea: '1º Ano AEA',
      turmaAeaNome: 'Turma AEA 1',

      duplo1Tipo: 'REGULAR',
      duplo1ClasseReg: '1ª Classe',
      duplo1TurmaReg: 'Turma A',
      duplo1ClassesMista: ['1ª', '2ª'],
      duplo1TurmaMistaNome: 'Turma Mista A',
      duplo1AnoAea: '1º Ano AEA',
      duplo1TurmaAeaNome: 'Turma AEA A',

      duplo2Tipo: 'REGULAR',
      duplo2ClasseReg: '2ª Classe',
      duplo2TurmaReg: 'Turma B',
      duplo2ClassesMista: ['3ª', '4ª'],
      duplo2TurmaMistaNome: 'Turma Mista B',
      duplo2AnoAea: '2º Ano AEA',
      duplo2TurmaAeaNome: 'Turma AEA B',

      observacoes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (d) => {
    setEditingId(d.id);
    setPassoModal(1);
    const isMista = d.ehTurmaMista === 1 || (d.turmasTexto && d.turmasTexto.includes('Mista'));
    const isAea = d.ehAEA === 1 || (d.turmasTexto && d.turmasTexto.includes('AEA'));
    const isDuplo = Number(d.totalHoras) > 24;

    let regime = 'REGULAR';
    if (isDuplo) regime = 'DUPLO_TURNO';
    else if (isAea) regime = 'AEA';
    else if (isMista) regime = 'MISTA';

    setForm({
      nomeCompleto: d.nomeCompleto || '',
      celular: d.celular || '',
      nuit: d.nuit || '',
      sexo: d.sexo || 'M',
      codCarreira: d.codCarreira || 'DN4',
      vinculo: d.vinculo === 'Contratado' ? 'Contratado' : 'Quadro',
      codCargoGestao: d.codCargoGestao || '',
      regimeGeral: regime,

      regularClasse: d.turmasTexto ? d.turmasTexto.split('(')[0]?.trim() || '1ª Classe' : '1ª Classe',
      regularTurma: 'Turma A',

      mistaClasses: ['1ª', '2ª'],
      mistaTurmaNome: 'Turma Mista',

      anoAea: d.anoAEA || '1º Ano AEA',
      turmaAeaNome: 'Turma AEA',

      duplo1Tipo: 'REGULAR',
      duplo1ClasseReg: '1ª Classe',
      duplo1TurmaReg: 'Turma A',
      duplo1ClassesMista: ['1ª', '2ª'],
      duplo1TurmaMistaNome: 'Turma Mista A',
      duplo1AnoAea: '1º Ano AEA',
      duplo1TurmaAeaNome: 'Turma AEA A',

      duplo2Tipo: 'REGULAR',
      duplo2ClasseReg: '2ª Classe',
      duplo2TurmaReg: 'Turma B',
      duplo2ClassesMista: ['3ª', '4ª'],
      duplo2TurmaMistaNome: 'Turma Mista B',
      duplo2AnoAea: '2º Ano AEA',
      duplo2TurmaAeaNome: 'Turma AEA B',

      observacoes: d.observacoes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover este docente?')) return;
    try {
      await api.excluirDocente(id);
      loadDocentes();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const toggleClasseMista = (classe, listKey) => {
    setForm(prev => {
      const current = prev[listKey] || [];
      const exists = current.includes(classe);
      const updated = exists ? current.filter(c => c !== classe) : [...current, classe].sort();
      return { ...prev, [listKey]: updated.length > 0 ? updated : [classe] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nomeCompleto.trim()) {
      alert('Por favor, informe o nome completo do docente.');
      return;
    }

    let turmasStr = '';
    let ehMista = 0;
    let ehAea = 0;
    let hl = 24; // Carga obrigatória padrão no EP = 24 tempos

    if (form.regimeGeral === 'REGULAR') {
      turmasStr = `${form.regularClasse} (${form.regularTurma})`;
      ehMista = 0;
      ehAea = 0;
      hl = 24;
    } else if (form.regimeGeral === 'MISTA') {
      ehMista = 1;
      const classesMarcadas = form.mistaClasses.join(' e ');
      turmasStr = `Turma Mista: ${classesMarcadas} Classes (${form.mistaTurmaNome})`;
      hl = 24;
    } else if (form.regimeGeral === 'AEA') {
      ehAea = 1;
      turmasStr = `Centro de AEA: ${form.anoAea} (${form.turmaAeaNome})`;
      hl = 24;
    } else if (form.regimeGeral === 'DUPLO_TURNO') {
      hl = 48; // 24h normais + 24h horas extras

      // Montar 1ª Turma
      let desc1 = '';
      if (form.duplo1Tipo === 'MISTA') {
        ehMista = 1;
        desc1 = `1ª T. Mista: ${form.duplo1ClassesMista.join(' e ')} (${form.duplo1TurmaMistaNome})`;
      } else if (form.duplo1Tipo === 'AEA') {
        ehAea = 1;
        desc1 = `1ª T. AEA: ${form.duplo1AnoAea} (${form.duplo1TurmaAeaNome})`;
      } else {
        desc1 = `1ª Turma: ${form.duplo1ClasseReg} (${form.duplo1TurmaReg})`;
      }

      // Montar 2ª Turma
      let desc2 = '';
      if (form.duplo2Tipo === 'MISTA') {
        ehMista = 1;
        desc2 = `2ª T. Mista: ${form.duplo2ClassesMista.join(' e ')} (${form.duplo2TurmaMistaNome})`;
      } else if (form.duplo2Tipo === 'AEA') {
        ehAea = 1;
        desc2 = `2ª T. AEA: ${form.duplo2AnoAea} (${form.duplo2TurmaAeaNome})`;
      } else {
        desc2 = `2ª Turma: ${form.duplo2ClasseReg} (${form.duplo2TurmaReg})`;
      }

      turmasStr = `${desc1} + ${desc2}`;
    }

    try {
      await api.salvarDocente({
        id: editingId,
        nomeCompleto: form.nomeCompleto.trim(),
        celular: form.celular.trim(),
        nuit: form.nuit.trim(),
        sexo: form.sexo,
        codCarreira: form.codCarreira,
        vinculo: form.vinculo, // Estritamente 'Quadro' ou 'Contratado'
        idEscola: escola.id,
        anoLectivo: ano,
        tipoEnsinoDocente: 'EP',
        disciplinas: ehAea ? 'Alfabetização e Educação de Adultos (AEA)' : (ehMista ? 'Monodocência (Turma Mista)' : 'Monodocência (1ª a 6ª)'),
        codCargoGestao: form.codCargoGestao,
        turmasTexto: turmasStr,
        ehTurmaMista: ehMista,
        ehAEA: ehAea,
        anoAEA: ehAea ? (form.regimeGeral === 'AEA' ? form.anoAea : `${form.duplo1AnoAea} / ${form.duplo2AnoAea}`) : '',
        horasLectivasManual: hl,
        observacoes: form.observacoes.trim()
      });
      setShowModal(false);
      loadDocentes();
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    }
  };

  // Alternar ordenação de coluna
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtragem e ordenação dinâmica com useMemo
  const processedDocentes = useMemo(() => {
    let result = docentes.filter(d => {
      const matchSearch = (
        (d.nomeCompleto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.celular || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.nuit || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.turmasTexto || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (!matchSearch) return false;

      if (filtroVinculo !== 'TODOS' && d.vinculo !== filtroVinculo) return false;

      if (filtroRegime === 'DUPLO') {
        if (Number(d.totalHoras) <= 24) return false;
      } else if (filtroRegime === 'MISTA') {
        if (d.ehTurmaMista !== 1 && (!d.turmasTexto || !d.turmasTexto.includes('Mista'))) return false;
      } else if (filtroRegime === 'AEA') {
        if (d.ehAEA !== 1 && (!d.turmasTexto || !d.turmasTexto.includes('AEA'))) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'totalHoras' || sortField === 'horasExtras' || sortField === 'horasLectivas') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [docentes, searchTerm, filtroVinculo, filtroRegime, sortField, sortDirection]);

  return (
    <div className="space-y-6">
      {/* Barra de Ações Superior & Filtros Dinâmicos */}
      <div className="card p-5 border-l-4 border-l-blue-800 bg-white shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-blue">Ensino Primário & Centro de AEA</span>
              <span className="badge badge-slate">Ano Lectivo {ano}</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <School className="text-blue-800" size={22} />
              Quadro de Docentes do Ensino Primário (EP) — {escola?.nomeAbreviado}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Regime de Monodocência • Suporte a Turmas Singulares, Mistas, AEA (1º ao 4º Ano) e Duplo Turno
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar professor, NUIT, turma..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl w-60 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              onClick={handleOpenAdd}
              className="btn-primary text-xs whitespace-nowrap shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <UserPlus size={16} />
              Cadastrar Professor EP
            </button>
          </div>
        </div>

        {/* Filtros de Vínculo e Regime */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
            <Filter size={13} /> Filtrar:
          </span>

          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[11px]">
            {['TODOS', 'Quadro', 'Contratado'].map(v => (
              <button
                key={v}
                onClick={() => setFiltroVinculo(v)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  filtroVinculo === v ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {v === 'TODOS' ? 'Todos Vínculos' : v}
              </button>
            ))}
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[11px]">
            {[
              { id: 'TODOS', label: 'Todos Regimes' },
              { id: 'DUPLO', label: 'Duplo Turno (+24h)' },
              { id: 'MISTA', label: 'Turmas Mistas' },
              { id: 'AEA', label: 'Centro de AEA' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setFiltroRegime(r.id)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  filtroRegime === r.id ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-400 ml-auto font-medium">
            Exibindo <strong>{processedDocentes.length}</strong> de {docentes.length} professores
          </span>
        </div>
      </div>

      {/* Tabela Dinâmica e Profissional de Docentes EP */}
      <div className="card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-3 w-12 text-center">Nº</th>
                <th 
                  className="py-3 px-4 min-w-[280px] cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('nomeCompleto')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Nome Completo do Docente</span>
                    {sortField === 'nomeCompleto' ? (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    ) : <ArrowUpDown size={12} className="opacity-40" />}
                  </div>
                </th>
                <th 
                  className="py-3 px-3 w-32 cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('codCarreira')}
                >
                  <div className="flex items-center gap-1">
                    <span>Carreira / Vínculo</span>
                    {sortField === 'codCarreira' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[220px]">Regime & Turmas Atribuídas</th>
                <th className="py-3 px-3 w-40">Cargo de Gestão</th>
                <th 
                  className="py-3 px-2 w-16 text-center cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('horasLectivas')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>HL</span>
                    {sortField === 'horasLectivas' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </div>
                </th>
                <th 
                  className="py-3 px-3 w-20 text-center cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('totalHoras')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Total</span>
                    {sortField === 'totalHoras' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </div>
                </th>
                <th 
                  className="py-3 px-3 w-20 text-center cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('horasExtras')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>HE</span>
                    {sortField === 'horasExtras' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </div>
                </th>
                <th className="py-3 px-3 w-32 text-center">Classificação</th>
                <th className="py-3 px-3 w-20 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {processedDocentes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    Nenhum docente corresponde aos critérios de pesquisa.<br />
                    Clique em <strong>"Cadastrar Professor EP"</strong> para adicionar novos docentes.
                  </td>
                </tr>
              ) : (
                processedDocentes.map((d, i) => {
                  const tot = Number(d.totalHoras) || 0;
                  const he = Number(d.horasExtras) || 0;
                  const isMista = d.ehTurmaMista === 1 || (d.turmasTexto && d.turmasTexto.includes('Mista'));
                  const isAea = d.ehAEA === 1 || (d.turmasTexto && d.turmasTexto.includes('AEA'));
                  const isDuplo = tot > 24;

                  return (
                    <tr 
                      key={d.id} 
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      <td className="py-3 px-3 text-center font-bold text-slate-400">
                        {i + 1}
                      </td>

                      {/* Nome Completo Amplo e Bem Visível */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-sm text-slate-900 group-hover:text-blue-900 leading-snug">
                          {d.nomeCompleto}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          {d.celular && (
                            <span className="flex items-center gap-1 text-slate-600">
                              <Phone size={10} className="text-blue-600" /> {d.celular}
                            </span>
                          )}
                          <span>NUIT: <strong>{d.nuit || 'S/N'}</strong></span>
                          <span>Sexo: <strong>{d.sexo === 'F' ? 'F' : 'M'}</strong></span>
                        </div>
                      </td>

                      {/* Carreira e Vínculo */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 block">{d.codCarreira || 'DN4'}</span>
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold mt-0.5 ${
                          d.vinculo === 'Quadro' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {d.vinculo}
                        </span>
                      </td>

                      {/* Regime & Turmas */}
                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold text-slate-800 block leading-tight">
                          {d.turmasTexto || '—'}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {isMista && (
                            <span className="badge badge-yellow text-[10px]">
                              Turma Mista
                            </span>
                          )}
                          {isAea && (
                            <span className="badge badge-blue text-[10px]">
                              Centro de AEA
                            </span>
                          )}
                          {isDuplo && (
                            <span className="badge badge-green text-[10px]">
                              Duplo Turno (+24h HE)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cargo de Gestão (sem tempos na etiqueta) */}
                      <td className="py-3 px-3">
                        {d.codCargoGestao ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 font-bold text-xs border border-blue-200">
                            <ShieldCheck size={12} className="text-blue-700" />
                            {d.codCargoGestao}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* HL, Total e HE */}
                      <td className="py-3 px-2 text-center font-semibold text-slate-800">
                        {d.horasLectivas}h
                      </td>

                      <td className="py-3 px-3 text-center font-extrabold text-slate-900">
                        {tot}h
                      </td>

                      <td className="py-3 px-3 text-center">
                        {he > 0 ? (
                          <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                            +{he}h
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">0h</span>
                        )}
                      </td>

                      {/* Classificação */}
                      <td className="py-3 px-3 text-center">
                        {isDuplo ? (
                          <span className="badge badge-green font-bold">
                            Duplo Turno
                          </span>
                        ) : (
                          <span className="badge badge-slate">
                            Carga Conforme
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(d)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                            title="Editar Docente"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(d.id)}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Docente"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro / Edição de Professor EP (Formulário em 3 Fases - Sem Rolagem Vertical) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 transform transition-all">
            {/* Topo do Modal com Indicador de Fases */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 font-bold flex items-center justify-center shrink-0">
                  <School size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                    {editingId ? 'Editar Professor EP' : 'Cadastrar Professor (Primário & AEA)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Fase {passoModal} de 3 — {passoModal === 1 ? 'Identificação & Carreira' : (passoModal === 2 ? 'Regime & Atribuição de Turmas' : 'Resumo da Carga & Confirmação')}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                title="Fechar Formulário"
              >
                <X size={18} />
              </button>
            </div>

            {/* Stepper Visual das Fases */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${passoModal >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
              <div className={`h-1.5 rounded-full transition-all duration-300 ${passoModal >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
              <div className={`h-1.5 rounded-full transition-all duration-300 ${passoModal >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`} />
            </div>

            <form onSubmit={handleSubmit}>
              {/* ======================================================== */}
              {/* FASE 1: DADOS PESSOAIS, CARREIRA, VÍNCULO E GESTÃO        */}
              {/* ======================================================== */}
              {passoModal === 1 && (
                <div className="space-y-3.5 animate-in fade-in duration-200">
                  {/* Nome Completo com Exemplo Solicitado */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo do Docente *</label>
                    <input
                      type="text"
                      required
                      value={form.nomeCompleto}
                      onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })}
                      placeholder="ex: Cândido Albino Nzualo"
                      className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium"
                    />
                  </div>

                  {/* Contactos e Documentos Administrativos */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Contacto / Celular</label>
                      <input
                        type="text"
                        value={form.celular}
                        onChange={(e) => setForm({ ...form, celular: e.target.value })}
                        placeholder="84xxxxxxx / 82xxxxxxx"
                        className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">NUIT</label>
                      <input
                        type="text"
                        value={form.nuit}
                        onChange={(e) => setForm({ ...form, nuit: e.target.value })}
                        placeholder="ex: 109823412"
                        className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Sexo</label>
                      <select
                        value={form.sexo}
                        onChange={(e) => setForm({ ...form, sexo: e.target.value })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-slate-50 font-semibold"
                      >
                        <option value="M">Masculino (M)</option>
                        <option value="F">Feminino (F)</option>
                      </select>
                    </div>
                  </div>

                  {/* Carreira, Vínculo e Cargo de Gestão (sem tempos) */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Carreira</label>
                      <select
                        value={form.codCarreira}
                        onChange={(e) => setForm({ ...form, codCarreira: e.target.value })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-slate-50"
                      >
                        <option value="DN4">DN4 (Básico)</option>
                        <option value="DN3">DN3 (Médio)</option>
                        <option value="DN2">DN2 (Bacharel)</option>
                        <option value="DN1">DN1 (Licenciatura)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Vínculo *</label>
                      <select
                        value={form.vinculo}
                        onChange={(e) => setForm({ ...form, vinculo: e.target.value })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-slate-50 font-bold text-blue-900"
                      >
                        <option value="Quadro">Quadro</option>
                        <option value="Contratado">Contratado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Cargo Gestão EP</label>
                      <select
                        value={form.codCargoGestao}
                        onChange={(e) => setForm({ ...form, codCargoGestao: e.target.value })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-slate-50 font-semibold text-slate-800"
                      >
                        <option value="">Nenhum</option>
                        <option value="Director da Escola">Director da Escola</option>
                        <option value="DAP">Director Adjunto Pedagógico (DAP)</option>
                        {isSedeZip && (
                          <>
                            <option value="Director da Escola e Coordenador de ZIP">Director e Coord. de ZIP</option>
                            <option value="Coordenador de ZIP">Coordenador de ZIP</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    ℹ️ No Ensino Primário (EP), a carga horária padrão de todos os docentes e cargos de gestão é de <strong>24 tempos semanais</strong> de monodocência.
                  </p>

                  {/* Rodapé Fase 1 */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn-secondary text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!form.nomeCompleto.trim()) {
                          alert('Por favor, informe o nome completo do docente antes de prosseguir.');
                          return;
                        }
                        setPassoModal(2);
                      }}
                      className="btn-primary text-xs shadow-md cursor-pointer"
                    >
                      Próximo: Atribuição de Turmas →
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* FASE 2: REGIME LECTIVO & ATRIBUIÇÃO DE TURMAS             */}
              {/* ======================================================== */}
              {passoModal === 2 && (
                <div className="space-y-3.5 animate-in fade-in duration-200">
                  {/* Seletor de Regime: Regular vs Mista vs AEA vs Duplo Turno */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">Tipo / Regime de Ensino no EP:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'REGULAR', label: 'Turma Regular', color: 'border-blue-700 bg-blue-50 text-blue-900' },
                        { id: 'MISTA', label: 'Turma Mista', color: 'border-amber-600 bg-amber-50 text-amber-900' },
                        { id: 'AEA', label: 'Centro de AEA', color: 'border-cyan-700 bg-cyan-50 text-cyan-900' },
                        { id: 'DUPLO_TURNO', label: 'Duplo Turno', color: 'border-emerald-600 bg-emerald-50 text-emerald-900' }
                      ].map(r => (
                        <label 
                          key={r.id} 
                          className={`p-2 rounded-lg border text-center cursor-pointer transition-all ${
                            form.regimeGeral === r.id ? `${r.color} font-bold shadow-xs` : 'border-slate-200 bg-white text-slate-600'
                          }`}
                        >
                          <input
                            type="radio"
                            name="regimeGeral"
                            value={r.id}
                            checked={form.regimeGeral === r.id}
                            onChange={() => setForm({ ...form, regimeGeral: r.id })}
                            className="hidden"
                          />
                          <span className="text-xs block">{r.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 1. SE REGULAR (1 Turma Monodocência) */}
                  {form.regimeGeral === 'REGULAR' && (
                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                      <span className="text-xs font-bold text-blue-900 block">Turma Monodocência Regular (1ª à 6ª Classe):</span>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={form.regularClasse}
                          onChange={(e) => setForm({ ...form, regularClasse: e.target.value })}
                          className="text-xs border border-blue-300 rounded-lg px-2.5 py-2 bg-white"
                        >
                          {TODAS_CLASSES_EP.map(c => <option key={c} value={`${c} Classe`}>{c} Classe</option>)}
                        </select>
                        <input
                          type="text"
                          value={form.regularTurma}
                          onChange={(e) => setForm({ ...form, regularTurma: e.target.value })}
                          placeholder="ex: Turma A"
                          className="text-xs border border-blue-300 rounded-lg px-2.5 py-2 bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. SE MISTA (Checkboxes das Classes) */}
                  {form.regimeGeral === 'MISTA' && (
                    <div className="p-3 bg-amber-50/70 border border-amber-300 rounded-xl space-y-2.5">
                      <div>
                        <span className="text-xs font-bold text-amber-900 block">Composição da Turma Mista:</span>
                        <p className="text-[11px] text-amber-800">
                          Marque as caixas das classes combinadas nesta turma mista:
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {TODAS_CLASSES_EP.map(c => {
                          const checked = form.mistaClasses.includes(c);
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => toggleClasseMista(c, 'mistaClasses')}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                checked
                                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] ${checked ? 'border-white bg-amber-800' : 'border-slate-400'}`}>
                                {checked ? '✓' : ''}
                              </span>
                              {c} Classe
                            </button>
                          );
                        })}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-amber-900 mb-1">Designação da Turma Mista:</label>
                        <input
                          type="text"
                          value={form.mistaTurmaNome}
                          onChange={(e) => setForm({ ...form, mistaTurmaNome: e.target.value })}
                          placeholder="ex: Turma Única Mista"
                          className="w-full text-xs border border-amber-300 rounded-lg px-3 py-2 bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* 3. SE CENTRO DE AEA (Alfabetização e Educação de Adultos) */}
                  {form.regimeGeral === 'AEA' && (
                    <div className="p-3 bg-cyan-50 border border-cyan-300 rounded-xl space-y-2.5">
                      <span className="text-xs font-bold text-cyan-950 block flex items-center gap-1.5">
                        <BookOpen size={15} className="text-cyan-800" />
                        Centro de Alfabetização e Educação de Adultos (AEA):
                      </span>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-cyan-900 mb-1">Ano de AEA:</label>
                          <select
                            value={form.anoAea}
                            onChange={(e) => setForm({ ...form, anoAea: e.target.value })}
                            className="w-full text-xs border border-cyan-400 rounded-lg px-2.5 py-2 bg-white font-bold text-cyan-900"
                          >
                            {ANOS_AEA.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-cyan-900 mb-1">Nome da Turma:</label>
                          <input
                            type="text"
                            value={form.turmaAeaNome}
                            onChange={(e) => setForm({ ...form, turmaAeaNome: e.target.value })}
                            placeholder="ex: Turma AEA 1"
                            className="w-full text-xs border border-cyan-400 rounded-lg px-2.5 py-2 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. SE DUPLO TURNO (Combinação de 1ª e 2ª Turmas) */}
                  {form.regimeGeral === 'DUPLO_TURNO' && (
                    <div className="space-y-2.5">
                      {/* Bloco 1ª Turma */}
                      <div className="p-2.5 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-950">1ª Turma (Turno Normal — 24h):</span>
                          <div className="flex gap-2">
                            {['REGULAR', 'MISTA', 'AEA'].map(t => (
                              <label key={t} className="text-[11px] flex items-center gap-1 font-semibold text-emerald-950 cursor-pointer">
                                <input
                                  type="radio"
                                  name="duplo1Tipo"
                                  checked={form.duplo1Tipo === t}
                                  onChange={() => setForm({ ...form, duplo1Tipo: t })}
                                />
                                {t === 'REGULAR' ? 'Regular' : (t === 'MISTA' ? 'Mista' : 'AEA')}
                              </label>
                            ))}
                          </div>
                        </div>

                        {form.duplo1Tipo === 'REGULAR' && (
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={form.duplo1ClasseReg}
                              onChange={(e) => setForm({ ...form, duplo1ClasseReg: e.target.value })}
                              className="text-xs border border-emerald-300 rounded-lg px-2 py-1.5 bg-white"
                            >
                              {TODAS_CLASSES_EP.map(c => <option key={c} value={`${c} Classe`}>{c} Classe</option>)}
                            </select>
                            <input
                              type="text"
                              value={form.duplo1TurmaReg}
                              onChange={(e) => setForm({ ...form, duplo1TurmaReg: e.target.value })}
                              placeholder="Turma A"
                              className="text-xs border border-emerald-300 rounded-lg px-2 py-1.5 bg-white"
                            />
                          </div>
                        )}

                        {form.duplo1Tipo === 'MISTA' && (
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap gap-1">
                              {TODAS_CLASSES_EP.map(c => {
                                const checked = form.duplo1ClassesMista.includes(c);
                                return (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => toggleClasseMista(c, 'duplo1ClassesMista')}
                                    className={`px-2 py-0.5 rounded border text-[10px] font-bold cursor-pointer ${checked ? 'bg-emerald-700 text-white' : 'bg-white text-slate-700'}`}
                                  >
                                    {c}
                                  </button>
                                );
                              })}
                            </div>
                            <input
                              type="text"
                              value={form.duplo1TurmaMistaNome}
                              onChange={(e) => setForm({ ...form, duplo1TurmaMistaNome: e.target.value })}
                              placeholder="Nome da 1ª Turma Mista"
                              className="w-full text-xs border border-emerald-300 rounded-lg px-2 py-1.5 bg-white"
                            />
                          </div>
                        )}

                        {form.duplo1Tipo === 'AEA' && (
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={form.duplo1AnoAea}
                              onChange={(e) => setForm({ ...form, duplo1AnoAea: e.target.value })}
                              className="text-xs border border-emerald-300 rounded-lg px-2 py-1.5 bg-white font-bold"
                            >
                              {ANOS_AEA.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                            <input
                              type="text"
                              value={form.duplo1TurmaAeaNome}
                              onChange={(e) => setForm({ ...form, duplo1TurmaAeaNome: e.target.value })}
                              placeholder="Turma AEA A"
                              className="text-xs border border-emerald-300 rounded-lg px-2 py-1.5 bg-white"
                            />
                          </div>
                        )}
                      </div>

                      {/* Bloco 2ª Turma */}
                      <div className="p-2.5 bg-teal-50/70 border border-teal-300 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-teal-950">2ª Turma (2º Turno — 24h Extras):</span>
                          <div className="flex gap-2">
                            {['REGULAR', 'MISTA', 'AEA'].map(t => (
                              <label key={t} className="text-[11px] flex items-center gap-1 font-semibold text-teal-950 cursor-pointer">
                                <input
                                  type="radio"
                                  name="duplo2Tipo"
                                  checked={form.duplo2Tipo === t}
                                  onChange={() => setForm({ ...form, duplo2Tipo: t })}
                                />
                                {t === 'REGULAR' ? 'Regular' : (t === 'MISTA' ? 'Mista' : 'AEA')}
                              </label>
                            ))}
                          </div>
                        </div>

                        {form.duplo2Tipo === 'REGULAR' && (
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={form.duplo2ClasseReg}
                              onChange={(e) => setForm({ ...form, duplo2ClasseReg: e.target.value })}
                              className="text-xs border border-teal-300 rounded-lg px-2 py-1.5 bg-white"
                            >
                              {TODAS_CLASSES_EP.map(c => <option key={c} value={`${c} Classe`}>{c} Classe</option>)}
                            </select>
                            <input
                              type="text"
                              value={form.duplo2TurmaReg}
                              onChange={(e) => setForm({ ...form, duplo2TurmaReg: e.target.value })}
                              placeholder="Turma B"
                              className="text-xs border border-teal-300 rounded-lg px-2 py-1.5 bg-white"
                            />
                          </div>
                        )}

                        {form.duplo2Tipo === 'MISTA' && (
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap gap-1">
                              {TODAS_CLASSES_EP.map(c => {
                                const checked = form.duplo2ClassesMista.includes(c);
                                return (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => toggleClasseMista(c, 'duplo2ClassesMista')}
                                    className={`px-2 py-0.5 rounded border text-[10px] font-bold cursor-pointer ${checked ? 'bg-teal-700 text-white' : 'bg-white text-slate-700'}`}
                                  >
                                    {c}
                                  </button>
                                );
                              })}
                            </div>
                            <input
                              type="text"
                              value={form.duplo2TurmaMistaNome}
                              onChange={(e) => setForm({ ...form, duplo2TurmaMistaNome: e.target.value })}
                              placeholder="Nome da 2ª Turma Mista"
                              className="w-full text-xs border border-teal-300 rounded-lg px-2 py-1.5 bg-white"
                            />
                          </div>
                        )}

                        {form.duplo2Tipo === 'AEA' && (
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={form.duplo2AnoAea}
                              onChange={(e) => setForm({ ...form, duplo2AnoAea: e.target.value })}
                              className="text-xs border border-teal-300 rounded-lg px-2 py-1.5 bg-white font-bold"
                            >
                              {ANOS_AEA.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                            <input
                              type="text"
                              value={form.duplo2TurmaAeaNome}
                              onChange={(e) => setForm({ ...form, duplo2TurmaAeaNome: e.target.value })}
                              placeholder="Turma AEA B"
                              className="text-xs border border-teal-300 rounded-lg px-2 py-1.5 bg-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rodapé Fase 2 */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setPassoModal(1)}
                      className="btn-secondary text-xs cursor-pointer"
                    >
                      ← Voltar ao Passo 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setPassoModal(3)}
                      className="btn-primary text-xs shadow-md cursor-pointer"
                    >
                      Próximo: Resumo & Confirmação →
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* FASE 3: APURAMENTO DA CARGA, RESUMO E CONFIRMAÇÃO         */}
              {/* ======================================================== */}
              {passoModal === 3 && (
                <div className="space-y-3.5 animate-in fade-in duration-200">
                  {/* Cartão de Resumo Visual */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">Resumo do Apuramento da Carga Horária:</span>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-semibold">Docente & Vínculo</span>
                        <strong className="text-slate-800 text-xs block truncate">{form.nomeCompleto || 'Sem nome'}</strong>
                        <span className="text-[10px] text-blue-900 font-bold">{form.codCarreira} • {form.vinculo}</span>
                      </div>

                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-semibold">Função de Gestão EP</span>
                        <strong className="text-slate-800 text-xs block">{form.codCargoGestao || 'Nenhum'}</strong>
                        <span className="text-[10px] text-emerald-800 font-semibold">24 Tempos Lectivos</span>
                      </div>
                    </div>

                    {/* Resumo das Turmas Atribuídas */}
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700">1.ª Turma (Turno Normal):</span>
                        <span className="text-[11px] font-semibold text-blue-900">
                          {form.regimeGeral === 'REGULAR' ? `${form.regularClasse} (${form.regularTurma})` :
                           form.regimeGeral === 'MISTA' ? `Turma Mista: ${form.mistaClasses.join(' e ')} Classes` :
                           form.regimeGeral === 'AEA' ? `Centro de AEA: ${form.anoAea}` :
                           (form.duplo1Tipo === 'MISTA' ? `1ª T. Mista: ${form.duplo1ClassesMista.join(' e ')}` :
                            form.duplo1Tipo === 'AEA' ? `1ª T. AEA: ${form.duplo1AnoAea}` :
                            `${form.duplo1ClasseReg} (${form.duplo1TurmaReg})`)}
                        </span>
                      </div>

                      {form.regimeGeral === 'DUPLO_TURNO' && (
                        <div className="flex items-center justify-between border-t border-slate-100 pt-1">
                          <span className="text-[11px] font-bold text-emerald-800">2.ª Turma (Duplo Turno):</span>
                          <span className="text-[11px] font-semibold text-emerald-900">
                            {form.duplo2Tipo === 'MISTA' ? `2ª T. Mista: ${form.duplo2ClassesMista.join(' e ')}` :
                             form.duplo2Tipo === 'AEA' ? `2ª T. AEA: ${form.duplo2AnoAea}` :
                             `${form.duplo2ClasseReg} (${form.duplo2TurmaReg})`}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-slate-100 pt-1 font-bold text-xs">
                        <span className="text-slate-700">Total de Turmas / Carga:</span>
                        <span className="text-blue-900">
                          {form.regimeGeral === 'DUPLO_TURNO' ? '2 Turmas (48 Tempos)' : '1 Turma (24 Tempos)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Observações Adicionais */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Observações Opcionais</label>
                    <textarea
                      rows={2}
                      value={form.observacoes}
                      onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                      placeholder="Informações adicionais do docente para os mapas oficiais..."
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  {/* Rodapé Fase 3 */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setPassoModal(2)}
                      className="btn-secondary text-xs cursor-pointer"
                    >
                      ← Voltar ao Passo 2
                    </button>
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                    >
                      <Save size={16} />
                      {editingId ? 'Salvar Alterações' : 'Salvar Professor'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
