## 1. Setup e Configuração do Tailwind

- [x] 1.1 Incluir a biblioteca Tailwind CSS Play CDN no head do index.html.
- [x] 1.2 Configurar o Tailwind para suportar a paleta de cores dinâmica baseada em CSS Variables.
- [x] 1.3 Atualizar o Service Worker (sw.js) para cachear a URL do script do Tailwind CDN permitindo funcionamento offline.

## 2. Implementação do Sistema de Temas Dinâmicos

- [x] 2.1 Mapear no JavaScript (app.js) o dicionário de cores para os 4 temas (Padrão/Twitch, Nintendont/Nintendo, X-theme/Xbox, Vapor/Steam).
- [x] 2.2 Refatorar a função de mudança de tema (changeTheme) para atualizar dinamicamente as variáveis CSS no elemento root.
- [x] 2.3 Adaptar a estilização dos cards, textos, botões e fundos usando as novas classes do Tailwind baseadas no tema brand (ex: bg-brand-bg, text-brand-primary, border-brand-border).

## 3. Sidebar Drawer Navigation

- [x] 3.1 Substituir o menu dropdown antigo por um componente Sidebar Drawer estruturado em Tailwind no index.html.
- [x] 3.2 Implementar lógica em JS para abrir e fechar o menu lateral adicionando/removendo classes de transição (ex: translate-x-0 / -translate-x-full).
- [x] 3.3 Adicionar comportamento de fechamento ao clicar fora do drawer (overlay) ou ao selecionar uma opção.

## 4. Modais Otimizados para Celular (Bottom-Sheets)

- [x] 4.1 Substituir os estilos antigos do modal de detalhes do jogo para usar classes do Tailwind que atuam como bottom-sheet no mobile e modal centralizado no desktop.
- [x] 4.2 Atualizar o modal de preferências e onboarding utilizando as classes responsivas do Tailwind para celulares.
- [x] 4.3 Ajustar as transições de abertura/fechamento das overlays e modais usando Tailwind.

## 5. Alertas e Toasts Baseados em Tailwind

- [x] 5.1 Adicionar um container de toasts no HTML e lógica de manipulação no JS para exibir mensagens usando alertas estilizados do Tailwind.
- [x] 5.2 Substituir as chamadas antigas de `customAlert()` pelo novo gerenciador de toasts do Tailwind.
- [x] 5.3 Implementar modal de confirmação responsiva (bottom-sheet/desktop) para substituir o `customConfirm()` antigo.

## 6. Validação e Ajustes Finais

- [x] 6.1 Testar a responsividade e transição de temas em diferentes resoluções.
- [x] 6.2 Validar a compatibilidade PWA offline testando o cache do script Tailwind CDN.
