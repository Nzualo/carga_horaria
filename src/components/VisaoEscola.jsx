import React, { useState, useEffect } from 'react';
import { School, Users, Clock, AlertTriangle, ArrowRight, Award, MapPin } from 'lucide-react';
import { api } from '../services/api';

export default function VisaoEscola({ escola, ano, onNavigate }) {
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!escola?.id) return;
      try {
        const data = await api.getDocentes(escola.id, ano);
        setDocentes(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    load();
  }, [escola?.id, ano]);

  const totalDocentes = docentes.length;
  const totalHL = docentes.reduce((acc, d) => acc + (Number(d.horasLectivas) || 0), 0);
  const totalHG = docentes.reduce((acc, d) => acc + (Number(d.horasGestao) || 0), 0);
  const totalHoras = docentes.reduce((acc, d) => acc + (Number(d.totalHoras) || 0), 0);
  const totalHE = docentes.reduce((acc, d) => acc + (Number(d.horasExtras) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Banner da Escola */}
      <div className="card p-6 border-l-4 border-l-blue-800 bg-gradient-to-r from-white to-blue-50/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-blue">Tipologia: {escola?.tipo}</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin size={13} className="text-slate-400" />
                {escola?.nomeZIP || 'Inhassoro'}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {escola?.nomeOficial}
            </h2>
            <p className="text-slate-500 text-xs mt-1">
              Código da Escola (COD): <strong className="text-slate-700">{escola?.codigoMEC || 'S/N'}</strong> • Sede Pedagógica: <strong className="text-slate-700">{escola?.sedeZIP || 'Distrital'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate(escola?.tipo === 'EP' ? 'docentes_ep' : 'docentes_es')}
              className="btn-primary text-xs"
            >
              <Users size={16} />
              Gerir Efectivo Docente
            </button>
            <button
              onClick={() => onNavigate('exportador')}
              className="btn-secondary text-xs"
            >
              Exportar Mapas
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Docentes Cadastrados</span>
            <Users size={16} className="text-blue-700" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">
            {totalDocentes}
          </div>
          <span className="text-xs text-slate-500">Professores em exercício</span>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Horas Lectivas (HL)</span>
            <Clock size={16} className="text-emerald-700" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">
            {totalHL} h
          </div>
          <span className="text-xs text-slate-500">Aulas presenciais</span>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Horas de Gestão (HG)</span>
            <Award size={16} className="text-blue-700" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">
            {totalHG} h
          </div>
          <span className="text-xs text-slate-500">Cargos de direção / apoio</span>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Horas Extras (HE)</span>
            <AlertTriangle size={16} className="text-amber-600" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-amber-600">
            {totalHE} h
          </div>
          <span className="text-xs text-slate-500">Aprovadas pelo SDEJT</span>
        </div>
      </div>
    </div>
  );
}

