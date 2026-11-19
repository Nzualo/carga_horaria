import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus, Search, Edit2, Trash2, Users, Building, ShieldCheck,
  Phone, CheckCircle, Save, X, Briefcase, ArrowUpDown, ChevronUp, ChevronDown, Filter
} from 'lucide-react';
import { api } from '../services/api';

const CARGOS_SUGERIDOS = [
  'Chefe de Secretaria',
  'Técnico de Administração / Escriturário',
  'Agente de Serviço / Auxiliar',
  'Guarda / Vigilante',
  'Contínuo / Limpeza',
  'Bibliotecário / Apoio Pedagógico',
  'Motorista',
  'Operador de Cópia / Reprografia',
  'Outro Cargo Administrativo'
];

export default function FuncionariosNaoDocentes({ escola, ano, onUpdated }) {
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroVinculo, setFiltroVinculo] = useState('TODOS');
  const [filtroCargo, setFiltroCargo] = useState('TODOS');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [passoModal, setPassoModal] = useState(1);

  // Ordenação de colunas
  const [sortField, setSortField] = useState('nomeCompleto');
  const [sortDirection, setSortDirection] = useState('asc');

  const [form, setForm] = useState({
    nomeCompleto: '',
    sexo: 'M',
    contacto: '',
    nuit: '',
    cargoFuncao: 'Chefe de Secretaria',
    outroCargo: '',
    vinculo: 'Quadro',
    observacoes: ''
  });

  const loadFuncionarios = async () => {
    if (!escola?.id) return;
    setLoading(true);
    try {
      const data = await api.getFuncionarios(escola.id, ano);
      setFuncionarios(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar funcionários:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFuncionarios();
  }, [escola?.id, ano]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setPassoModal(1);
    setForm({
      nomeCompleto: '',
      sexo: 'M',
      contacto: '',
      nuit: '',
      cargoFuncao: 'Chefe de Secretaria',
      outroCargo: '',
      vinculo: 'Quadro',
      observacoes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (f) => {
    setEditingId(f.id);
    setPassoModal(1);
    const isCustom = !CARGOS_SUGERIDOS.includes(f.cargoFuncao);
    setForm({
      nomeCompleto: f.nomeCompleto || '',
      sexo: f.sexo || 'M',
      contacto: f.contacto || '',
      nuit: f.nuit || '',
      cargoFuncao: isCustom ? 'Outro Cargo Administrativo' : f.cargoFuncao,
      outroCargo: isCustom ? f.cargoFuncao : '',
      vinculo: f.vinculo || 'Quadro',
      observacoes: f.observacoes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover este funcionário não docente?')) return;
    try {
      await api.excluirFuncionario(id);
      loadFuncionarios();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nomeCompleto.trim()) {
      alert('Por favor, informe o nome completo.');
      return;
    }

    const funcaoFinal = form.cargoFuncao === 'Outro Cargo Administrativo' && form.outroCargo.trim()
      ? form.outroCargo.trim()
      : form.cargoFuncao;

    try {
      await api.salvarFuncionario({
        id: editingId,
        idEscola: escola.id,
        anoLectivo: ano,
        nomeCompleto: form.nomeCompleto.trim(),
        sexo: form.sexo,
        contacto: form.contacto.trim(),
        nuit: form.nuit.trim(),
        cargoFuncao: funcaoFinal,
        vinculo: form.vinculo, // Estritamente 'Quadro' ou 'Contratado'
        observacoes: form.observacoes.trim()
      });
      setShowModal(false);
      loadFuncionarios();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert('Erro ao salvar funcionário: ' + err.message);
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

  // Filtragem e ordenação dinâmica
  const processedFuncionarios = useMemo(() => {
    let list = funcionarios.filter(f => {
      const matchSearch = (
        (f.nomeCompleto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.cargoFuncao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.nuit || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.contacto || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (!matchSearch) return false;

      if (filtroVinculo !== 'TODOS' && f.vinculo !== filtroVinculo) return false;
      if (filtroCargo !== 'TODOS' && f.cargoFuncao !== filtroCargo) return false;

      return true;
    });

    list.sort((a, b) => {
      const aVal = String(a[sortField] || '').toLowerCase();
      const bVal = String(b[sortField] || '').toLowerCase();
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [funcionarios, searchTerm, filtroVinculo, filtroCargo, sortField, sortDirection]);

  // Totais analíticos
  const totalGeral = funcionarios.length;
  const noQuadro = funcionarios.filter(f => f.vinculo === 'Quadro').length;
  const contratados = funcionarios.filter(f => f.vinculo === 'Contratado').length;
  const homens = funcionarios.filter(f => (f.sexo || 'M').toUpperCase() === 'M').length;
  const mulheres = funcionarios.filter(f => (f.sexo || 'M').toUpperCase() === 'F').length;

  return (
    <div className="space-y-6">
      {/* Barra de Ações Superior & Filtros */}
      <div className="card p-5 border-l-4 border-l-blue-800 bg-white shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-blue">Corpo Técnico Administrativo (CTA)</span>
              <span className="badge badge-slate">Ano Lectivo {ano}</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase className="text-blue-800" size={22} />
              Quadro de Pessoal Não Docente — {escola?.nomeAbreviado}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Secretarias, Técnicos de Apoio, Guardas, Agentes de Serviço e Vigilância
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar funcionário, cargo..."
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
              Cadastrar Funcionário
            </button>
          </div>
        </div>

        {/* 4 Cards de Totais em Destaque */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Não Docentes</span>
            <span className="text-2xl font-extrabold text-blue-900 block mt-0.5">{totalGeral}</span>
            <span className="text-[10px] text-slate-400">Contabilizados no Menu Principal</span>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Do Quadro</span>
            <span className="text-2xl font-extrabold text-emerald-900 block mt-0.5">{noQuadro}</span>
            <span className="text-[10px] text-emerald-700">{totalGeral > 0 ? ((noQuadro / totalGeral) * 100).toFixed(0) : 0}% do efectivo</span>
          </div>
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
            <span className="text-[10px] font-bold text-amber-800 uppercase block">Contratados</span>
            <span className="text-2xl font-extrabold text-amber-900 block mt-0.5">{contratados}</span>
            <span className="text-[10px] text-amber-700">{totalGeral > 0 ? ((contratados / totalGeral) * 100).toFixed(0) : 0}% do efectivo</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Por Género</span>
            <span className="text-sm font-bold text-slate-800 block mt-1">
              {homens} Homens • {mulheres} Mulheres
            </span>
            <span className="text-[10px] text-slate-400">Distribuição por sexo</span>
          </div>
        </div>
      </div>

      {/* Tabela Dinâmica de Funcionários */}
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
                    <span>Nome Completo</span>
                    {sortField === 'nomeCompleto' ? (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    ) : <ArrowUpDown size={12} className="opacity-40" />}
                  </div>
                </th>
                <th
                  className="py-3 px-3 w-44 cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('cargoFuncao')}
                >
                  <div className="flex items-center gap-1">
                    <span>Cargo / Função</span>
                    {sortField === 'cargoFuncao' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </div>
                </th>
                <th className="py-3 px-3 w-28">Vínculo</th>
                <th className="py-3 px-3 w-36">Contacto / Celular</th>
                <th className="py-3 px-3 w-32">NUIT</th>
                <th className="py-3 px-2 w-16 text-center">Sexo</th>
                <th className="py-3 px-4 min-w-[180px]">Observações</th>
                <th className="py-3 px-3 w-20 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {processedFuncionarios.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    Nenhum funcionário não docente registado nesta escola.<br />
                    Clique em <strong>"Cadastrar Funcionário"</strong> para adicionar secretários e auxiliares.
                  </td>
                </tr>
              ) : (
                processedFuncionarios.map((f, i) => (
                  <tr
                    key={f.id}
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    <td className="py-3 px-3 text-center font-bold text-slate-400">
                      {i + 1}
                    </td>

                    {/* Nome Completo Amplo e Bem Visível */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-sm text-slate-900 group-hover:text-blue-900 leading-snug">
                        {f.nomeCompleto}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Registado em: {new Date(f.criadoEm || Date.now()).toLocaleDateString('pt-MZ')}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 font-bold text-xs border border-blue-200">
                        {f.cargoFuncao}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold ${f.vinculo === 'Quadro'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                        {f.vinculo}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {f.contacto ? (
                        <span className="flex items-center gap-1">
                          <Phone size={11} className="text-blue-600" /> {f.contacto}
                        </span>
                      ) : '—'}
                    </td>

                    <td className="py-3 px-3 text-slate-600 font-mono font-semibold">
                      {f.nuit || '—'}
                    </td>

                    <td className="py-3 px-2 text-center font-semibold text-slate-800">
                      {f.sexo === 'F' ? 'F' : 'M'}
                    </td>

                    <td className="py-3 px-4 text-slate-500 truncate max-w-xs">
                      {f.observacoes || '—'}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(f)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          title="Editar Funcionário"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                          title="Excluir Funcionário"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro / Edição em 2 Fases (Sem Rolagem Vertical) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 transform transition-all">
            {/* Topo do Modal com Indicador de Fases */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 font-bold flex items-center justify-center shrink-0">
                  <Briefcase size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                    {editingId ? 'Editar Funcionário Não Docente' : 'Cadastrar Novo Funcionário (CTA)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Fase {passoModal} de 2 — {passoModal === 1 ? 'Identificação & Contactos' : 'Cargo, Função & Confirmação'}
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

            {/* Stepper Visual */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${passoModal >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
              <div className={`h-1.5 rounded-full transition-all duration-300 ${passoModal >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
            </div>

            <form onSubmit={handleSubmit}>
              {/* FASE 1: DADOS PESSOAIS E VÍNCULO */}
              {passoModal === 1 && (
                <div className="space-y-3.5 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo do Funcionário *</label>
                    <input
                      type="text"
                      required
                      value={form.nomeCompleto}
                      onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })}
                      placeholder="ex: Cândido Albino Nzualo"
                      className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Contacto / Celular</label>
                      <input
                        type="text"
                        value={form.contacto}
                        onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                        placeholder="84xxxxxxx / 82xxxxxxx"
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">NUIT</label>
                      <input
                        type="text"
                        value={form.nuit}
                        onChange={(e) => setForm({ ...form, nuit: e.target.value })}
                        placeholder="ex: 109234812"
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
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
                          alert('Por favor, informe o nome completo do funcionário antes de prosseguir.');
                          return;
                        }
                        setPassoModal(2);
                      }}
                      className="btn-primary text-xs shadow-md cursor-pointer"
                    >
                      Próximo: Função & Atribuição →
                    </button>
                  </div>
                </div>
              )}

              {/* FASE 2: CARGO / FUNÇÃO NO CTA E CONFIRMAÇÃO */}
              {passoModal === 2 && (
                <div className="space-y-3.5 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cargo / Função *</label>
                    <select
                      value={form.cargoFuncao}
                      onChange={(e) => setForm({ ...form, cargoFuncao: e.target.value })}
                      className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-slate-50 font-semibold"
                    >
                      {CARGOS_SUGERIDOS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {form.cargoFuncao === 'Outro Cargo Administrativo' && (
                      <input
                        type="text"
                        placeholder="Especificar a função exacta..."
                        value={form.outroCargo}
                        onChange={(e) => setForm({ ...form, outroCargo: e.target.value })}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 mt-2 bg-white"
                      />
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Resumo da Inscrição:</span>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Funcionário:</span>
                      <strong className="text-slate-900">{form.nomeCompleto}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Vínculo & Sexo:</span>
                      <span className="font-semibold text-blue-900">{form.vinculo} • {form.sexo === 'M' ? 'Masculino' : 'Feminino'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Observações Opcionais</label>
                    <textarea
                      rows={2}
                      value={form.observacoes}
                      onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                      placeholder="Informações adicionais do funcionário..."
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white"
                    />
                  </div>

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
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                    >
                      <Save size={16} />
                      {editingId ? 'Salvar Alterações' : 'Concluir Cadastro'}
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
