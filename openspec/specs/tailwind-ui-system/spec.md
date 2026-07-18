# tailwind-ui-system Specification

## Purpose
TBD - created by archiving change tailwind-components-update. Update Purpose after archive.
## Requirements
### Requirement: Responsive Sidebar Drawer Navigation
O sistema SHALL apresentar um menu de navegação lateral (Sidebar Drawer) que desliza a partir da lateral da tela quando acionado e se recolhe quando dispensado.

#### Scenario: Open sidebar drawer
- **WHEN** o usuário clica no botão de menu hambúrguer
- **THEN** o menu lateral desliza para dentro da tela e exibe as opções de navegação com um overlay escuro no fundo.

#### Scenario: Dismiss sidebar drawer
- **WHEN** o menu está aberto e o usuário clica fora dele (no overlay) ou clica em uma opção/fechar
- **THEN** o menu lateral desliza para fora da tela e o overlay desaparece.

### Requirement: Tailwind Toast/Alert Notifications
O sistema SHALL exibir mensagens de alerta (sucesso, erro, avisos) ao usuário por meio de notificações flutuantes (toasts) ou banners estilizados com Tailwind CSS, substituindo diálogos modais bloqueantes.

#### Scenario: Show success alert toast
- **WHEN** uma ação de sucesso ocorre (ex. backup exportado com sucesso)
- **THEN** o sistema exibe um toast de sucesso estilizado com cores adequadas (ex. verde/Twitch theme context) que desaparece automaticamente ou após fechamento manual.

### Requirement: Mobile-Optimized Dialog Overlays
O sistema SHALL apresentar telas de detalhes de jogo e preferências utilizando modais responsivos que se comportam como bottom-sheet em telas pequenas (celulares) e como modal centralizado em telas maiores.

#### Scenario: Show game details on mobile
- **WHEN** o usuário clica em um card de jogo em uma tela de largura igual ou inferior a 480px
- **THEN** o sistema exibe o modal de detalhes deslizando-o de baixo para cima (estilo bottom-sheet).

#### Scenario: Show game details on desktop
- **WHEN** o usuário clica em um card de jogo em uma tela de largura superior a 480px
- **THEN** o sistema exibe o modal de detalhes centralizado na tela com um overlay escuro.

