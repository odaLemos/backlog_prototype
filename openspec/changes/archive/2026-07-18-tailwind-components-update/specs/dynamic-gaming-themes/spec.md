## ADDED Requirements

### Requirement: Platform-themed Color Palettes
O sistema SHALL permitir a troca dinâmica de temas visuais, alterando cores de destaque, fundos e botões de acordo com o tema selecionado (Padrão/Twitch, Nintendont/Nintendo, X-theme/Xbox, Vapor/Steam).

#### Scenario: Apply Default Twitch theme
- **WHEN** o usuário seleciona o tema "Padrão"
- **THEN** a cor primária de destaque torna-se Roxo Twitch e o visual do app se adapta a essa paleta.

#### Scenario: Apply Nintendo theme
- **WHEN** o usuário seleciona o tema "Nintendont"
- **THEN** o destaque principal do app torna-se Vermelho Nintendo.

#### Scenario: Apply Xbox theme
- **WHEN** o usuário seleciona o tema "X-theme"
- **THEN** o destaque principal do app torna-se Verde Xbox.

#### Scenario: Apply Steam theme
- **WHEN** o usuário seleciona o tema "Vapor"
- **THEN** a interface adota a paleta degradê escuro e azul característica do Steam.
