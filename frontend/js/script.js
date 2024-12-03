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

// Fonction pour afficher l'arbre généalogique avec liens entre parents et enfants
function renderTree(members) {
    const treeContainer = document.getElementById('tree-container');
    treeContainer.innerHTML = ''; // Réinitialiser le contenu avant de le remplir

    // Créer une carte des membres pour faciliter l'accès
    const memberMap = members.reduce((acc, member) => {
        acc[member.id] = { ...member, children: [] };
        return acc;
    }, {});

    // Relier les enfants aux parents
    members.forEach(member => {
        if (member.parent_id && memberMap[member.parent_id]) {
            memberMap[member.parent_id].children.push(member);
        }
    });

    // Afficher les membres et leurs enfants
    members.filter(member => !member.parent_id).forEach(root => {
        displayMember(root, treeContainer, memberMap);
    });
}

// Fonction récursive pour afficher un membre et ses enfants
function displayMember(member, container, memberMap) {
    const memberDiv = document.createElement('div');
    memberDiv.className = 'tree-node';

    const parentLink = member.parent_id ? `<a class="parent-link" href="#" onclick="goToParent(${member.parent_id})">Voir parent</a>` : '';

    memberDiv.innerHTML = `
        <div class="node">
            ID: ${member.id}<br>Nom: ${member.nom}<br>Prénom: ${member.prenom}<br>
            Sexe: ${member.sexe}<br>Date de naissance: ${member.dob}<br>
            ${parentLink}
        </div>
        <div class="child-nodes">
            ${memberMap[member.id] && memberMap[member.id].children.length > 0 ? memberMap[member.id].children.map(child => `
                <div class="tree-node">
                    <div class="node">
                        ID: ${child.id}<br>Nom: ${child.nom}<br>Prénom: ${child.prenom}<br>
                        Sexe: ${child.sexe}<br>Date de naissance: ${child.dob}
                    </div>
                </div>`).join('') : ''}
        </div>
    `;

    container.appendChild(memberDiv);
}

// Fonction pour naviguer vers un parent spécifique (simple effet ici)
function goToParent(parentId) {
    alert(`Afficher les détails du parent avec ID: ${parentId}`);
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
            window.location.reload();
        }
    } catch (error) {
        console.error("Erreur lors de l'ajout :", error);
    }
});

// Afficher le formulaire d'ajout
document.getElementById('addPersonButton').addEventListener('click', function() {
    document.getElementById('form-container').style.display = 'block';
});
