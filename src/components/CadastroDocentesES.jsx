import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus, Search, Edit2, Trash2, CheckCircle, AlertTriangle, AlertCircle,
  Save, X, BookOpen, Clock, Phone, ShieldCheck, Calculator, ArrowUpDown,
  ChevronUp, ChevronDown, Filter, Layers, CheckSquare, Sparkles
} from 'lucide-react';
import { api } from '../services/api';

const DISCIPLINAS_OPCOES = [
  'Português', 'Matemática', 'Inglês', 'Francês', 'História', 'Geografia',
  'Filosofia', 'Biologia', 'Física', 'Química', 'Ed. Visual', 'Ed. Física',
  'TIC / Informática', 'Agropecuária', 'Empreendedorismo', 'IPP (Introdução à Psicopedagogia)'
];

const MATRIZ_TEMPOS_DISCIPLINA = {
  'Português': { '7ª': 5, '8ª': 5, '9ª': 5, '10ª': 5, '11ª Letras': 5, '11ª Ciências': 3, '12ª Letras': 5, '12ª Ciências': 3 },
  'Matemática': { '7ª': 5, '8ª': 5, '9ª': 5, '10ª': 5, '11ª Letras': 3, '11ª Ciências': 5, '12ª Letras': 3, '12ª Ciências': 5 },
  'Inglês': { '7ª': 5, '8ª': 3, '9ª': 3, '10ª': 3, '11ª Letras': 3, '11ª Ciências': 2, '12ª Letras': 3, '12ª Ciências': 2 },
  'Francês': { '7ª': 0, '8ª': 2, '9ª': 2, '10ª': 2, '11ª Letras': 4, '11ª Ciências': 0, '12ª Letras': 4, '12ª Ciências': 0 },
  'História': { '7ª': 2, '8ª': 2, '9ª': 2, '10ª': 2, '11ª Letras': 4, '11ª Ciências': 2, '12ª Letras': 4, '12ª Ciências': 2 },
  'Geografia': { '7ª': 2, '8ª': 2, '9ª': 2, '10ª': 2, '11ª Letras': 4, '11ª Ciências': 2, '12ª Letras': 4, '12ª Ciências': 2 },
  'Filosofia': { '7ª': 0, '8ª': 0, '9ª': 0, '10ª': 0, '11ª Letras': 3, '11ª Ciências': 2, '12ª Letras': 3, '12ª Ciências': 2 },
  'Biologia': { '7ª': 2, '8ª': 2, '9ª': 2, '10ª': 2, '11ª Letras': 2, '11ª Ciências': 4, '12ª Letras': 2, '12ª Ciências': 4 },
  'Física': { '7ª': 0, '8ª': 2, '9ª': 2, '10ª': 2, '11ª Letras': 0, '11ª Ciências': 4, '12ª Letras': 0, '12ª Ciências': 4 },
  'Química': { '7ª': 0, '8ª': 2, '9ª': 2, '10ª': 2, '11ª Letras': 0, '11ª Ciências': 4, '12ª Letras': 0, '12ª Ciências': 4 },
  'Ed. Visual': { '7ª': 2, '8ª': 2, '9ª': 2, '10ª': 2, '11ª Letras': 2, '11ª Ciências': 3, '12ª Letras': 2, '12ª Ciências': 3 },
  'Ed. Física': { '7ª': 2, '8ª': 2, '9ª': 2, '10ª': 2, '11ª Letras': 2, '11ª Ciências': 2, '12ª Letras': 2, '12ª Ciências': 2 },
  'TIC / Informática': { '7ª': 2, '8ª': 2, '9ª': 2, '10ª': 2, '11ª Letras': 2, '11ª Ciências': 2, '12ª Letras': 2, '12ª Ciências': 2 },
  'Agropecuária': { '7ª': 2, '8ª': 2, '9ª': 2, '10ª': 2, '11ª Letras': 0, '11ª Ciências': 0, '12ª Letras': 0, '12ª Ciências': 0 },
  'Empreendedorismo': { '7ª': 2, '8ª': 2, '9ª': 2, '10ª': 2, '11ª Letras': 0, '11ª Ciências': 0, '12ª Letras': 0, '12ª Ciências': 0 },
  'IPP (Introdução à Psicopedagogia)': { '7ª': 0, '8ª': 0, '9ª': 0, '10ª': 0, '11ª Letras': 3, '11ª Ciências': 2, '12ª Letras': 3, '12ª Ciências': 2 }
};

const GESTAO_OPCOES = [
  { sigla: 'DT', label: 'DT - Director de Turma (2h)', hg: 2 },
  { sigla: 'DD', label: 'DD - Delegado de Disciplina (4h)', hg: 4 },
  { sigla: 'CC', label: 'CC - Coordenador de Ciclo (2h)', hg: 2 },
  { sigla: 'CAA', label: 'CAA - Apoio e Aprendizagem (2h)', hg: 2 },
  { sigla: 'DAP', label: 'DAP - Dir. Adjunto Pedagógico (10h)', hg: 10 },
  { sigla: 'Dir', label: 'Dir - Director da Escola (16h)', hg: 16 },
  { sigla: 'Desp', label: 'Desp - Desporto Escolar (2h)', hg: 2 }
];

export default function CadastroDocentesES({ escola, ano }) {
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroDisciplina, setFiltroDisciplina] = useState('TODAS');
  const [filtroVinculo, setFiltroVinculo] = useState('TODOS');
  const [filtroRegimeEB, setFiltroRegimeEB] = useState('TODOS');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [passoModal, setPassoModal] = useState(1);

  // Ordenação dinâmica de colunas
  const [sortField, setSortField] = useState('nomeCompleto');
  const [sortDirection, setSortDirection] = useState('asc');

  const isEB = escola?.tipo === 'EB';

  // Classes exibidas conforme tipologia: EB tem 7ª a 9ª; ESG tem 7ª a 12ª
  const classesDisponiveis = useMemo(() => {
    if (isEB) {
      return [
        { id: '7ª', label: '7ª Classe', grupo: '1º Ciclo' },
        { id: '8ª', label: '8ª Classe', grupo: '1º Ciclo' },
        { id: '9ª', label: '9ª Classe', grupo: '1º Ciclo' }
      ];
    }
    return [
      { id: '7ª', label: '7ª Classe', grupo: '1º Ciclo' },
      { id: '8ª', label: '8ª Classe', grupo: '1º Ciclo' },
      { id: '9ª', label: '9ª Classe', grupo: '1º Ciclo' },
      { id: '10ª', label: '10ª Classe', grupo: '1º Ciclo' },
      { id: '11ª Letras', label: '11ª Letras (A1..An)', grupo: '2º Ciclo' },
      { id: '11ª Ciências', label: '11ª Ciências (B1..Bn)', grupo: '2º Ciclo' },
      { id: '12ª Letras', label: '12ª Letras (A1..An)', grupo: '2º Ciclo' },
      { id: '12ª Ciências', label: '12ª Ciências (B1..Bn)', grupo: '2º Ciclo' }
    ];
  }, [isEB]);

  // Form State
  const [form, setForm] = useState({
    nomeCompleto: '',
    celular: '',
    nuit: '',
    sexo: 'M',
    codCarreira: 'DN1',
    vinculo: 'Quadro', // 'Quadro' ou 'Contratado'
    regimeEB: 'REGULAR', // 'REGULAR' (titular do secundário) ou 'EP_EM_HE' (efectivo do EP em horas extras no ES)
    temposObrigatorios: 20, // 20, 24 ou 28 tempos obrigatórios
    disciplinaPrincipal: 'Português',
    funcoesGestao: [], // Múltiplas funções de gestão acumuláveis (DT 2h, DD 4h, etc.)
    // Alocação detalhada de turmas: quantidade obrigatória vs quantidade em Horas Extras + designação de turmas
    turmasConfig: {
      '7ª': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' },
      '8ª': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' },
      '9ª': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' },
      '10ª': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' },
      '11ª Letras': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' },
      '11ª Ciências': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' },
      '12ª Letras': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' },
      '12ª Ciências': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' }
    },
    modoManual: false,
    hlManual: 16,
    observacoes: ''
  });

  const loadDocentes = async () => {
    setLoading(true);
    try {
      const data = await api.getDocentes(escola?.id, ano);
      setDocentes(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar docentes:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (escola?.id) loadDocentes();
  }, [escola?.id, ano]);

  // Cálculo de Carga Horária com Suporte a Carga Obrigatória (20h, 24h, 28h) vs Horas Extras (HE)
  const calcularCargaLocal = () => {
    const disc = form.disciplinaPrincipal;
    const temposDisc = MATRIZ_TEMPOS_DISCIPLINA[disc] || {};

    let hlObrigatoria = 0;
    let hlExtra = 0;
    const turmasArray = [];
    const turmasTextoPartes = [];

    const isEpEmHe = form.regimeEB === 'EP_EM_HE';

    if (form.modoManual) {
      const hlMan = Number(form.hlManual) || 0;
      if (isEpEmHe) {
        hlExtra = hlMan;
      } else {
        const cargaRef = Number(form.temposObrigatorios) || 20;
        hlObrigatoria = Math.min(hlMan, cargaRef);
        hlExtra = Math.max(0, hlMan - cargaRef);
      }
    } else {
      for (const [classeId, cfg] of Object.entries(form.turmasConfig)) {
        if (cfg.ativo) {
          const tPorTurma = temposDisc[classeId] || 2;
          const qtdObrig = Number(cfg.qtdObrigatoria) || 0;
          const qtdExt = Number(cfg.qtdExtra) || 0;
          const txtEf = (cfg.turmasEf || '').trim();
          const txtHe = (cfg.turmasHe || '').trim();

          if (isEpEmHe) {
            // Em regime de HE do EP, toda a turma no secundário conta como Horas Extras
            const totalQtd = qtdObrig + qtdExt;
            if (totalQtd > 0) {
              const subExtra = totalQtd * tPorTurma;
              hlExtra += subExtra;
              turmasArray.push({
                classe: classeId,
                disciplina: disc,
                qtdTurmas: totalQtd,
                temposPorTurma: tPorTurma,
                tipo: 'EXTRA',
                turmasNomes: txtHe || txtEf || ''
              });
              const rotuloTurmas = (txtHe || txtEf) ? ` [${txtHe || txtEf}]` : '';
              turmasTextoPartes.push(`${classeId}${rotuloTurmas} (${totalQtd}T HE × ${tPorTurma}h)`);
            }
          } else {
            // Titular regular: soma turmas obrigatórias e turmas extras
            if (qtdObrig > 0) {
              hlObrigatoria += qtdObrig * tPorTurma;
              turmasArray.push({
                classe: classeId,
                disciplina: disc,
                qtdTurmas: qtdObrig,
                temposPorTurma: tPorTurma,
                tipo: 'OBRIGATORIA',
                turmasNomes: txtEf
              });
            }
            if (qtdExt > 0) {
              hlExtra += qtdExt * tPorTurma;
              turmasArray.push({
                classe: classeId,
                disciplina: disc,
                qtdTurmas: qtdExt,
                temposPorTurma: tPorTurma,
                tipo: 'EXTRA',
                turmasNomes: txtHe
              });
            }
            const desc = [];
            if (qtdObrig > 0) desc.push(`${qtdObrig}T Obrig${txtEf ? ` [${txtEf}]` : ''}`);
            if (qtdExt > 0) desc.push(`${qtdExt}T HE${txtHe ? ` [${txtHe}]` : ''}`);
            if (desc.length > 0) {
              turmasTextoPartes.push(`${classeId} (${desc.join(' + ')} × ${tPorTurma}h)`);
            }
          }
        }
      }
    }

    // Soma das horas de todas as funções de gestão acumuladas
    const hgCalculado = (form.funcoesGestao || []).reduce((acc, sigla) => {
      const g = GESTAO_OPCOES.find(item => item.sigla.toUpperCase() === sigla.toUpperCase());
      return acc + (g ? g.hg : 0);
    }, 0);

    const hlTotal = hlObrigatoria + hlExtra;
    const totalHoras = hlTotal + hgCalculado;

    let horasExtrasFinal = 0;
    if (isEpEmHe) {
      horasExtrasFinal = totalHoras; // 100% Horas Extras
    } else {
      const cargaBase = Number(form.temposObrigatorios) || 20;
      // Abater o somatório de HG da meta obrigatória (20h, 24h ou 28h)
      const excessoTotal = Math.max(0, totalHoras - cargaBase);
      horasExtrasFinal = hlExtra + excessoTotal;
    }

    return {
      hlObrigatoria,
      hlExtra,
      hl: hlTotal,
      hg: hgCalculado,
      total: totalHoras,
      he: horasExtrasFinal,
      turmas: turmasArray,
      turmasTexto: turmasTextoPartes.join(', ') || 'Nenhuma turma atribuída'
    };
  };

  const apuramento = calcularCargaLocal();

  const handleOpenAdd = () => {
    setEditingId(null);
    setPassoModal(1);
    setForm({
      nomeCompleto: '',
      celular: '',
      nuit: '',
      sexo: 'M',
      codCarreira: 'DN1',
      vinculo: 'Quadro',
      regimeEB: 'REGULAR',
      temposObrigatorios: 20,
      disciplinaPrincipal: 'Português',
      funcoesGestao: [],
      turmasConfig: {
        '7ª': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' },
        '8ª': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' },
        '9ª': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' },
        '10ª': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' },
        '11ª Letras': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' },
        '11ª Ciências': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' },
        '12ª Letras': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' },
        '12ª Ciências': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' }
      },
      modoManual: false,
      hlManual: 16,
      observacoes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (d) => {
    setEditingId(d.id);
    setPassoModal(1);

    const initCfg = {
      '7ª': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' },
      '8ª': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' },
      '9ª': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' },
      '10ª': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' },
      '11ª Letras': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' },
      '11ª Ciências': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' },
      '12ª Letras': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' },
      '12ª Ciências': { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' }
    };

    let hasParsed = false;
    try {
      if (d.turmasJSON) {
        const arr = typeof d.turmasJSON === 'string' ? JSON.parse(d.turmasJSON) : d.turmasJSON;
        if (Array.isArray(arr) && arr.length > 0) {
          for (const item of arr) {
            if (initCfg[item.classe]) {
              const isExt = item.tipo === 'EXTRA';
              initCfg[item.classe] = {
                ativo: true,
                qtdObrigatoria: isExt ? 0 : Number(item.qtdTurmas) || 1,
                qtdExtra: isExt ? Number(item.qtdTurmas) || 1 : 0,
                turmasEf: !isExt ? (item.turmasNomes || '') : (initCfg[item.classe].turmasEf || ''),
                turmasHe: isExt ? (item.turmasNomes || '') : (initCfg[item.classe].turmasHe || '')
              };
              hasParsed = true;
            }
          }
        }
      }
    } catch (e) { }

    let funcoesParsed = [];
    if (Array.isArray(d.funcoesGestao)) {
      funcoesParsed = d.funcoesGestao;
    } else if (d.codCargoGestao) {
      funcoesParsed = d.codCargoGestao.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    }

    setForm({
      nomeCompleto: d.nomeCompleto || '',
      celular: d.celular || '',
      nuit: d.nuit || '',
      sexo: d.sexo || 'M',
      codCarreira: d.codCarreira || 'DN1',
      vinculo: d.vinculo === 'Contratado' ? 'Contratado' : 'Quadro',
      regimeEB: d.regimeEB || 'REGULAR',
      temposObrigatorios: Number(d.temposObrigatorios) || 20,
      disciplinaPrincipal: d.disciplinas || 'Português',
      funcoesGestao: funcoesParsed,
      turmasConfig: initCfg,
      modoManual: !hasParsed && Number(d.horasLectivas) > 0,
      hlManual: Number(d.horasLectivas) || 16,
      observacoes: d.observacoes || ''
    });
    setShowModal(true);
  };

  const toggleFuncaoGestao = (sigla) => {
    setForm(prev => {
      const upper = sigla.toUpperCase();
      const current = prev.funcoesGestao || [];
      const exists = current.some(s => s.toUpperCase() === upper);
      const updated = exists
        ? current.filter(s => s.toUpperCase() !== upper)
        : [...current, sigla];
      return { ...prev, funcoesGestao: updated };
    });
  };

  const changeTurmaNomes = (classeId, field, val) => {
    setForm(prev => ({
      ...prev,
      turmasConfig: {
        ...prev.turmasConfig,
        [classeId]: { ...prev.turmasConfig[classeId], [field]: val }
      }
    }));
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

  const toggleTurmaCheckbox = (classeId) => {
    setForm(prev => {
      const cfg = prev.turmasConfig[classeId] || { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' };
      return {
        ...prev,
        turmasConfig: {
          ...prev.turmasConfig,
          [classeId]: { ...cfg, ativo: !cfg.ativo }
        }
      };
    });
  };

  const changeTurmaQtdObrig = (classeId, qtd) => {
    const val = Math.max(0, Math.min(10, Number(qtd) || 0));
    setForm(prev => ({
      ...prev,
      turmasConfig: {
        ...prev.turmasConfig,
        [classeId]: { ...prev.turmasConfig[classeId], qtdObrigatoria: val }
      }
    }));
  };

  const changeTurmaQtdExtra = (classeId, qtd) => {
    const val = Math.max(0, Math.min(10, Number(qtd) || 0));
    setForm(prev => ({
      ...prev,
      turmasConfig: {
        ...prev.turmasConfig,
        [classeId]: { ...prev.turmasConfig[classeId], qtdExtra: val }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nomeCompleto.trim()) {
      alert('Por favor, informe o nome do docente.');
      return;
    }

    const ap = calcularCargaLocal();

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
        tipoEnsinoDocente: 'ES',
        regimeEB: form.regimeEB,
        temposObrigatorios: Number(form.temposObrigatorios),
        disciplinas: form.disciplinaPrincipal,
        codCargoGestao: (form.funcoesGestao || []).join(', '),
        funcoesGestao: form.funcoesGestao || [],
        horasGestao: ap.hg,
        horasLectivas: ap.hl,
        totalHoras: ap.total,
        horasExtras: ap.he,
        turmasTexto: ap.turmasTexto,
        turmas: ap.turmas,
        horasLectivasManual: ap.hl,
        observacoes: form.observacoes.trim()
      });
      setShowModal(false);
      loadDocentes();
    } catch (err) {
      alert('Erro ao salvar docente: ' + err.message);
    }
  };

  // Alternar ordenação
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
        (d.disciplinas || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.celular || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.nuit || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.turmasTexto || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (!matchSearch) return false;

      if (filtroDisciplina !== 'TODAS' && d.disciplinas !== filtroDisciplina) return false;
      if (filtroVinculo !== 'TODOS' && d.vinculo !== filtroVinculo) return false;

      if (filtroRegimeEB === 'EP_HE' && d.regimeEB !== 'EP_EM_HE') return false;
      if (filtroRegimeEB === 'TITULAR' && d.regimeEB === 'EP_EM_HE') return false;

      return true;
    });

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'totalHoras' || sortField === 'horasExtras' || sortField === 'horasLectivas' || sortField === 'horasGestao') {
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
  }, [docentes, searchTerm, filtroDisciplina, filtroVinculo, filtroRegimeEB, sortField, sortDirection]);

  return (
    <div className="space-y-6">
      {/* Barra Superior & Filtros Dinâmicos */}
      <div className="card p-5 border-l-4 border-l-blue-800 bg-white shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-blue">
                {isEB ? 'Ensino Básico (7ª à 9ª Classe)' : 'Ensino Secundário Geral (7ª à 12ª)'}
              </span>
              <span className="badge badge-slate">Ano Lectivo {ano}</span>
              {isEB && (
                <span className="badge badge-yellow font-bold">
                  Suporte a Docentes do EP em Regime de HE
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="text-blue-800" size={22} />
              Quadro de Docentes do Secundário (Cad_Docentes_EB_ES) — {escola?.nomeAbreviado}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Matriz Curricular • Distinção de Turmas Obrigatórias (20h, 24h ou 28h) e Horas Extras (HE)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar professor, disciplina, NUIT..."
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
              Cadastrar Docente Secundário
            </button>
          </div>
        </div>

        {/* Filtros Dinâmicos */}
        <div className="flex flex-wrap items-center gap-2.5 mt-4 pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
            <Filter size={13} /> Filtrar:
          </span>

          {/* Filtro de Disciplinas */}
          <select
            value={filtroDisciplina}
            onChange={(e) => setFiltroDisciplina(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold"
          >
            <option value="TODAS">Todas as Disciplinas</option>
            {DISCIPLINAS_OPCOES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* Filtro de Vínculo */}
          <select
            value={filtroVinculo}
            onChange={(e) => setFiltroVinculo(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold"
          >
            <option value="TODOS">Todos Vínculos</option>
            <option value="Quadro">Quadro</option>
            <option value="Contratado">Contratado</option>
          </select>

          {/* Filtro EB */}
          {isEB && (
            <select
              value={filtroRegimeEB}
              onChange={(e) => setFiltroRegimeEB(e.target.value)}
              className="text-xs bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-1 text-amber-900 font-bold"
            >
              <option value="TODOS">Todos os Enquadramentos EB</option>
              <option value="TITULAR">Apenas Titulares do Secundário</option>
              <option value="EP_HE">Professores do EP em Horas Extras (HE)</option>
            </select>
          )}

          <span className="text-[11px] text-slate-400 ml-auto font-medium">
            Exibindo <strong>{processedDocentes.length}</strong> de {docentes.length} professores
          </span>
        </div>
      </div>

      {/* Tabela Dinâmica e Profissional de Docentes Secundário */}
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
                    <span>Nome do Professor</span>
                    {sortField === 'nomeCompleto' ? (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    ) : <ArrowUpDown size={12} className="opacity-40" />}
                  </div>
                </th>
                <th
                  className="py-3 px-3 w-32 cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('disciplinas')}
                >
                  <div className="flex items-center gap-1">
                    <span>Disciplina</span>
                    {sortField === 'disciplinas' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </div>
                </th>
                <th className="py-3 px-3 w-28">Vínculo / Regime</th>
                <th className="py-3 px-4 min-w-[220px]">Classes & Turmas Atribuídas</th>
                <th className="py-3 px-3 w-32">Função Gestão</th>
                <th
                  className="py-3 px-2 w-16 text-center cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('horasLectivas')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>HL</span>
                    {sortField === 'horasLectivas' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </div>
                </th>
                <th className="py-3 px-2 w-16 text-center">HG</th>
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
                <th className="py-3 px-3 w-32 text-center">Estado da Carga</th>
                <th className="py-3 px-3 w-20 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {processedDocentes.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-slate-400">
                    Nenhum docente registado corresponde aos critérios selecionados.<br />
                    Clique em <strong>"Cadastrar Docente Secundário"</strong> para adicionar professores.
                  </td>
                </tr>
              ) : (
                processedDocentes.map((d, i) => {
                  const tot = Number(d.totalHoras) || 0;
                  const he = Number(d.horasExtras) || 0;
                  const hl = Number(d.horasLectivas) || 0;
                  const hg = Number(d.horasGestao) || 0;
                  const isEpEmHe = d.regimeEB === 'EP_EM_HE';

                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      <td className="py-3 px-3 text-center font-bold text-slate-400">
                        {i + 1}
                      </td>

                      {/* Nome do Professor com largura ampla e sem aperto */}
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

                      {/* Disciplina */}
                      <td className="py-3 px-3">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 font-extrabold text-xs border border-blue-200">
                          {d.disciplinas}
                        </span>
                      </td>

                      {/* Vínculo e Regime Especial EB */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 block text-xs">{d.codCarreira || 'DN1'}</span>
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold mt-0.5 ${d.vinculo === 'Quadro'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                          {d.vinculo}
                        </span>
                        {isEpEmHe && (
                          <span className="badge badge-yellow text-[9px] block mt-1 font-bold">
                            Prof. EP em HE
                          </span>
                        )}
                      </td>

                      {/* Classes e Turmas Atribuídas */}
                      <td className="py-3 px-4">
                        <span className="text-xs text-slate-800 font-semibold block leading-tight">
                          {d.turmasTexto || '—'}
                        </span>
                        {!isEpEmHe && d.temposObrigatorios && (
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                            Carga Obrigatória: <strong>{d.temposObrigatorios}h</strong>
                          </span>
                        )}
                      </td>

                      {/* Função de Gestão */}
                      <td className="py-3 px-3">
                        {d.codCargoGestao ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 font-bold text-xs border border-amber-200">
                            {d.codCargoGestao} (+{hg}h)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Horas: HL, HG, Total, HE */}
                      <td className="py-3 px-2 text-center font-semibold text-slate-800">{hl}h</td>
                      <td className="py-3 px-2 text-center font-semibold text-slate-800">{hg}h</td>
                      <td className="py-3 px-3 text-center font-extrabold text-slate-900">{tot}h</td>

                      <td className="py-3 px-3 text-center">
                        {he > 0 ? (
                          <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                            +{he}h
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">0h</span>
                        )}
                      </td>

                      {/* Estado da Carga */}
                      <td className="py-3 px-3 text-center">
                        {isEpEmHe ? (
                          <span className="badge badge-green font-bold text-[10px]">
                            100% Horas Extras
                          </span>
                        ) : tot > 24 ? (
                          <span className="badge badge-green font-bold text-[10px]">
                            Sobrecarga (+{he}h)
                          </span>
                        ) : tot >= 16 ? (
                          <span className="badge badge-slate text-[10px]">
                            Equilibrada ({tot}h)
                          </span>
                        ) : (
                          <span className="badge badge-yellow text-[10px]">
                            Reduzida ({tot}h)
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

      {/* Modal de Cadastro / Edição com Formulário em 3 Fases (Sem Rolagem Vertical) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 transform transition-all">
            {/* Topo do Modal com Indicador de Fases */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 font-bold flex items-center justify-center shrink-0">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                    {editingId ? 'Editar Professor (Secundário)' : 'Cadastrar Novo Docente (Secundário)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Fase {passoModal} de 3 — {passoModal === 1 ? 'Identificação & Regime' : (passoModal === 2 ? 'Disciplina & Turmas' : 'Apuramento & Resumo')}
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
              {/* FASE 1: DADOS DO DOCENTE, IDENTIFICAÇÃO & REGIME EB       */}
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

                  {/* Informações Administrativas */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Contacto / Celular</label>
                      <input
                        type="text"
                        value={form.celular}
                        onChange={(e) => setForm({ ...form, celular: e.target.value })}
                        placeholder="84xxxxxxx"
                        className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">NUIT</label>
                      <input
                        type="text"
                        value={form.nuit}
                        onChange={(e) => setForm({ ...form, nuit: e.target.value })}
                        placeholder="123456789"
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
                  </div>

                  {/* Carreira e Tempos Obrigatórios */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Carreira Docente</label>
                      <select
                        value={form.codCarreira}
                        onChange={(e) => setForm({ ...form, codCarreira: e.target.value })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-slate-50"
                      >
                        <option value="DN1">DN1 (Licenciatura)</option>
                        <option value="DN2">DN2 (Bacharelato)</option>
                        <option value="DN3">DN3 (Médio)</option>
                        <option value="DN4">DN4 (Básico)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tempos Obrigatórios</label>
                      <select
                        disabled={form.regimeEB === 'EP_EM_HE'}
                        value={form.temposObrigatorios}
                        onChange={(e) => setForm({ ...form, temposObrigatorios: Number(e.target.value) })}
                        className={`w-full text-xs border rounded-lg px-2.5 py-2 font-bold ${form.regimeEB === 'EP_EM_HE' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-white border-blue-300 text-slate-800'
                          }`}
                      >
                        <option value={20}>20 Tempos (Padrão DN1/DN2)</option>
                        <option value={24}>24 Tempos (Padrão DN3)</option>
                        <option value={28}>28 Tempos (Padrão DN4)</option>
                      </select>
                    </div>
                  </div>

                  {/* Regra Especial de Escolas EB: Enquadramento do Docente */}
                  {isEB && (
                    <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl space-y-1.5">
                      <span className="text-xs font-bold text-amber-950 block flex items-center gap-1.5">
                        <ShieldCheck size={15} className="text-amber-800" />
                        Enquadramento do Docente na Escola Básica (EB):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className={`p-2 rounded-lg border cursor-pointer text-xs flex items-start gap-2 ${form.regimeEB === 'REGULAR' ? 'border-blue-700 bg-blue-50 font-bold text-blue-900' : 'border-slate-300 bg-white text-slate-700'
                          }`}>
                          <input
                            type="radio"
                            name="regimeEB"
                            checked={form.regimeEB === 'REGULAR'}
                            onChange={() => setForm({ ...form, regimeEB: 'REGULAR' })}
                            className="mt-0.5"
                          />
                          <div>
                            <span>Docente Titular do Secundário</span>
                            <span className="text-[10px] block font-normal text-slate-500">Carga obrigatória cumprida no ES</span>
                          </div>
                        </label>

                        <label className={`p-2 rounded-lg border cursor-pointer text-xs flex items-start gap-2 ${form.regimeEB === 'EP_EM_HE' ? 'border-amber-700 bg-amber-100 font-bold text-amber-950 shadow-xs' : 'border-slate-300 bg-white text-slate-700'
                          }`}>
                          <input
                            type="radio"
                            name="regimeEB"
                            checked={form.regimeEB === 'EP_EM_HE'}
                            onChange={() => setForm({ ...form, regimeEB: 'EP_EM_HE' })}
                            className="mt-0.5"
                          />
                          <div>
                            <span>Docente Efectivo no EP em Regime de HE</span>
                            <span className="text-[10px] block font-normal text-amber-800">100% das horas no ES são Horas Extras</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

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
                      Próximo: Disciplina & Turmas →
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* FASE 2: DISCIPLINA, CARGO & MARCAÇÃO DE TURMAS            */}
              {/* ======================================================== */}
              {passoModal === 2 && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  {/* Disciplina Principal */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <BookOpen size={14} className="text-blue-700" />
                        Disciplina Principal de Ensino *
                      </label>
                      <select
                        value={form.disciplinaPrincipal}
                        onChange={(e) => setForm({ ...form, disciplinaPrincipal: e.target.value })}
                        className="w-full text-xs border border-blue-400 rounded-lg px-2.5 py-2 bg-white font-bold text-blue-900"
                      >
                        {DISCIPLINAS_OPCOES.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:text-right">
                      <span className="text-[10px] font-semibold text-slate-500 block">Carga Semanal Obrigatória:</span>
                      <span className="text-sm font-extrabold text-blue-900">{form.temposObrigatorios} Tempos / Semana</span>
                    </div>
                  </div>

                  {/* Funções de Gestão com Caixinhas Múltiplas (DT, DD, CC, CAA, etc.) */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-blue-700" />
                        Funções de Gestão e Coordenação Pedagógica (Acumuláveis):
                      </label>
                      <span className="text-[11px] font-bold text-blue-900 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-full">
                        Total HG: {apuramento.hg}h semanais
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {GESTAO_OPCOES.map(g => {
                        const isChecked = (form.funcoesGestao || []).some(s => s.toUpperCase() === g.sigla.toUpperCase());
                        return (
                          <label
                            key={g.sigla}
                            className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${isChecked
                                ? 'bg-blue-50/80 border-blue-500 font-bold text-blue-900 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleFuncaoGestao(g.sigla)}
                                className="w-3.5 h-3.5 rounded text-blue-700 border-slate-300"
                              />
                              <span className="truncate">{g.label}</span>
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-500 ml-1">+{g.hg}h</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grelha de Marcação de Classes: Turmas Obrigatórias vs Turmas em Horas Extras + Caixinhas de Turmas */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                          <Calculator size={14} className="text-blue-700" />
                          Distribuição de Turmas por Classe ({form.disciplinaPrincipal})
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Marque as classes e indique a quantidade e nomes de turmas:
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setForm({ ...form, modoManual: !form.modoManual })}
                        className="text-[10px] font-semibold text-blue-700 hover:underline cursor-pointer"
                      >
                        {form.modoManual ? 'Cálculo Automático' : 'Ajuste Manual'}
                      </button>
                    </div>

                    {!form.modoManual ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {classesDisponiveis.map(cls => {
                          const cfg = form.turmasConfig[cls.id] || { ativo: false, qtdObrigatoria: 1, qtdExtra: 0, turmasEf: '', turmasHe: '' };
                          const temposUnit = (MATRIZ_TEMPOS_DISCIPLINA[form.disciplinaPrincipal] || {})[cls.id] || 0;
                          const isEpEmHe = form.regimeEB === 'EP_EM_HE';

                          return (
                            <div
                              key={cls.id}
                              className={`p-2 rounded-xl border transition-all ${cfg.ativo
                                  ? 'bg-blue-50/70 border-blue-400 shadow-xs'
                                  : 'bg-white border-slate-200 opacity-80'
                                }`}
                            >
                              <label className="flex items-center justify-between cursor-pointer mb-1.5">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="checkbox"
                                    checked={cfg.ativo}
                                    onChange={() => toggleTurmaCheckbox(cls.id)}
                                    className="w-3.5 h-3.5 rounded text-blue-700 border-slate-300"
                                  />
                                  <span className="text-xs font-bold text-slate-900">{cls.label}</span>
                                </div>
                                <span className="text-[9px] font-semibold text-slate-500">
                                  {temposUnit}h
                                </span>
                              </label>

                              {isEpEmHe ? (
                                <div className="space-y-1.5 text-[10px] bg-amber-100/60 p-1.5 rounded border border-amber-200">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-amber-950 font-bold">Turmas HE:</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="10"
                                      disabled={!cfg.ativo}
                                      value={cfg.qtdExtra || cfg.qtdObrigatoria}
                                      onChange={(e) => changeTurmaQtdExtra(cls.id, e.target.value)}
                                      className="w-10 text-center text-xs font-bold py-0.5 border border-amber-400 rounded bg-white text-amber-900"
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="text"
                                      disabled={!cfg.ativo}
                                      value={cfg.turmasHe || ''}
                                      onChange={(e) => changeTurmaNomes(cls.id, 'turmasHe', e.target.value)}
                                      placeholder="Ex: 7ª1, 7ª2"
                                      className="w-full text-center text-[10px] font-mono font-bold py-0.5 border border-amber-300 rounded bg-white text-amber-950"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-1 text-[10px]">
                                    <span className="text-slate-600 font-medium">Obrig.:</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="10"
                                      disabled={!cfg.ativo}
                                      value={cfg.qtdObrigatoria}
                                      onChange={(e) => changeTurmaQtdObrig(cls.id, e.target.value)}
                                      className={`w-9 text-center text-xs font-bold py-0.5 border rounded ${cfg.ativo ? 'bg-white border-blue-300 text-blue-900' : 'bg-slate-100 border-slate-200 text-slate-400'
                                        }`}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between gap-1 text-[10px]">
                                    <span className="text-emerald-700 font-bold">HE:</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="10"
                                      disabled={!cfg.ativo}
                                      value={cfg.qtdExtra}
                                      onChange={(e) => changeTurmaQtdExtra(cls.id, e.target.value)}
                                      className={`w-9 text-center text-xs font-bold py-0.5 border rounded ${cfg.ativo ? 'bg-white border-emerald-400 text-emerald-900' : 'bg-slate-100 border-slate-200 text-slate-400'
                                        }`}
                                    />
                                  </div>
                                  {cfg.ativo && (
                                    <div className="mt-1 pt-1 border-t border-slate-200/60 space-y-1">
                                      <input
                                        type="text"
                                        value={cfg.turmasEf || ''}
                                        onChange={(e) => changeTurmaNomes(cls.id, 'turmasEf', e.target.value)}
                                        placeholder="Turmas Ef (ex: 8ª1)"
                                        className="w-full text-center text-[9px] font-mono font-semibold py-0.5 border border-blue-200 rounded bg-white text-blue-900"
                                      />
                                      {Number(cfg.qtdExtra) > 0 && (
                                        <input
                                          type="text"
                                          value={cfg.turmasHe || ''}
                                          onChange={(e) => changeTurmaNomes(cls.id, 'turmasHe', e.target.value)}
                                          placeholder="Turmas HE (ex: 8ª2)"
                                          className="w-full text-center text-[9px] font-mono font-semibold py-0.5 border border-amber-300 rounded bg-white text-amber-900"
                                        />
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg flex items-center gap-3">
                        <label className="text-xs font-bold text-amber-900">Horas Lectivas Manuais (HL):</label>
                        <input
                          type="number"
                          min="0"
                          max="60"
                          value={form.hlManual}
                          onChange={(e) => setForm({ ...form, hlManual: Number(e.target.value) })}
                          className="w-24 text-xs font-bold border border-amber-400 rounded-lg px-2.5 py-1 bg-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Rodapé Fase 2 com Cancelar, Voltar e Próximo */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn-secondary text-xs cursor-pointer text-slate-600 hover:text-slate-800"
                    >
                      Cancelar
                    </button>
                    <div className="flex items-center gap-2">
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
                        className="btn-primary text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Próximo: Apuramento & Resumo</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* FASE 3: APURAMENTO DA CARGA & CONFIRMAÇÃO                 */}
              {/* ======================================================== */}
              {passoModal === 3 && (
                <div className="space-y-3.5 animate-in fade-in duration-200">
                  {/* Cartão de Apuramento Oficial ao Vivo */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Apuramento Oficial de Carga Horária
                        </span>
                        <div className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                          <span>HL: <strong className="text-blue-800">{apuramento.hl}h</strong></span>
                          {apuramento.hg > 0 && <span>+ HG: <strong className="text-amber-700">{apuramento.hg}h</strong></span>}
                          <span>= <strong>{apuramento.total}h Total</strong></span>
                        </div>
                      </div>

                      <div>
                        {form.regimeEB === 'EP_EM_HE' ? (
                          <span className="badge badge-green text-xs font-bold px-3 py-1 shadow-xs">
                            100% Horas Extras (+{apuramento.he}h HE)
                          </span>
                        ) : apuramento.he > 0 ? (
                          <span className="badge badge-green text-xs font-bold px-3 py-1 shadow-xs">
                            Sobrecarga Conforme (+{apuramento.he}h HE)
                          </span>
                        ) : apuramento.total >= 16 ? (
                          <span className="badge badge-blue text-xs font-bold px-3 py-1">
                            Carga Conforme ({apuramento.total}h)
                          </span>
                        ) : (
                          <span className="badge badge-yellow text-xs font-bold px-3 py-1">
                            Carga Reduzida ({apuramento.total}h &lt; {form.temposObrigatorios}h)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-semibold">Docente & Disciplina</span>
                        <strong className="text-slate-900 block truncate">{form.nomeCompleto || 'Sem nome'}</strong>
                        <span className="text-[10px] text-blue-900 font-bold">{form.disciplinaPrincipal} • {form.codCarreira}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-semibold">Função de Gestão & Regime</span>
                        <strong className="text-slate-900 block truncate">{(form.funcoesGestao || []).join(', ') || 'Docência Exclusiva'}</strong>
                        <span className="text-[10px] text-slate-600 font-medium">Obrigatório: {form.temposObrigatorios}h semanais</span>
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-slate-200 text-xs">
                      <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">Turmas Atribuídas:</span>
                      <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                        {apuramento.turmasTexto || 'Nenhuma turma selecionada'}
                      </p>
                    </div>
                  </div>

                  {/* Observações */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Observações Opcionais</label>
                    <textarea
                      rows={2}
                      value={form.observacoes}
                      onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                      placeholder="Informações adicionais do docente para o Mapa 1.3..."
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  {/* Rodapé Fase 3 com Cancelar, Voltar e Salvar */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn-secondary text-xs cursor-pointer text-slate-600 hover:text-slate-800"
                    >
                      Cancelar
                    </button>
                    <div className="flex items-center gap-2">
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
                        {editingId ? 'Salvar Alterações' : 'Concluir Cadastro'}
                      </button>
                    </div>
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
