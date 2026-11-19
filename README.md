#  CineMatch — Recomendador Inteligente de Filmes e Séries

Aplicação web desenvolvida em **arquitetura Web Vanilla** (HTML5, CSS3 e JavaScript ES6+) para ajudar usuários a escolherem o que assistir sem sofrer com a fadiga de decisão. O sistema cruza preferências de gênero, humor do momento, tempo disponível e faixa etária para sugerir títulos compatíveis em segundos.

🔗 **Acesse a aplicação online:** [CineMatch no GitHub Pages](https://victorbs23.github.io/CineMath/)

---

##  Funcionalidades

- ** Cadastro de Preferências:** Seleção combinada de gêneros favoritos, humor atual, tempo disponível (`Até 1h30`, `Até 2h`, `Mais de 2h`, `Maratona de Série`) e faixa etária (`Livre` a `+18`).
- ** Algoritmo de Recomendação Ponderado:** Calcula um índice de compatibilidade multidimensional considerando gênero, humor, duração, faixa etária flexível e nota crítica, destacando as **3 melhores recomendações** e listando opções complementares.
- ** Busca Instantânea com Debounce:** Campo de pesquisa rápida no cabeçalho com atraso controlado (`250ms`) e dropdown interativo para localizar obras pelo título.
- ** Lista de Favoritos e Estatísticas:** Permite salvar e remover filmes ou séries com sincronização visual em toda a interface, atualizando automaticamente o contador de favoritos e o **Top Gênero** no cabeçalho.
- ** Avaliação Pessoal por Estrelas:** Sistema interativo de 1 a 5 estrelas em cada card para registrar sua nota individual por obra.
- ** Histórico de Recomendações:** Registro cronológico das consultas realizadas (data, horário e filtros aplicados), com prevenção de duplicatas consecutivas e opção para limpar o histórico.
- ** Tema Claro e Escuro (Dark / Light Mode):** Alternância fluida entre o tema escuro cinematográfico e o tema claro de alto contraste, com feedback visual via notificações *Toast*.
- ** Persistência Local (`LocalStorage`):** Mantém favoritos, histórico, últimas preferências, avaliações por estrelas e tema salvos no navegador mesmo após fechar a página.

---

##  Tecnologias Utilizadas

- **HTML5 Semântico:** Estrutura acessível seguindo padrões W3C e diretrizes **WCAG 2.1 AA** (`header`, `main`, `section`, `article`, `footer` e atributos ARIA).
- **CSS3 Moderno:** Estilização baseada em *CSS Custom Properties* (variáveis de tema), **CSS Grid**, **Flexbox**, transições aceleradas via GPU e layout responsivo para **Mobile**, **Tablet** e **Desktop**.
- **JavaScript Vanilla (ES6+):** Arquitetura modular inspirada no padrão **MVC**, *Event Delegation* e encapsulamento via *IIFE* no módulo de armazenamento, sem dependências externas ou necessidade de *build*.
- **Web Storage API (`LocalStorage`):** Persistência local estruturada com tratamento de exceções (`try/catch`).

---

##  Estrutura do Repositório

```text
CineMath/
├── index.html          # Estrutura semântica principal da aplicação
├── css/
│   └── style.css       # Design System, temas Dark/Light e media queries
├── js/
│   ├── movies.js       # Catálogo com 30 filmes e séries e seus metadados
│   ├── storage.js      # Módulo encapsulado para gerenciamento do LocalStorage
│   └── app.js          # Motor de recomendação, controle de eventos e manipulação da DOM
└── assets/
    └── images/         # Recursos visuais e capturas de tela do projeto
