/**
 * ============================================================
 * CineMatch - Lógica Principal da Aplicação
 * Arquivo: js/app.js
 * 
 * Gerencia: algoritmo de recomendação, manipulação da DOM,
 * interações do usuário, busca, favoritos, histórico,
 * avaliações, toasts e inicialização.
 * ============================================================
 */

const App = (() => {

  // ── Referências da DOM ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // Elementos principais
  const elTemaBtn         = $('#btn-tema');
  const elBusca           = $('#campo-busca');
  const elContadorFavs    = $('#contador-favoritos');
  const elGeneroTopFav    = $('#genero-top-favorito');
  const elFormPrefs       = $('#form-preferencias');
  const elResultados      = $('#resultados-grid');
  const elResultadosInfo  = $('#resultados-info');
  const elSecaoResultados = $('#secao-resultados');
  const elFavoritosGrid   = $('#favoritos-grid');
  const elFavoritosVazio  = $('#favoritos-vazio');
  const elHistoricoLista  = $('#historico-lista');
  const elHistoricoVazio  = $('#historico-vazio');
  const elBtnLimparHist   = $('#btn-limpar-historico');
  const elBuscaResultados = $('#busca-resultados');
  const elToastContainer  = $('#toast-container');

  // Abas
  const elAbas            = $$('.aba-btn');
  const elPaineis         = $$('.aba-painel');

  // ── Mapa de faixa etária para valor numérico ──
  const FAIXA_VALOR = {
    'Livre': 0,
    '+10': 10,
    '+12': 12,
    '+14': 14,
    '+16': 16,
    '+18': 18
  };

  // ── Limites de duração ──
  const TEMPO_LIMITES = {
    'ate-1h30':    90,
    'ate-2h':      120,
    'mais-2h':     Infinity,
    'maratona':    Infinity
  };

  // ══════════════════════════════════════════════
  // TEMA (DARK / LIGHT MODE)
  // ══════════════════════════════════════════════

  function inicializarTema() {
    const tema = Storage.getTema();
    document.documentElement.setAttribute('data-theme', tema);
    atualizarBotaoTema(tema);
  }

  function alternarTema() {
    const temaAtual = document.documentElement.getAttribute('data-theme');
    const novoTema = temaAtual === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', novoTema);
    Storage.setTema(novoTema);
    atualizarBotaoTema(novoTema);
    mostrarToast(novoTema === 'dark' ? '🌙 Tema escuro ativado' : '☀️ Tema claro ativado', 'info');
  }

  function atualizarBotaoTema(tema) {
    if (elTemaBtn) {
      elTemaBtn.textContent = tema === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
      elTemaBtn.setAttribute('aria-label', `Alternar para modo ${tema === 'dark' ? 'claro' : 'escuro'}`);
    }
  }

  // ══════════════════════════════════════════════
  // TOAST NOTIFICATIONS
  // ══════════════════════════════════════════════

  /**
   * Exibe uma notificação toast.
   * @param {string} mensagem - Texto da notificação
   * @param {'sucesso'|'erro'|'info'|'aviso'} tipo - Tipo do toast
   * @param {number} duracao - Duração em ms (padrão 3000)
   */
  function mostrarToast(mensagem, tipo = 'info', duracao = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');

    const icones = {
      sucesso: '✅',
      erro: '❌',
      info: 'ℹ️',
      aviso: '⚠️'
    };

    toast.innerHTML = `
      <span class="toast-icone">${icones[tipo] || 'ℹ️'}</span>
      <span class="toast-msg">${mensagem}</span>
      <button class="toast-fechar" aria-label="Fechar notificação">&times;</button>
    `;

    // Fechar ao clicar
    toast.querySelector('.toast-fechar').addEventListener('click', () => {
      toast.classList.add('toast-saindo');
      setTimeout(() => toast.remove(), 300);
    });

    elToastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('toast-visivel'));

    // Auto-remover
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add('toast-saindo');
        setTimeout(() => toast.remove(), 300);
      }
    }, duracao);
  }

  // ══════════════════════════════════════════════
  // ALGORITMO DE RECOMENDAÇÃO
  // ══════════════════════════════════════════════

  /**
   * Calcula score de compatibilidade de um título com as preferências.
   * @param {object} item - Objeto do catálogo
   * @param {object} prefs - Preferências do usuário
   * @returns {number} Score (maior = mais compatível)
   */
  function calcularScore(item, prefs) {
    let score = 0;

    // --- Correspondência de Gêneros (peso alto: até 40 pontos) ---
    if (prefs.generos && prefs.generos.length > 0) {
      const generosMatch = item.generos.filter(g => prefs.generos.includes(g));
      // Pontuação proporcional: quanto mais gêneros batem, melhor
      score += (generosMatch.length / prefs.generos.length) * 30;
      // Bônus extra por cada gênero que combina
      score += generosMatch.length * 5;
    } else {
      // Sem filtro de gênero: todos recebem pontuação base
      score += 15;
    }

    // --- Correspondência de Humor (peso médio-alto: até 30 pontos) ---
    if (prefs.humor && prefs.humor.length > 0) {
      const humorMatch = item.humor.filter(h => prefs.humor.includes(h));
      score += (humorMatch.length / prefs.humor.length) * 20;
      score += humorMatch.length * 5;
    } else {
      score += 10;
    }

    // --- Tempo Disponível (peso médio: até 15 pontos) ---
    if (prefs.tempo) {
      const limite = TEMPO_LIMITES[prefs.tempo];
      if (prefs.tempo === 'maratona') {
        // Maratona: prioriza séries
        score += item.tipo === 'Série' ? 15 : 5;
      } else if (prefs.tempo === 'mais-2h') {
        // Mais de 2h: prioriza filmes longos ou séries
        score += item.duracaoMinutos > 120 ? 15 : 8;
      } else {
        // Limite fixo: penaliza se ultrapassa
        if (item.duracaoMinutos <= limite) {
          score += 15;
        } else {
          score += Math.max(0, 10 - (item.duracaoMinutos - limite) / 10);
        }
      }
    } else {
      score += 7;
    }

    // --- Faixa Etária (peso moderado: até 15 pontos, com penalidade suave se ultrapassar) ---
    if (prefs.faixaEtaria) {
      const limiteUser = FAIXA_VALOR[prefs.faixaEtaria] ?? 18;
      const limiteItem = FAIXA_VALOR[item.faixaEtaria] ?? 0;
      if (limiteItem <= limiteUser) {
        score += 15;
      } else {
        // Títulos acima da faixa etária escolhida perdem pontos proporcionalmente à diferença
        const diferenca = limiteItem - limiteUser;
        score += Math.max(0, 15 - diferenca * 2.5);
      }
    } else {
      score += 10;
    }

    // --- Bônus por Nota (até 10 pontos) ---
    score += (item.nota / 10) * 10;

    return Math.round(score * 100) / 100;
  }

  /**
   * Filtra e ranqueia o catálogo com base nas preferências.
   * @param {object} prefs - Preferências do formulário
   * @returns {{ principais: object[], extras: object[], totalFiltrado: number }}
   */
  function gerarRecomendacoes(prefs) {
    // 1. Todos os títulos são candidatos (faixa etária é ponderada, não excludente)
    let candidatos = CATALOGO;

    // 2. Calcular score de cada candidato (faixa etária penaliza em vez de excluir)
    const comScore = candidatos.map(item => ({
      ...item,
      score: calcularScore(item, prefs)
    }));

    // 3. Ordenar por score (desc), desempate por nota (desc)
    comScore.sort((a, b) => b.score - a.score || b.nota - a.nota);

    // 4. Separar os 3 principais e o restante
    const principais = comScore.slice(0, 3);
    const extras = comScore.slice(3, 9);

    return { principais, extras, totalFiltrado: comScore.length };
  }

  // ══════════════════════════════════════════════
  // RENDERIZAÇÃO DE CARDS
  // ══════════════════════════════════════════════

  /**
   * Gera o HTML de um card de filme/série.
   * @param {object} item - Objeto do catálogo (pode ter .score)
   * @param {object} opcoes - { compacto: bool, mostrarScore: bool }
   * @returns {string} HTML do card
   */
  function renderCard(item, opcoes = {}) {
    const { compacto = false, mostrarScore = false } = opcoes;
    const isFav = Storage.isFavorito(item.id);
    const avaliacao = Storage.getAvaliacao(item.id) || 0;

    // Estrelas de avaliação pessoal
    let estrelasHTML = '';
    for (let i = 1; i <= 5; i++) {
      const preenchida = i <= avaliacao ? 'estrela-ativa' : '';
      estrelasHTML += `<button class="btn-estrela ${preenchida}" data-id="${item.id}" data-nota="${i}" 
        aria-label="Avaliar ${item.titulo} com ${i} estrela${i > 1 ? 's' : ''}" title="${i} estrela${i > 1 ? 's' : ''}">★</button>`;
    }

    // Tags de gênero
    const tagsGenero = item.generos.map(g => `<span class="tag tag-genero">${g}</span>`).join('');

    // Tags de humor
    const tagsHumor = item.humor.map(h => `<span class="tag tag-humor">${h}</span>`).join('');

    // Badge de score
    const scoreBadge = mostrarScore && item.score !== undefined
      ? `<span class="badge-score" title="Compatibilidade">${Math.round(item.score)}%</span>`
      : '';

    return `
    <article class="card-filme ${compacto ? 'card-compacto' : ''}" data-id="${item.id}" aria-label="${item.titulo}">
      <div class="card-poster" style="background: ${item.corCapa};">
        <div class="poster-conteudo">
          <span class="poster-tipo">${item.tipo}</span>
          <span class="poster-titulo-overlay">${item.titulo}</span>
        </div>
        <span class="badge-nota" title="Nota: ${item.nota}">⭐ ${item.nota}</span>
        ${scoreBadge}
        <button class="btn-favoritar ${isFav ? 'favoritado' : ''}" data-id="${item.id}"
          aria-label="${isFav ? 'Remover' : 'Adicionar'} ${item.titulo} dos favoritos"
          title="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
          ${isFav ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="card-info">
        <h3 class="card-titulo">${item.titulo}</h3>
        <div class="card-meta">
          <span class="meta-duracao">🕐 ${item.duracaoTexto}</span>
          <span class="meta-faixa" title="Classificação indicativa">${item.faixaEtaria}</span>
        </div>
        <div class="card-tags">${tagsGenero}${tagsHumor}</div>
        ${!compacto ? `<p class="card-sinopse">${item.sinopse}</p>` : ''}
        <div class="card-avaliacao" aria-label="Sua avaliação pessoal">
          <span class="avaliacao-label">Sua nota:</span>
          <div class="estrelas-container">${estrelasHTML}</div>
        </div>
      </div>
    </article>
    `;
  }

  // ══════════════════════════════════════════════
  // RECOMENDAÇÕES - UI
  // ══════════════════════════════════════════════

  function processarFormulario(e) {
    e.preventDefault();

    // Coletar preferências
    const generosChecked = [...$$('input[name="genero"]:checked')].map(el => el.value);
    const faixaEtaria = $('select[name="faixaEtaria"]').value;
    const tempo = $('select[name="tempo"]').value;
    const humorChecked = [...$$('input[name="humor"]:checked')].map(el => el.value);

    // Validação mínima
    if (generosChecked.length === 0 && !faixaEtaria && !tempo && humorChecked.length === 0) {
      mostrarToast('Selecione pelo menos um filtro para gerar recomendações.', 'aviso');
      return;
    }

    const prefs = {
      generos: generosChecked,
      faixaEtaria: faixaEtaria || null,
      tempo: tempo || null,
      humor: humorChecked
    };

    // Salvar preferências
    Storage.setPreferencias(prefs);

    // Gerar recomendações
    const { principais, extras, totalFiltrado } = gerarRecomendacoes(prefs);

    // Exibir resultados
    exibirRecomendacoes(principais, extras, totalFiltrado);

    // Salvar no histórico
    const idsRec = principais.map(p => p.id);
    Storage.adicionarHistorico(idsRec, prefs);

    // Atualizar aba de histórico
    renderHistorico();

    mostrarToast(`🎬 ${principais.length} recomendações geradas!`, 'sucesso');

    // Scroll suave até resultados
    elSecaoResultados.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function exibirRecomendacoes(principais, extras, total) {
    // Info
    let infoHTML = '';
    if (principais.length < 3 && total > 0) {
      infoHTML = `<p class="resultado-aviso">⚠️ Encontramos apenas <strong>${principais.length}</strong> resultado(s) com alta compatibilidade. Completamos com sugestões próximas.</p>`;
      // Completar com extras
      while (principais.length < 3 && extras.length > 0) {
        principais.push(extras.shift());
      }
    } else if (total === 0) {
      infoHTML = `<p class="resultado-aviso">😕 Nenhum título encontrado para esses filtros. Tente ajustar seus critérios.</p>`;
    }

    elResultadosInfo.innerHTML = infoHTML;

    // Cards principais
    elResultados.innerHTML = principais.map(item =>
      renderCard(item, { mostrarScore: true })
    ).join('');

    // Cards extras (seção "Outras sugestões")
    const elExtras = $('#extras-grid');
    if (elExtras && extras.length > 0) {
      elExtras.innerHTML = `
        <h3 class="subtitulo-secao">Outras sugestões para você</h3>
        <div class="grid-cards">
          ${extras.map(item => renderCard(item, { compacto: true, mostrarScore: true })).join('')}
        </div>
      `;
    } else if (elExtras) {
      elExtras.innerHTML = '';
    }

    // Mostrar seção
    elSecaoResultados.classList.add('secao-visivel');

    // Registrar event listeners nos novos cards
    registrarEventosCards();
  }

  function limparFiltros() {
    elFormPrefs.reset();
    elResultados.innerHTML = '';
    elResultadosInfo.innerHTML = '';
    const elExtras = $('#extras-grid');
    if (elExtras) elExtras.innerHTML = '';
    elSecaoResultados.classList.remove('secao-visivel');
    mostrarToast('🧹 Filtros limpos!', 'info');
  }

  // ══════════════════════════════════════════════
  // FAVORITOS
  // ══════════════════════════════════════════════

  function toggleFavorito(id) {
    const item = CATALOGO.find(c => c.id === id);
    if (!item) return;

    if (Storage.isFavorito(id)) {
      Storage.removerFavorito(id);
      mostrarToast(`💔 "${item.titulo}" removido dos favoritos`, 'info');
    } else {
      Storage.adicionarFavorito(id);
      mostrarToast(`❤️ "${item.titulo}" adicionado aos favoritos!`, 'sucesso');
    }

    // Atualizar todos os botões de favorito desse ID na página
    atualizarBotoesFavorito(id);
    atualizarContadorFavoritos();
    renderFavoritos();
  }

  function atualizarBotoesFavorito(id) {
    const isFav = Storage.isFavorito(id);
    $$(`.btn-favoritar[data-id="${id}"]`).forEach(btn => {
      btn.classList.toggle('favoritado', isFav);
      btn.innerHTML = isFav ? '❤️' : '🤍';
      const item = CATALOGO.find(c => c.id === id);
      if (item) {
        btn.setAttribute('aria-label', `${isFav ? 'Remover' : 'Adicionar'} ${item.titulo} dos favoritos`);
        btn.setAttribute('title', isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
      }
    });
  }

  function atualizarContadorFavoritos() {
    const favs = Storage.getFavoritos();
    if (elContadorFavs) {
      elContadorFavs.textContent = favs.length;
    }

    // Gênero mais favoritado
    if (elGeneroTopFav) {
      if (favs.length === 0) {
        elGeneroTopFav.textContent = '—';
        return;
      }
      const contagem = {};
      favs.forEach(id => {
        const item = CATALOGO.find(c => c.id === id);
        if (item) {
          item.generos.forEach(g => {
            contagem[g] = (contagem[g] || 0) + 1;
          });
        }
      });
      const top = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0];
      elGeneroTopFav.textContent = top ? top[0] : '—';
    }
  }

  function renderFavoritos() {
    const favIds = Storage.getFavoritos();

    if (favIds.length === 0) {
      elFavoritosGrid.innerHTML = '';
      elFavoritosVazio.classList.remove('oculto');
      return;
    }

    elFavoritosVazio.classList.add('oculto');

    const items = favIds.map(id => CATALOGO.find(c => c.id === id)).filter(Boolean);
    elFavoritosGrid.innerHTML = items.map(item =>
      renderCard(item, { compacto: true })
    ).join('');

    registrarEventosCards();
  }

  // ══════════════════════════════════════════════
  // HISTÓRICO
  // ══════════════════════════════════════════════

  function renderHistorico() {
    const historico = Storage.getHistorico();

    if (historico.length === 0) {
      elHistoricoLista.innerHTML = '';
      elHistoricoVazio.classList.remove('oculto');
      elBtnLimparHist.classList.add('oculto');
      return;
    }

    elHistoricoVazio.classList.add('oculto');
    elBtnLimparHist.classList.remove('oculto');

    elHistoricoLista.innerHTML = historico.map((entrada, idx) => {
      const dataObj = new Date(entrada.data);
      const dataFormatada = dataObj.toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
      const horaFormatada = dataObj.toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit'
      });

      const titulos = entrada.ids.map(id => {
        const item = CATALOGO.find(c => c.id === id);
        return item ? item.titulo : 'Título desconhecido';
      });

      const filtrosTexto = [];
      if (entrada.preferencias.generos && entrada.preferencias.generos.length > 0)
        filtrosTexto.push(entrada.preferencias.generos.join(', '));
      if (entrada.preferencias.humor && entrada.preferencias.humor.length > 0)
        filtrosTexto.push(entrada.preferencias.humor.join(', '));
      if (entrada.preferencias.faixaEtaria)
        filtrosTexto.push(entrada.preferencias.faixaEtaria);

      return `
        <div class="historico-item" data-index="${idx}">
          <div class="historico-cabecalho">
            <span class="historico-data">📅 ${dataFormatada} às ${horaFormatada}</span>
          </div>
          <div class="historico-titulos">
            ${titulos.map(t => `<span class="historico-titulo">${t}</span>`).join('')}
          </div>
          ${filtrosTexto.length > 0 ? `<div class="historico-filtros">Filtros: ${filtrosTexto.join(' • ')}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  function limparHistorico() {
    Storage.limparHistorico();
    renderHistorico();
    mostrarToast('🗑️ Histórico limpo!', 'info');
  }

  // ══════════════════════════════════════════════
  // BUSCA EM TEMPO REAL
  // ══════════════════════════════════════════════

  function realizarBusca() {
    const termo = elBusca.value.trim().toLowerCase();

    if (termo.length < 2) {
      elBuscaResultados.innerHTML = '';
      elBuscaResultados.classList.add('oculto');
      return;
    }

    const resultados = CATALOGO.filter(item =>
      item.titulo.toLowerCase().includes(termo) ||
      item.generos.some(g => g.toLowerCase().includes(termo)) ||
      item.tipo.toLowerCase().includes(termo)
    );

    if (resultados.length === 0) {
      elBuscaResultados.innerHTML = '<p class="busca-vazio">Nenhum título encontrado.</p>';
      elBuscaResultados.classList.remove('oculto');
      return;
    }

    elBuscaResultados.innerHTML = resultados.map(item => `
      <div class="busca-item" data-id="${item.id}">
        <div class="busca-item-poster" style="background: ${item.corCapa};"></div>
        <div class="busca-item-info">
          <strong>${item.titulo}</strong>
          <span class="busca-item-meta">${item.tipo} • ${item.duracaoTexto} • ⭐ ${item.nota}</span>
        </div>
      </div>
    `).join('');

    elBuscaResultados.classList.remove('oculto');

    // Click em item de busca → scroll até o card ou mostrar detalhes
    elBuscaResultados.querySelectorAll('.busca-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt(el.dataset.id);
        const item = CATALOGO.find(c => c.id === id);
        if (item) {
          // Mostrar card individual nos resultados
          elResultados.innerHTML = renderCard(item, { mostrarScore: false });
          elResultadosInfo.innerHTML = `<p class="resultado-aviso">🔍 Resultado da busca por "<strong>${elBusca.value.trim()}</strong>"</p>`;
          elSecaoResultados.classList.add('secao-visivel');
          const elExtras = $('#extras-grid');
          if (elExtras) elExtras.innerHTML = '';
          registrarEventosCards();
          elBuscaResultados.classList.add('oculto');
          elBusca.value = '';
          elSecaoResultados.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ══════════════════════════════════════════════
  // AVALIAÇÃO POR ESTRELAS
  // ══════════════════════════════════════════════

  function avaliarTitulo(id, nota) {
    Storage.setAvaliacao(id, nota);
    const item = CATALOGO.find(c => c.id === id);

    // Atualizar visualmente todas as estrelas desse ID
    $$(`.btn-estrela[data-id="${id}"]`).forEach(btn => {
      const notaBtn = parseInt(btn.dataset.nota);
      btn.classList.toggle('estrela-ativa', notaBtn <= nota);
    });

    if (item) {
      mostrarToast(`⭐ "${item.titulo}" avaliado com ${nota} estrela${nota > 1 ? 's' : ''}!`, 'sucesso');
    }
  }

  // ══════════════════════════════════════════════
  // ABAS (Favoritos / Histórico)
  // ══════════════════════════════════════════════

  function trocarAba(abaAlvo) {
    elAbas.forEach(btn => {
      btn.classList.toggle('aba-ativa', btn.dataset.aba === abaAlvo);
      btn.setAttribute('aria-selected', btn.dataset.aba === abaAlvo);
    });
    elPaineis.forEach(painel => {
      painel.classList.toggle('aba-painel-ativo', painel.id === `painel-${abaAlvo}`);
    });
  }

  // ══════════════════════════════════════════════
  // EVENT DELEGATION & LISTENERS
  // ══════════════════════════════════════════════

  /**
   * Registra event listeners nos cards renderizados dinamicamente.
   * Usa event delegation no documento para capturar cliques.
   */
  function registrarEventosCards() {
    // Nada aqui: usamos event delegation global (ver init)
  }

  function handleClickGlobal(e) {
    // Botão favoritar
    const btnFav = e.target.closest('.btn-favoritar');
    if (btnFav) {
      e.preventDefault();
      e.stopPropagation();
      const id = parseInt(btnFav.dataset.id);
      toggleFavorito(id);
      return;
    }

    // Botão estrela
    const btnEstrela = e.target.closest('.btn-estrela');
    if (btnEstrela) {
      e.preventDefault();
      const id = parseInt(btnEstrela.dataset.id);
      const nota = parseInt(btnEstrela.dataset.nota);
      avaliarTitulo(id, nota);
      return;
    }

    // Abas
    const btnAba = e.target.closest('.aba-btn');
    if (btnAba) {
      trocarAba(btnAba.dataset.aba);
      return;
    }
  }

  // ══════════════════════════════════════════════
  // RESTAURAR PREFERÊNCIAS DO FORMULÁRIO
  // ══════════════════════════════════════════════

  function restaurarPreferencias() {
    const prefs = Storage.getPreferencias();
    if (!prefs) return;

    // Gêneros
    if (prefs.generos) {
      prefs.generos.forEach(g => {
        const el = $(`input[name="genero"][value="${g}"]`);
        if (el) el.checked = true;
      });
    }

    // Faixa etária
    if (prefs.faixaEtaria) {
      const el = $('select[name="faixaEtaria"]');
      if (el) el.value = prefs.faixaEtaria;
    }

    // Tempo
    if (prefs.tempo) {
      const el = $('select[name="tempo"]');
      if (el) el.value = prefs.tempo;
    }

    // Humor
    if (prefs.humor) {
      prefs.humor.forEach(h => {
        const el = $(`input[name="humor"][value="${h}"]`);
        if (el) el.checked = true;
      });
    }
  }

  // ══════════════════════════════════════════════
  // FECHAR BUSCA AO CLICAR FORA
  // ══════════════════════════════════════════════

  function handleClickFora(e) {
    if (elBuscaResultados && !elBuscaResultados.contains(e.target) && e.target !== elBusca) {
      elBuscaResultados.classList.add('oculto');
    }
  }

  // ══════════════════════════════════════════════
  // INICIALIZAÇÃO
  // ══════════════════════════════════════════════

  function init() {
    // 1. Tema
    inicializarTema();

    // 2. Restaurar dados salvos
    restaurarPreferencias();
    atualizarContadorFavoritos();
    renderFavoritos();
    renderHistorico();

    // 3. Event Listeners

    // Tema
    if (elTemaBtn) {
      elTemaBtn.addEventListener('click', alternarTema);
    }

    // Formulário
    if (elFormPrefs) {
      elFormPrefs.addEventListener('submit', processarFormulario);
    }

    // Botão limpar filtros
    const btnLimpar = $('#btn-limpar-filtros');
    if (btnLimpar) {
      btnLimpar.addEventListener('click', limparFiltros);
    }

    // Busca em tempo real (debounced)
    if (elBusca) {
      let buscaTimer;
      elBusca.addEventListener('input', () => {
        clearTimeout(buscaTimer);
        buscaTimer = setTimeout(realizarBusca, 250);
      });
    }

    // Limpar histórico
    if (elBtnLimparHist) {
      elBtnLimparHist.addEventListener('click', limparHistorico);
    }

    // Event delegation global para cliques
    document.addEventListener('click', handleClickGlobal);

    // Fechar busca ao clicar fora
    document.addEventListener('click', handleClickFora);

    console.log('[CineMatch] Aplicação inicializada com sucesso! 🎬');
  }

  // ── Iniciar quando DOM estiver pronto ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── API pública (para debug, se necessário) ──
  return { mostrarToast, gerarRecomendacoes };

})();

