import React, { useState, useEffect, useRef } from 'react';
import {
  School, User, Phone, Users, Layers, Award, Save, CheckCircle2,
  Building, BookOpen, Camera, Trash2, Upload, Briefcase, Edit3, X, Lock
} from 'lucide-react';
import { api } from '../services/api';

export default function MenuPrincipalEscola({ escola, ano, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [contagemDocentes, setContagemDocentes] = useState(0);
  const [contagemNaoDocentes, setContagemNaoDocentes] = useState(0);
  const fileInputRef = useRef(null);

  // Carregar contagens reais da escola
  useEffect(() => {
    async function carregarTotais() {
      if (!escola?.id) return;
      try {
        const [docs, naoDocs] = await Promise.all([
          api.getDocentes(escola.id, ano),
          api.getFuncionarios(escola.id, ano)
        ]);
        // Nas Escolas Básicas (EB), docentes com turmas nos dois níveis são contados apenas 1 única vez
        const uniqueDocs = new Set((docs || []).map(d => (d.nuit || d.nomeCompleto || d.id).toString().trim())).size;
        setContagemDocentes(uniqueDocs);
        setContagemNaoDocentes((naoDocs || []).length);
      } catch (e) {
        console.error('Erro ao carregar totais de pessoal:', e);
      }
    }
    carregarTotais();
  }, [escola?.id, ano]);

  // Form State
  const [formData, setFormData] = useState({
    nomeDirector: escola?.nomeDirector || '',
    contactoDirector: escola?.contactoDirector || '',
    nomeDAP: escola?.nomeDAP || '',
    contactoDAP: escola?.contactoDAP || '',
    nomeChefeSecretaria: escola?.nomeChefeSecretaria || '',
    contactoChefeSecretaria: escola?.contactoChefeSecretaria || '',
    totalAlunosH: escola?.totalAlunosH || 0,
    totalAlunosM: escola?.totalAlunosM || 0,
    localizacao: escola?.localizacao || 'Distrito de Inhassoro',
    fotoUrl: escola?.fotoUrl || ''
  });

  // Turmas por classe
  const [turmasPorClasse, setTurmasPorClasse] = useState(() => {
    try {
      if (escola?.turmasClassesJSON) {
        return typeof escola.turmasClassesJSON === 'string'
          ? JSON.parse(escola.turmasClassesJSON)
          : escola.turmasClassesJSON;
      }
    } catch (e) { }
    if (escola?.tipo === 'EP') {
      return { '1ª': 2, '2ª': 2, '3ª': 2, '4ª': 2, '5ª': 1, '6ª': 1 };
    }
    if (escola?.tipo === 'EB') {
      return { '1ª': 2, '2ª': 2, '3ª': 2, '4ª': 2, '5ª': 1, '6ª': 1, '7ª': 2, '8ª': 2, '9ª': 1 };
    }
    return { '7ª': 3, '8ª': 3, '9ª': 3, '10ª': 3, '11ª Letras': 2, '11ª Ciências': 2, '12ª Letras': 2, '12ª Ciências': 2 };
  });

  useEffect(() => {
    if (escola) {
      setFormData({
        nomeDirector: escola.nomeDirector || '',
        contactoDirector: escola.contactoDirector || '',
        nomeDAP: escola.nomeDAP || '',
        contactoDAP: escola.contactoDAP || '',
        nomeChefeSecretaria: escola.nomeChefeSecretaria || '',
        contactoChefeSecretaria: escola.contactoChefeSecretaria || '',
        totalAlunosH: escola.totalAlunosH || 0,
        totalAlunosM: escola.totalAlunosM || 0,
        localizacao: escola.localizacao || 'Distrito de Inhassoro',
        fotoUrl: escola.fotoUrl || ''
      });
    }
  }, [escola]);

  const handleFotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('A foto selecionada é muito grande. Escolha uma imagem de até 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      setFormData(prev => ({ ...prev, fotoUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const removerFoto = () => {
    setFormData(prev => ({ ...prev, fotoUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalAlunos = Number(formData.totalAlunosH || 0) + Number(formData.totalAlunosM || 0);
  const percentMulheres = totalAlunos > 0
    ? ((Number(formData.totalAlunosM || 0) / totalAlunos) * 100).toFixed(1)
    : '0.0';

  const totalTurmas = Object.values(turmasPorClasse).reduce((a, b) => a + (Number(b) || 0), 0);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!escola?.id || escola.id === 'sdejt') return;
    setLoading(true);

    try {
      await api.atualizarEscola(escola.id, {
        ...formData,
        totalAlunos,
        turmasClassesJSON: turmasPorClasse
      });
      setSavedSuccess(true);
      setModoEdicao(false);
      setTimeout(() => setSavedSuccess(false), 3500);
      if (onSaved) onSaved();
    } catch (err) {
      alert('Erro ao guardar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Banner Oficial de Apresentação da Escola + Foto da Fachada + Botão Editar */}
      <div className="card p-6 border-l-4 border-l-blue-800 bg-white shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Informações da Escola */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="badge badge-blue">Tipologia: {escola?.tipo}</span>
              <span className="badge badge-green">ZIP #{escola?.idZip}: {escola?.nomeZIP}</span>
              <span className="badge badge-slate">Ano Lectivo {ano}</span>
              {escola?.ehSedeZip && (
                <span className="badge badge-yellow font-bold">Sede de ZIP</span>
              )}
              {!modoEdicao ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  <Lock size={11} /> Dados Bloqueados (Modo Leitura)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
                  <Edit3 size={11} /> Modo de Edição Aberto
                </span>
              )}
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {escola?.nomeOficial}
            </h1>
            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
              Nome Abreviado: <strong className="text-slate-800">{escola?.nomeAbreviado}</strong> • Código da Escola (COD): <strong className="text-blue-900 font-mono font-bold">{escola?.codigoMEC || 'S/N'}</strong> • Sede Pedagógica: <strong className="text-slate-800">{escola?.sedeZIP || 'Inhassoro'}</strong>
            </p>

            {/* Botões de Ação para Edição */}
            <div className="mt-4 flex items-center gap-2">
              {!modoEdicao ? (
                <button
                  type="button"
                  onClick={() => setModoEdicao(true)}
                  className="btn-primary text-xs flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Edit3 size={15} />
                  <span>Editar Dados da Escola</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setModoEdicao(false);
                      if (escola) {
                        setFormData({
                          nomeDirector: escola.nomeDirector || '',
                          contactoDirector: escola.contactoDirector || '',
                          nomeDAP: escola.nomeDAP || '',
                          contactoDAP: escola.contactoDAP || '',
                          nomeChefeSecretaria: escola.nomeChefeSecretaria || '',
                          contactoChefeSecretaria: escola.contactoChefeSecretaria || '',
                          totalAlunosH: escola.totalAlunosH || 0,
                          totalAlunosM: escola.totalAlunosM || 0,
                          localizacao: escola.localizacao || 'Distrito de Inhassoro',
                          fotoUrl: escola.fotoUrl || ''
                        });
                      }
                    }}
                    className="btn-secondary text-xs cursor-pointer"
                  >
                    <X size={14} />
                    <span>Cancelar</span>
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSubmit}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Save size={15} />
                    <span>{loading ? 'A guardar...' : 'Guardar Alterações'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Área da Foto Frontal da Fachada */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              disabled={!modoEdicao}
              onChange={handleFotoUpload}
              className="hidden"
            />

            {formData.fotoUrl ? (
              <div className="relative group w-48 h-32 rounded-2xl overflow-hidden border-2 border-blue-600 shadow-md">
                <img
                  src={formData.fotoUrl}
                  alt="Fachada Frontal da Escola"
                  className="w-full h-full object-cover"
                />
                {modoEdicao && (
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 bg-blue-700 text-white rounded-lg hover:bg-blue-600 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                      title="Trocar Foto"
                    >
                      <Upload size={12} />
                      Trocar
                    </button>
                    <button
                      type="button"
                      onClick={removerFoto}
                      className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-500 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                      title="Remover Foto"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
                <span className="absolute bottom-1.5 left-1.5 right-1.5 text-center bg-slate-950/80 text-white text-[9px] py-0.5 rounded font-bold truncate">
                  Fachada Frontal Oficial
                </span>
              </div>
            ) : (
              <div
                onClick={() => {
                  if (modoEdicao) fileInputRef.current?.click();
                }}
                className={`w-48 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-3 text-center transition-all ${modoEdicao
                    ? 'border-blue-400 bg-blue-50/50 hover:bg-blue-50 cursor-pointer group'
                    : 'border-slate-200 bg-slate-50 opacity-80'
                  }`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mb-1">
                  <Camera size={16} />
                </div>
                <span className="text-[11px] font-bold text-slate-700 block">
                  {modoEdicao ? 'Carregar Foto da Escola' : 'Sem Foto Cadastrada'}
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5">
                  {modoEdicao ? 'Clique para selecionar imagem' : 'Active a edição para adicionar foto'}
                </span>
              </div>
            )}
          </div>
        </div>

        {savedSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-600" />
            Dados da Escola e Foto guardados com sucesso na base de dados!
          </div>
        )}
      </div>

      {/* 3 Cards de Pessoal da Escola (Docentes + Não Docentes + Total Geral) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 border-t-4 border-t-blue-800 flex items-center gap-4 bg-linear-to-b from-white to-blue-50/20 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-blue-100/70 text-blue-900 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Efectivo Docente (Professores)
            </span>
            <span className="text-2xl font-black text-blue-950 block mt-0.5">
              {contagemDocentes || escola?.totalDocentesCadastrados || 0}
            </span>
            <span className="text-[10px] text-slate-400">Professores em exercício</span>
          </div>
        </div>

        <div className="card p-4 border-t-4 border-t-amber-600 flex items-center gap-4 bg-linear-to-b from-white to-amber-50/20 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-amber-100/70 text-amber-900 flex items-center justify-center shrink-0">
            <Briefcase size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Funcionários Não Docentes
            </span>
            <span className="text-2xl font-black text-amber-900 block mt-0.5">
              {contagemNaoDocentes || escola?.totalNaoDocentes || 0}
            </span>
            <span className="text-[10px] text-slate-400">Secretaria, guarda e apoio</span>
          </div>
        </div>

        <div className="card p-4 border-t-4 border-t-emerald-600 flex items-center gap-4 bg-linear-to-b from-white to-emerald-50/20 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-100/70 text-emerald-900 flex items-center justify-center shrink-0">
            <Building size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Geral de Pessoal
            </span>
            <span className="text-2xl font-black text-emerald-950 block mt-0.5">
              {(contagemDocentes + contagemNaoDocentes) || escola?.totalPessoalGeral || (Number(escola?.totalDocentesCadastrados || 0) + Number(escola?.totalNaoDocentes || 0))}
            </span>
            <span className="text-[10px] text-slate-400">Total de trabalhadores da instituição</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bloco 1: Equipa de Direção e Gestão Escolar com Tabela Dinâmica e Colunas Largas */}
        <div className="card overflow-hidden shadow-sm border border-slate-200 bg-white">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <User className="text-blue-800" size={18} />
                1. Direcção da Escola e Equipa de Gestão Pedagógica
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Quadro oficial de identificação dos responsáveis da instituição ({modoEdicao ? 'Modo de Edição Activo' : 'Bloqueado para visualização'})
              </p>
            </div>
            <span className="badge badge-blue shrink-0">
              Cargos Directivos Oficiais
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 min-w-[220px]">Cargo / Função Directiva</th>
                  <th className="py-3 px-4 min-w-[340px]">Nome Completo Oficial do Titular</th>
                  <th className="py-3 px-4 min-w-[200px]">Contacto Telefónico / Celular</th>
                  <th className="py-3 px-4 text-center min-w-[130px]">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {/* Linha 1: Director da Escola */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                        DIR
                      </div>
                      <div>
                        <span className="block text-slate-900 font-bold">Director(a) da Escola</span>
                        <span className="text-[10px] text-slate-400 font-normal">Representante Máximo da Instituição</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {modoEdicao ? (
                      <input
                        type="text"
                        value={formData.nomeDirector}
                        onChange={(e) => setFormData({ ...formData, nomeDirector: e.target.value })}
                        placeholder="ex: Cândido Albino Nzualo"
                        className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
                      />
                    ) : (
                      <span className="font-bold text-slate-900 text-xs block">
                        {formData.nomeDirector || <span className="text-slate-400 italic font-normal">Pendente de indicação</span>}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {modoEdicao ? (
                      <input
                        type="text"
                        value={formData.contactoDirector}
                        onChange={(e) => setFormData({ ...formData, contactoDirector: e.target.value })}
                        placeholder="ex: 84xxxxxxx / 82xxxxxxx"
                        className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
                      />
                    ) : (
                      <span className="font-mono text-slate-700 font-semibold text-xs block">
                        {formData.contactoDirector || <span className="text-slate-400 italic font-normal">Sem contacto</span>}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {formData.nomeDirector ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 size={12} className="text-emerald-600" /> Atribuído
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                        Pendente
                      </span>
                    )}
                  </td>
                </tr>

                {/* Linha 2: DAP */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                        DAP
                      </div>
                      <div>
                        <span className="block text-slate-900 font-bold">Director(a) Adjunto(a) Pedagógico(a)</span>
                        <span className="text-[10px] text-slate-400 font-normal">Coordenação Técnico-Pedagógica</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {modoEdicao ? (
                      <input
                        type="text"
                        value={formData.nomeDAP}
                        onChange={(e) => setFormData({ ...formData, nomeDAP: e.target.value })}
                        placeholder="ex: Alberto João Macuácua"
                        className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
                      />
                    ) : (
                      <span className="font-bold text-slate-900 text-xs block">
                        {formData.nomeDAP || <span className="text-slate-400 italic font-normal">Pendente de indicação</span>}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {modoEdicao ? (
                      <input
                        type="text"
                        value={formData.contactoDAP}
                        onChange={(e) => setFormData({ ...formData, contactoDAP: e.target.value })}
                        placeholder="ex: 84xxxxxxx / 82xxxxxxx"
                        className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
                      />
                    ) : (
                      <span className="font-mono text-slate-700 font-semibold text-xs block">
                        {formData.contactoDAP || <span className="text-slate-400 italic font-normal">Sem contacto</span>}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {formData.nomeDAP ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 size={12} className="text-emerald-600" /> Atribuído
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                        Pendente
                      </span>
                    )}
                  </td>
                </tr>

                {/* Linha 3: Chefe de Secretaria */}
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                        SEC
                      </div>
                      <div>
                        <span className="block text-slate-900 font-bold">Chefe de Secretaria / Apoio</span>
                        <span className="text-[10px] text-slate-400 font-normal">Administração e Arquivo Geral</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {modoEdicao ? (
                      <input
                        type="text"
                        value={formData.nomeChefeSecretaria}
                        onChange={(e) => setFormData({ ...formData, nomeChefeSecretaria: e.target.value })}
                        placeholder="ex: Faustino Zacarias Vilanculos"
                        className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
                      />
                    ) : (
                      <span className="font-bold text-slate-900 text-xs block">
                        {formData.nomeChefeSecretaria || <span className="text-slate-400 italic font-normal">Não aplicável / Pendente</span>}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {modoEdicao ? (
                      <input
                        type="text"
                        value={formData.contactoChefeSecretaria}
                        onChange={(e) => setFormData({ ...formData, contactoChefeSecretaria: e.target.value })}
                        placeholder="ex: 84xxxxxxx / 82xxxxxxx"
                        className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
                      />
                    ) : (
                      <span className="font-mono text-slate-700 font-semibold text-xs block">
                        {formData.contactoChefeSecretaria || <span className="text-slate-400 italic font-normal">Sem contacto</span>}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {formData.nomeChefeSecretaria ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 size={12} className="text-emerald-600" /> Atribuído
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                        Opcional
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bloco 2: Efectivo Estudantil (Total de Alunos por Sexo) */}
        <div className="card p-6 bg-white shadow-sm border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="text-emerald-700" size={18} />
              2. Efectivo Estudantil — Alunos Matriculados no Ano Lectivo {ano}
            </h2>
            <span className="text-xs text-slate-400">Totais oficiais por género</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-xs font-bold text-slate-600 mb-1">Alunos Rapazes (Homens):</label>
              {modoEdicao ? (
                <input
                  type="number"
                  min="0"
                  value={formData.totalAlunosH}
                  onChange={(e) => setFormData({ ...formData, totalAlunosH: Number(e.target.value) })}
                  className="w-full text-lg font-bold border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-900"
                />
              ) : (
                <span className="text-2xl font-extrabold text-slate-900 block mt-1">{formData.totalAlunosH}</span>
              )}
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-xs font-bold text-slate-600 mb-1">Alunas Raparigas (Mulheres):</label>
              {modoEdicao ? (
                <input
                  type="number"
                  min="0"
                  value={formData.totalAlunosM}
                  onChange={(e) => setFormData({ ...formData, totalAlunosM: Number(e.target.value) })}
                  className="w-full text-lg font-bold border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-900"
                />
              ) : (
                <span className="text-2xl font-extrabold text-slate-900 block mt-1">{formData.totalAlunosM}</span>
              )}
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col justify-center">
              <span className="text-xs font-bold text-blue-900 uppercase">Total Geral de Alunos</span>
              <span className="text-2xl font-extrabold text-blue-900 mt-1">{totalAlunos}</span>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col justify-center">
              <span className="text-xs font-bold text-emerald-900 uppercase">Proporção Raparigas (%)</span>
              <span className="text-2xl font-extrabold text-emerald-900 mt-1">{percentMulheres}%</span>
            </div>
          </div>
        </div>

        {/* Bloco 3: Distribuição de Turmas por Classe */}
        <div className="card p-6 bg-white shadow-sm border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="text-blue-800" size={18} />
              3. Número de Turmas em Funcionamento por Classe
            </h2>
            <span className="badge badge-blue">
              Total: {totalTurmas} Turmas
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.keys(turmasPorClasse).map(cls => (
              <div key={cls} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800">{cls}</span>
                {modoEdicao ? (
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={turmasPorClasse[cls] || 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setTurmasPorClasse(prev => ({ ...prev, [cls]: val }));
                    }}
                    className="w-16 text-center text-xs font-bold border border-slate-300 rounded-lg py-1 bg-white"
                  />
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
                    {turmasPorClasse[cls] || 0} {turmasPorClasse[cls] === 1 ? 'Turma' : 'Turmas'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Botão de Salvar Inferior se estiver em modo de edição */}
        {modoEdicao && (
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => setModoEdicao(false)}
              className="btn-secondary text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Save size={16} />
              {loading ? 'A guardar dados...' : 'Guardar Alterações da Escola'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
