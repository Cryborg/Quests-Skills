// Gestion des mots mêlés dans l'interface admin
const WordSearchAdmin = {
    themes: [],
    cardThemes: [],
    collapsedThemes: new Set(),

    async init() {
        console.log('🔧 Initializing WordSearch Admin');
        this.loadCollapsedState();
        await this.loadCardThemes();
        await this.loadThemes();
        this.attachEvents();
    },

    // Charger l'état des thèmes repliés depuis localStorage
    loadCollapsedState() {
        const saved = localStorage.getItem('admin-words-collapsed-themes');
        this.collapsedThemes = saved ? new Set(JSON.parse(saved)) : new Set();
    },

    // Sauvegarder l'état des thèmes repliés dans localStorage
    saveCollapsedState() {
        localStorage.setItem('admin-words-collapsed-themes', JSON.stringify([...this.collapsedThemes]));
    },

    // Toggle un thème
    toggleTheme(themeSlug) {
        if (this.collapsedThemes.has(themeSlug)) {
            this.collapsedThemes.delete(themeSlug);
        } else {
            this.collapsedThemes.add(themeSlug);
        }
        this.saveCollapsedState();
        this.renderThemes();
    },

    async loadCardThemes() {
        try {
            const response = await authService.fetchAPI('/themes/all');
            const data = await response.json();
            this.cardThemes = Array.isArray(data) ? data : data.themes || [];
        } catch (error) {
            console.error('Failed to load card themes:', error);
            this.cardThemes = [];
        }
    },

    attachEvents() {
        // Modal mot
        const wordForm = document.getElementById('word-form');
        if (wordForm) {
            wordForm.addEventListener('submit', (e) => this.handleWordSubmit(e));
        }

        const wordFormCancel = document.getElementById('word-form-cancel');
        if (wordFormCancel) {
            wordFormCancel.addEventListener('click', () => {
                document.getElementById('word-modal').classList.remove('show');
            });
        }

        const wordModalClose = document.getElementById('word-modal-close');
        if (wordModalClose) {
            wordModalClose.addEventListener('click', () => {
                document.getElementById('word-modal').classList.remove('show');
            });
        }

        // Auto-uppercase pour le mot
        const wordTextInput = document.getElementById('word-text');
        if (wordTextInput) {
            wordTextInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }

        // Filtrage des mots
        const searchInput = document.getElementById('words-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterWords(e.target.value);
            });
        }
    },

    filterWords(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const wordChips = document.querySelectorAll('.word-chip');
        const themeCards = document.querySelectorAll('.word-theme-card');

        wordChips.forEach(chip => {
            const wordText = chip.querySelector('.word-text').textContent.toLowerCase();
            if (wordText.includes(term)) {
                chip.style.display = 'flex';
            } else {
                chip.style.display = 'none';
            }
        });

        // Cacher les thèmes qui n'ont plus de mots visibles
        themeCards.forEach(card => {
            const visibleWords = card.querySelectorAll('.word-chip[style="display: flex;"]');
            if (term === '' || visibleWords.length > 0) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    },

    async loadThemes() {
        try {
            const response = await authService.fetchAPI('/themes/with-words');
            const themes = await response.json();
            this.themes = Array.isArray(themes) ? themes : [];
            this.renderThemes();
        } catch (error) {
            console.error('Failed to load themes:', error);
            showToast('❌ Erreur lors du chargement des thèmes');
        }
    },

    renderThemes() {
        const container = document.getElementById('word-themes-container');
        if (!container) return;

        if (this.themes.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucun thème. Créez-en un dans "Cartes & Thèmes" !</p>';
            return;
        }

        container.innerHTML = this.themes.map(theme => {
            const themeSlug = theme.slug || 'generic';
            const isCollapsed = this.collapsedThemes.has(themeSlug);

            return `
            <div class="word-theme-card ${isCollapsed ? 'collapsed' : ''}" data-theme-slug="${themeSlug}">
                <div class="word-theme-header">
                    <div class="word-theme-header-left">
                        <button class="theme-collapse-btn" onclick="WordSearchAdmin.toggleTheme('${themeSlug}')" title="${isCollapsed ? 'Déplier' : 'Replier'}">
                            ${isCollapsed ? '▶' : '▼'}
                        </button>
                        <h3>${theme.icon} ${theme.name}</h3>
                    </div>
                    <div class="word-theme-actions">
                        <button class="admin-btn-small admin-btn-secondary" onclick="WordSearchAdmin.openAddWordModal('${theme.slug || ''}')">
                            ➕ Ajouter un mot
                        </button>
                    </div>
                </div>
                <div class="words-grid">
                    ${theme.words && theme.words.length > 0 ? theme.words.map(word => `
                        <div class="word-chip">
                            <span class="word-text">${word.word}</span>
                            <button class="word-edit-btn" onclick="WordSearchAdmin.editWord(${word.id}, '${word.word}', '${word.theme_slug || ''}')" title="Modifier">✏️</button>
                            <button class="word-delete-btn" onclick="WordSearchAdmin.deleteWord(${word.id}, '${word.word}')" title="Supprimer">×</button>
                        </div>
                    `).join('') : '<p class="empty-state-small">Aucun mot dans ce thème</p>'}
                </div>
            </div>
        `}).join('');
    },

    openAddWordModal(themeSlug) {
        document.getElementById('word-modal-title').textContent = 'Ajouter un mot';
        document.getElementById('word-id').value = '';
        document.getElementById('word-theme-ref').value = themeSlug || '';
        document.getElementById('word-text').value = '';
        document.getElementById('word-text').disabled = false;

        // Charger les thèmes dans le select
        this.populateThemeSelect(themeSlug);

        document.getElementById('word-modal').classList.add('show');
    },

    editWord(wordId, word, themeSlug) {
        document.getElementById('word-modal-title').textContent = 'Modifier le mot';
        document.getElementById('word-id').value = wordId;
        document.getElementById('word-theme-ref').value = themeSlug || '';
        document.getElementById('word-text').value = word;
        document.getElementById('word-text').disabled = false;

        // Charger les thèmes dans le select
        this.populateThemeSelect(themeSlug);

        document.getElementById('word-modal').classList.add('show');
    },

    populateThemeSelect(selectedTheme) {
        const themeSelect = document.getElementById('word-theme');
        themeSelect.innerHTML = '<option value="">-- Mot générique (pour tous) --</option>' +
            this.cardThemes.map(theme => `<option value="${theme.slug}">${theme.icon} ${theme.name}</option>`).join('');
        themeSelect.value = selectedTheme || '';
    },

    async handleWordSubmit(e) {
        e.preventDefault();

        const wordId = document.getElementById('word-id').value;
        const themeSlug = document.getElementById('word-theme').value || null;
        const word = document.getElementById('word-text').value.trim().toUpperCase();

        // Validation du mot
        if (word.length < 3 || word.length > 15) {
            showToast('❌ Le mot doit faire entre 3 et 15 caractères');
            return;
        }

        if (!/^[A-ZÀ-ÿ\s]+$/.test(word)) {
            showToast('❌ Le mot ne doit contenir que des lettres');
            return;
        }

        try {
            if (wordId) {
                // Mise à jour
                await authService.fetchAPI(`/word-search/words/${wordId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ word, theme: themeSlug })
                });
                showToast('✅ Mot modifié');
            } else {
                // Création
                await authService.fetchAPI('/word-search/words', {
                    method: 'POST',
                    body: JSON.stringify({
                        theme: themeSlug,
                        word
                    })
                });
                showToast('✅ Mot ajouté');

                // Garder la modale ouverte, vider le champ et refocus pour ajout rapide
                document.getElementById('word-text').value = '';
                document.getElementById('word-text').focus();
                await this.loadThemes();
                return; // On ne ferme pas la modale
            }

            // Si édition, on ferme la modale
            document.getElementById('word-modal').classList.remove('show');
            await this.loadThemes();
        } catch (error) {
            console.error('Error saving word:', error);
            showToast('❌ Erreur lors de l\'enregistrement');
        }
    },

    async deleteWord(wordId, word) {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer le mot "${word}" ?`)) {
            return;
        }

        try {
            await authService.fetchAPI(`/word-search/words/${wordId}`, {
                method: 'DELETE'
            });
            showToast('✅ Mot supprimé');
            await this.loadThemes();
        } catch (error) {
            console.error('Error deleting word:', error);
            showToast('❌ Erreur lors de la suppression');
        }
    }
};

// Helper pour les toasts
function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}
