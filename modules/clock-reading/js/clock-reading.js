// Jeu d'Apprentissage de la Lecture de l'Heure
class ClockReadingGame {
    constructor() {
        this.score = 0;
        this.correctCount = 0;
        this.currentMode = 'read'; // 'read' ou 'place'
        this.currentTime = null;
        this.isDragging = false;
        this.draggedHand = null;
    }

    async init() {
        // Créer le header
        PageHeader.render({
            icon: '🕐',
            title: 'Apprendre l\'Heure',
            subtitle: 'Apprends à lire et à placer les aiguilles !',
            actions: [],
            stats: [
                { label: 'Essais aujourd\'hui', id: 'attempts-remaining', value: '3' },
                { label: 'Score', id: 'score', value: '0' },
                { label: 'Bonnes réponses', id: 'correct-count', value: '0' }
            ]
        });

        const remaining = await GameAttempts.initHeaderDisplay('clock-reading', 3);
        if (remaining === 0) {
            Toast.warning('Plus d\'essais pour aujourd\'hui ! Reviens demain.');
            return;
        }

        this.cacheElements();
        this.attachEvents();
        this.drawClockBase();
        this.drawClockBasePlaceMode();
        this.generateReadQuestion();
    }

    cacheElements() {
        this.elements = {
            modeReadBtn: document.getElementById('mode-read-btn'),
            modePlaceBtn: document.getElementById('mode-place-btn'),
            readMode: document.getElementById('read-mode'),
            placeMode: document.getElementById('place-mode'),
            clockSvg: document.getElementById('clock-svg'),
            clockSvgPlace: document.getElementById('clock-svg-place'),
            hourHand: document.getElementById('hour-hand'),
            minuteHand: document.getElementById('minute-hand'),
            hourHandPlace: document.getElementById('hour-hand-place'),
            minuteHandPlace: document.getElementById('minute-hand-place'),
            answerButtons: document.querySelectorAll('.time-btn'),
            validatePlacementBtn: document.getElementById('validate-placement-btn'),
            targetTime: document.getElementById('target-time'),
            nextBtn: document.getElementById('next-btn'),
            score: document.getElementById('score'),
            correctCount: document.getElementById('correct-count')
        };
    }

    attachEvents() {
        // Mode buttons
        this.elements.modeReadBtn.addEventListener('click', () => this.switchMode('read'));
        this.elements.modePlaceBtn.addEventListener('click', () => this.switchMode('place'));

        // Answer buttons (read mode)
        this.elements.answerButtons.forEach(btn => {
            btn.addEventListener('click', () => this.checkAnswer(btn.textContent));
        });

        // Validate placement button
        this.elements.validatePlacementBtn.addEventListener('click', () => this.validatePlacement());

        // Next button
        this.elements.nextBtn.addEventListener('click', () => this.nextQuestion());

        // Dragging for place mode
        this.setupDragging();
    }

    setupDragging() {
        // Mouse events
        this.elements.hourHandPlace.addEventListener('mousedown', (e) => this.startDrag(e, 'hour'));
        this.elements.minuteHandPlace.addEventListener('mousedown', (e) => this.startDrag(e, 'minute'));

        // Touch events
        this.elements.hourHandPlace.addEventListener('touchstart', (e) => this.startDrag(e, 'hour'));
        this.elements.minuteHandPlace.addEventListener('touchstart', (e) => this.startDrag(e, 'minute'));

        // Global events
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('touchmove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.stopDrag());
        document.addEventListener('touchend', () => this.stopDrag());
    }

    startDrag(e, hand) {
        e.preventDefault();
        this.isDragging = true;
        this.draggedHand = hand;
    }

    drag(e) {
        if (!this.isDragging) return;

        const svg = this.elements.clockSvgPlace;
        const rect = svg.getBoundingClientRect();

        let clientX, clientY;
        if (e.type.startsWith('touch')) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const angle = Math.atan2(clientY - centerY, clientX - centerX);
        const degrees = angle * (180 / Math.PI) + 90;
        const normalizedDegrees = (degrees + 360) % 360;

        if (this.draggedHand === 'hour') {
            this.rotateHand(this.elements.hourHandPlace, normalizedDegrees);
        } else {
            this.rotateHand(this.elements.minuteHandPlace, normalizedDegrees);
        }
    }

    stopDrag() {
        this.isDragging = false;
        this.draggedHand = null;
    }

    rotateHand(hand, degrees) {
        hand.setAttribute('transform', `rotate(${degrees} 150 150)`);
    }

    drawClockBase() {
        this.drawHourMarks('hour-marks');
        this.drawHourNumbers('hour-numbers');
    }

    drawClockBasePlaceMode() {
        this.drawHourMarks('hour-marks-place');
        this.drawHourNumbers('hour-numbers-place');
    }

    drawHourMarks(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        for (let i = 0; i < 12; i++) {
            const angle = (i * 30 - 90) * Math.PI / 180;
            const x1 = 150 + 120 * Math.cos(angle);
            const y1 = 150 + 120 * Math.sin(angle);
            const x2 = 150 + 130 * Math.cos(angle);
            const y2 = 150 + 130 * Math.sin(angle);

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('class', 'hour-mark');
            line.setAttribute('stroke-width', '3');
            container.appendChild(line);
        }
    }

    drawHourNumbers(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        for (let i = 1; i <= 12; i++) {
            const angle = (i * 30 - 90) * Math.PI / 180;
            const x = 150 + 100 * Math.cos(angle);
            const y = 150 + 100 * Math.sin(angle);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', y);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('class', 'hour-number');
            text.textContent = i;
            container.appendChild(text);
        }
    }

    switchMode(mode) {
        this.currentMode = mode;

        if (mode === 'read') {
            this.elements.modeReadBtn.classList.add('active');
            this.elements.modePlaceBtn.classList.remove('active');
            this.elements.readMode.style.display = 'flex';
            this.elements.placeMode.style.display = 'none';
            this.generateReadQuestion();
        } else {
            this.elements.modeReadBtn.classList.remove('active');
            this.elements.modePlaceBtn.classList.add('active');
            this.elements.readMode.style.display = 'none';
            this.elements.placeMode.style.display = 'flex';
            this.generatePlaceQuestion();
        }
    }

    generateReadQuestion() {
        // Générer une heure aléatoire (heures rondes, quarts d'heure, demi-heures)
        const quarters = [0, 15, 30, 45];
        const hour = Math.floor(Math.random() * 24); // 0-23 pour format 24h
        const minute = quarters[Math.floor(Math.random() * quarters.length)];

        this.currentTime = { hour, minute };

        // Positionner les aiguilles
        this.setClockHands(this.elements.hourHand, this.elements.minuteHand, hour, minute);

        // Générer 4 options de réponse
        const correctAnswer = this.formatTime(hour, minute);
        const wrongAnswers = this.generateWrongAnswers(hour, minute);
        const allAnswers = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);

        // Afficher les boutons
        this.elements.answerButtons.forEach((btn, idx) => {
            btn.textContent = allAnswers[idx];
            btn.disabled = false;
            btn.style.opacity = '1';
        });
    }

    generatePlaceQuestion() {
        // Générer une heure aléatoire
        const quarters = [0, 15, 30, 45];
        const hour = Math.floor(Math.random() * 24); // 0-23 pour format 24h
        const minute = quarters[Math.floor(Math.random() * quarters.length)];

        this.currentTime = { hour, minute };

        // Afficher l'heure cible
        this.elements.targetTime.textContent = this.formatTime(hour, minute);

        // Réinitialiser les aiguilles à 00h00
        this.rotateHand(this.elements.hourHandPlace, 0);
        this.rotateHand(this.elements.minuteHandPlace, 0);
    }

    setClockHands(hourHand, minuteHand, hour, minute) {
        const minuteDegrees = minute * 6; // 360 / 60
        const hourDegrees = (hour % 12) * 30 + (minute / 60) * 30; // 360 / 12 + offset par les minutes

        this.rotateHand(hourHand, hourDegrees);
        this.rotateHand(minuteHand, minuteDegrees);
    }

    formatTime(hour, minute) {
        return `${hour.toString().padStart(2, '0')}h${minute.toString().padStart(2, '0')}`;
    }

    generateWrongAnswers(correctHour, correctMinute) {
        const answers = new Set();
        const quarters = [0, 15, 30, 45];

        while (answers.size < 3) {
            const hour = Math.floor(Math.random() * 24); // 0-23 pour format 24h
            const minute = quarters[Math.floor(Math.random() * quarters.length)];

            if (hour !== correctHour || minute !== correctMinute) {
                answers.add(this.formatTime(hour, minute));
            }
        }

        return Array.from(answers);
    }

    checkAnswer(answer) {
        const correctAnswer = this.formatTime(this.currentTime.hour, this.currentTime.minute);

        if (answer === correctAnswer) {
            this.correctAnswer();
        } else {
            this.incorrectAnswer(correctAnswer);
        }

        // Désactiver les boutons
        this.elements.answerButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        });
    }

    validatePlacement() {
        const hourTransform = this.elements.hourHandPlace.getAttribute('transform');
        const minuteTransform = this.elements.minuteHandPlace.getAttribute('transform');

        const hourDegrees = this.extractDegrees(hourTransform);
        const minuteDegrees = this.extractDegrees(minuteTransform);

        // Calculer les degrés attendus
        const expectedMinuteDegrees = this.currentTime.minute * 6;
        const expectedHourDegrees = (this.currentTime.hour % 12) * 30 + (this.currentTime.minute / 60) * 30;

        // Tolérance pour les enfants : 30 degrés (1 heure ou 5 minutes)
        const hourMatch = Math.abs(this.normalizeDegrees(hourDegrees - expectedHourDegrees)) <= 30;
        const minuteMatch = Math.abs(this.normalizeDegrees(minuteDegrees - expectedMinuteDegrees)) <= 30;

        if (hourMatch && minuteMatch) {
            this.correctAnswer();
        } else {
            this.incorrectAnswer(this.formatTime(this.currentTime.hour, this.currentTime.minute));
        }
    }

    extractDegrees(transform) {
        if (!transform) return 0;
        const match = transform.match(/rotate\(([^)]+)\)/);
        return match ? parseFloat(match[1]) : 0;
    }

    normalizeDegrees(degrees) {
        degrees = degrees % 360;
        if (degrees > 180) degrees -= 360;
        if (degrees < -180) degrees += 360;
        return degrees;
    }

    async correctAnswer() {
        this.score += 10;
        this.correctCount++;
        this.updateStats();

        let message = 'Bravo ! Bonne réponse !';

        // Récompense tous les 3 bonnes réponses
        if (this.correctCount % 3 === 0) {
            await this.addCredits(2);
            message += ' +2 🪙';
        }

        Toast.success(message);
    }

    incorrectAnswer(correctAnswer) {
        Toast.error(`Incorrect. La bonne réponse était ${correctAnswer}`);
    }

    nextQuestion() {
        if (this.currentMode === 'read') {
            this.generateReadQuestion();
        } else {
            this.generatePlaceQuestion();
        }
    }

    updateStats() {
        this.elements.score.textContent = this.score;
        this.elements.correctCount.textContent = this.correctCount;
    }

    async addCredits(amount) {
        const user = authService.getCurrentUser();
        if (!user) return;

        try {
            await authService.fetchAPI(`/users/${user.id}/credits`, {
                method: 'POST',
                body: JSON.stringify({ amount })
            });
        } catch (error) {
            console.error('Failed to add credits:', error);
        }
    }
}

// Instance globale
const clockGame = new ClockReadingGame();
