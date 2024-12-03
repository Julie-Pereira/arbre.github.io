import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://uwqimphpkzcjinlucwwl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cWltcGhwa3pjamlubHVjd3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxMzA1ODcsImV4cCI6MjA0ODcwNjU4N30.IA-ZS1tu3FuUdrTioALpWuiJvgkkZRn4qX_ghcW4tXI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Charger l'arbre généalogique initialement
window.onload = async function () {
    try {
        const { data, error } = await supabase
            .from('members')
            .select('*');

        if (error) {
            console.error("Erreur lors du chargement des membres :", error);
        } else {
            renderTree(data); // Appelle la fonction pour afficher l'arbre
        }
    } catch (error) {
        console.error("Erreur lors du chargement de l'arbre :", error);
    }
};

// Fonction pour afficher l'arbre généalogique avec hiérarchie
function renderTree(members) {
    const treeContainer = document.getElementById('tree-container');
    treeContainer.innerHTML = ''; // Réinitialiser le contenu avant de le remplir

    // Créer une map des membres pour les organiser en structure parent-enfant
    const memberMap = members.reduce((acc, member) => {
        acc[member.id] = { ...member, children: [] };
        return acc;
    }, {});

    // Organiser les membres en enfants de leurs parents
    members.forEach(member => {
        if (member.parent_id && memberMap[member.parent_id]) {
            memberMap[member.parent_id].children.push(memberMap[member.id]);
        }
    });

    // Trouver les racines (membres sans parents)
    const roots = members.filter(member => !member.parent_id);

    // Afficher les racines et leurs enfants
    roots.forEach(root => {
        renderNode(root, treeContainer);
    });
}

// Fonction pour créer un nœud et afficher les enfants
function renderNode(member, container) {
    const node = document.createElement('div');
    node.className = 'tree-node';

    node.innerHTML = `
        <div class="node">
            <strong>${member.prenom} ${member.nom}</strong><br>
            Sexe: ${member.sexe}<br>
            Date de naissance: ${member.dob}
        </div>
        <button class="delete" data-member-id="${member.id}">Supprimer</button>
    `;

    container.appendChild(node);

    // Si le membre a des enfants, les afficher
    if (member.children && member.children.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'children-container';

        member.children.forEach(child => {
            renderNode(child, childrenContainer); // Appel récursif pour chaque enfant
        });

        container.appendChild(childrenContainer);
    }

    // Attacher l'événement de suppression pour ce membre
    const deleteButton = node.querySelector('.delete');
    deleteButton.addEventListener('click', function() {
        deletePerson(member.id);  // Appeler la fonction de suppression pour ce membre
    });
}

// Fonction pour supprimer un membre
async function deletePerson(memberId) {
    try {
        const { error } = await supabase
            .from('members')
            .delete()
            .eq('id', memberId);

        if (error) {
            alert("Erreur lors de la suppression: " + error.message);
        } else {
            alert("Membre supprimé avec succès !");
            window.location.reload(); // Recharge la page après suppression
        }
    } catch (error) {
        console.error("Erreur lors de la suppression :", error);
    }
}

// Ajouter une personne via le formulaire
document.getElementById('addPersonForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const gender = document.getElementById('gender').value;
    const dob = document.getElementById('dob').value;
    const parentId = document.getElementById('parent-id').value || null;

    try {
        const { data, error } = await supabase
            .from('members')
            .insert([
                {
                    nom: lastName,
                    prenom: firstName,
                    sexe: gender,
                    dob: dob,
                    parent_id: parentId ? parseInt(parentId) : null
                }
            ]);

        if (error) {
            alert("Erreur lors de l'ajout : " + error.message);
        } else {
            alert("Personne ajoutée avec succès !");
            window.location.reload(); // Recharge la page après ajout
        }
    } catch (error) {
        console.error("Erreur lors de l'ajout :", error);
    }
});

// Afficher le formulaire d'ajout
document.getElementById('addPersonButton').addEventListener('click', function() {
    document.getElementById('form-container').style.display = 'block';
});
