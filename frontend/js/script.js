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
    treeDiv.innerHTML = `<div class="node">ID: ${treeData.id}<br>Nom: ${treeData.nom}<br>Prénom: ${treeData.prenom}<br>Sexe: ${treeData.sexe}<br>Date de naissance: ${treeData.dob}</div>`;

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
    childDiv.innerHTML = `<div class="node">ID: ${child.id}<br>Nom: ${child.nom}<br>Prénom: ${child.prenom}<br>Sexe: ${child.sexe}<br>Date de naissance: ${child.dob}</div>`;
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

// Afficher le formulaire d'ajout de personne
document.getElementById('addPerson').addEventListener('click', function() {
    document.getElementById('form-container').style.display = 'block';
});

// Ajouter une personne via le formulaire
document.getElementById('addPersonForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const gender = document.getElementById('gender').value;
    const dob = document.getElementById('dob').value;
    const parentId = document.getElementById('parent-id').value || null;

    const newPerson = {
        id: Date.now(),  // Utiliser un ID unique basé sur l'heure
        nom: lastName,
        prenom: firstName,
        sexe: gender,
        dob: dob,
        parent_id: parentId,
        enfants: []
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
