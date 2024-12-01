// Charger l'arbre généalogique initialement
window.onload = function() {
    fetch('/get_tree')
        .then(response => response.json())
        .then(data => {
            renderTree(data);
        });
};

// Fonction pour afficher l'arbre généalogique
function renderTree(treeData) {
    const treeContainer = document.getElementById('tree-container');
    treeContainer.innerHTML = ''; // Réinitialiser le contenu avant de le remplir

    const treeDiv = document.createElement('div');
    treeDiv.className = 'tree-node';
    treeDiv.innerHTML = `<div class="node">${treeData.nom}</div>`;

    treeContainer.appendChild(treeDiv);

    // Afficher les enfants récursivement
    if (treeData.enfants.length > 0) {
        const childrenDiv = document.createElement('div');
        childrenDiv.className = 'node-container';
        treeData.enfants.forEach(child => {
            renderChild(child, childrenDiv);
        });
        treeContainer.appendChild(childrenDiv);
    }
}

// Fonction pour afficher un enfant
function renderChild(child, parentElement) {
    const childDiv = document.createElement('div');
    childDiv.className = 'tree-node';
    childDiv.innerHTML = `<div class="node">${child.nom}</div>`;
    parentElement.appendChild(childDiv);

    if (child.enfants.length > 0) {
        const childChildrenDiv = document.createElement('div');
        childChildrenDiv.className = 'node-container';
        child.enfants.forEach(grandchild => {
            renderChild(grandchild, childChildrenDiv);
        });
        parentElement.appendChild(childChildrenDiv);
    }
}

// Ajouter une personne via un bouton
document.getElementById('addPerson').addEventListener('click', function() {
    const nom = prompt("Nom de la nouvelle personne :");
    if (!nom) return;

    const parentId = prompt("ID du parent (laisser vide pour ajouter à la racine) :");
    const newPerson = {
        id: Date.now(),  // Utiliser un ID unique basé sur l'heure
        nom: nom,
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
            alert("Personne ajoutée avec succès !");
            location.reload();  // Recharge la page pour voir les changements
        } else {
            alert("Erreur lors de l'ajout : " + data.message);
        }
    })
    .catch(error => {
        console.error("Erreur lors de l'ajout :", error);
    });
});
