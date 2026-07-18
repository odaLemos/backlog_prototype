## Why

O protótipo atual depende de CSS Vanilla com propriedades personalizadas para estilo e de uma implementação personalizada para modais/alertas. A integração do Tailwind CSS simplificará a manutenção de estilo, tornará o design responsivo mais robusto e facilitará a transição dinâmica de temas. Além disso, substituir os alertas e modais por componentes otimizados para dispositivos móveis melhorará a experiência de uso (UX) em celulares.

## What Changes

- Integração do Tailwind CSS no projeto (via CDN para manter o formato sem etapa de compilação/build).
- Substituição do sistema atual de diálogos (`customAlert` e `customConfirm`) por alertas/toasts baseados no Tailwind.
- Substituição de modais de detalhes e de preferências por componentes adequados para celular (como bottom-sheets com overlays arrastáveis ou layouts mobile-friendly).
- Implementação de um menu de navegação do tipo Sidebar Drawer responsivo.
- Configuração de 4 temas dinâmicos com as paletas de cores solicitadas:
  - **Padrão** (Twitch): Roxo Twitch (`#9146FF`)
  - **Nintendont** (Nintendo): Vermelho Nintendo (`#E60012`)
  - **X-theme** (Xbox): Verde Xbox (`#107C10`)
  - **Vapor** (Steam): Tons escuros e azuis degradê do Steam (`#171a21`, `#1b2838`, `#66c0f4`)

## Capabilities

### New Capabilities
- `tailwind-ui-system`: Sistema de componentes de interface responsivos baseados no Tailwind CSS (sidebar, toasts e overlays otimizados para celular).
- `dynamic-gaming-themes`: Suporte para múltiplos temas dinâmicos inspirados em plataformas de jogos (Twitch, Nintendo, Xbox, Steam) aplicando as paletas de cores correspondentes.

### Modified Capabilities
<!-- Sem especificações anteriores no diretório openspec/specs -->
