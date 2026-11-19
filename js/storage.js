/**
 * ============================================================
 * CineMatch - Módulo de Persistência (LocalStorage)
 * Arquivo: js/storage.js
 * 
 * Funções seguras (try/catch) para salvar e recuperar dados
 * do LocalStorage: favoritos, histórico, preferências,
 * avaliações e tema.
 * ============================================================
 */

const Storage = (() => {
  // ── Chaves do LocalStorage ──
  const KEYS = {
    FAVORITOS:    'cinematch_favoritos',
    HISTORICO:    'cinematch_historico',
    PREFERENCIAS: 'cinematch_preferencias',
    AVALIACOES:   'cinematch_avaliacoes',
    TEMA:         'cinematch_tema'
  };

  // ── Helpers genéricos ──

  /**
   * Salva um valor serializado no LocalStorage.
   * @param {string} chave - Chave de armazenamento
   * @param {*} valor - Valor a ser armazenado (será convertido em JSON)
   * @returns {boolean} true se salvou com sucesso
   */
  function _salvar(chave, valor) {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
      return true;
    } catch (erro) {
      console.error(`[Storage] Erro ao salvar "${chave}":`, erro);
      return false;
    }
  }

  /**
   * Recupera e desserializa um valor do LocalStorage.
   * @param {string} chave - Chave de armazenamento
   * @param {*} padrao - Valor padrão caso a chave não exista
   * @returns {*} Valor recuperado ou o padrão
   */
  function _recuperar(chave, padrao = null) {
    try {
      const dados = localStorage.getItem(chave);
      return dados !== null ? JSON.parse(dados) : padrao;
    } catch (erro) {
      console.error(`[Storage] Erro ao recuperar "${chave}":`, erro);
      return padrao;
    }
  }

  // ── Favoritos ──

  /**
   * Retorna a lista de IDs dos filmes/séries favoritados.
   * @returns {number[]}
   */
  function getFavoritos() {
    return _recuperar(KEYS.FAVORITOS, []);
  }

  /**
   * Salva a lista de IDs de favoritos.
   * @param {number[]} lista
   * @returns {boolean}
   */
  function setFavoritos(lista) {
    return _salvar(KEYS.FAVORITOS, lista);
  }

  /**
   * Adiciona um ID aos favoritos (sem duplicatas).
   * @param {number} id
   * @returns {boolean}
   */
  function adicionarFavorito(id) {
    const favoritos = getFavoritos();
    if (!favoritos.includes(id)) {
      favoritos.push(id);
      return setFavoritos(favoritos);
    }
    return true; // Já existe
  }

  /**
   * Remove um ID dos favoritos.
   * @param {number} id
   * @returns {boolean}
   */
  function removerFavorito(id) {
    const favoritos = getFavoritos().filter(fId => fId !== id);
    return setFavoritos(favoritos);
  }

  /**
   * Verifica se um ID está nos favoritos.
   * @param {number} id
   * @returns {boolean}
   */
  function isFavorito(id) {
    return getFavoritos().includes(id);
  }

  // ── Histórico de Recomendações ──

  /**
   * Retorna o histórico de recomendações.
   * Cada entrada: { data: string ISO, ids: number[], preferencias: object }
   * @returns {object[]}
   */
  function getHistorico() {
    return _recuperar(KEYS.HISTORICO, []);
  }

  /**
   * Adiciona uma entrada ao histórico, evitando duplicatas seguidas
   * (mesma combinação de IDs que a última entrada).
   * Mantém no máximo as 20 últimas entradas.
   * @param {number[]} ids - IDs recomendados
   * @param {object} preferencias - Filtros usados
   * @returns {boolean}
   */
  function adicionarHistorico(ids, preferencias) {
    const historico = getHistorico();

    // Evitar duplicata seguida
    if (historico.length > 0) {
      const ultima = historico[0];
      if (JSON.stringify(ultima.ids) === JSON.stringify(ids)) {
        return true; // Idêntica à última, ignora
      }
    }

    // Adicionar no início (mais recente primeiro)
    historico.unshift({
      data: new Date().toISOString(),
      ids: ids,
      preferencias: preferencias
    });

    // Limitar a 20 entradas
    if (historico.length > 20) {
      historico.splice(20);
    }

    return _salvar(KEYS.HISTORICO, historico);
  }

  /**
   * Limpa todo o histórico.
   * @returns {boolean}
   */
  function limparHistorico() {
    return _salvar(KEYS.HISTORICO, []);
  }

  // ── Preferências do Formulário ──

  /**
   * Retorna as últimas preferências salvas.
   * @returns {object|null}
   */
  function getPreferencias() {
    return _recuperar(KEYS.PREFERENCIAS, null);
  }

  /**
   * Salva as preferências atuais do formulário.
   * @param {object} prefs - { generos, faixaEtaria, tempo, humor }
   * @returns {boolean}
   */
  function setPreferencias(prefs) {
    return _salvar(KEYS.PREFERENCIAS, prefs);
  }

  // ── Avaliações por Estrelas ──

  /**
   * Retorna todas as avaliações. Formato: { "id": nota }
   * @returns {object}
   */
  function getAvaliacoes() {
    return _recuperar(KEYS.AVALIACOES, {});
  }

  /**
   * Salva/atualiza a avaliação de um título.
   * @param {number} id - ID do filme/série
   * @param {number} nota - Nota de 1 a 5
   * @returns {boolean}
   */
  function setAvaliacao(id, nota) {
    const avaliacoes = getAvaliacoes();
    avaliacoes[id] = nota;
    return _salvar(KEYS.AVALIACOES, avaliacoes);
  }

  /**
   * Retorna a avaliação de um título específico.
   * @param {number} id
   * @returns {number|null}
   */
  function getAvaliacao(id) {
    const avaliacoes = getAvaliacoes();
    return avaliacoes[id] || null;
  }

  // ── Tema (Light / Dark) ──

  /**
   * Retorna o tema salvo ('light' ou 'dark').
   * @returns {string}
   */
  function getTema() {
    return _recuperar(KEYS.TEMA, 'dark');
  }

  /**
   * Salva a preferência de tema.
   * @param {string} tema - 'light' ou 'dark'
   * @returns {boolean}
   */
  function setTema(tema) {
    return _salvar(KEYS.TEMA, tema);
  }

  // ── API Pública ──
  return {
    getFavoritos,
    setFavoritos,
    adicionarFavorito,
    removerFavorito,
    isFavorito,
    getHistorico,
    adicionarHistorico,
    limparHistorico,
    getPreferencias,
    setPreferencias,
    getAvaliacoes,
    setAvaliacao,
    getAvaliacao,
    getTema,
    setTema
  };
})();

