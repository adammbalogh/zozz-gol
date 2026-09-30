// Ties the page to the game and to the API.
(function () {
    const status = document.getElementById('status');
    const boardElement = document.getElementById('board');
    let board = Game.createBoard();

    // One button per cell: clickable and usable from the keyboard.
    const cells = document.createDocumentFragment();
    board.forEach((row, r) => row.forEach((alive, c) => {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.setAttribute('aria-label', `Sejt: ${r + 1}. sor, ${c + 1}. oszlop`);
        cell.setAttribute('aria-pressed', String(alive));
        cells.appendChild(cell);
    }));
    boardElement.appendChild(cells);

    boardElement.addEventListener('click', (event) => {
        const cell = event.target.closest('.cell');
        if (!cell) return;
        const r = Number(cell.dataset.row);
        const c = Number(cell.dataset.col);
        board = Game.toggleCell(board, r, c);
        cell.classList.toggle('alive', board[r][c]);
        cell.setAttribute('aria-pressed', String(board[r][c]));
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
