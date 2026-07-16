// --- REGISTRO DO SERVICE WORKER (PWA) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                console.log('Service Worker registrado com sucesso:', reg.scope);
                // Escuta atualizações do service worker
                reg.onupdatefound = () => {
                    const installingWorker = reg.installing;
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                // Novo conteúdo está disponível, recarrega a página automaticamente
                                console.log('Novo Service Worker instalado. Recarregando a página...');
                                window.location.reload();
                            }
                        }
                    };
                };
            })
            .catch(err => console.error('Erro ao registrar Service Worker:', err));
    });
}


// --- CONFIGURAÇÃO DA API IGDB ---
        // Preencha com as suas credenciais da Twitch Developer para habilitar a busca automatizada.
        const IGDB_CONFIG = {
            CLIENT_ID: '8io6hzb86ffaiix0xz5jnxa5a9fdht',      // Seu Client ID
            CLIENT_SECRET: 'egfbyxg1r1x1e20tquv093gepig8vs',  // Seu Client Secret
            PROXY_URL: 'https://corsproxy.io/?url='
        };

        const DEFAULT_COVER = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iMTYwIiB2aWV3Qm94PSIwIDAgMTIwIDE2MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxNjAiIHJ4PSIxMiIgZmlsbD0iIzFlMjkzYiIgc3Ryb2tlPSIjMzM0MTU1IiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNNDAgNzBINTZNNDggNjJWNzhNODAgNzJDODAgNzAuODk1NCA4MC44OTU0IDcwIDgyIDcwQzgzLjEwNDYgNzAgODQgNzAuODk1NCA4NCA3MkM4NCA3My4xMDQ2IDgzLjEwNDYgNzQgODIgNzRDODAuODk1NCA3NCA4MCA3My4xMDQ2IDgwIDcyWk04OCA3NkM4OCA3NC44OTU0IDg4Ljg5NTQgNzQgOTAgNzRDOTEuMTA0NiA3NCA5MiA3NC44OTU0IDkyIDc2QzkyIDc3LjEwNDYgOTEuMTA0NiA3OCA5MCA3OEM4OC44OTU0IDc4IDg4IDc3LjEwNDYgODggNzZaTTQyIDU0QzQ4IDQ2IDcyIDQ2IDc4IDU0Qzg0IDYyIDg0IDc4IDc4IDgyQzczLjUgODggNjYgODggNjAgODZINTRDNDggODggNDAuNSA4OCAzNiA4MkMzMCA3NCAzMCA2MiA4MiA1NFoiIHN0cm9rZT0iIzQ3NTU2OSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48dGV4dCB4PSI2MCIgeT0iMTE1IiBmaWxsPSIjNjQ3NDhiIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSI4IiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SU1BR0VNPC90ZXh0Pjx0ZXh0IHg9IjYwIiB5PSIxMjciIGZpbGw9IiM2NDc0OGIiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JTkRJU1BPTsONVkVMPC90ZXh0Pjwvc3ZnPg==`;
        const DEFAULT_PLATFORMS = ['PC', 'PS5', 'PS4', 'Switch', 'Xbox', 'SNES'];

        let games = JSON.parse(localStorage.getItem('backlog_oda_mobile')) || [];
        let currentScreen = 'home';
        let selectedGameData = null;
        let searchTimeout = null;
        let maxPlayingLimit = parseInt(localStorage.getItem('max_playing_limit')) || 3;
        let suggestionsOffset = 0;
        let isFetchingSuggestions = false;
        let allSuggestionsResults = [];

        function save() {
            localStorage.setItem('backlog_oda_mobile', JSON.stringify(games));
        }

        function customAlert(message, title = "Aviso", icon = "⚠️") {
            return new Promise((resolve) => {
                const modal = document.getElementById('customDialogModal');
                const titleEl = document.getElementById('customDialogTitle');
                const msgEl = document.getElementById('customDialogMessage');
                const iconEl = document.getElementById('customDialogIcon');
                const buttonsEl = document.getElementById('customDialogButtons');

                titleEl.textContent = title;
                msgEl.textContent = message;
                iconEl.innerHTML = icon;
                buttonsEl.innerHTML = `
                    <button class="add-btn" style="flex: 1; padding: 10px 20px;" id="customDialogOkBtn">OK</button>
                `;

                modal.classList.add('active');

                const handleOk = () => {
                    modal.classList.remove('active');
                    resolve();
                };

                const btn = document.getElementById('customDialogOkBtn');
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                newBtn.addEventListener('click', handleOk);
            });
        }

        function customConfirm(message, title = "Confirmar", icon = "❓", confirmText = "Confirmar", cancelText = "Cancelar") {
            return new Promise((resolve) => {
                const modal = document.getElementById('customDialogModal');
                const titleEl = document.getElementById('customDialogTitle');
                const msgEl = document.getElementById('customDialogMessage');
                const iconEl = document.getElementById('customDialogIcon');
                const buttonsEl = document.getElementById('customDialogButtons');

                titleEl.textContent = title;
                msgEl.textContent = message;
                iconEl.innerHTML = icon;
                buttonsEl.innerHTML = `
                    <button class="backup-btn" style="flex: 1; padding: 10px 20px; border-color: rgba(255,255,255,0.15);" id="customDialogCancelBtn">${cancelText}</button>
                    <button class="add-btn" style="flex: 1; padding: 10px 20px; background: var(--status-dropped); border-color: rgba(239, 68, 68, 0.4);" id="customDialogConfirmBtn">${confirmText}</button>
                `;

                modal.classList.add('active');

                const close = (result) => {
                    modal.classList.remove('active');
                    resolve(result);
                };

                const confirmBtn = document.getElementById('customDialogConfirmBtn');
                const newConfirmBtn = confirmBtn.cloneNode(true);
                confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

                const cancelBtn = document.getElementById('customDialogCancelBtn');
                const newCancelBtn = cancelBtn.cloneNode(true);
                cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

                newConfirmBtn.addEventListener('click', () => close(true));
                newCancelBtn.addEventListener('click', () => close(false));
            });
        }

        function switchView(view) {
            currentScreen = view;
            const homeView = document.getElementById('homeView');
            const othersView = document.getElementById('othersView');
            const finalizadosView = document.getElementById('finalizadosView');
            const dropadosView = document.getElementById('dropadosView');
            const addGameView = document.getElementById('addGameView');

            const allViews = [homeView, othersView, finalizadosView, dropadosView, addGameView];

            allViews.forEach(v => {
                if (v && v.style.display !== 'none') {
                    v.style.opacity = '0';
                    v.style.transform = 'translateY(10px)';
                    setTimeout(() => {
                        v.style.display = 'none';
                    }, 200);
                }
            });

            let targetView = homeView;
            if (view === 'home') {
                if (activeMainTab === 'backlog') targetView = homeView;
                else if (activeMainTab === 'finalizados') targetView = finalizadosView;
                else if (activeMainTab === 'dropados') targetView = dropadosView;
            } else if (view === 'others') {
                targetView = othersView;
            } else if (view === 'addGame') {
                targetView = addGameView;
            }

            setTimeout(() => {
                if (targetView) {
                    targetView.style.display = 'flex';
                    setTimeout(() => {
                        targetView.style.opacity = '1';
                        targetView.style.transform = 'translateY(0)';
                    }, 20);
                }
            }, 200);
        }

        let activeMainTab = 'backlog';

        function switchMainTab(tabName) {
            activeMainTab = tabName;
            
            document.getElementById('tabBacklog').classList.remove('active');
            document.getElementById('tabFinalizados').classList.remove('active');
            document.getElementById('tabDropados').classList.remove('active');
            
            if (tabName === 'backlog') {
                document.getElementById('tabBacklog').classList.add('active');
            } else if (tabName === 'finalizados') {
                document.getElementById('tabFinalizados').classList.add('active');
            } else if (tabName === 'dropados') {
                document.getElementById('tabDropados').classList.add('active');
            }

            // Move o botão circular "+" para o âncora da aba ativa
            const plusBtn = document.querySelector('.add-game-circle-btn');
            if (plusBtn) {
                if (tabName === 'backlog') {
                    const anchor = document.getElementById('backlogInputAnchor');
                    if (anchor) anchor.appendChild(plusBtn);
                } else if (tabName === 'finalizados') {
                    const anchor = document.getElementById('finalizadosInputAnchor');
                    if (anchor) anchor.appendChild(plusBtn);
                } else if (tabName === 'dropados') {
                    const anchor = document.getElementById('dropadosInputAnchor');
                    if (anchor) anchor.appendChild(plusBtn);
                }
            }

            // Atualiza o placeholder do input de jogo baseado na aba
            const gameInputEl = document.getElementById('gameInput');
            if (gameInputEl) {
                if (tabName === 'backlog') {
                    gameInputEl.placeholder = 'Adicionar jogo ao backlog...';
                } else if (tabName === 'finalizados') {
                    gameInputEl.placeholder = 'Adicionar jogo finalizado...';
                } else if (tabName === 'dropados') {
                    gameInputEl.placeholder = 'Adicionar jogo dropado...';
                }
            }

            const homeView = document.getElementById('homeView');
            const othersView = document.getElementById('othersView');
            const finalizadosView = document.getElementById('finalizadosView');
            const dropadosView = document.getElementById('dropadosView');
            const addGameView = document.getElementById('addGameView');

            // Oculta todas as visualizações com efeito suave de opacidade
            [homeView, othersView, finalizadosView, dropadosView, addGameView].forEach(v => {
                if (v) {
                    v.style.display = 'none';
                    v.style.opacity = '0';
                    v.style.transform = 'translateY(10px)';
                }
            });

            // Mostra a aba ativa
            if (tabName === 'backlog') {
                homeView.style.display = 'flex';
                setTimeout(() => {
                    homeView.style.opacity = '1';
                    homeView.style.transform = 'translateY(0)';
                }, 20);
                currentScreen = 'home';
            } else if (tabName === 'finalizados') {
                finalizadosView.style.display = 'flex';
                setTimeout(() => {
                    finalizadosView.style.opacity = '1';
                    finalizadosView.style.transform = 'translateY(0)';
                }, 20);
                currentScreen = 'home';
            } else if (tabName === 'dropados') {
                dropadosView.style.display = 'flex';
                setTimeout(() => {
                    dropadosView.style.opacity = '1';
                    dropadosView.style.transform = 'translateY(0)';
                }, 20);
                currentScreen = 'home';
            }
        }

        let previousScreen = 'home';
        function openAddGameScreen() {
            previousScreen = currentScreen;
            
            const addTitle = document.getElementById('addGameViewTitle');
            if (activeMainTab === 'backlog') {
                addTitle.textContent = 'Adicionar ao Backlog';
            } else if (activeMainTab === 'finalizados') {
                addTitle.textContent = 'Adicionar aos Finalizados';
            } else if (activeMainTab === 'dropados') {
                addTitle.textContent = 'Adicionar aos Dropados';
            }

            switchView('addGame');
            setTimeout(() => {
                document.getElementById('gameInput').focus();
            }, 300);
        }

        function closeAddGameScreen() {
            document.getElementById('gameInput').value = '';
            document.getElementById('suggestionsGrid').innerHTML = '';
            selectedGameData = null;
            resetPlatformDatalist();

            switchView(previousScreen);
        }

        // --- LÓGICA DA API IGDB ---

        async function refreshAccessToken() {
            const tokenUrl = 'https://id.twitch.tv/oauth2/token' +
                `?client_id=${IGDB_CONFIG.CLIENT_ID}` +
                `&client_secret=${IGDB_CONFIG.CLIENT_SECRET}` +
                `&grant_type=client_credentials`;
            
            const url = IGDB_CONFIG.PROXY_URL ? (IGDB_CONFIG.PROXY_URL + encodeURIComponent(tokenUrl)) : tokenUrl;
            
            try {
                const response = await fetch(url, {
                    method: 'POST'
                });
                
                if (!response.ok) {
                    throw new Error(`Erro ao gerar token: ${response.statusText}`);
                }
                
                const data = await response.json();
                const accessToken = data.access_token;
                const expiresAt = Date.now() + (data.expires_in * 1000);
                
                localStorage.setItem('igdb_access_token', accessToken);
                localStorage.setItem('igdb_token_expires_at', expiresAt);
                
                return accessToken;
            } catch (error) {
                console.error('Erro ao renovar token do IGDB:', error);
                throw error;
            }
        }

        async function getAccessToken(forceRefresh = false) {
            const token = localStorage.getItem('igdb_access_token');
            const expiresAt = localStorage.getItem('igdb_token_expires_at');
            
            if (forceRefresh || !token || !expiresAt || Date.now() >= parseInt(expiresAt)) {
                return await refreshAccessToken();
            }
            
            return token;
        }

        async function fetchSuggestions(query, isAppend = false) {
            if (!IGDB_CONFIG.CLIENT_ID || !IGDB_CONFIG.CLIENT_SECRET) {
                console.warn('IGDB API: Client ID ou Client Secret não configurados no código.');
                return;
            }

            if (isFetchingSuggestions) return;
            isFetchingSuggestions = true;

            const targetUrl = 'https://api.igdb.com/v4/games';
            const url = IGDB_CONFIG.PROXY_URL ? (IGDB_CONFIG.PROXY_URL + encodeURIComponent(targetUrl)) : targetUrl;
            
            try {
                let token = await getAccessToken();
                
                const offset = isAppend ? suggestionsOffset : 0;
                const requestBody = `search "${query}"; fields name, cover.url, platforms.name; limit 10; offset ${offset};`;

                let response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Client-ID': IGDB_CONFIG.CLIENT_ID,
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'text/plain'
                    },
                    body: requestBody
                });

                if (response.status === 401) {
                    console.warn('Token expirado ou inválido. Renovando...');
                    token = await getAccessToken(true);
                    response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Client-ID': IGDB_CONFIG.CLIENT_ID,
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'text/plain'
                        },
                        body: requestBody
                    });
                }

                if (!response.ok) {
                    throw new Error(`Erro na API IGDB: ${response.statusText}`);
                }

                const data = await response.json();
                
                if (isAppend) {
                    allSuggestionsResults = allSuggestionsResults.concat(data);
                } else {
                    allSuggestionsResults = data;
                }
                
                suggestionsOffset = allSuggestionsResults.length;
                renderSuggestions(allSuggestionsResults, query);
            } catch (error) {
                console.error('Erro ao buscar sugestões no IGDB:', error);
            } finally {
                isFetchingSuggestions = false;
            }
        }

        function renderSuggestions(results, query) {
            const grid = document.getElementById('suggestionsGrid');
            grid.innerHTML = '';

            if (results && results.length > 0) {
                results.forEach(game => {
                    const card = document.createElement('div');
                    card.className = 'suggestion-grid-card';
                    
                    let coverUrl = '';
                    if (game.cover && game.cover.url) {
                        coverUrl = 'https:' + game.cover.url.replace('t_thumb', 't_cover_big');
                    } else {
                        coverUrl = DEFAULT_COVER;
                    }

                    const platforms = game.platforms || [];
                    const platformsBadges = platforms.map(plat => `<span style="font-size: 0.6rem; background: rgba(139, 92, 246, 0.85); color: white; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.1);">${plat.name}</span>`).join('');

                    card.innerHTML = `
                        <img src="${coverUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="Capa">
                        <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.4) 70%, transparent 100%); padding: 12px 8px; display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; z-index: 2;">
                            ${platformsBadges}
                        </div>
                    `;

                    card.addEventListener('click', () => {
                        const gameObj = {
                            name: game.name,
                            coverUrl: coverUrl,
                            igdbId: game.id,
                            platforms: platforms,
                            status: activeMainTab === 'finalizados' ? 'Finalizado' : (activeMainTab === 'dropados' ? 'Dropado' : 'Backlog')
                        };
                        selectedGameData = gameObj;
                        
                        document.getElementById('gameInput').value = game.name;
                        showGameDetails(gameObj);
                    });

                    grid.appendChild(card);
                });
            }

            // Sempre adiciona a opção de Jogo Personalizado no final
            if (query && query.trim().length >= 2) {
                const customCard = document.createElement('div');
                customCard.className = 'suggestion-grid-card';
                customCard.innerHTML = `
                    <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(30, 41, 59, 0.95) 100%); padding: 16px; text-align: center; gap: 12px;">
                        <span style="font-size: 2.2rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">🎮</span>
                        <div style="font-size: 0.9rem; font-weight: 700; color: var(--status-playing); overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; line-height: 1.3; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">${query}</div>
                        <span style="font-size: 0.65rem; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold; background: rgba(255,255,255,0.08); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">Jogo Personalizado</span>
                    </div>
                `;
                
                customCard.addEventListener('click', () => {
                    const gameObj = {
                        name: query,
                        coverUrl: '',
                        igdbId: null,
                        platforms: [],
                        status: activeMainTab === 'finalizados' ? 'Finalizado' : (activeMainTab === 'dropados' ? 'Dropado' : 'Backlog')
                    };
                    selectedGameData = gameObj;
                    
                    document.getElementById('gameInput').value = query;
                    showGameDetails(gameObj);
                });
                
                grid.appendChild(customCard);
            }
        }

        function addGameFromPreview() {
            if (!selectedGameData) return;
            
            const name = selectedGameData.name;
            const platformInput = document.getElementById('modalPlatformSelect');
            const platform = platformInput ? platformInput.value.trim() : '';

            // O campo de plataforma é obrigatório
            if (!platform) {
                customAlert("Por favor, selecione ou digite a plataforma. Este campo é obrigatório!", "Plataforma Obrigatória", "⚠️");
                return;
            }

            // Validação de Duplicados (nome e plataforma - case-insensitive)
            const nameLower = name.toLowerCase();
            const platformLower = platform.toLowerCase();
            const isDuplicate = games.some(g => g.name.toLowerCase() === nameLower && (g.platform || '').toLowerCase() === platformLower);
            
            if (isDuplicate) {
                customAlert("Este jogo já está cadastrado para esta plataforma!", "Jogo Duplicado", "⚠️");
                return;
            }

            let newStatus = 'Backlog';
            let startDate = null;
            let finishCount = 0;
            let dropCount = 0;

            if (activeMainTab === 'finalizados') {
                newStatus = 'Finalizado';
                startDate = new Date().toISOString();
                finishCount = 1;
            } else if (activeMainTab === 'dropados') {
                newStatus = 'Dropado';
                startDate = new Date().toISOString();
                dropCount = 1;
            }

            games.push({
                name,
                platform,
                status: newStatus,
                coverUrl: selectedGameData.coverUrl,
                igdbId: selectedGameData.igdbId,
                startDate: startDate,
                createdAt: new Date().toISOString(),
                playtime: 0,
                finishCount: finishCount,
                dropCount: dropCount
            });

            // Limpar inputs e sugestões
            document.getElementById('gameInput').value = '';
            document.getElementById('suggestionsGrid').innerHTML = '';
            selectedGameData = null;

            resetPlatformDatalist();
            save();
            render();
            closeDetailsModal();
            closeAddGameScreen();

            if (newStatus === 'Backlog') {
                const backlogGames = games.filter(g => g.status === 'Backlog');
                switchMainTab('backlog');
                if (backlogGames.length > 5) {
                    switchView('others');
                } else {
                    switchView('home');
                }
            } else if (newStatus === 'Finalizado') {
                switchMainTab('finalizados');
            } else if (newStatus === 'Dropado') {
                switchMainTab('dropados');
            }
        }

        function resetPlatformDatalist() {
            const datalist = document.getElementById('platformList');
            if (datalist) {
                datalist.innerHTML = '';
                DEFAULT_PLATFORMS.forEach(plat => {
                    const option = document.createElement('option');
                    option.value = plat;
                    datalist.appendChild(option);
                });
            }
        }

        // --- RENDERIZAÇÃO DOS CARDS ---

        function createGameCard(game, index, isFirst, isLast) {
            const card = document.createElement('div');
            card.className = `game-card status-${game.status}`;
            card.dataset.index = index;

            const platformText = game.platform ? game.platform : 'N/A';
            const platformBadge = game.platform ? `<span class="platform-tag">${platformText}</span>` : '';
            const coverSrc = game.coverUrl ? game.coverUrl : DEFAULT_COVER;

            const orderActions = game.status === 'Backlog' ? `
                <div class="order-actions">
                    <button class="order-btn" onclick="moveUp(${index}); event.stopPropagation();" ${isFirst ? 'style="opacity: 0.3; pointer-events: none;"' : ''}>▲</button>
                    <button class="order-btn" onclick="moveDown(${index}); event.stopPropagation();" ${isLast ? 'style="opacity: 0.3; pointer-events: none;"' : ''}>▼</button>
                </div>
            ` : '';

            let statusActionButton = '';
            if (game.status === 'Backlog') {
                statusActionButton = `
                    <button class="status-action-btn play-btn" onclick="updateStatus(${index}, 'Jogando'); event.stopPropagation();" title="Começar a Jogar">
                        ▶
                    </button>
                `;
            } else if (game.status === 'Finalizado' || game.status === 'Dropado') {
                statusActionButton = `
                    <button class="status-action-btn return-btn" onclick="updateStatus(${index}, 'Backlog'); event.stopPropagation();" title="Devolver ao Backlog">
                        ↩
                    </button>
                `;
            }

            card.innerHTML = `
                ${orderActions}
                
                <img src="${coverSrc}" class="game-card-cover" alt="Capa">
                
                <div class="game-info">
                    <span class="game-title">${game.name}</span>
                    ${platformBadge}
                </div>
                
                <div class="controls-right">
                    ${statusActionButton}
                    <button class="del-btn" onclick="removeGame(${index}); event.stopPropagation();">✕</button>
                </div>
            `;
            
            card.addEventListener('click', () => {
                showGameDetails(index);
            });
            
            return card;
        }

        function createGridGameCard(game, index) {
            const card = document.createElement('div');
            card.className = 'suggestion-grid-card';
            card.dataset.index = index;

            const coverSrc = game.coverUrl ? game.coverUrl : DEFAULT_COVER;

            card.innerHTML = `
                <img src="${coverSrc}" style="width: 100%; height: 100%; object-fit: cover;" alt="Capa">
                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.4) 70%, transparent 100%); padding: 12px 8px; display: flex; flex-direction: column; align-items: center; gap: 4px; justify-content: center; z-index: 2;">
                    <span style="font-size: 0.9rem; font-weight: 700; color: white; text-align: center; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.2; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">${game.name}</span>
                    <span class="platform-tag" style="margin-top: 2px;">${game.platform || 'N/A'}</span>
                </div>
            `;

            card.addEventListener('click', () => {
                showGameDetails(index);
            });

            return card;
        }

        function render() {
            // Atualiza os contadores das abas
            const countBacklog = games.filter(g => g.status === 'Backlog' || g.status === 'Jogando').length;
            const countFinalizados = games.filter(g => g.status === 'Finalizado').length;
            const countDropados = games.filter(g => g.status === 'Dropado').length;

            const badgeBacklog = document.getElementById('badgeBacklogCount');
            const badgeFinalizados = document.getElementById('badgeFinalizadosCount');
            const badgeDropados = document.getElementById('badgeDropadosCount');

            if (badgeBacklog) badgeBacklog.textContent = countBacklog;
            if (badgeFinalizados) badgeFinalizados.textContent = countFinalizados;
            if (badgeDropados) badgeDropados.textContent = countDropados;

            const listHome = document.getElementById('gameListHome');
            const listOthers = document.getElementById('gameListOthers');
            const seeMoreContainer = document.getElementById('seeMoreContainer');
            const otherGamesCount = document.getElementById('otherGamesCount');

            listHome.innerHTML = '';
            listOthers.innerHTML = '';

            // Atualiza o Carrossel de Jogos com status 'Jogando' (máximo maxPlayingLimit)
            const playingGames = games.filter(game => game.status === 'Jogando').slice(0, maxPlayingLimit);
            const carouselSection = document.getElementById('playingCarouselSection');
            const carouselTrack = document.getElementById('playingCarousel');
            const carouselDots = document.getElementById('carouselDots');

            if (playingGames.length > 0) {
                const titleEl = document.getElementById('playingCarouselTitle');
                if (titleEl) titleEl.style.display = 'block';
                carouselSection.style.display = 'block';
                carouselTrack.innerHTML = '';
                carouselDots.innerHTML = '';

                playingGames.forEach((game, pIndex) => {
                    const originalIndex = games.indexOf(game);
                    const item = document.createElement('div');
                    item.className = 'carousel-item';
                    
                    let coverSrc = game.coverUrl ? game.coverUrl.replace('t_cover_small', 't_screenshot_med').replace('t_thumb', 't_screenshot_med').replace('t_cover_big', 't_screenshot_med') : '';
                    if (!coverSrc) {
                        coverSrc = DEFAULT_COVER;
                    }
                    
                    const platformText = game.platform ? game.platform : 'N/A';
                    
                    item.innerHTML = `
                        <img src="${coverSrc}" class="carousel-item-img" alt="Capa de ${game.name}">
                        <div class="carousel-item-content">
                            <span class="carousel-item-title">${game.name}</span>
                            <span class="carousel-item-platform">${platformText}</span>
                        </div>
                    `;
                    
                    item.addEventListener('click', () => {
                        showGameDetails(originalIndex);
                    });
                    
                    carouselTrack.appendChild(item);

                    if (playingGames.length > 1) {
                        const dot = document.createElement('div');
                        dot.className = `carousel-dot ${pIndex === 0 ? 'active' : ''}`;
                        dot.addEventListener('click', () => {
                            carouselTrack.scrollTo({
                                left: carouselTrack.clientWidth * pIndex,
                                behavior: 'smooth'
                            });
                        });
                        carouselDots.appendChild(dot);
                    }
                });

                if (playingGames.length > 1) {
                    carouselTrack.onscroll = () => {
                        const width = carouselTrack.clientWidth;
                        if (width > 0) {
                            const activeIndex = Math.round(carouselTrack.scrollLeft / width);
                            const dots = carouselDots.querySelectorAll('.carousel-dot');
                            dots.forEach((dot, dIndex) => {
                                if (dIndex === activeIndex) {
                                    dot.classList.add('active');
                                } else {
                                    dot.classList.remove('active');
                                }
                            });
                        }
                    };
                }
            } else {
                const titleEl = document.getElementById('playingCarouselTitle');
                if (titleEl) titleEl.style.display = 'none';
                const backlogGames = games.filter(game => game.status === 'Backlog');
                if (backlogGames.length > 0) {
                    carouselSection.style.display = 'block';
                    carouselTrack.innerHTML = '';
                    carouselDots.innerHTML = '';

                    const recCard = document.createElement('div');
                    recCard.className = 'carousel-item recommendation-card';
                    recCard.style.display = 'flex';
                    recCard.style.flexDirection = 'column';
                    recCard.style.justifyContent = 'center';
                    recCard.style.alignItems = 'center';
                    recCard.style.padding = '20px';
                    recCard.style.textAlign = 'center';
                    recCard.style.gap = '14px';
                    recCard.style.height = '100%';
                    recCard.style.borderRadius = '16px';
                    recCard.style.overflow = 'hidden';

                    const firstBacklogGame = backlogGames[0];
                    const originalIndex = games.indexOf(firstBacklogGame);

                    let coverSrc = firstBacklogGame.coverUrl ? firstBacklogGame.coverUrl.replace('t_cover_small', 't_screenshot_med').replace('t_thumb', 't_screenshot_med').replace('t_cover_big', 't_screenshot_med') : '';
                    if (!coverSrc) {
                        coverSrc = DEFAULT_COVER;
                    }

                    recCard.innerHTML = `
                        <img src="${coverSrc}" class="carousel-item-img" alt="Capa de ${firstBacklogGame.name}">
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.85) 100%); z-index: 1;"></div>
                        <div style="font-size: 1.1rem; font-weight: 700; color: #cbd5e1; max-width: 90%; line-height: 1.4; z-index: 2; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">
                            Que tal iniciar o jogo: <br><strong style="color: var(--status-playing); font-size: 1.25rem;">${firstBacklogGame.name}</strong>?
                        </div>
                        <button class="status-action-btn play-btn" style="width: 46px; height: 46px; border-radius: 50%; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; background: var(--status-playing); color: #0f172a; border: none; box-shadow: 0 0 12px var(--status-playing); cursor: pointer; z-index: 2; margin-top: 5px;" title="Iniciar Jogo">
                            ▶
                        </button>
                    `;

                    recCard.querySelector('.play-btn').addEventListener('click', (e) => {
                        e.stopPropagation();
                        updateStatus(originalIndex, 'Jogando');
                    });

                    recCard.addEventListener('click', () => {
                        showGameDetails(originalIndex);
                    });

                    carouselTrack.appendChild(recCard);
                } else {
                    if (carouselSection) carouselSection.style.display = 'none';
                }
            }

            // Renderiza a Lista de Finalizados
            const finalizadosList = document.getElementById('gameListFinalizados');
            if (finalizadosList) {
                finalizadosList.innerHTML = '';
                const finalizadosGames = games.filter(game => game.status === 'Finalizado');
                if (finalizadosGames.length === 0) {
                    finalizadosList.innerHTML = '<div style="text-align: center; color: var(--text-muted); margin-top: 20px; font-size: 0.9rem;">Nenhum jogo finalizado.</div>';
                } else {
                    finalizadosGames.forEach(game => {
                        const originalIndex = games.indexOf(game);
                        const card = createGridGameCard(game, originalIndex);
                        finalizadosList.appendChild(card);
                    });
                }
            }

            // Renderiza a Lista de Dropados
            const dropadosList = document.getElementById('gameListDropados');
            if (dropadosList) {
                dropadosList.innerHTML = '';
                const dropadosGames = games.filter(game => game.status === 'Dropado');
                if (dropadosGames.length === 0) {
                    dropadosList.innerHTML = '<div style="text-align: center; color: var(--text-muted); margin-top: 20px; font-size: 0.9rem;">Nenhum jogo dropado.</div>';
                } else {
                    dropadosGames.forEach(game => {
                        const originalIndex = games.indexOf(game);
                        const card = createGridGameCard(game, originalIndex);
                        dropadosList.appendChild(card);
                    });
                }
            }

            // Filtra os jogos para exibir apenas os que estão com status 'Backlog' na lista do backlog
            const listGames = games.filter(game => game.status === 'Backlog');
            const nextTitle = document.getElementById('nextToPlayTitle');

            if (listGames.length === 0) {
                if (nextTitle) nextTitle.style.display = 'none';
                listHome.innerHTML = `
                    <div class="empty-backlog-card" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; background: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(56, 189, 248, 0.25); border-radius: 16px; text-align: center; gap: 14px; margin: 20px 0; box-shadow: inset 0 0 20px rgba(56, 189, 248, 0.02); z-index: 1;">
                        <div style="font-size: 3.2rem; animation: float-icon 3s ease-in-out infinite alternate; filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.45));">👾</div>
                        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-light); margin: 0; letter-spacing: 0.5px;">Adicione jogos ao seu backlog</h3>
                        <p style="font-size: 0.85rem; color: var(--text-muted); max-width: 260px; margin: 0; line-height: 1.4;">Comece a sua jornada gamer organizando seus jogos favoritos em um só lugar!</p>
                        <button class="add-btn" onclick="openAddGameScreen()" style="margin-top: 6px; padding: 10px 20px; border-radius: 8px; font-weight: bold; background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%); border: none; color: white; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3); transition: transform 0.2s;">
                            <span>+</span> Adicionar Primeiro Jogo
                        </button>
                    </div>
                `;
                listOthers.innerHTML = '<div style="text-align: center; color: var(--text-muted); margin-top: 20px; font-size: 0.9rem;">Nenhum outro jogo listado.</div>';
                seeMoreContainer.style.display = 'none';
                if (currentScreen === 'others') {
                    switchView('home');
                }
                return;
            }

            if (nextTitle) nextTitle.style.display = 'block';

            const homeGames = listGames.slice(0, 5);
            const otherGames = listGames.slice(5);

            homeGames.forEach((game, fIndex) => {
                const originalIndex = games.indexOf(game);
                const isFirst = fIndex === 0;
                const isLast = (fIndex === listGames.length - 1);
                const card = createGameCard(game, originalIndex, isFirst, isLast);
                listHome.appendChild(card);
            });

            if (otherGames.length === 0) {
                listOthers.innerHTML = '<div style="text-align: center; color: var(--text-muted); margin-top: 20px; font-size: 0.9rem;">Nenhum outro jogo listado.</div>';
            } else {
                otherGames.forEach((game, fIndex) => {
                    const originalIndex = games.indexOf(game);
                    const isFirst = false;
                    const isLast = (fIndex + 5 === listGames.length - 1);
                    const card = createGameCard(game, originalIndex, isFirst, isLast);
                    listOthers.appendChild(card);
                });
            }

            if (listGames.length > 5) {
                seeMoreContainer.style.display = 'block';
                otherGamesCount.textContent = listGames.length - 5;
            } else {
                seeMoreContainer.style.display = 'none';
                if (currentScreen === 'others') {
                    switchView('home');
                }
            }
        }

        function addGame() {
            const nameInput = document.getElementById('gameInput');
            const platformInput = document.getElementById('platformInput');
            
            const name = nameInput.value.trim();
            const platform = platformInput.value.trim();

            if (name) {
                // Validação de Duplicados (nome e plataforma - case-insensitive)
                const nameLower = name.toLowerCase();
                const platformLower = platform.toLowerCase();
                const isDuplicate = games.some(g => g.name.toLowerCase() === nameLower && (g.platform || '').toLowerCase() === platformLower);
                
                if (isDuplicate) {
                    customAlert("Este jogo já está cadastrado para esta plataforma!", "Jogo Duplicado", "⚠️");
                    return;
                }

                let coverUrl = '';
                let igdbId = null;
                if (selectedGameData && selectedGameData.name.toLowerCase() === name.toLowerCase()) {
                    coverUrl = selectedGameData.coverUrl;
                    igdbId = selectedGameData.igdbId;
                }

                let newStatus = 'Backlog';
                let startDate = null;
                let finishCount = 0;
                let dropCount = 0;

                if (activeMainTab === 'finalizados') {
                    newStatus = 'Finalizado';
                    startDate = new Date().toISOString();
                    finishCount = 1;
                } else if (activeMainTab === 'dropados') {
                    newStatus = 'Dropado';
                    startDate = new Date().toISOString();
                    dropCount = 1;
                }

                games.push({ 
                    name, 
                    platform, 
                    status: newStatus,
                    coverUrl: coverUrl,
                    igdbId: igdbId,
                    startDate: startDate,
                    createdAt: new Date().toISOString(),
                    playtime: 0,
                    finishCount: finishCount,
                    dropCount: dropCount
                });

                closeAddGameScreen();

                resetPlatformDatalist();
                save();
                render();

                if (newStatus === 'Backlog') {
                    const backlogGames = games.filter(g => g.status === 'Backlog');
                    switchMainTab('backlog');
                    if (backlogGames.length > 5) {
                        switchView('others');
                    } else {
                        switchView('home');
                    }
                } else if (newStatus === 'Finalizado') {
                    switchMainTab('finalizados');
                } else if (newStatus === 'Dropado') {
                    switchMainTab('dropados');
                }
            }
        }

        // --- LÓGICA DE BACKUP E OUTROS EVENTOS ---

        async function removeGame(index) {
            const confirmed = await customConfirm(
                "Ao excluir o jogo, todas as informações sobre ele também serão excluídas. tem certeza que deseja remover este jogo?",
                "Excluir Jogo",
                "🗑️"
            );
            if (confirmed) {
                games.splice(index, 1);
                save();
                render();
            }
        }

        async function deleteGameFromModal(index) {
            const confirmed = await customConfirm(
                "Ao excluir o jogo, todas as informações sobre ele também serão excluídas. tem certeza que deseja remover este jogo?",
                "Excluir Jogo",
                "🗑️"
            );
            if (confirmed) {
                games.splice(index, 1);
                save();
                render();
                closeDetailsModal();
            }
        }

        async function updateStatus(index, newStatus) {
            const oldStatus = games[index].status;
            
            if (newStatus === 'Jogando') {
                const playingCount = games.filter((g, idx) => g.status === 'Jogando' && idx !== index).length;
                if (playingCount >= maxPlayingLimit) {
                    customAlert(`Você só pode jogar até ${maxPlayingLimit} jogos simultaneamente, finalize um dos jogos em andamento para iniciar outro jogo`, "Limite Excedido", "⚠️");
                    render();
                    return false;
                }
                // Define a data de início automaticamente ao entrar no status Jogando
                if (!games[index].startDate) {
                    games[index].startDate = new Date().toISOString();
                }
                if (games[index].playtime === undefined) {
                    games[index].playtime = 0;
                }
                games[index].endDate = null;
            } else if (newStatus === 'Finalizado') {
                games[index].finishCount = (games[index].finishCount || 0) + 1;
                games[index].endDate = new Date().toISOString();
                
                if (oldStatus === 'Jogando') {
                    const game = games[index];
                    const start = game.startDate ? new Date(game.startDate) : new Date();
                    const end = new Date();
                    
                    const diffMs = Math.max(0, end - start);
                    const diffMins = Math.floor(diffMs / (1000 * 60));
                    const diffHrs = Math.floor(diffMins / 60);
                    const hours = diffHrs % 24;
                    const daysTotal = Math.floor(diffHrs / 24);
                    
                    const years = Math.floor(daysTotal / 365);
                    const days = daysTotal % 365;

                    let durationStr = '';
                    if (years > 0) {
                        durationStr = `${years} ${years === 1 ? 'ano' : 'anos'}, ${days} ${days === 1 ? 'dia' : 'dias'} e ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
                    } else if (days > 0) {
                        durationStr = `${days} ${days === 1 ? 'dia' : 'dias'} e ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
                    } else {
                        durationStr = `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
                    }

                    const playtime = game.playtime || 0;
                    const playtimeStr = `${playtime} ${playtime === 1 ? 'hora' : 'horas'}`;
                    
                    const congratulationsMsg = `Parabéns!!\nvocê finalizou o jogo em ${playtimeStr}, durante o período de ${durationStr}.`;
                    customAlert(congratulationsMsg, "Jogo Finalizado!", "🏆");
                }
            } else if (newStatus === 'Dropado') {
                if (oldStatus === 'Jogando') {
                    const confirmed = await customConfirm(
                        "Tem certeza que deseja desistir deste jogo?",
                        "Desistir?",
                        "<span class='icon-dropped'>⬇</span>",
                        "Sim",
                        "Não"
                    );
                    if (!confirmed) {
                        return false;
                    }
                }
                games[index].dropCount = (games[index].dropCount || 0) + 1;
                games[index].endDate = new Date().toISOString();
            } else if (newStatus === 'Backlog') {
                const gameToMove = games.splice(index, 1)[0];
                games.push(gameToMove);
                const newIndex = games.length - 1;

                games[newIndex].endDate = null;
                games[newIndex].status = newStatus;
                save();
                render();

                // Identifica se o jogo está nos primeiros 5 (Backlog Home) ou nos demais (Outros Jogos)
                const listGames = games.filter(game => game.status === 'Backlog');
                const backlogIndex = listGames.indexOf(games[newIndex]);
                
                if (backlogIndex >= 5) {
                    switchMainTab('backlog');
                    switchView('others');
                } else {
                    switchMainTab('backlog');
                    switchView('home');
                }
                return true;
            }
            games[index].status = newStatus;
            save();
            render();
            return true;
        }

        // --- LÓGICA DO MENU SANDUÍCHE E PREFERÊNCIAS ---

        function toggleMenu(event) {
            if (event) event.stopPropagation();
            const dropdown = document.getElementById('menuDropdown');
            if (dropdown.style.display === 'none') {
                dropdown.style.display = 'block';
            } else {
                dropdown.style.display = 'none';
            }
        }

        function triggerImport(event) {
            if (event) event.preventDefault();
            document.getElementById('importFile').click();
            document.getElementById('menuDropdown').style.display = 'none';
        }

        async function clearAllData(event) {
            if (event) event.preventDefault();
            document.getElementById('menuDropdown').style.display = 'none';

            const confirmed = await customConfirm(
                "Atenção: todas as informações sobre seus jogos serão excluídas permanentemente! Só será possível restaurar as informações caso você possua um arquivo de backup (.json).\n\nDeseja realmente apagar todos os dados?",
                "Limpar Todas as Informações",
                "⚠️",
                "Sim, Apagar Tudo",
                "Não, Cancelar"
            );

            if (confirmed) {
                games = [];
                save();
                localStorage.removeItem('backlog_first_access_completed');
                render();
                customAlert("Todas as informações do aplicativo foram apagadas com sucesso!", "Dados Limpos", "🗑️");
                showOnboarding();
            }
        }

        function openPreferencesModal(event) {
            if (event) event.preventDefault();
            document.getElementById('menuDropdown').style.display = 'none';
            document.getElementById('prefMaxPlaying').value = maxPlayingLimit;
            document.getElementById('preferencesModalOverlay').classList.add('active');
        }

        function closePreferencesModal(event) {
            document.getElementById('preferencesModalOverlay').classList.remove('active');
        }

        function savePreferences() {
            const inputVal = parseInt(document.getElementById('prefMaxPlaying').value);
            if (!isNaN(inputVal) && inputVal >= 1) {
                maxPlayingLimit = inputVal;
                localStorage.setItem('max_playing_limit', maxPlayingLimit.toString());
                closePreferencesModal();
                customAlert('Preferências salvas com sucesso!', 'Sucesso', '⚙️');
                render(); // atualiza possíveis exibições que usem a contagem
            } else {
                customAlert('Por favor, insira um valor válido (maior ou igual a 1).', 'Erro', '❌');
            }
        }

        // Fecha o menu suspenso se clicar fora
        document.addEventListener('click', function(e) {
            const dropdown = document.getElementById('menuDropdown');
            const menuBtn = document.getElementById('menuBtn');
            if (dropdown && menuBtn && !menuBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        function moveUp(index) {
            const game = games[index];
            const listGames = games.filter(g => g.status !== 'Jogando');
            const filteredIndex = listGames.indexOf(game);
            
            if (filteredIndex > 0) {
                const prevGame = listGames[filteredIndex - 1];
                const originalPrevIndex = games.indexOf(prevGame);
                
                games[index] = prevGame;
                games[originalPrevIndex] = game;
                
                save();
                render();
            }
        }

        function moveDown(index) {
            const game = games[index];
            const listGames = games.filter(g => g.status !== 'Jogando');
            const filteredIndex = listGames.indexOf(game);
            
            if (filteredIndex >= 0 && filteredIndex < listGames.length - 1) {
                const nextGame = listGames[filteredIndex + 1];
                const originalNextIndex = games.indexOf(nextGame);
                
                games[index] = nextGame;
                games[originalNextIndex] = game;
                
                save();
                render();
            }
        }

        async function exportData() {
            if (games.length === 0) {
                customAlert("Não há dados para exportar!", "Aviso", "⚠️");
                return;
            }
            
            const dataStr = localStorage.getItem('backlog_oda_mobile');

            // 1. Tenta usar a Web Share API (ideal para celulares)
            if (navigator.share) {
                try {
                    const file = new File([dataStr], "meu_backlog_backup.json", { type: "application/json" });
                    await navigator.share({
                        files: [file],
                        title: 'Backup do Backlog',
                        text: 'Aqui está o backup do meu backlog de jogos.'
                    });
                    return;
                } catch (error) {
                    console.log('Compartilhamento via API cancelado ou falhou. Tentando download padrão...', error);
                }
            }
            
            // 2. Fallback para download clássico usando Blob URL
            try {
                const blob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = "meu_backlog_backup.json";
                document.body.appendChild(a);
                a.click();
                
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error("Falha no download via Blob URL. Tentando Data URI...", err);
                
                // 3. Fallback secundário usando Data URI (para contornar restrições do file://)
                try {
                    const a = document.createElement('a');
                    a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                    a.download = "meu_backlog_backup.json";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } catch (e) {
                    // 4. Último recurso: Copiar para área de transferência
                    navigator.clipboard.writeText(dataStr);
                    customAlert("Devido às restrições do seu navegador local, não pudemos iniciar o download direto. O backup em formato de texto foi copiado para sua Área de Transferência. Cole em um arquivo de texto para salvar!", "Aviso de Download", "💾");
                }
            }
        }

        function importData(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    if (Array.isArray(importedData)) {
                        games = importedData;
                        save();
                        render();
                        customAlert("Backup importado com sucesso!", "Importação Concluída", "✅");
                    } else {
                        customAlert("O formato do arquivo parece incorreto.", "Erro de Importação", "❌");
                    }
                } catch (error) {
                    customAlert("Erro ao ler o arquivo de backup.", "Erro de Leitura", "❌");
                }
            };
            
            reader.readAsText(file);
            event.target.value = '';
        }

        // --- EVENTOS E INICIALIZAÇÃO ---

        document.getElementById('gameInput').addEventListener('input', function(e) {
            const query = e.target.value.trim();
            clearTimeout(searchTimeout);
            
            selectedGameData = null;

            if (query.length < 2) {
                document.getElementById('suggestionsGrid').innerHTML = '';
                suggestionsOffset = 0;
                allSuggestionsResults = [];
                return;
            }

            searchTimeout = setTimeout(() => {
                suggestionsOffset = 0;
                allSuggestionsResults = [];
                fetchSuggestions(query);
            }, 400);
        });

        document.getElementById('gameInput').addEventListener('keypress', function (e) {
            if (e.key === 'Enter') addGame();
        });

        // --- FUNÇÕES DE DETALHES DO JOGO (IGDB) ---

        async function fetchGameExtraDetails(igdbId) {
            const token = await getAccessToken();
            const targetUrl = 'https://api.igdb.com/v4/games';
            const url = IGDB_CONFIG.PROXY_URL ? (IGDB_CONFIG.PROXY_URL + encodeURIComponent(targetUrl)) : targetUrl;

            // Buscando campos adicionais: sinopse, ano, gêneros, avaliação, screenshots, vídeos
            const queryBody = `fields summary, first_release_date, genres.name, rating, involved_companies.company.name, involved_companies.developer, screenshots.url, videos.video_id, videos.name; where id = ${igdbId};`;

            let response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Client-ID': IGDB_CONFIG.CLIENT_ID,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'text/plain'
                },
                body: queryBody
            });

            if (response.status === 401) {
                // Token expirado/revogado
                const newToken = await getAccessToken(true);
                response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Client-ID': IGDB_CONFIG.CLIENT_ID,
                        'Authorization': `Bearer ${newToken}`,
                        'Content-Type': 'text/plain'
                    },
                    body: queryBody
                });
            }

            if (!response.ok) {
                throw new Error(`Erro na busca de detalhes: ${response.statusText}`);
            }

            const data = await response.json();
            return data && data.length > 0 ? data[0] : null;
        }

        async function searchGameIdByName(name) {
            const token = await getAccessToken();
            const targetUrl = 'https://api.igdb.com/v4/games';
            const url = IGDB_CONFIG.PROXY_URL ? (IGDB_CONFIG.PROXY_URL + encodeURIComponent(targetUrl)) : targetUrl;

            const queryBody = `search "${name}"; fields id; limit 1;`;
            let response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Client-ID': IGDB_CONFIG.CLIENT_ID,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'text/plain'
                },
                body: queryBody
            });

            if (response.status === 401) {
                const newToken = await getAccessToken(true);
                response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Client-ID': IGDB_CONFIG.CLIENT_ID,
                        'Authorization': `Bearer ${newToken}`,
                        'Content-Type': 'text/plain'
                    },
                    body: queryBody
                });
            }

            if (!response.ok) return null;
            const data = await response.json();
            return data && data.length > 0 ? data[0].id : null;
        }

        function formatDurationMessage(game) {
            const start = game.startDate ? new Date(game.startDate) : new Date();
            const end = (game.status === 'Finalizado' || game.status === 'Dropado') && game.endDate ? new Date(game.endDate) : new Date();
            
            const diffMs = Math.max(0, end - start);
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHrs = Math.floor(diffMins / 60);
            const hours = diffHrs % 24;
            const daysTotal = Math.floor(diffHrs / 24);
            
            const years = Math.floor(daysTotal / 365);
            const days = daysTotal % 365;

            let prefix = 'Você está jogando este jogo há ';
            if (game.status === 'Finalizado' || game.status === 'Dropado') {
                prefix = 'Você jogou este jogo por ';
            }

            let durationStr = '';
            if (years > 0) {
                durationStr = `${years} ${years === 1 ? 'ano' : 'anos'}, ${days} ${days === 1 ? 'dia' : 'dias'} e ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
            } else if (days > 0) {
                durationStr = `${days} ${days === 1 ? 'dia' : 'dias'} e ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
            } else {
                durationStr = `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
            }

            return `${prefix}${durationStr}`;
        }

        function getBacklogDurationMessage(game) {
            const created = game.createdAt ? new Date(game.createdAt) : new Date();
            const now = new Date();
            
            const diffMs = Math.max(0, now - created);
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHrs = Math.floor(diffMins / 60);
            const hours = diffHrs % 24;
            const daysTotal = Math.floor(diffHrs / 24);
            
            const years = Math.floor(daysTotal / 365);
            const days = daysTotal % 365;

            let durationStr = '';
            if (years > 0) {
                durationStr = `${years} ${years === 1 ? 'ano' : 'anos'}, ${days} ${days === 1 ? 'dia' : 'dias'} e ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
            } else if (days > 0) {
                durationStr = `${days} ${days === 1 ? 'dia' : 'dias'} e ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
            } else {
                durationStr = `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
            }

            return `Este jogo já está há ${durationStr} em seu backlog`;
        }

        function getPlayingControlsHtml(game, index) {
            if (game.status !== 'Jogando' && game.status !== 'Finalizado' && game.status !== 'Dropado') return '';

            // Calcular tempo de jogo
            const start = game.startDate ? new Date(game.startDate) : new Date();

            // Formata data de início para input datetime-local em fuso horário local (YYYY-MM-DDTHH:MM)
            const tzoffset = start.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(start.getTime() - tzoffset)).toISOString().slice(0, 16);

            // Botões de status (apenas se estiver com status 'Jogando')
            const actionButtons = game.status === 'Jogando' ? `
                <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                    <button class="backup-btn" style="flex: 1; background: var(--status-finished); border-color: rgba(34, 197, 94, 0.4); color: white;" onclick="changeStatusFromModal(${index}, 'Finalizado')">🏆 Finalizar Jogo</button>
                    <button class="backup-btn" style="flex: 1; background: var(--status-dropped); border-color: rgba(239, 68, 68, 0.4); color: white;" onclick="changeStatusFromModal(${index}, 'Dropado')">⬇ Dropar Jogo</button>
                </div>
            ` : '';

            // Estilos de caixa baseados no status do jogo
            let boxBg = 'rgba(234, 179, 8, 0.08)';
            let boxBorder = 'rgba(234, 179, 8, 0.25)';
            let textColor = '#eab308';
            if (game.status === 'Finalizado') {
                boxBg = 'rgba(34, 197, 94, 0.08)';
                boxBorder = 'rgba(34, 197, 94, 0.25)';
                textColor = '#22c55e';
            } else if (game.status === 'Dropado') {
                boxBg = 'rgba(239, 68, 68, 0.08)';
                boxBorder = 'rgba(239, 68, 68, 0.25)';
                textColor = '#ef4444';
            }

            return `
                <div class="playing-modal-controls" style="background: ${boxBg}; border: 1px solid ${boxBorder}; border-radius: 12px; padding: 16px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 12px;">
                    ${actionButtons}

                    <div style="font-size: 0.9rem; color: ${textColor}; font-weight: 600; text-align: center; padding: 4px 0;">
                        ⏳ ${formatDurationMessage(game)}.
                    </div>

                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; border-top: 1px solid var(--border-color); padding-top: 10px;">
                        <label style="font-size: 0.85rem; font-weight: 700; color: #cbd5e1;">Tempo de Jogo (horas):</label>
                        <input type="number" id="modalPlaytimeInput" value="${game.playtime || 0}" min="0" onchange="updatePlaytimeFromModal(${index}, this.value)" style="width: 80px; padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color); color: white; text-align: center; font-weight: bold;">
                    </div>
                </div>
            `;
        }

        async function changeStatusFromModal(index, newStatus) {
            const success = await updateStatus(index, newStatus);
            if (success) {
                closeDetailsModal();
            }
        }

        function updateStartDateFromModal(index, newDateString) {
            if (newDateString) {
                games[index].startDate = new Date(newDateString).toISOString();
                save();
                showGameDetails(index);
            }
        }

        function updatePlaytimeFromModal(index, value) {
            const playtime = parseFloat(value);
            if (!isNaN(playtime) && playtime >= 0) {
                games[index].playtime = playtime;
                save();
            }
        }

        function getBacklogDurationHtml(game, index) {
            if (index === -1 || game.status !== 'Backlog') return '';

            const created = game.createdAt ? new Date(game.createdAt) : new Date();
            const now = new Date();
            const diffMs = Math.max(0, now - created);
            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

            if (diffHrs < 24) return '';

            return `
                <div class="backlog-duration-box" style="background: rgba(148, 163, 184, 0.08); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; font-size: 0.9rem; color: #cbd5e1; font-weight: 600; text-align: center;">
                    📅 ${getBacklogDurationMessage(game)}.
                </div>
            `;
        }

        function getRecordHtml(game, index) {
            if (index === -1) return '';
            
            const isReadOnly = game.status !== 'Jogando';
            let recordHtml = '';
            if (isReadOnly) {
                recordHtml = `
                    <div class="modal-record-container" style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                        <label style="font-size: 0.85rem; font-weight: 700; color: #cbd5e1;">Recorde:</label>
                        <span style="font-size: 1.1rem; font-weight: 800; color: var(--text-light);">${game.record || 0}</span>
                    </div>
                `;
            } else {
                recordHtml = `
                    <div class="modal-record-container" style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                        <label style="font-size: 0.85rem; font-weight: 700; color: #cbd5e1;">Recorde:</label>
                        <input type="number" id="modalRecordInput" value="${game.record || 0}" min="0" onchange="updateRecordFromModal(${index}, this.value)" style="width: 100px; padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color); color: white; text-align: center; font-weight: bold;">
                    </div>
                `;
            }
            
            return recordHtml;
        }

        function updateRecordFromModal(index, value) {
            const record = parseFloat(value);
            if (!isNaN(record) && record >= 0) {
                games[index].record = record;
                save();
            }
        }

        async function translateText(text) {
            if (!text) return '';
            try {
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=pt&dt=t&q=${encodeURIComponent(text)}`;
                const response = await fetch(url);
                if (!response.ok) return '';
                const data = await response.json();
                if (data && data[0]) {
                    return data[0].map(x => x[0]).join('');
                }
            } catch (err) {
                console.error('Erro na chamada da API de tradução:', err);
            }
            return '';
        }

        async function showGameDetails(indexOrGame) {
            let game;
            let index;
            if (typeof indexOrGame === 'number') {
                game = games[indexOrGame];
                index = indexOrGame;
            } else {
                game = indexOrGame;
                index = -1;
            }

            if (!game) return;

            const overlay = document.getElementById('detailsModalOverlay');
            const loading = document.getElementById('modalLoading');
            const errorContainer = document.getElementById('modalError');
            const content = document.getElementById('modalContent');
            const retryBtn = document.getElementById('retryBtn');

            // Abre o modal e mostra carregando
            overlay.classList.add('active');
            loading.style.display = 'flex';
            errorContainer.style.display = 'none';
            content.style.display = 'none';

            const loadData = async () => {
                try {
                    // Se não tiver o igdbId, tenta buscar pelo nome
                    if (!game.igdbId) {
                        const foundId = await searchGameIdByName(game.name);
                        if (foundId) {
                            game.igdbId = foundId;
                            if (index !== -1) save(); // Salva a associação somente se já estiver na lista
                        }
                    }

                    if (!game.igdbId) {
                        // Jogo não encontrado no IGDB
                        renderSimpleDetails(game, index);
                        return;
                    }

                    const details = await fetchGameExtraDetails(game.igdbId);
                    if (!details) {
                        renderSimpleDetails(game, index);
                    } else {
                        renderRichDetails(game, details, index);
                    }
                } catch (err) {
                    console.error(err);
                    loading.style.display = 'none';
                    errorContainer.style.display = 'flex';
                    retryBtn.onclick = loadData;
                }
            };

            await loadData();
        }

        function closeDetailsModal(event) {
            const overlay = document.getElementById('detailsModalOverlay');
            overlay.classList.remove('active');
            // Remove o iframe do vídeo (se existir) para parar a reprodução ao fechar o modal
            const iframe = overlay.querySelector('iframe');
            if (iframe) iframe.remove();
        }

        // Fecha modal ao apertar Esc
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeDetailsModal();
            }
        });

        function renderSimpleDetails(game, index) {
            const loading = document.getElementById('modalLoading');
            const content = document.getElementById('modalContent');
            const coverSrc = game.coverUrl ? game.coverUrl : DEFAULT_COVER;

            loading.style.display = 'none';
            content.style.display = 'block';

            const playingControls = getPlayingControlsHtml(game, index);

            const statsHtml = index === -1 ? '' : `
                <div class="game-stats" style="display: flex; gap: 16px; margin-bottom: 20px; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); padding: 10px 14px; border-radius: 10px; justify-content: space-around;">
                    <div style="text-align: center;">
                        <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Finalizado</span>
                        <div style="font-size: 1.1rem; font-weight: 800; color: var(--status-finished); margin-top: 2px;">🏆 ${game.finishCount || 0}x</div>
                    </div>
                    <div style="border-left: 1px solid var(--border-color); height: auto;"></div>
                    <div style="text-align: center;">
                        <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Dropado</span>
                        <div style="font-size: 1.1rem; font-weight: 800; color: var(--status-dropped); margin-top: 2px;">⬇ ${game.dropCount || 0}x</div>
                    </div>
                </div>
            `;

            const backlogDurationHtml = getBacklogDurationHtml(game, index);
            const recordHtml = getRecordHtml(game, index);

            let addGameButtonHtml = '';
            if (index === -1) {
                const plats = (selectedGameData && selectedGameData.platforms && selectedGameData.platforms.length > 0)
                    ? selectedGameData.platforms.map(p => p.name)
                    : DEFAULT_PLATFORMS;
                const optionsHtml = plats.map(plat => `<option value="${plat}"></option>`).join('');

                addGameButtonHtml = `
                    <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
                            <label style="font-size: 0.75rem; font-weight: 700; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.5px;">Plataforma *</label>
                            <input type="text" id="modalPlatformSelect" placeholder="Selecione ou digite a plataforma..." list="modalPlatformDatalist" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color); color: white; font-size: 0.9rem; font-weight: bold;" required>
                            <datalist id="modalPlatformDatalist">
                                ${optionsHtml}
                            </datalist>
                        </div>
                        <button class="add-btn" style="width: 100%; padding: 10px; font-weight: bold; border-radius: 8px; margin-top: 6px;" onclick="addGameFromPreview()">
                            📥 Adicionar ao ${activeMainTab === 'finalizados' ? 'Finalizados' : (activeMainTab === 'dropados' ? 'Dropados' : 'Backlog')}
                        </button>
                    </div>
                `;
            }

            const platformBadgeHtml = game.platform ? `<span class="modal-badge badge-platform">${game.platform}</span>` : '';

            // Botões de ação adicionais (Excluir e Devolver ao Backlog) para jogos já salvos (index !== -1)
            let modalActionButtonsHtml = '';
            if (index !== -1) {
                const returnButtonHtml = (game.status === 'Finalizado' || game.status === 'Dropado') ? `
                    <button class="backup-btn" style="flex: 1; border-color: rgba(255,255,255,0.15);" onclick="changeStatusFromModal(${index}, 'Backlog')">↩ Devolver ao Backlog</button>
                ` : '';
                
                modalActionButtonsHtml = `
                    <div style="display: flex; gap: 10px; margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 20px;">
                        ${returnButtonHtml}
                        <button class="backup-btn" style="flex: 1; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #f87171;" onclick="deleteGameFromModal(${index})">🗑️ Excluir Jogo</button>
                    </div>
                `;
            }

            content.innerHTML = `
                <div class="modal-hero">
                    <img src="${coverSrc}" class="modal-hero-cover" alt="Capa">
                    <div class="modal-hero-info">
                        <h2 class="modal-title">${game.name}</h2>
                        <div class="modal-meta-row">
                            ${platformBadgeHtml}
                        </div>
                    </div>
                </div>
                <div class="modal-content-body">
                    ${addGameButtonHtml}
                    ${backlogDurationHtml}
                    ${playingControls}
                    ${statsHtml}
                    ${recordHtml}
                    ${modalActionButtonsHtml}
                    <div class="modal-section-title">Sobre</div>
                    <p class="modal-summary">Informações detalhadas não encontradas no IGDB para este jogo. O status atual do jogo no seu backlog é: <strong>${game.status}</strong>.</p>
                </div>
            `;
        }

        function renderRichDetails(game, details, index) {
            const loading = document.getElementById('modalLoading');
            const content = document.getElementById('modalContent');

            loading.style.display = 'none';
            content.style.display = 'block';

            const coverSrc = game.coverUrl ? game.coverUrl : DEFAULT_COVER;

            // Extrai ano de lançamento
            let releaseYear = 'N/A';
            if (details.first_release_date) {
                const date = new Date(details.first_release_date * 1000);
                releaseYear = date.getFullYear();
            }

            // Extrai nota
            const ratingText = details.rating ? Math.round(details.rating) + '%' : 'N/A';

            // Extrai desenvolvedores
            let devCompany = '';
            if (details.involved_companies) {
                const devs = details.involved_companies.filter(c => c.developer);
                if (devs.length > 0) {
                    devCompany = devs[0].company.name;
                } else if (details.involved_companies.length > 0) {
                    devCompany = details.involved_companies[0].company.name;
                }
            }

            // Gêneros
            let genresHtml = '';
            if (details.genres && details.genres.length > 0) {
                genresHtml = `
                    <div class="modal-genres">
                        ${details.genres.map(g => `<span class="genre-tag">${g.name}</span>`).join('')}
                    </div>
                `;
            }

            // Screenshots
            let screenshotsHtml = '';
            if (details.screenshots && details.screenshots.length > 0) {
                const items = details.screenshots.map(s => {
                    const scrUrl = 'https:' + s.url.replace('t_thumb', 't_screenshot_med');
                    const scrBig = 'https:' + s.url.replace('t_thumb', 't_screenshot_huge');
                    return `<img src="${scrUrl}" class="screenshot-item" onclick="window.open('${scrBig}', '_blank')" alt="Screenshot">`;
                }).join('');

                screenshotsHtml = `
                    <div style="margin-top: 15px;">
                        <div class="modal-section-title">Screenshots</div>
                        <div class="screenshots-slider">
                            ${items}
                        </div>
                    </div>
                `;
            }

            // Vídeos do Youtube (Trailers)
            let videoHtml = '';
            if (details.videos && details.videos.length > 0) {
                const videoId = details.videos[0].video_id;
                videoHtml = `
                    <div style="margin-top: 15px;">
                        <div class="modal-section-title">Vídeos / Trailers</div>
                        <div class="video-container">
                            <iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>
                        </div>
                    </div>
                `;
            }

            const playingControls = getPlayingControlsHtml(game, index);

            const statsHtml = index === -1 ? '' : `
                <div class="game-stats" style="display: flex; gap: 16px; margin-bottom: 20px; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); padding: 10px 14px; border-radius: 10px; justify-content: space-around;">
                    <div style="text-align: center;">
                        <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Finalizado</span>
                        <div style="font-size: 1.1rem; font-weight: 800; color: var(--status-finished); margin-top: 2px;">🏆 ${game.finishCount || 0}x</div>
                    </div>
                    <div style="border-left: 1px solid var(--border-color); height: auto;"></div>
                    <div style="text-align: center;">
                        <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Dropado</span>
                        <div style="font-size: 1.1rem; font-weight: 800; color: var(--status-dropped); margin-top: 2px;">⬇ ${game.dropCount || 0}x</div>
                    </div>
                </div>
            `;

            const backlogDurationHtml = getBacklogDurationHtml(game, index);
            const recordHtml = getRecordHtml(game, index);

            let addGameButtonHtml = '';
            if (index === -1) {
                const plats = (selectedGameData && selectedGameData.platforms && selectedGameData.platforms.length > 0)
                    ? selectedGameData.platforms.map(p => p.name)
                    : DEFAULT_PLATFORMS;
                const optionsHtml = plats.map(plat => `<option value="${plat}"></option>`).join('');

                addGameButtonHtml = `
                    <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
                            <label style="font-size: 0.75rem; font-weight: 700; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.5px;">Plataforma *</label>
                            <input type="text" id="modalPlatformSelect" placeholder="Selecione ou digite a plataforma..." list="modalPlatformDatalist" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color); color: white; font-size: 0.9rem; font-weight: bold;" required>
                            <datalist id="modalPlatformDatalist">
                                ${optionsHtml}
                            </datalist>
                        </div>
                        <button class="add-btn" style="width: 100%; padding: 10px; font-weight: bold; border-radius: 8px; margin-top: 6px;" onclick="addGameFromPreview()">
                            📥 Adicionar ao ${activeMainTab === 'finalizados' ? 'Finalizados' : (activeMainTab === 'dropados' ? 'Dropados' : 'Backlog')}
                        </button>
                    </div>
                `;
            }

            const platformBadgeHtml = game.platform ? `<span class="modal-badge badge-platform">${game.platform}</span>` : '';

            // Botões de ação adicionais (Excluir e Devolver ao Backlog) para jogos já salvos (index !== -1)
            let modalActionButtonsHtml = '';
            if (index !== -1) {
                const returnButtonHtml = (game.status === 'Finalizado' || game.status === 'Dropado') ? `
                    <button class="backup-btn" style="flex: 1; border-color: rgba(255,255,255,0.15);" onclick="changeStatusFromModal(${index}, 'Backlog')">↩ Devolver ao Backlog</button>
                ` : '';
                
                modalActionButtonsHtml = `
                    <div style="display: flex; gap: 10px; margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 20px;">
                        ${returnButtonHtml}
                        <button class="backup-btn" style="flex: 1; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #f87171;" onclick="deleteGameFromModal(${index})">🗑️ Excluir Jogo</button>
                    </div>
                `;
            }

            content.innerHTML = `
                <div class="modal-hero">
                    <img src="${coverSrc}" class="modal-hero-cover" alt="Capa">
                    <div class="modal-hero-info">
                        <h2 class="modal-title">${details.name || game.name}</h2>
                        <div class="modal-meta-row">
                            ${platformBadgeHtml}
                            ${releaseYear !== 'N/A' ? `<span class="modal-badge badge-year">${releaseYear}</span>` : ''}
                            ${details.rating ? `<span class="modal-badge badge-rating">★ ${ratingText}</span>` : ''}
                            ${devCompany ? `<span class="modal-badge badge-developer" title="${devCompany}">${devCompany}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="modal-content-body">
                    ${addGameButtonHtml}
                    ${backlogDurationHtml}
                    ${playingControls}
                    ${statsHtml}
                    ${recordHtml}
                    ${modalActionButtonsHtml}
                    
                    <div>
                        <div class="modal-section-title">Sobre</div>
                        <p class="modal-summary">${details.summary || 'Nenhuma descrição detalhada disponível.'}</p>
                    </div>
                    
                    ${genresHtml}
                    ${screenshotsHtml}
                    ${videoHtml}
                </div>
            `;

            // Traduz a descrição automaticamente em segundo plano
            if (details.summary) {
                translateText(details.summary).then(translatedText => {
                    const summaryElement = content.querySelector('.modal-summary');
                    if (summaryElement && translatedText) {
                        summaryElement.textContent = translatedText;
                    }
                }).catch(err => console.error('Erro na tradução automática:', err));
            }
        }

        // --- ONBOARDING (BOAS-VINDAS) ---
        let currentOnboardingSlide = 0;
        const totalOnboardingSlides = 3;

        function showOnboarding() {
            currentOnboardingSlide = 0;
            updateOnboardingSlides();
            const modal = document.getElementById('onboardingModal');
            if (modal) modal.classList.add('active');
        }

        function closeOnboarding() {
            const modal = document.getElementById('onboardingModal');
            if (modal) modal.classList.remove('active');
            localStorage.setItem('backlog_first_access_completed', 'true');
        }

        function startAppAndAddGame() {
            closeOnboarding();
            openAddGameScreen();
        }

        function updateOnboardingSlides() {
            for (let i = 1; i <= totalOnboardingSlides; i++) {
                const slide = document.getElementById(`onboardingSlide${i}`);
                if (slide) {
                    if (i - 1 === currentOnboardingSlide) {
                        slide.style.display = 'flex';
                        slide.classList.add('active');
                    } else {
                        slide.style.display = 'none';
                        slide.classList.remove('active');
                    }
                }
            }

            // Update dots
            const dots = document.getElementById('onboardingDots').querySelectorAll('.carousel-dot');
            dots.forEach((dot, index) => {
                if (index === currentOnboardingSlide) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });

            // Update buttons
            const backBtn = document.getElementById('onboardingBackBtn');
            const nextBtn = document.getElementById('onboardingNextBtn');

            if (backBtn) {
                backBtn.disabled = currentOnboardingSlide === 0;
            }

            if (nextBtn) {
                if (currentOnboardingSlide === totalOnboardingSlides - 1) {
                    nextBtn.textContent = 'Começar';
                } else {
                    nextBtn.textContent = 'Avançar';
                }
            }
        }

        function goToOnboardingSlide(slideIndex) {
            currentOnboardingSlide = slideIndex;
            updateOnboardingSlides();
        }

        function nextOnboardingSlide() {
            if (currentOnboardingSlide < totalOnboardingSlides - 1) {
                currentOnboardingSlide++;
                updateOnboardingSlides();
            } else {
                closeOnboarding();
            }
        }

        function prevOnboardingSlide() {
            if (currentOnboardingSlide > 0) {
                currentOnboardingSlide--;
                updateOnboardingSlides();
            }
        }

        function checkFirstAccess() {
            const firstAccessCompleted = localStorage.getItem('backlog_first_access_completed');
            if (!firstAccessCompleted) {
                showOnboarding();
            }
        }

        // Listener de Scroll para carregar mais sugestões (Paginação)
        window.addEventListener('scroll', () => {
            if (currentScreen === 'addGame' && !isFetchingSuggestions && suggestionsOffset > 0 && suggestionsOffset < 30) {
                const threshold = 150; // pixels da borda inferior
                const position = window.innerHeight + window.scrollY;
                const height = document.documentElement.scrollHeight;
                if (height - position < threshold) {
                    const query = document.getElementById('gameInput').value.trim();
                    if (query.length >= 2) {
                        fetchSuggestions(query, true);
                    }
                }
            }
        });

        resetPlatformDatalist();
        render();
        checkFirstAccess();