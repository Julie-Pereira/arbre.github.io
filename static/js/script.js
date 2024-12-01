document.addEventListener("DOMContentLoaded", () => {
    const treeDiv = document.getElementById('tree');
    const addPersonButton = document.getElementById('addPerson');

    function renderTree(node) {
        const div = document.createElement('div');
        div.className = 'node';
        div.textContent = node.nom;
        treeDiv.appendChild(div);

        node.enfants.forEach(enfant => {
            const childContainer = document.createElement('div');
            childContainer.style.marginLeft = '20px';
            treeDiv.appendChild(childContainer);
            renderTree(enfant);
        });
    }

    function fetchTree() {
        fetch('/')
            .then(response => response.json())
            .then(data => {
                treeDiv.innerHTML = '';
                renderTree(data);
            });
    }

    addPersonButton.addEventListener('click', () => {
        const nom = prompt("Nom de la nouvelle personne :");
        const parentId = prompt("ID du parent (laisser vide pour ajouter à la racine) :");

        fetch('/add_person', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: Date.now(), nom, parent_id: parentId })
        }).then(() => fetchTree());
    });

    fetchTree();
});
