document.addEventListener("DOMContentLoaded", () => {
    const treeDiv = document.getElementById('tree');
    const addPersonButton = document.getElementById('addPerson');

    // Fonction pour afficher l'arbre
    function renderTree(node, container) {
        const div = document.createElement('div');
        div.className = 'node';
        div.textContent = node.nom;
        container.appendChild(div);

        if (node.enfants && node.enfants.length > 0) {
            const childrenContainer = document.createElement('div');
            childrenContainer.style.marginLeft = '20px';
            childrenContainer.style.borderLeft = '1px solid #ddd';
            childrenContainer.style.paddingLeft = '10px';
            container.appendChild(childrenContainer);

            node.enfants.forEach(enfant => renderTree(enfant, childrenContainer));
        }
    }

    // Fonction pour récupérer l'arbre depuis le serveur
    function fetchTree() {
        fetch('/get_tree')
            .then(response => response.json())
            .then(data => {
                treeDiv.innerHTML = '';
                renderTree(data, treeDiv);
            });
    }

    // Ajouter une personne dans l'arbre
    addPersonButton.addEventListener('click', () => {
        const nom = prompt("Nom de la nouvelle personne :");
        if (!nom) return;

        const parentId = prompt("ID du parent (laisser vide pour ajouter à la racine) :");
        const newPerson = {
            id: Date.now(),
            nom,
            parent_id: parentId ? parseInt(parentId) : null
        };

        fetch('/add_person', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPerson)
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === "success") {
                    fetchTree();
                } else {
                    alert(data.message || "Erreur lors de l'ajout !");
                }
            });
    });

    // Charger l'arbre au démarrage
    fetchTree();
});
