/* ============================================================
   APP — Canes Solution Portfolio
   Responsabilidades:
   - Seed de 20 registros (apenas se LocalStorage estiver vazio)
   - CRUD de mensagens (listar/editar/excluir/excluir-todas/exportar)
   - Render do painel administrativo (cards responsivos)
   - Formulário de contato (validação + persistência + webhook)
   - Painel oculto: 5 cliques no gatilho do rodapé + senha
   - Escape de HTML contra XSS

   Organização:
   1. Utilitários (escape, datas, IDs)
   2. Storage
   3. Seed
   4. Messages (CRUD)
   5. Automation (webhook)
   6. AdminUI (render + ações do painel)
   7. Admin (gatilho oculto + senha)
   8. ContactForm (submit + integração com webhook)
   9. Bootstrap do app
   ============================================================ */

(function () {
  'use strict';

  /* 1. UTILITÁRIOS */

  const CFG = window.CONFIG || {};
  const STORAGE_KEY = CFG.STORAGE_KEY || 'canes_portfolio_messages';
  const SEED_SIZE = Number(CFG.SEED_SIZE) || 20;

  function escapeHTML(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function formatarData(iso) {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (_) {
      return iso;
    }
  }

  function statusToClass(status) {
    const mapa = {
      'novo': 'status-novo',
      'em análise': 'status-em-analise',
      'respondido': 'status-respondido',
      'arquivado': 'status-arquivado'
    };
    return mapa[status] || 'status-novo';
  }

  function getBootstrapModal(el) {
    if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
      console.error('[App] Bootstrap Modal indisponível. Verifique o CDN.');
      return null;
    }
    if (!el) return null;
    return bootstrap.Modal.getOrCreateInstance(el);
  }

  /* 2. STORAGE */

  const Storage = {
    read() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.warn('[Storage] Falha ao ler localStorage:', err);
        return [];
      }
    },

    write(list) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        return true;
      } catch (err) {
        console.error('[Storage] Falha ao gravar localStorage:', err);
        return false;
      }
    },

    ensureSeed() {
      const existente = this.read();
      if (existente.length > 0) return existente;
      const seeded = buildSeedData();
      this.write(seeded);
      console.info(`[Storage] Seed de ${seeded.length} registros injetado.`);
      return seeded;
    }
  };

  /* 3. SEED */

  function buildSeedData() {
    const diasAtras = (n) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d.toISOString();
    };

    const base = [
      { nome: 'Mariana Costa', email: 'mariana.costa@example.com', assunto: 'Proposta de projeto frontend', mensagem: 'Olá! Vi seu portfólio e gostaria de conversar sobre um projeto de landing page responsiva para nossa startup. Tem disponibilidade nas próximas semanas?', status: 'novo', obs: '' },
      { nome: 'Rafael Almeida', email: 'rafael.almeida@example.com', assunto: 'Colaboração em projeto open source', mensagem: 'Tenho interesse em colaborar com um dos seus projetos no GitHub. Posso contribuir com issues de acessibilidade e responsividade.', status: 'em análise', obs: 'Aguardando resposta do Rafael com escopo.' },
      { nome: 'Juliana Ferreira', email: 'juliana.f@example.com', assunto: 'Feedback sobre o site', mensagem: 'Achei o portfólio muito organizado e a navegação mobile excelente. Sugiro apenas revisar o contraste do rodapé.', status: 'respondido', obs: 'Agradeci e anotei sugestão de contraste.' },
      { nome: 'Bruno Santos', email: 'bruno.santos@example.com', assunto: 'Dúvida sobre Bootstrap', mensagem: 'Estou começando com Bootstrap e gostaria de saber como você organizou as classes do grid nos cards de projetos.', status: 'novo', obs: '' },
      { nome: 'Camila Rodrigues', email: 'camila.r@example.com', assunto: 'Oportunidade freelance', mensagem: 'Estamos buscando um desenvolvedor frontend para um projeto de 3 meses. Podemos agendar uma conversa?', status: 'novo', obs: '' },
      { nome: 'Lucas Oliveira', email: 'lucas.oliveira@example.com', assunto: 'Sobre acessibilidade', mensagem: 'Vi que você se preocupa com acessibilidade. Poderia indicar materiais sobre ARIA e navegação por teclado?', status: 'respondido', obs: 'Enviei 3 links de referência.' },
      { nome: 'Fernanda Lima', email: 'fernanda.lima@example.com', assunto: 'Parceria em conteúdo', mensagem: 'Escrevo um blog sobre frontend e gostaria de propor uma parceria para publicação de artigos técnicos.', status: 'em análise', obs: 'Avaliar alinhamento editorial.' },
      { nome: 'Diego Pereira', email: 'diego.pereira@example.com', assunto: 'Orçamento para landing page', mensagem: 'Preciso de uma landing page simples, com formulário de contato e integração com e-mail. Qual seu prazo e orçamento?', status: 'novo', obs: '' },
      { nome: 'Patrícia Souza', email: 'patricia.souza@example.com', assunto: 'Sugestão de melhoria', mensagem: 'Sugiro adicionar um tema escuro opcional. O site já é leve, seria um diferencial interessante.', status: 'respondido', obs: 'Adicionei ao backlog de melhorias.' },
      { nome: 'Thiago Martins', email: 'thiago.martins@example.com', assunto: 'Processo seletivo', mensagem: 'Trabalho no RH da empresa X e gostaria de saber se você está aberto a oportunidades CLT júnior em frontend.', status: 'novo', obs: '' },
      { nome: 'Amanda Ribeiro', email: 'amanda.ribeiro@example.com', assunto: 'Dúvida sobre LocalStorage', mensagem: 'Como você estrutura o LocalStorage para manter as mensagens do formulário? Queria entender a modelagem.', status: 'em análise', obs: 'Responder com exemplo de payload.' },
      { nome: 'Gustavo Carvalho', email: 'gustavo.carvalho@example.com', assunto: 'Projeto de voluntariado', mensagem: 'Somos uma ONG buscando site institucional simples. Teríamos como adaptar seu portfólio como base?', status: 'novo', obs: '' },
      { nome: 'Beatriz Nascimento', email: 'beatriz.n@example.com', assunto: 'Feedback positivo', mensagem: 'Adorei a seção de tendências tecnológicas, especialmente Edge Computing. Parabéns pela clareza dos textos.', status: 'respondido', obs: 'Agradeci o retorno.' },
      { nome: 'Henrique Barbosa', email: 'henrique.barbosa@example.com', assunto: 'Proposta de mentoria', mensagem: 'Sou iniciante em frontend e gostaria de saber se você oferece mentoria ou acompanhamento pontual.', status: 'em análise', obs: 'Avaliar disponibilidade de agenda.' },
      { nome: 'Larissa Gomes', email: 'larissa.gomes@example.com', assunto: 'Entrevista para blog', mensagem: 'Gostaria de te entrevistar sobre transição de carreira para frontend. Seria para um post curto no blog da comunidade.', status: 'novo', obs: '' },
      { nome: 'Vinícius Araújo', email: 'vinicius.araujo@example.com', assunto: 'Sobre formulário e webhook', mensagem: 'Como você integrou o webhook do formulário sem backend? Queria replicar a mesma abordagem em um projeto pessoal.', status: 'respondido', obs: 'Expliquei uso de Formspree + fallback webhook.site.' },
      { nome: 'Carolina Pinto', email: 'carolina.pinto@example.com', assunto: 'Projeto de ONG', mensagem: 'Precisamos de ajuda com um site para captação de doadores. Você teria interesse em participar como voluntário?', status: 'novo', obs: '' },
      { nome: 'Eduardo Mendes', email: 'eduardo.mendes@example.com', assunto: 'Feedback sobre responsividade', mensagem: 'Testei o site em vários dispositivos e o layout se manteve consistente em todos. Sugiro só ajustar o espaçamento no iPad.', status: 'arquivado', obs: 'Feedback incorporado na Etapa 3.' },
      { nome: 'Renata Cardoso', email: 'renata.cardoso@example.com', assunto: 'Colaboração acadêmica', mensagem: 'Sou professora e gostaria de usar seu portfólio como exemplo de boas práticas em uma disciplina de introdução ao frontend.', status: 'em análise', obs: 'Verificar termos de uso.' },
      { nome: 'Felipe Teixeira', email: 'felipe.teixeira@example.com', assunto: 'Oportunidade CLT', mensagem: 'Temos uma vaga júnior em nosso time e seu perfil parece aderente. Podemos marcar uma conversa inicial?', status: 'arquivado', obs: 'Já preenchida por outro candidato.' }
    ];

    const offsets = [1, 2, 4, 6, 9, 12, 15, 18, 22, 25, 28, 32, 35, 38, 42, 45, 48, 52, 55, 58];

    return base.slice(0, SEED_SIZE).map((item, i) => ({
      id: `seed-${i + 1}-${Date.now()}`,
      nome: item.nome,
      email: item.email,
      assunto: item.assunto,
      mensagem: item.mensagem,
      dataISO: diasAtras(offsets[i] !== undefined ? offsets[i] : 60 + i),
      status: item.status,
      observacoes: item.obs || ''
    }));
  }

  /* 4. MESSAGES (CRUD) */

  const Messages = {
    list() {
      return Storage.read()
        .slice()
        .sort((a, b) => new Date(b.dataISO).getTime() - new Date(a.dataISO).getTime());
    },

    getById(id) {
      return Storage.read().find((m) => m.id === id) || null;
    },

    add({ nome, email, assunto, mensagem }) {
      const novo = {
        id: generateId(),
        nome: (nome || '').trim(),
        email: (email || '').trim(),
        assunto: (assunto || '').trim(),
        mensagem: (mensagem || '').trim(),
        dataISO: new Date().toISOString(),
        status: 'novo',
        observacoes: ''
      };
      const lista = Storage.read();
      lista.unshift(novo);
      Storage.write(lista);
      return novo;
    },

    update(id, patch) {
      const lista = Storage.read();
      const idx = lista.findIndex((m) => m.id === id);
      if (idx === -1) return null;
      lista[idx] = { ...lista[idx], ...patch };
      Storage.write(lista);
      return lista[idx];
    },

    remove(id) {
      const lista = Storage.read();
      const nova = lista.filter((m) => m.id !== id);
      Storage.write(nova);
      return lista.length !== nova.length;
    },

    removeAll() {
      Storage.write([]);
    },

    count() {
      return Storage.read().length;
    }
  };

  /* 5. AUTOMATION */

  const Automation = {
    async send(payload) {
      const url = (CFG.WEBHOOK_URL || '').trim();

      if (!url || url.startsWith('[PREENCHER')) {
        console.warn(
          '[Automation] WEBHOOK_URL não configurado. ' +
          'Defina em js/config.js para habilitar a notificação externa.'
        );
        return { ok: false, reason: 'not_configured' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn(`[Automation] Webhook respondeu HTTP ${response.status}.`);
          return { ok: false, reason: 'http_error', status: response.status };
        }

        console.info('[Automation] Webhook respondeu OK.');
        return { ok: true };
      } catch (err) {
        clearTimeout(timeoutId);
        if (err && err.name === 'AbortError') {
          console.warn('[Automation] Timeout (10s) ao contatar o webhook.');
          return { ok: false, reason: 'timeout' };
        }
        console.warn('[Automation] Falha no envio:', err);
        return { ok: false, reason: 'network', error: err };
      }
    }
  };

  /* 6. ADMIN UI */

  const AdminUI = {
    el(id) {
      return document.getElementById(id);
    },

    render() {
      const container = this.el('adminMessageList');
      const countEl = this.el('adminCount');
      if (!container) return;

      const lista = Messages.list();
      if (countEl) countEl.textContent = String(lista.length);

      if (lista.length === 0) {
        container.innerHTML =
          '<div class="col-12"><div class="alert alert-info mb-0">Nenhuma mensagem cadastrada.</div></div>';
        return;
      }

      container.innerHTML = lista
        .map((msg) => {
          const preview =
            msg.mensagem.length > 140
              ? msg.mensagem.slice(0, 137) + '…'
              : msg.mensagem;
          return `
            <div class="col-12 col-md-6 col-xl-4">
              <article class="card h-100">
                <div class="card-body d-flex flex-column">
                  <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                    <h3 class="h6 card-title mb-0">${escapeHTML(msg.nome)}</h3>
                    <span class="status-badge ${statusToClass(msg.status)}">
                      ${escapeHTML(msg.status)}
                    </span>
                  </div>
                  <p class="small text-muted mb-1">
                    ${escapeHTML(msg.email)} · ${escapeHTML(formatarData(msg.dataISO))}
                  </p>
                  <p class="fw-semibold mb-1 small">${escapeHTML(msg.assunto)}</p>
                  <p class="small text-muted flex-grow-1 mb-2">${escapeHTML(preview)}</p>
                  <div class="d-flex gap-2 mt-auto">
                    <button type="button" class="btn btn-sm btn-outline-primary"
                            data-admin-action="edit" data-id="${msg.id}">Editar</button>
                    <button type="button" class="btn btn-sm btn-outline-danger"
                            data-admin-action="delete" data-id="${msg.id}">Excluir</button>
                  </div>
                </div>
              </article>
            </div>
          `;
        })
        .join('');
    },

    feedback(text, variant = 'info') {
      const el = this.el('adminFeedback');
      if (!el) return;
      el.innerHTML = `<div class="alert alert-${variant} mb-0">${escapeHTML(text)}</div>`;
      clearTimeout(this._fbTimer);
      this._fbTimer = setTimeout(() => {
        el.innerHTML = '';
      }, 4000);
    },

    abrirEdicao(id) {
      const msg = Messages.getById(id);
      if (!msg) {
        this.feedback('Mensagem não encontrada.', 'danger');
        return;
      }

      this.el('adminEditId').value = msg.id;
      this.el('adminEditMeta').textContent =
        `${msg.nome} · ${msg.email} · ${formatarData(msg.dataISO)}`;
      this.el('adminEditAssunto').textContent = msg.assunto;
      this.el('adminEditMensagem').textContent = msg.mensagem;
      this.el('adminEditStatus').value = msg.status;
      this.el('adminEditObs').value = msg.observacoes || '';

      const modal = getBootstrapModal(this.el('adminEditModal'));
      if (modal) modal.show();
    },

    salvarEdicao() {
      const id = this.el('adminEditId').value;
      if (!id) return;

      const status = this.el('adminEditStatus').value;
      const observacoes = this.el('adminEditObs').value;

      const atualizado = Messages.update(id, { status, observacoes });
      if (!atualizado) {
        this.feedback('Falha ao atualizar a mensagem.', 'danger');
        return;
      }

      this.feedback('Mensagem atualizada com sucesso.', 'success');
      this.render();

      const modal = getBootstrapModal(this.el('adminEditModal'));
      if (modal) modal.hide();
    },

    excluir(id) {
      const msg = Messages.getById(id);
      if (!msg) return;

      const ok = window.confirm(
        `Excluir a mensagem de "${msg.nome}" sobre "${msg.assunto}"?`
      );
      if (!ok) return;

      if (Messages.remove(id)) {
        this.feedback('Mensagem excluída.', 'success');
        this.render();
      } else {
        this.feedback('Falha ao excluir a mensagem.', 'danger');
      }
    },

    excluirTodas() {
      if (!window.confirm('Excluir TODAS as mensagens? Esta ação é irreversível.')) return;
      if (!window.confirm('Tem certeza absoluta? Não será possível recuperar.')) return;

      Messages.removeAll();
      this.feedback('Todas as mensagens foram excluídas.', 'success');
      this.render();
    },

    exportarJSON() {
      const lista = Messages.list();
      const blob = new Blob([JSON.stringify(lista, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `canes-portfolio-mensagens-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.feedback(`Exportadas ${lista.length} mensagens.`, 'success');
    },

    abrir() {
      const panel = this.el('adminPanel');
      if (!panel) return;
      panel.hidden = false;
      this.render();
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    fechar() {
      const panel = this.el('adminPanel');
      if (!panel) return;
      panel.hidden = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    init() {
      const listEl = this.el('adminMessageList');
      if (listEl) {
        listEl.addEventListener('click', (ev) => {
          const btn = ev.target.closest('[data-admin-action]');
          if (!btn) return;
          const action = btn.getAttribute('data-admin-action');
          const id = btn.getAttribute('data-id');
          if (action === 'edit') this.abrirEdicao(id);
          else if (action === 'delete') this.excluir(id);
        });
      }

      this.el('adminEditSaveBtn')?.addEventListener('click', () => this.salvarEdicao());

      this.el('adminEditDeleteBtn')?.addEventListener('click', () => {
        const id = this.el('adminEditId').value;
        if (!id) return;
        const modal = getBootstrapModal(this.el('adminEditModal'));
        if (modal) modal.hide();
        this.excluir(id);
      });

      this.el('adminExportBtn')?.addEventListener('click', () => this.exportarJSON());
      this.el('adminDeleteAllBtn')?.addEventListener('click', () => this.excluirTodas());
      this.el('adminExitBtn')?.addEventListener('click', () => this.fechar());
    }
  };

  /* 7. ADMIN (gatilho oculto + senha) */

  const Admin = {
    _clickTimestamps: [],

    init() {
      this.initHiddenTrigger();
      this.initPasswordForm();
      this.initModalLifecycle();
      this.initDeveloperHook();
    },

    initHiddenTrigger() {
      const btn = document.getElementById('adminTrigger');
      if (!btn) return;

      const required = Number(CFG.ADMIN_CLICKS_REQUIRED) || 5;
      const windowMs = Number(CFG.ADMIN_CLICKS_WINDOW_MS) || 2000;

      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        const now = Date.now();
        this._clickTimestamps.push(now);

        while (
          this._clickTimestamps.length > 0 &&
          now - this._clickTimestamps[0] > windowMs
        ) {
          this._clickTimestamps.shift();
        }

        if (this._clickTimestamps.length >= required) {
          this._clickTimestamps.length = 0;
          this.openPasswordModal();
        }
      });
    },

    openPasswordModal() {
      this.resetPasswordForm();
      const modal = getBootstrapModal(document.getElementById('adminPasswordModal'));
      if (modal) modal.show();
    },

    initPasswordForm() {
      const form = document.getElementById('adminLoginForm');
      if (!form) return;

      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const input = document.getElementById('adminPasswordInput');
        const password = input ? input.value : '';

        if (!password) {
          this.showPasswordError('Informe a senha.');
          input && input.focus();
          return;
        }

        if (password !== CFG.ADMIN_PASSWORD) {
          this.showPasswordError('Senha incorreta. Tente novamente.');
          if (input) {
            input.focus();
            input.select();
          }
          return;
        }

        const modal = getBootstrapModal(document.getElementById('adminPasswordModal'));
        if (modal) modal.hide();
        this.resetPasswordForm();
        AdminUI.abrir();
      });

      document.getElementById('adminPasswordInput')?.addEventListener('input', () => {
        const error = document.getElementById('adminPasswordError');
        if (error) error.classList.add('d-none');
      });
    },

    initModalLifecycle() {
      const modalEl = document.getElementById('adminPasswordModal');
      if (!modalEl) return;

      modalEl.addEventListener('shown.bs.modal', () => {
        document.getElementById('adminPasswordInput')?.focus();
      });

      modalEl.addEventListener('hidden.bs.modal', () => {
        this.resetPasswordForm();
      });
    },

    initDeveloperHook() {
      window.__admin = {
        openPasswordModal: () => this.openPasswordModal()
      };
    },

    showPasswordError(text) {
      const error = document.getElementById('adminPasswordError');
      if (!error) return;
      error.textContent = text;
      error.classList.remove('d-none');
    },

    resetPasswordForm() {
      const input = document.getElementById('adminPasswordInput');
      const error = document.getElementById('adminPasswordError');
      if (input) input.value = '';
      if (error) {
        error.classList.add('d-none');
        error.textContent = 'Senha incorreta. Tente novamente.';
      }
    }
  };

  /* 8. CONTACT FORM */

  const ContactForm = {
    feedback(text, variant = 'info') {
      const el = document.getElementById('contactFeedback');
      if (!el) return;
      el.innerHTML = `<div class="alert alert-${variant} mb-0">${escapeHTML(text)}</div>`;
    },

    setLoading(loading) {
      const btn = document.getElementById('btnEnviar');
      const spinner = document.getElementById('btnEnviarSpinner');
      if (btn) btn.disabled = !!loading;
      if (spinner) spinner.classList.toggle('d-none', !loading);
    },

    init() {
      const form = document.getElementById('contactForm');
      if (!form) return;

      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        if (!form.checkValidity()) {
          form.classList.add('was-validated');
          this.feedback('Verifique os campos destacados.', 'warning');
          return;
        }

        const nome = document.getElementById('campoNome').value.trim();
        const email = document.getElementById('campoEmail').value.trim();
        const assunto = document.getElementById('campoAssunto').value.trim();
        const mensagem = document.getElementById('campoMensagem').value.trim();

        if (
          nome.length < 2 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
          assunto.length < 3 ||
          mensagem.length < 10
        ) {
          this.feedback('Dados inválidos. Revise os campos.', 'danger');
          return;
        }

        const salvo = Messages.add({ nome, email, assunto, mensagem });
        if (!salvo) {
          this.feedback('Falha ao salvar no navegador.', 'danger');
          return;
        }

        form.reset();
        form.classList.remove('was-validated');
        this.feedback('Enviando…', 'info');
        this.setLoading(true);

        const payload = {
          nome: salvo.nome,
          email: salvo.email,
          assunto: salvo.assunto,
          mensagem: salvo.mensagem,
          dataISO: salvo.dataISO
        };

        Automation.send(payload).then((resultado) => {
          this.setLoading(false);

          if (resultado.ok) {
            this.feedback('Mensagem enviada com sucesso!', 'success');
          } else {
            this.feedback(
              'Mensagem salva com sucesso! Aviso: a notificação externa não pôde ser enviada — sua mensagem está registrada localmente.',
              'warning'
            );
          }

          const panel = document.getElementById('adminPanel');
          if (panel && !panel.hidden) AdminUI.render();
        });
      });
    }
  };

  /* 9. BOOTSTRAP DO APP */

  document.addEventListener('DOMContentLoaded', () => {
    Storage.ensureSeed();
    ContactForm.init();
    AdminUI.init();
    Admin.init();
    console.info(
      '[App] Pronto. Painel oculto: 5 cliques no ⌘ do rodapé em até 2s.'
    );
  });
})();