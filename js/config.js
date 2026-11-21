/* ============================================================
   CONFIG — Canes Solution Portfolio
   Único ponto de configuração do app.
   Não hardcode endpoints/chaves em app.js — use este arquivo.
   ============================================================ */

window.CONFIG = {
  /* Chave do LocalStorage (array JSON de mensagens) */
  STORAGE_KEY: 'canes_portfolio_messages',

  /* Quantidade de registros de teste injetados na primeira visita */
  SEED_SIZE: 20,

  /* Senha de demonstração do painel (client-side — NÃO é segurança real) */
  ADMIN_PASSWORD: 'LL14@3',

  /* Gatilho oculto: 5 cliques em até 2 segundos no logo do rodapé */
  ADMIN_CLICKS_REQUIRED: 5,
  ADMIN_CLICKS_WINDOW_MS: 2000,

  /* ============================================================
     AUTOMAÇÃO — Endpoint público (sem chave privada)
     POST application/json
     Recomendado: Formspree (https://formspree.io/f/SEU_ID)
     Fallback/teste: webhook.site (https://webhook.site/SEU_UUID)
     Consulte o README para instruções de configuração.
     ============================================================ */
  WEBHOOK_URL: ''
};