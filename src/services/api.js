const API_BASE = '/api';

export const api = {
  // Status
  getStatus: () => fetch(`${API_BASE}/status`).then(r => r.json()),

  // ZIPs
  getZips: () => fetch(`${API_BASE}/zips`).then(r => r.json()),

  // Escolas
  getEscolas: (tipo, zip) => {
    const params = new URLSearchParams();
    if (tipo) params.append('tipo', tipo);
    if (zip) params.append('zip', zip);
    return fetch(`${API_BASE}/escolas?${params.toString()}`).then(r => r.json());
  },
  getEscola: (id) => fetch(`${API_BASE}/escolas/${id}`).then(r => r.json()),
  atualizarEscola: (id, dados) => {
    return fetch(`${API_BASE}/escolas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    }).then(r => r.json());
  },

  // Docentes
  getDocentes: (idEscola, ano = 2026, search = '') => {
    const params = new URLSearchParams({ idEscola, ano });
    if (search) params.append('search', search);
    return fetch(`${API_BASE}/docentes?${params.toString()}`).then(r => r.json());
  },
  getTodosDocentesDistrito: (ano = 2026) => {
    return fetch(`${API_BASE}/docentes?idEscola=all&ano=${ano}`).then(r => r.json());
  },
  salvarDocente: (docente) => {
    return fetch(`${API_BASE}/docentes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docente)
    }).then(r => r.json());
  },
  excluirDocente: (id) => {
    return fetch(`${API_BASE}/docentes/${id}`, { method: 'DELETE' }).then(r => r.json());
  },

  // Funcionários Não Docentes
  getFuncionarios: (idEscola, ano = 2026) => {
    const params = new URLSearchParams({ idEscola, ano });
    return fetch(`${API_BASE}/funcionarios?${params.toString()}`).then(r => r.json());
  },
  salvarFuncionario: (func) => {
    return fetch(`${API_BASE}/funcionarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(func)
    }).then(r => r.json());
  },
  excluirFuncionario: (id) => {
    return fetch(`${API_BASE}/funcionarios/${id}`, { method: 'DELETE' }).then(r => r.json());
  },

  // Resumo Distrital
  getDistritoResumo: (ano = 2026) => {
    return fetch(`${API_BASE}/distrito/resumo?ano=${ano}`).then(r => r.json());
  },

  // URLs de Exportação
  getExportWordUrl: (idEscola, ano = 2026, mapa = '1.3') => {
    return `${API_BASE}/exportar/word?idEscola=${idEscola}&ano=${ano}&mapa=${mapa}`;
  },
  getExportExcelUrl: (idEscola, ano = 2026, mapa = '1.3') => {
    return `${API_BASE}/exportar/excel?idEscola=${idEscola}&ano=${ano}&mapa=${mapa}`;
  },

  // ------------------ GESTÃO SDEJT & SEGURANÇA ------------------ //
  loginSDEJT: (senha) => {
    return fetch(`${API_BASE}/auth/sdejt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha })
    }).then(async r => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro na autenticação');
      return data;
    });
  },

  alterarSenhaSDEJT: (novaSenha, senhaMestre) => {
    return fetch(`${API_BASE}/auth/sdejt/alterar-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ novaSenha, senhaMestre })
    }).then(async r => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro ao alterar senha');
      return data;
    });
  },

  getConfiguracoes: () => fetch(`${API_BASE}/configuracoes`).then(r => r.json()),
  salvarConfiguracoes: (dados) => {
    return fetch(`${API_BASE}/configuracoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    }).then(r => r.json());
  },

  getMatrizCurricular: () => fetch(`${API_BASE}/matriz-curricular`).then(r => r.json()),
  salvarMatrizCurricular: (disciplinas, ano = 2026) => {
    return fetch(`${API_BASE}/matriz-curricular`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disciplinas, ano })
    }).then(async r => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro ao salvar matriz');
      return data;
    });
  },

  transicaoAnoLectivo: (anoOrigem, anoDestino) => {
    return fetch(`${API_BASE}/ano-lectivo/transicao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anoOrigem, anoDestino })
    }).then(async r => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro na transição de ano letivo');
      return data;
    });
  },

  transferirFAE: (dados) => {
    return fetch(`${API_BASE}/transferencias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    }).then(async r => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro ao transferir FAE');
      return data;
    });
  },

  getTransferencias: (ano = 2026) => fetch(`${API_BASE}/transferencias?ano=${ano}`).then(r => r.json()),

  getNotificacoes: (idEscola, ano = 2026) => {
    const params = new URLSearchParams({ idEscola, ano });
    return fetch(`${API_BASE}/notificacoes?${params.toString()}`).then(r => r.json());
  },

  marcarNotificacaoLida: (id) => {
    return fetch(`${API_BASE}/notificacoes/${id}/lida`, { method: 'PUT' }).then(r => r.json());
  },

  atualizarCadastroEscola: (id, dados) => {
    return fetch(`${API_BASE}/escolas/${id}/cadastro`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    }).then(async r => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro ao atualizar dados cadastrais');
      return data;
    });
  }
};

