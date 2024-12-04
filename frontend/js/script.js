import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://uwqimphpkzcjinlucwwl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cWltcGhwa3pjamlubHVjd3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxMzA1ODcsImV4cCI6MjA0ODcwNjU4N30.IA-ZS1tu3FuUdrTioALpWuiJvgkkZRn4qX_ghcW4tXI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Charger l'arbre généalogique à l'initialisation
window.onload = async function () {
    await loadTree();
};

// Charger et afficher l'arbre généalogique
async function loadTree() {
    try {
        const { data, error } = await supabase
            .from('members')
            .select('*');

        if (error) {
            console.error("Erreur lors du chargement des membres :", error);
        } else {
            renderTree(data);
        }
    } catch (error) {
        console.error("Erreur lors du chargement de l'arbre :", error);
    }
}

// Fonction pour afficher l'arbre généalogique
function renderTree(members) {
    const treeContainer = document.getElementById('tree-container');
    treeContainer.innerHTML = '';

    // Organisation des membres en parent-enfant
    const memberMap = members.reduce((acc, member) => {
        acc[member.id] = { ...member, children: [] };
        return acc;
    }, {});

    members.forEach(member => {
        if (member.parent_id) {
            if (memberMap[member.parent_id]) {
                memberMap[member.parent_id].children.push(memberMap[member.id]);
            }
        }
    });

    // Ajouter les membres racines (sans parent) à l'arbre
    members.forEach(member => {
        if (!member.parent_id) {
            renderNode(memberMap[member.id], treeContainer);
        }
    });
}

// Fonction pour créer un nœud HTML pour un membre et ses enfants
function renderNode(member, container) {
    const node = document.createElement('div');
    node.className = 'tree-node';

    node.innerHTML = `
        <div class="node-content">
            <div class="person">
                <div class="name">${member.prenom} ${member.nom}</div>
                <div class="details">
                    <span class="dob">${member.dob}</span>
                    <span class="gender">${member.sexe}</span>
                </div>
                <button class="delete-button" data-member-id="${member.id}">Supprimer</button>
            </div>
        </div>
    `;

    container.appendChild(node);

    // Afficher l'époux/épouse
    if (member.spouse_id) {
        const spouse = members.find(p => p.id === member.spouse_id);
        if (spouse) {
            const spouseDiv = document.createElement('div');
            spouseDiv.className = 'spouse-container';
            spouseDiv.innerHTML = `
                <div class="spouse">
                    <p>Nom : ${spouse.prenom} ${spouse.nom}</p>
                    <p>Sexe : ${spouse.sexe}</p>
                </div>
            `;
            node.appendChild(spouseDiv);
        }
    }

    // Conteneur pour les enfants
    if (member.children && member.children.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'children-container';
        node.appendChild(childrenContainer);

        member.children.forEach(child => {
            renderNode(child, childrenContainer);
        });
    }

    // Ajout de l'événement pour la suppression
    const deleteButton = node.querySelector('.delete-button');
    deleteButton.addEventListener('click', async () => {
        if (confirm(`Voulez-vous vraiment supprimer ${member.prenom} ${member.nom} ?`)) {
            await deletePerson(member.id);
        }
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
            alert("Erreur lors de la suppression : " + error.message);
        } else {
            alert("Membre supprimé avec succès !");
            await loadTree(); // Recharge l’arbre après suppression
        }
    } catch (error) {
        console.error("Erreur lors de la suppression :", error);
    }
}

// Gestion du formulaire d'ajout
document.getElementById('addPersonForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const gender = document.getElementById('gender').value;
    const dob = document.getElementById('dob').value;
    const parentId = document.getElementById('parent-id').value || null;
    const spouseId = document.getElementById('spouse-id').value || null; // Récupère l'ID du conjoint

    try {
        if (parentId) {
            const { data: parentData, error: parentError } = await supabase
                .from('members')
                .select('*')
                .eq('id', parentId)
                .single();

            if (parentError || !parentData) {
                alert("Le parent spécifié n'existe pas !");
                return;
            }
        }

        // Insertion du membre dans la base de données
        const { error } = await supabase
            .from('members')
            .insert([
                {
                    nom: lastName,
                    prenom: firstName,
                    sexe: gender,
                    dob: dob,
                    parent_id: parentId ? parseInt(parentId) : null,
                    spouse_id: spouseId ? parseInt(spouseId) : null // Ajouter l'ID du conjoint
                }
            ]);

        if (error) {
            alert("Erreur lors de l'ajout : " + error.message);
        } else {
            alert("Personne ajoutée avec succès !");
            await loadTree(); // Recharge l’arbre après ajout
        }
    } catch (error) {
        console.error("Erreur lors de l'ajout :", error);
    }
});


// Afficher le formulaire d'ajout
document.getElementById('addPersonButton').addEventListener('click', function () {
    document.getElementById('form-container').style.display = 'block';
});
