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
            const members = buildTree(data);
            renderTree(members); // Afficher l'arbre
        }
    } catch (error) {
        console.error("Erreur lors du chargement de l'arbre :", error);
    }
};

// Construire l'arbre généalogique
function buildTree(members) {
    const memberMap = new Map();
    const rootMembers = [];

    // Créer une map des membres par ID pour faciliter l'accès aux parents
    members.forEach(member => {
        member.enfants = []; // Initialiser les enfants de chaque membre
        memberMap.set(member.id, member);
    });

    // Associer les membres aux enfants
    members.forEach(member => {
        if (member.parent_id) {
            const parent = memberMap.get(member.parent_id);
            if (parent) {
                parent.enfants.push(member); // Ajouter l'enfant au parent
            }
        } else {
            rootMembers.push(member); // Si le membre n'a pas de parent, c'est la racine
        }
    });

    return rootMembers;
}

// Fonction pour afficher l'arbre généalogique
function renderTree(members) {
    const treeContainer = document.getElementById('tree-container');
    treeContainer.innerHTML = ''; // Réinitialiser le contenu avant de le remplir

    members.forEach(member => {
        const treeDiv = document.createElement('div');
        treeDiv.className = 'tree-node';
        treeDiv.innerHTML = `
            <div class="node">
                <strong>${member.prenom} ${member.nom}</strong><br>
                Sexe: ${member.sexe}<br>
                Date de naissance: ${member.dob}
            </div>
        `;
        treeContainer.appendChild(treeDiv);

        // Si ce membre a des enfants, les afficher récursivement
        if (member.enfants.length > 0) {
            const childrenDiv = document.createElement('div');
            childrenDiv.className = 'children';
            renderChildren(member.enfants, childrenDiv);
            treeContainer.appendChild(childrenDiv);
        }
    });
}

// Fonction pour afficher les enfants d'un membre
function renderChildren(children, parentElement) {
    children.forEach(child => {
        const childDiv = document.createElement('div');
        childDiv.className = 'tree-node';
        childDiv.innerHTML = `
            <div class="node">
                <strong>${child.prenom} ${child.nom}</strong><br>
                Sexe: ${child.sexe}<br>
                Date de naissance: ${child.dob}
            </div>
        `;
        parentElement.appendChild(childDiv);

        // Si l'enfant a des enfants, afficher récursivement
        if (child.enfants.length > 0) {
            const childChildrenDiv = document.createElement('div');
            childChildrenDiv.className = 'children';
            renderChildren(child.enfants, childChildrenDiv);
            parentElement.appendChild(childChildrenDiv);
        }
    });
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

// Annuler le formulaire d'ajout
document.getElementById('cancelButton').addEventListener('click', function() {
    document.getElementById('form-container').style.display = 'none';
});
