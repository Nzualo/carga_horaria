import React, { useState } from 'react';
import MenuPrincipal from './components/MenuPrincipal';
import Navbar from './components/Navbar';
import MenuPrincipalEscola from './components/MenuPrincipalEscola';
import CadastroDocentesEP from './components/CadastroDocentesEP';
import CadastroDocentesES from './components/CadastroDocentesES';
import FuncionariosNaoDocentes from './components/FuncionariosNaoDocentes';
import ResumoEstatistico from './components/ResumoEstatistico';
import DashboardSDEJT from './components/DashboardSDEJT';
import ListaEscolasDistrito from './components/ListaEscolasDistrito';
import MatrizCurricularES from './components/MatrizCurricularES';
import ExportadorOffice from './components/ExportadorOffice';
import ImportadorLote from './components/ImportadorLote';
import AuditoriaConformidade from './components/AuditoriaConformidade';
import IndicadoresRacios from './components/IndicadoresRacios';
import { api } from './services/api';

export default function App() {
  const [autenticado, setAutenticado] = useState(false);
  const [escolaActiva, setEscolaActiva] = useState(null);
  const [anoActual, setAnoActual] = useState(2026);
  const [activeTab, setActiveTab] = useState('menu_escola');

  const handleEntrar = ({ escola, ano }) => {
    setEscolaActiva(escola);
    setAnoActual(ano);
    setAutenticado(true);

    // Definir aba inicial padrão conforme a tipologia:
    // Se for escola: A 1ª aba é o Menu Principal da Escola (Dados Gerais)
    // Se for SDEJT: Painel Distrital
    if (escola.tipo === 'SDEJT') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('menu_escola');
    }
  };

  const handleSair = () => {
    setAutenticado(false);
    setEscolaActiva(null);
  };

  const refreshEscola = async () => {
    if (escolaActiva?.id && escolaActiva.id !== 'sdejt') {
      try {
        const updated = await api.getEscola(escolaActiva.id);
        setEscolaActiva(updated);
      } catch (e) {
        console.error('Erro ao atualizar dados da escola:', e);
      }
    }
  };

  // Se não estiver logado, exibe o Menu Principal de Entrada
  if (!autenticado || !escolaActiva) {
    return (
      <MenuPrincipal
        onEntrar={handleEntrar}
        anoActual={anoActual}
        setAnoActual={setAnoActual}
      />
    );
  }

  return (
    <div className="min-h-screen bg-ambient-pattern flex flex-col text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      {/* Navbar Superior com Botão 3 Barras (Hamburger) */}
      <Navbar
        escola={escolaActiva}
        ano={anoActual}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSair={handleSair}
      />

      {/* Conteúdo Principal da Seção Selecionada com Transição Suave e Profissional */}
      <main className="app-container flex-1 py-6">
        <div key={activeTab} className="tab-pane-transition">
          {/* 1. Menu Principal da Escola (Dados Gerais: Fachada, Direção, Alunos, Turmas) */}
          {activeTab === 'menu_escola' && (
            <MenuPrincipalEscola
              escola={escolaActiva}
              ano={anoActual}
              onSaved={refreshEscola}
            />
          )}

          {/* 1.1 Nova Aba Oficial Escolas: Quadro de Indicadores Pedagógicos e Rácios Oficiais */}
          {activeTab === 'indicadores' && (
            <IndicadoresRacios
              escola={escolaActiva}
              ano={anoActual}
            />
          )}

          {/* 2. Cadastro Docentes EP (Monodocência, Turmas Mistas com Checkboxes, Duplo Turno) */}
          {activeTab === 'docentes_ep' && (
            <CadastroDocentesEP
              escola={escolaActiva}
              ano={anoActual}
            />
          )}

          {/* 3. Cadastro Docentes ES (7ª a 12ª, Marcação de Classes/Turmas, Cálculo Automático) */}
          {activeTab === 'docentes_es' && (
            <CadastroDocentesES
              escola={escolaActiva}
              ano={anoActual}
            />
          )}

          {/* 4. Funcionários Não Docentes (CTA, Apoio, Secretarias, Vigilância) */}
          {activeTab === 'funcionarios_nd' && (
            <FuncionariosNaoDocentes
              escola={escolaActiva}
              ano={anoActual}
              onUpdated={refreshEscola}
            />
          )}

          {/* 5. Resumo Estatístico Oficial com Gráficos Circulares e Barras */}
          {activeTab === 'resumo' && (
            <ResumoEstatistico
              escola={escolaActiva}
              ano={anoActual}
            />
          )}

          {/* 6. Mapas Oficiais */}
          {activeTab === 'mapa_ep' && (
            <CadastroDocentesEP
              escola={escolaActiva}
              ano={anoActual}
            />
          )}

          {(activeTab === 'mapa_es' || activeTab === 'mapa_m23') && (
            <CadastroDocentesES
              escola={escolaActiva}
              ano={anoActual}
            />
          )}

          {activeTab === 'matriz' && (
            <MatrizCurricularES
              ano={anoActual}
              isSDEJT={escolaActiva?.tipo === 'SDEJT'}
            />
          )}

          {/* 7. Central de Exportação Word e Excel */}
          {activeTab === 'exportador' && (
            <ExportadorOffice
              escola={escolaActiva}
              ano={anoActual}
            />
          )}

          {/* 8. Menus Exclusivos do SDEJT (Acesso Distrital Total) */}
          {activeTab === 'dashboard' && (
            <DashboardSDEJT
              ano={anoActual}
              onSelectEscola={(esc) => {
                setEscolaActiva(esc);
                setActiveTab('menu_escola');
              }}
            />
          )}

          {/* 8.1 Nova Aba Oficial SDEJT: Auditor Automático de Conformidade Legal e Incompatibilidades */}
          {activeTab === 'auditoria' && (
            <AuditoriaConformidade
              ano={anoActual}
              onSelectEscola={async (escId) => {
                try {
                  const esc = await api.getEscola(escId);
                  if (esc) {
                    setEscolaActiva(esc);
                    setActiveTab('menu_escola');
                  }
                } catch (e) {
                  console.error('Erro ao abrir escola da auditoria:', e);
                }
              }}
            />
          )}

          {activeTab === 'escolas' && (
            <ListaEscolasDistrito
              onSelectEscola={(esc) => {
                setEscolaActiva(esc);
                setActiveTab('menu_escola');
              }}
            />
          )}

          {activeTab === 'docentes_all' && (
            <CadastroDocentesES
              escola={{ id: 'all', nomeAbreviado: 'Todos os Estabelecimentos' }}
              ano={anoActual}
            />
          )}

          {activeTab === 'importar_lote' && (
            <ImportadorLote
              ano={anoActual}
            />
          )}
        </div>
      </main>

      {/* Rodapé Executivo */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="app-container flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © 2026 Serviço Distrital de Educação, Juventude e Tecnologia de Inhassoro • MINEDH
          </span>
          <span className="font-semibold text-slate-700">
            Sistema Integrado de Gestão Curricular • 56 Escolas em 16 ZIPs
          </span>
        </div>
      </footer>
    </div>
  );
}
