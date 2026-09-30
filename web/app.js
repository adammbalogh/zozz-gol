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
