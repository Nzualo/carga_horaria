import React, { useState, useEffect } from 'react';
import { School, Search, Filter, Layers, ExternalLink, Edit2, Save, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function ListaEscolasDistrito({ onSelectEscola }) {
  const [escolas, setEscolas] = useState([]);
  const [zips, setZips] = useState([]);
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [filtroZip, setFiltroZip] = useState('');
  const [loading, setLoading] = useState(true);

  // Estado para Edição Cadastral da Escola pelo Gestor SDEJT
  const [escolaEditando, setEscolaEditando] = useState(null);
  const [editForm, setEditForm] = useState({
    nomeOficial: '',
    nomeAbreviado: '',
    codigoMEC: '',
    tipo: 'EP',
    idZip: 1
  });
  const [editSuccess, setEditSuccess] = useState('');
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [esc, zp] = await Promise.all([
        api.getEscolas(),
        api.getZips()
      ]);
      setEscolas(esc || []);
      setZips(zp || []);
      setLoading(false);
    } catch (err) {
      console.error('Erro:', err);
      setLoading(false);
    }
  };

  const handleOpenEdit = (e) => {
    setEscolaEditando(e);
    setEditForm({
      nomeOficial: e.nomeOficial || '',
      nomeAbreviado: e.nomeAbreviado || '',
      codigoMEC: e.codigoMEC || '',
      tipo: e.tipo || 'EP',
      idZip: e.idZip || 1
    });
    setEditSuccess('');
    setEditError('');
  };

  const handleSaveEdit = async (e) => {
    if (e) e.preventDefault();
    if (!escolaEditando) return;
    setSavingEdit(true);
    setEditError('');

    try {
      await api.atualizarCadastroEscola(escolaEditando.id, editForm);
      setEditSuccess('Dados cadastrais da escola atualizados com sucesso!');
      await loadData();
      setTimeout(() => {
        setEscolaEditando(null);
        setEditSuccess('');
      }, 1500);
    } catch (err) {
      setEditError(err.message || 'Erro ao guardar dados da escola');
    } finally {
      setSavingEdit(false);
    }
  };

  const filtered = escolas.filter(e => {
    if (filtroTipo !== 'TODOS' && !e.tipo.includes(filtroTipo)) return false;
    if (filtroZip && String(e.idZip) !== String(filtroZip)) return false;
    if (search && !e.nomeOficial.toLowerCase().includes(search.toLowerCase()) &&
        !String(e.codigoMEC).includes(search) &&
        !e.nomeAbreviado.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Barra de Filtros */}
      <div className="card p-5 border-l-4 border-l-blue-800 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-blue">Gestão Distrital</span>
            <span className="badge badge-green">56 Estabelecimentos</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <School className="text-blue-800" size={22} />
            Catálogo Oficial das 56 Escolas do Distrito de Inhassoro
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Gestão cadastral, correção de nomes oficiais, códigos (COD) e enquadramento nas 16 ZIPs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por escola ou COD..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl w-56 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-semibold"
          >
            <option value="TODOS">Todos os Níveis</option>
            <option value="EP">Ensino Primário (EP)</option>
            <option value="EB">Ensino Básico (EB)</option>
            <option value="ESG">Ensino Secundário (ESG)</option>
            <option value="ETP">Técnico (ETP)</option>
          </select>

          <select
            value={filtroZip}
            onChange={(e) => setFiltroZip(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-semibold"
          >
            <option value="">Todas as 16 ZIPs</option>
            {zips.map(z => (
              <option key={z.id} value={z.id}>ZIP #{z.id}: {z.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Escolas */}
      <div className="card overflow-hidden shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-3 w-12 text-center">ID</th>
                <th className="py-3 px-3 min-w-[100px]">Código (COD)</th>
                <th className="py-3 px-4 min-w-[280px]">Nome Oficial da Escola</th>
                <th className="py-3 px-3 min-w-[160px]">Nome Abreviado</th>
                <th className="py-3 px-3 text-center min-w-[100px]">Tipologia</th>
                <th className="py-3 px-4 min-w-[180px]">Zona Pedagógica (ZIP)</th>
                <th className="py-3 px-4 text-right min-w-[200px]">Acções do SDEJT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-400 text-center">#{e.id}</td>
                  <td className="py-3 px-3 font-mono font-bold text-blue-900">{e.codigoMEC || 'S/N'}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{e.nomeOficial}</td>
                  <td className="py-3 px-3 text-slate-600">{e.nomeAbreviado}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`badge ${
                      e.tipo.includes('ESG') ? 'badge-blue' :
                      e.tipo === 'EB' ? 'badge-green' :
                      e.tipo === 'ETP' ? 'badge-yellow' : 'badge-slate'
                    }`}>
                      {e.tipo}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800 text-xs">ZIP #{e.idZip}</span>
                    <span className="text-[10px] text-slate-400 block">{e.nomeZIP || 'Inhassoro'}</span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(e)}
                      className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-blue-900 font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Editar Dados Cadastrais e Corrigir Nomes"
                    >
                      <Edit2 size={13} className="text-blue-700" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectEscola(e)}
                      className="inline-flex items-center gap-1 text-xs text-blue-800 hover:text-blue-900 font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                      title="Aceder ao Painel da Escola"
                    >
                      <span>Aceder</span>
                      <ExternalLink size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição Cadastral da Escola */}
      {escolaEditando && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setEscolaEditando(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <School size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Editar Cadastro Oficial da Escola #{escolaEditando.id}
                </h3>
                <p className="text-xs text-slate-500">
                  Corrija a designação oficial, sigla, código COD ou tipologia
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Oficial da Escola *</label>
                <input
                  type="text"
                  required
                  value={editForm.nomeOficial}
                  onChange={(e) => setEditForm({ ...editForm, nomeOficial: e.target.value })}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome Abreviado (Sigla) *</label>
                  <input
                    type="text"
                    required
                    value={editForm.nomeAbreviado}
                    onChange={(e) => setEditForm({ ...editForm, nomeAbreviado: e.target.value })}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código da Escola (COD) *</label>
                  <input
                    type="text"
                    required
                    value={editForm.codigoMEC}
                    onChange={(e) => setEditForm({ ...editForm, codigoMEC: e.target.value })}
                    className="w-full text-xs font-mono font-bold border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white text-blue-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipologia / Nível *</label>
                  <select
                    value={editForm.tipo}
                    onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value })}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-800"
                  >
                    <option value="EP">Ensino Primário (EP)</option>
                    <option value="EB">Ensino Básico (EB)</option>
                    <option value="ESG1 e 2">Secundário Geral (ESG 1 e 2)</option>
                    <option value="ESG2">Secundário Geral (ESG 2)</option>
                    <option value="ETP">Ensino Técnico (ETP)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Zona Pedagógica (ZIP) *</label>
                  <select
                    value={editForm.idZip}
                    onChange={(e) => setEditForm({ ...editForm, idZip: Number(e.target.value) })}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-800"
                  >
                    {zips.map(z => (
                      <option key={z.id} value={z.id}>ZIP #{z.id}: {z.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              {editSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  {editSuccess}
                </div>
              )}

              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-900 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600" />
                  {editError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEscolaEditando(null)}
                  className="btn-secondary text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn-primary text-xs flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Save size={15} />
                  {savingEdit ? 'A guardar...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

