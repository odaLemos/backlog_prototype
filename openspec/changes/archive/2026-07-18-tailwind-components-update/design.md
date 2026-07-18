## Context

O protótipo atual é uma Single Page Application (SPA) para gerenciamento de backlog de jogos, que funciona completamente offline (PWA) e utiliza localStorage para persistência de dados. A estilização atual é baseada em CSS Vanilla, com modais e caixas de diálogo (`customAlert`, `customConfirm`) injetadas via JavaScript e um menu dropdown simples. Para melhorar a responsividade, a experiência no celular (mobile-first) e padronizar o design, estamos migrando o visual para componentes baseados no **Tailwind CSS**, permitindo também suporte dinâmico a 4 temas visuais inspirados nas plataformas de jogos Twitch, Nintendo, Xbox e Steam.

## Goals / Non-Goals

**Goals:**
- Integrar o Tailwind CSS (Play CDN v3 ou v4) sem quebrar o suporte PWA offline.
- Substituir o menu dropdown atual por um **Sidebar Drawer Navigation** responsivo.
- Substituir modais gerais e de detalhes por layouts responsivos que se comportam como **bottom-sheets** no mobile.
- Substituir os alertas customizados e confirmadores por alertas não-bloqueantes (**Alert Toasts**) com visual moderno baseados em Tailwind.
- Implementar 4 temas dinâmicos usando paletas específicas e estendendo a configuração do Tailwind via CSS Variables.

**Non-Goals:**
- Reescrever a lógica de integração com a API IGDB ou MyMemory Translation.
- Alterar o modelo de dados dos jogos persistidos no localStorage.
- Migrar para um framework JS de build step (como Next.js ou Angular); manteremos vanilla JS.

## Decisions

### 1. Integração do Tailwind CSS via Play CDN
Para manter a arquitetura sem etapa de build (SPA com 3 arquivos principais hospedável no GitHub Pages), utilizaremos o Tailwind CSS Play CDN.
- *Alternativa considerada:* Configurar npm build com Tailwind CLI. Descartado por complexidade de infraestrutura na fase de prototipação atual.
- *Configuração:* O script do Tailwind CDN será importado no `<head>` do `index.html`. O arquivo `style.css` continuará contendo regras globais específicas (como animações complexas ou overrides de reset).

### 2. Temas dinâmicos via Variáveis CSS acopladas ao Tailwind
Em vez de alternar dezenas de classes no JS para cada tema, configuraremos o Tailwind para usar variáveis CSS no objeto `theme.extend.colors`. As variáveis serão atualizadas via JS no elemento `:root`.
- *Configuração de Cores por Tema:*
  - **Padrão (Twitch)**: Roxo principal (`#9146FF`), fundo azul/roxo escuro (`#0f172a`), cards e bordas cinzas-escuro/zinc.
  - **Nintendont (Nintendo)**: Vermelho principal (`#E60012`), fundos e cards escuros neutros (`#0a0a0a`/`#1a1a1a`), bordas cinzas.
  - **X-theme (Xbox)**: Verde Xbox (`#107C10`), fundos escuros e pretos foscos (`#111`/`#1f1f1f`).
  - **Vapor (Steam)**: Azul/Ciano claro (`#66c0f4`), fundos gradê escuro azulado (`#171a21`/`#1b2838`), bordas azuis (`#2a475e`).
- *Implementação:* Definiremos a paleta `brand` no `tailwind.config`:
  ```js
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          brand: {
            primary: 'var(--brand-primary)',
            bg: 'var(--brand-bg)',
            card: 'var(--brand-card)',
            border: 'var(--brand-border)',
            text: 'var(--brand-text)',
            muted: 'var(--brand-muted)',
            accent: 'var(--brand-accent)'
          }
        }
      }
    }
  }
  ```

### 3. Alertas / Toasts Não Bloqueantes do Tailwind
Substituiremos a modal invasiva `#customDialogModal` por um gerenciador de notificações do tipo Toast que empilha pequenas mensagens flutuantes no canto superior ou inferior da tela. Para diálogos de confirmação (`confirm`), utilizaremos um modal simplificado estilo bottom-sheet no mobile ou centralizado no desktop, integrado via Tailwind.

### 4. Menu lateral (Sidebar Drawer Navigation)
Implementaremos um menu lateral deslizante (Drawer) controlado por classes utilitárias de transição do Tailwind (`transition-transform duration-300 transform -translate-x-full` para ocultar e `translate-x-0` para exibir). No mobile, o drawer cobrirá grande parte da tela (por exemplo, 80% da largura); no desktop, poderá atuar como um sidebar permanente ou deslizante menor.

### 5. Modais estilo Bottom-Sheet no Mobile
Os modais de detalhes do jogo, de preferências e de diálogos de confirmação utilizarão classes responsivas do Tailwind para se fixarem na parte inferior e deslizarem de baixo para cima no mobile (telas `< 640px` ou `< 480px`), enquanto no desktop se posicionam no centro como modais tradicionais.

## Risks / Trade-offs

- **[Risco]** Carregamento do Tailwind CDN offline: Como o app é uma PWA offline, se o usuário abrir o app sem conexão pela primeira vez em um novo navegador ou se o cache expirar, o Tailwind CDN pode falhar.
  - *Mitigação:* O Service Worker (`sw.js`) será configurado para interceptar e fazer o cache da URL do script do CDN do Tailwind no evento de instalação.
- **[Risco]** Performance de compilação JIT do Tailwind CDN: Em dispositivos móveis antigos, o interpretador JS do CDN pode introduzir um pequeno atraso inicial de renderização.
  - *Mitigação:* Manteremos o HTML o mais limpo possível e o CSS original limpo. O impacto é insignificante para um app deste porte.
