import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://uwqimphpkzcjinlucwwl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cWltcGhwa3pjamlubHVjd3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxMzA1ODcsImV4cCI6MjA0ODcwNjU4N30.IA-ZS1tu3FuUdrTioALpWuiJvgkkZRn4qX_ghcW4tXI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Charger l'arbre généalogique initialement
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
            console.log("Membres chargés :", data); // Affiche les membres pour inspection
            renderTree(data); // Appelle la fonction pour afficher l'arbre
        }
    } catch (error) {
        console.error("Erreur lors du chargement de l'arbre :", error);
    }
}

// Afficher l'arbre généalogique
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
            renderNode(memberMap[member.id], treeContainer, members); // Passer aussi members
        }
    });
}

// Afficher un nœud et ses enfants
function renderNode(member, container, members) {
    const node = document.createElement('div');
    node.className = 'tree-node';

    // Affichage des parents et de leur relation
    if (member.spouse_id) {
        const spouse = members.find(p => p.id === member.spouse_id);
        
        if (spouse) {
            const parentsContainer = document.createElement('div');
            parentsContainer.className = 'parents';

            // Ajouter les deux parents côte à côte
            parentsContainer.innerHTML = `
                <div class="parent">
                    <p>${member.prenom} ${member.nom}</p>
                </div>
                <div class="parent">
                    <p>${spouse.prenom} ${spouse.nom}</p>
                </div>
            `;
            node.appendChild(parentsContainer);
        }
    }

    // Ajouter une ligne de connexion visuelle entre les parents et leurs enfants
    if (member.spouse_id) {
        const line = document.createElement('div');
        line.className = 'parent-child-line';
        node.appendChild(line);
    }

    // Affichage des enfants
    if (member.children && member.children.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'children-container';

        member.children.forEach(child => {
            const childNode = document.createElement('div');
            childNode.className = 'child-node';
            childNode.innerHTML = `<p>${child.prenom} ${child.nom}</p>`;
            childrenContainer.appendChild(childNode);
            renderNode(child, childrenContainer, members); // Recursion pour afficher les enfants
        });

        node.appendChild(childrenContainer);
    }

    container.appendChild(node);
}


// Supprimer un membre
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

// Ajouter un nouveau membre
document.getElementById('addPersonForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const gender = document.getElementById('gender').value;
    const dob = document.getElementById('dob').value;
    const parentId = document.getElementById('parent-id').value || null;

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
