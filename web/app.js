// Ties the page to the game and to the API.
(function () {
    const status = document.getElementById('status');
    const boardElement = document.getElementById('board');
    const stepButton = document.getElementById('step');
    let board = Game.createBoard();
    // The saved pattern last loaded or saved: marked in the list.
    let currentPatternId = null;

    // One button per cell: clickable and usable from the keyboard.
    // cellElements[r][c] is the button of the cell in row r, column c.
    const cells = document.createDocumentFragment();
    const cellElements = board.map(() => []);
    board.forEach((row, r) => row.forEach((alive, c) => {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.setAttribute('aria-label', `Sejt: ${r + 1}. sor, ${c + 1}. oszlop`);
        cell.setAttribute('aria-pressed', String(alive));
        cells.appendChild(cell);
        cellElements[r][c] = cell;
    }));
    boardElement.appendChild(cells);

    // Shows one cell of the board as it is now.
    function renderCell(r, c) {
        const cell = cellElements[r][c];
        cell.classList.toggle('alive', board[r][c]);
        cell.setAttribute('aria-pressed', String(board[r][c]));
    }

    // Shows the whole board as it is now.
    function render() {
        board.forEach((row, r) => row.forEach((alive, c) => renderCell(r, c)));
    }

    boardElement.addEventListener('click', (event) => {
        const cell = event.target.closest('.cell');
        if (!cell) return;
        const r = Number(cell.dataset.row);
        const c = Number(cell.dataset.col);
        board = Game.toggleCell(board, r, c);
        renderCell(r, c);
    });

    // One generation forward by the rules of the game.
    stepButton.addEventListener('click', () => {
        board = Game.nextGeneration(board);
        render();
    });

    // Saving the board under a name.
    const saveForm = document.getElementById('save-form');
    const nameInput = document.getElementById('pattern-name');
    const saveButton = document.getElementById('save-button');
    const saveMessage = document.getElementById('save-message');
    const saveErrors = {
        name_required: 'Adj meg egy nevet a mentéshez.',
        name_too_long: 'A név legfeljebb 50 karakter lehet.',
    };

    function showSaveMessage(text, ok) {
        saveMessage.textContent = text;
        saveMessage.className = ok ? 'message ok' : 'message bad';
    }

    saveForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = Game.patternName(nameInput.value);
        if (name === '') {
            showSaveMessage(saveErrors.name_required, false);
            nameInput.focus();
            return;
        }
        saveButton.disabled = true;
        saveButton.textContent = 'Mentés…';
        fetch('/api/patterns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, rows: board.length, cols: board[0].length, cells: Game.liveCells(board) }),
        })
            .then((response) => response.json().catch(() => ({})).then((body) => {
                if (response.ok) {
                    showSaveMessage(`Elmentve: ${body.name}`, true);
                    currentPatternId = body.id;
                    loadPatternList();
                } else {
                    showSaveMessage(saveErrors[body.error] || 'Nem sikerült menteni: a szerver nem érhető el.', false);
                }
            }))
            .catch(() => showSaveMessage('Nem sikerült menteni: a szerver nem érhető el.', false))
            .finally(() => {
                saveButton.disabled = false;
                saveButton.textContent = 'Mentés';
            });
    });

    // The saved patterns next to the board; clicking one puts it on the board.
    const patternList = document.getElementById('pattern-list');
    const patternsEmpty = document.getElementById('patterns-empty');
    const patternsMessage = document.getElementById('patterns-message');
    const listUnavailable = 'A mentett minták nem érhetők el: a szerver nem válaszol.';
    let loadingPattern = false;
    let listRequest = 0;

    function showPatternsMessage(text, ok) {
        patternsMessage.textContent = text;
        patternsMessage.className = ok ? 'message ok' : 'message bad';
    }

    function renderPatternList(patterns) {
        const items = document.createDocumentFragment();
        for (const pattern of patterns) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'pattern';
            button.dataset.id = pattern.id;
            button.disabled = loadingPattern;
            if (pattern.id === currentPatternId) {
                button.setAttribute('aria-current', 'true');
            }
            const name = document.createElement('span');
            name.className = 'pattern-name';
            name.textContent = pattern.name;
            const savedAt = document.createElement('time');
            savedAt.dateTime = pattern.updatedAt;
            savedAt.textContent = Game.formatSavedAt(pattern.updatedAt);
            button.append(name, savedAt);
            const item = document.createElement('li');
            item.appendChild(button);
            items.appendChild(item);
        }
        patternList.replaceChildren(items);
        patternsEmpty.hidden = patterns.length > 0;
    }

    // Asks for the list again; only the answer to the latest request is shown.
    function loadPatternList() {
        const request = ++listRequest;
        return fetch('/api/patterns')
            .then((response) => response.ok ? response.json() : Promise.reject(response.status))
            .then((patterns) => {
                if (request !== listRequest) return;
                renderPatternList(patterns);
                if (patternsMessage.textContent === listUnavailable) {
                    showPatternsMessage('', true);
                }
            })
            .catch(() => {
                if (request !== listRequest) return;
                showPatternsMessage(listUnavailable, false);
            });
    }

    function setPatternsDisabled(disabled) {
        loadingPattern = disabled;
        patternList.querySelectorAll('.pattern').forEach((button) => { button.disabled = disabled; });
    }

    function markCurrentPattern() {
        patternList.querySelectorAll('.pattern').forEach((button) => {
            if (Number(button.dataset.id) === currentPatternId) {
                button.setAttribute('aria-current', 'true');
            } else {
                button.removeAttribute('aria-current');
            }
        });
    }

    patternList.addEventListener('click', (event) => {
        const button = event.target.closest('.pattern');
        if (!button || loadingPattern) return;
        setPatternsDisabled(true);
        fetch(`/api/patterns/${button.dataset.id}`)
            .then((response) => response.json().catch(() => ({})).then((body) => {
                if (response.ok) {
                    board = Game.boardFromCells(body.cells);
                    render();
                    nameInput.value = body.name;
                    showSaveMessage('', true);
                    currentPatternId = body.id;
                    markCurrentPattern();
                    showPatternsMessage(`Betöltve: ${body.name}`, true);
                } else if (response.status === 404) {
                    showPatternsMessage('Ez a minta már nem érhető el.', false);
                    loadPatternList();
                } else {
                    showPatternsMessage('Nem sikerült betölteni: a szerver nem érhető el.', false);
                }
            }))
            .catch(() => showPatternsMessage('Nem sikerült betölteni: a szerver nem érhető el.', false))
            .finally(() => setPatternsDisabled(false));
    });

    loadPatternList();

    fetch('/api/health')
        .then((response) => response.ok ? response.json() : Promise.reject(response.status))
        .then(() => {
            status.textContent = 'A szerver elérhető.';
            status.className = 'status ok';
        })
        .catch(() => {
            status.textContent = 'A szerver nem érhető el.';
            status.className = 'status bad';
        });
})();
