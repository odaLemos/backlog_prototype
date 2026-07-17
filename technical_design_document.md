# Technical Design Document — Meu Backlog de Jogos

> **Versão:** 1.0  
> **Data:** Julho 2026  
> **Status:** Protótipo ativo (fase de prototipação)

---

## 1. Visão Geral

**Meu Backlog de Jogos** é uma Progressive Web App (PWA) para gerenciamento pessoal de biblioteca de jogos. O usuário pode organizar títulos por status de jogo, visualizar detalhes via integração com a API IGDB, e instalar o app na tela inicial de dispositivos Android.

### Objetivos
- Substituir planilhas e notas avulsas por uma interface dedicada e mobile-first.
- Funcionar completamente offline após o primeiro carregamento.
- Não exigir backend próprio — toda a persistência é local (localStorage).
- Ser hospedável gratuitamente em plataformas como GitHub Pages.

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Estrutura | HTML5 | Simples, sem build step, compatível com GitHub Pages |
| Estilização | CSS Vanilla (custom properties) | Controle total, sem dependências |
| Lógica | JavaScript ES2020+ (sem framework) | Prototipação ágil; Angular/React avaliados mas descartados nesta fase |
| Persistência | `localStorage` (browser API) | Sem necessidade de backend; dados ficam no dispositivo |
| API de jogos | [IGDB](https://www.igdb.com/api) via Twitch Auth | Metadados ricos: capa, sinopse, gênero, screenshots, trailer |
| CORS Proxy | `corsproxy.io` | Permite chamadas à IGDB diretamente do browser |
| Tradução | MyMemory API (gratuita) | Tradução automática da sinopse (EN → PT-BR) |
| Offline/PWA | Service Worker + Cache API | Cache de assets estáticos; funcionalidade offline completa |
| Instalação | Web App Manifest | Instalação como app nativo no Android |

---

## 3. Arquitetura de Arquivos

```
backlog/
├── index.html       # Estrutura HTML (SPA — Single Page Application)
├── style.css        # Todos os estilos (design system, componentes, responsividade)
├── app.js           # Toda a lógica JavaScript (~1.700 linhas)
├── manifest.json    # Configuração PWA (ícone, display, cores, orientação)
├── sw.js            # Service Worker (cache e estratégia offline)
├── icon.svg         # Ícone do app (SVG escalável, usado como maskable icon)
└── README.md        # Documentação básica
```

> **Princípio de design:** três arquivos de código (`index.html`, `style.css`, `app.js`) sem build toolchain. Facilita manutenção na fase de prototipação e compatibilidade com GitHub Pages.

---

## 4. Modelo de Dados

### 4.1 Estrutura de um Jogo (`games[]`)

Cada jogo é um objeto JavaScript persistido em `localStorage` sob a chave `backlog_oda_mobile`.

```js
{
  name:        String,    // Nome do jogo
  platform:    String,    // Plataforma (PC, PS5, Switch, etc.)
  status:      String,    // "Backlog" | "Jogando" | "Finalizado" | "Dropado"
  coverUrl:    String,    // URL da imagem de capa (IGDB CDN) ou string vazia
  igdbId:      Number,    // ID numérico na IGDB (null se adicionado manualmente)
  startDate:   String,    // ISO 8601 — data de início do jogo (null se Backlog)
  createdAt:   String,    // ISO 8601 — data de adição ao backlog
  playtime:    Number,    // Horas jogadas (input manual)
  finishCount: Number,    // Quantidade de vezes que finalizou
  dropCount:   Number,    // Quantidade de vezes que dropou
  notes:       String     // Anotações livres do usuário (opcional)
}
```

### 4.2 Preferências do Usuário

Armazenadas separadamente no `localStorage`:

| Chave | Tipo | Descrição |
|---|---|---|
| `backlog_oda_mobile` | `JSON string` | Array serializado de jogos |
| `max_playing_limit` | `string (number)` | Limite máximo de jogos com status "Jogando" |

### 4.3 Token de API (IGDB)

| Chave | Tipo | Descrição |
|---|---|---|
| `igdb_access_token` | `string` | Bearer token OAuth2 da Twitch |
| `igdb_token_expiry` | `string (timestamp)` | Timestamp de expiração do token |

---

## 5. Módulos Funcionais (app.js)

O `app.js` é organizado em módulos lógicos por responsabilidade:

### 5.1 Inicialização e Estado Global

```
Linha 1–28
```

- Registro do Service Worker
- Definição de constantes (`IGDB_CONFIG`, `DEFAULT_COVER`, `DEFAULT_PLATFORMS`)
- Estado global: `games[]`, `currentScreen`, `selectedGameData`, `maxPlayingLimit`

### 5.2 Sistema de Diálogos Customizados

```
Linhas 33–96 | customAlert(), customConfirm()
```

Substitui `alert()` e `confirm()` nativos por modais estilizados com Promise. Reutilizado em todo o app para confirmações e avisos.

### 5.3 Roteamento de Telas (SPA)

```
Linhas 98–221 | switchView(), switchMainTab()
```

Gerencia a visibilidade das "páginas" da aplicação via `display` + `opacity` + `transform` CSS para animações suaves:

```
homeView → othersView
         → addGameView
finalizadosView
dropadosView
```

Tabs superiores (`Backlog`, `Finalizados`, `Dropados`) controlam qual view principal está ativa.

### 5.4 Integração com IGDB

```
Linhas 254–416 | refreshAccessToken(), getAccessToken(), fetchSuggestions(), renderSuggestions()
```

**Fluxo de autenticação:**
1. Token OAuth2 obtido via POST em `id.twitch.tv` com Client ID + Client Secret
2. Token cacheado no `localStorage` com timestamp de expiração
3. Renovação automática quando expirado

**Fluxo de busca:**
1. Usuário digita na tela "Adicionar Jogo" (debounce de 400ms)
2. `fetchSuggestions()` chama IGDB via `corsproxy.io` buscando nome, capa e plataformas
3. Resultados renderizados como grid de cards clicáveis (`renderSuggestions()`)

> **Limitação conhecida:** As credenciais IGDB (Client ID e Secret) ficam expostas no código client-side. Aceitável para uso pessoal/privado; para publicação pública exigiria um backend proxy.

### 5.5 Renderização da Lista de Jogos

```
Linhas 496–769 | createGameCard(), render()
```

A função `render()` é o coração da UI. A cada mudança de estado ela:

1. Filtra `games[]` por status e aba ativa
2. Separa os primeiros 5 jogos do Backlog (exibidos na home) dos demais
3. Renderiza o carrossel de jogos "Jogando Atualmente" com swipe e dots de paginação
4. Gera os cards via `createGameCard()` com:
   - Capa do jogo (ou placeholder SVG)
   - Nome + plataforma
   - Seletor de status
   - Botões de ordenação (↑ ↓)
   - Botão de remoção

### 5.6 Carrossel de "Jogando Atualmente"

```
Dentro de render() | Linhas ~590–670
```

- Cards de destaque para jogos com status `Jogando`
- Suporte a swipe horizontal via touch events (`touchstart`, `touchend`)
- Dots de navegação sincronizados com scroll

### 5.7 Modal de Detalhes do Jogo

```
Linhas 1416–1714 | showGameDetails(), renderSimpleDetails(), renderRichDetails()
```

Ao clicar em um card:
1. Exibe modal de loading
2. Tenta buscar detalhes via IGDB (`fetchGameExtraDetails()`) se houver `igdbId`
3. Renderiza versão rica (sinopse, gêneros, screenshots, trailer YouTube) se dados disponíveis
4. Fallback para versão simples (dados locais apenas) em caso de erro ou jogo manual
5. Tradução automática da sinopse via MyMemory API (background, não bloqueia a UI)

### 5.8 Gerenciamento de Status

```
Linhas 849–944 | updateStatus()
```

- Validação do limite `maxPlayingLimit` antes de mudar para "Jogando"
- Atualização de `startDate` ao iniciar um jogo
- Incremento automático de `finishCount` / `dropCount` ao finalizar/dropar
- Re-renderização após mudança

### 5.9 Backup (Exportar / Importar)

```
Linhas 1049–1153 | exportData(), importData()
```

- **Exportar:** Serializa `games[]` para JSON e dispara download via `Blob` + `URL.createObjectURL`
- **Importar:** Lê arquivo `.json` via `FileReader`, valida estrutura e mescla ou substitui dados

### 5.10 Menu e Preferências

```
Linhas 946–1014 | toggleMenu(), triggerImport(), clearAllData(), openPreferencesModal()
```

Menu sanduíche com dropdown (em refatoração para side drawer). Preferência configurável: limite máximo de jogos simultâneos no status "Jogando".

---

## 6. Design System (style.css)

### 6.1 Variáveis CSS (Custom Properties)

```css
:root {
  --bg-color:        #0f172a;  /* Fundo principal (azul escuro) */
  --card-bg:         #1e293b;  /* Fundo de cards e modais */
  --border-color:    #334155;  /* Bordas e divisores */
  --primary:         #8b5cf6;  /* Roxo — cor de ação principal */
  --primary-hover:   #7c3aed;
  --text-light:      #f8fafc;  /* Texto principal */
  --text-muted:      #94a3b8;  /* Texto secundário */
  --status-backlog:  #64748b;  /* Cinza */
  --status-playing:  #eab308;  /* Amarelo */
  --status-finished: #22c55e;  /* Verde */
  --status-dropped:  #ef4444;  /* Vermelho */
}
```

### 6.2 Componentes CSS

| Componente | Classes | Descrição |
|---|---|---|
| Cards de jogo | `.game-card`, `.status-*::before` | Card com barra colorida de status |
| Carrossel | `.carousel-container`, `.carousel-track`, `.carousel-dots` | Destaque de jogos em andamento |
| Modais | `.modal-overlay`, `.modal-container`, `.modal-hero` | Bottom sheet no mobile, modal centrado no desktop |
| Abas | `.nav-tabs`, `.tab-btn.active` | Navegação entre Backlog / Finalizados / Dropados |
| Side Drawer | `.drawer-overlay`, `.drawer-content`, `.drawer-nav` | Menu lateral deslizante |
| Diálogos | `.modal-overlay` (reutilizado) | Alert / Confirm customizados |

### 6.3 Responsividade

```css
/* Mobile-first: layout base para telas pequenas */
.container { max-width: 500px; }

/* Bottom sheet para modais em telas ≤ 480px */
@media (max-width: 480px) {
  .modal-overlay { align-items: flex-end; }
  .modal-container { border-radius: 24px 24px 0 0; transform: translateY(100%); }
}
```

---

## 7. Progressive Web App (PWA)

### 7.1 Service Worker (`sw.js`)

**Estratégia de cache:** Cache-first para assets estáticos, Network-first para APIs externas.

```
install  → Pré-cacheia: index.html, style.css, app.js, manifest.json, icon.svg
activate → Remove caches com versão antiga (CACHE_NAME != 'backlog-v1')
fetch    → Retorna do cache se disponível; faz fetch se não
           Ignora: api.igdb.com, corsproxy.io, id.twitch.tv (sempre online)
```

### 7.2 Web App Manifest

```json
{
  "name": "Meu Backlog de Jogos",
  "short_name": "Backlog",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#8b5cf6",
  "background_color": "#0f172a"
}
```

**Critérios de instalabilidade (Android):**
- ✅ HTTPS (ou localhost)
- ✅ `manifest.json` linkado
- ✅ Service Worker registrado com evento `fetch`
- ✅ Ícone SVG maskable

---

## 8. Integrações Externas

### 8.1 IGDB (Internet Game Database)

| Detalhe | Valor |
|---|---|
| Auth endpoint | `https://id.twitch.tv/oauth2/token` |
| API endpoint | `https://api.igdb.com/v4/games` |
| CORS Proxy | `https://corsproxy.io/?url=` |
| Método | POST com corpo Apicalypse |
| Dados retornados | `name`, `cover`, `platforms`, `summary`, `genres`, `screenshots`, `videos`, `rating`, `first_release_date`, `involved_companies` |

### 8.2 MyMemory Translation API

| Detalhe | Valor |
|---|---|
| Endpoint | `https://api.mymemory.translated.net/get` |
| Método | GET com params `q` (texto) e `langpair` (`en|pt-BR`) |
| Uso | Tradução assíncrona da sinopse (não bloqueia renderização) |
| Limitação | Gratuita, limite de 500 chars/requisição sem API key |

---

## 9. Fluxos Principais

### 9.1 Adicionar Jogo

```
Usuário clica "+" 
  → openAddGameScreen()
  → Digita nome → debounce 400ms → fetchSuggestions() → IGDB
  → renderSuggestions() → grid de cards
  → Clique no card → addGameFromPreview()
  → games.push({...}) → save() → render()
```

### 9.2 Ver Detalhes do Jogo

```
Usuário clica no card
  → showGameDetails(index)
  → Modal de loading exibido
  → fetchGameExtraDetails(igdbId) → IGDB [se igdbId disponível]
    → Success: renderRichDetails()
    → Error/null: renderSimpleDetails()
  → translateText(summary) [background]
  → Atualiza sinopse traduzida
```

### 9.3 Exportar Backup

```
Menu → "Exportar Backup"
  → exportData()
  → JSON.stringify(games[])
  → Blob → URL.createObjectURL
  → <a download> simulado → arquivo .json baixado
```

### 9.4 Importar Backup

```
Menu → "Importar Backup"
  → triggerImport() → <input type="file">.click()
  → Usuário seleciona .json
  → importData(event) → FileReader.readAsText()
  → JSON.parse() → validação de estrutura
  → games = parsedData → save() → render()
```

---

## 10. Limitações Conhecidas e Débitos Técnicos

| # | Limitação | Impacto | Resolução futura |
|---|---|---|---|
| 1 | Credenciais IGDB expostas no client-side | Segurança — risco baixo para uso pessoal | Implementar backend proxy (Node/Cloudflare Workers) |
| 2 | `localStorage` como única persistência | Dados perdidos se o usuário limpar o browser | Integração com Google Drive / IndexedDB |
| 3 | `app.js` monolítico (~1.700 linhas) | Manutenibilidade | Refatoração em módulos ES6 ou migração para Angular |
| 4 | CORS Proxy (`corsproxy.io`) de terceiro | Dependência externa sem SLA | Substituir por proxy próprio ao produzir |
| 5 | Sem testes automatizados | Regressões manuais | Adicionar Vitest/Jest ao migrar para framework |
| 6 | Menu drawer com bugs de comportamento | UX prejudicada | Em investigação ativa |
| 7 | MyMemory API limitada a 500 chars | Sinopses longas cortadas | Usar DeepL/LibreTranslate com API key |
| 8 | Sem PWA update flow | Usuário pode ficar com versão antiga em cache | Implementar `skipWaiting` + notificação de atualização |

---

## 11. Decisões de Arquitetura Registradas

| Decisão | Alternativas consideradas | Razão da escolha |
|---|---|---|
| Vanilla JS sem framework | Angular, Vue, React | Prototipação rápida sem build step; framework avaliado para v2 |
| 3 arquivos (HTML/CSS/JS) | Componentização, bundler | Compatibilidade direta com GitHub Pages; sem dependências |
| localStorage | IndexedDB, backend | Zero infraestrutura; suficiente para uso pessoal |
| IGDB como fonte de dados | RAWG, GiantBomb, manual | API gratuita mais completa para jogos |
| Side Drawer em vez de dropdown | Dropdown, bottom sheet | Padrão mobile universal; melhor UX em telas pequenas |

---

## 12. Roadmap de Features

### Curto prazo (prototipação)
- [ ] Corrigir funcionamento do side drawer menu
- [ ] Filtros e ordenação da lista de jogos
- [ ] Campo de anotações por jogo

### Médio prazo
- [ ] Backup automático no Google Drive
- [ ] Integração com HowLongToBeat (requer backend)
- [ ] Estatísticas e gráficos da coleção
- [ ] Tela de perfil/resumo anual

### Longo prazo (v2 com framework)
- [ ] Migração para Angular ou Next.js
- [ ] Backend próprio (Node.js ou Cloudflare Workers)
- [ ] Conta de usuário e sincronização entre dispositivos
- [ ] Hospedagem privada (Cloudflare Pages, Railway)
