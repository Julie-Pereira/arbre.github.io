import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

const supabaseUrl = 'https://uwqimphpkzcjinlucwwl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cWltcGhwa3pjamlubHVjd3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxMzA1ODcsImV4cCI6MjA0ODcwNjU4N30.IA-ZS1tu3FuUdrTioALpWuiJvgkkZRn4qX_ghcW4tXI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Charger l'arbre généalogique au démarrage
window.onload = async function () {
    await loadTree();
};

// Charger et afficher l'arbre généalogique
async function loadTree() {
    try {
        const { data: members, error } = await supabase.from('members').select('*');

        if (error) {
            console.error('Erreur lors du chargement des membres :', error);
            return;
        }

        renderTree(members);
    } catch (error) {
        console.error('Erreur lors du chargement de l\'arbre :', error);
    }
}

function renderTree(members) {
    const treeContainer = document.getElementById('tree-container');
    treeContainer.innerHTML = '';

    // Mapper les membres en un dictionnaire avec leurs enfants
    const memberMap = members.reduce((acc, member) => {
        acc[member.id] = { ...member, children: [] };
        return acc;
    }, {});

    members.forEach(member => {
        if (member.parent_id && memberMap[member.parent_id]) {
            memberMap[member.parent_id].children.push(memberMap[member.id]);
        }
    });

    const rootMember = members.find(member => !member.parent_id); // Trouver la racine
    if (!rootMember) {
        console.error('Aucun membre racine trouvé.');
        return;
    }

    const root = d3.hierarchy(memberMap[rootMember.id], d => d.children);

    const width = 1000;
    const height = 600;

    const svg = d3.select(treeContainer)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const treeLayout = d3.tree().size([width - 200, height - 200]);
    treeLayout(root);

    const g = svg.append('g').attr('transform', 'translate(100, 50)');

    // Dessiner les connexions
    g.selectAll('.link')
        .data(root.links())
        .enter()
        .append('line')
        .classed('link', true)
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
        .style('stroke', '#555')
        .style('stroke-width', 2);

    // Dessiner les nœuds
    const node = g.selectAll('.node')
        .data(root.descendants())
        .enter()
        .append('g')
        .classed('node', true)
        .attr('transform', d => `translate(${d.x},${d.y})`);

    node.append('circle')
        .attr('r', 20)
        .style('fill', d => d.data.sexe === 'femme' ? '#ffb6c1' : '#add8e6')
        .style('stroke', '#333')
        .style('stroke-width', 2);

    node.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', 5)
        .style('font-size', '12px')
        .style('font-family', 'Arial')
        .text(d => `${d.data.prenom} ${d.data.nom}`);

    // Ajouter un bouton de suppression sur chaque nœud
    node.append('text')
        .attr('x', 25)
        .attr('y', 10)
        .style('fill', 'red')
        .style('cursor', 'pointer')
        .text('X')
        .on('click', async function (event, d) {
            await deletePerson(d.data.id);
        });
}

// Ajouter une personne
document.getElementById('addPersonForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const gender = document.getElementById('gender').value;
    const dob = document.getElementById('dob').value;
    const relation = document.getElementById('relation').value;

    const personData = {
        prenom: firstName,
        nom: lastName,
        sexe: gender,
        dob: dob,
        parent_id: null // Par défaut sans parent
    };

    await addPersonWithRelation(personData, relation);
});

// Ajouter une personne avec une relation
async function addPersonWithRelation(personData, relation) {
    try {
        if (relation === 'none') {
            await insertPerson(personData);
        } else {
            const { data: parent, error } = await supabase
                .from('members')
                .select('*')
                .eq('prenom', relation);

            if (error) {
                console.error('Erreur lors de la recherche du parent :', error);
                return;
            }

            if (parent && parent.length > 0) {
                personData.parent_id = parent[0].id;
                await insertPerson(personData);
            } else {
                alert('Relation parentale non trouvée.');
            }
        }
    } catch (error) {
        console.error('Erreur lors de l\'ajout avec relation :', error);
    }
}

// Insérer une personne dans la base de données
async function insertPerson(personData) {
    try {
        const { data, error } = await supabase.from('members').insert([personData]);

        if (error) {
            console.error('Erreur lors de l\'insertion :', error);
            return;
        }

        console.log('Personne ajoutée :', data);
        await loadTree(); // Recharger l’arbre après ajout
    } catch (error) {
        console.error('Erreur lors de l\'insertion :', error);
    }
}

// Supprimer une personne
async function deletePerson(memberId) {
    try {
        const { error } = await supabase.from('members').delete().eq('id', memberId);

        if (error) {
            alert('Erreur lors de la suppression : ' + error.message);
        } else {
            alert('Membre supprimé avec succès.');
            await loadTree(); // Recharger l’arbre après suppression
        }
    } catch (error) {
        console.error('Erreur lors de la suppression :', error);
    }
}

// Afficher le formulaire d'ajout
document.getElementById('addPersonButton').addEventListener('click', function () {
    document.getElementById('form-container').style.display = 'block';
});

// Cacher le formulaire d'ajout
document.getElementById('cancelFormButton').addEventListener('click', function () {
    document.getElementById('form-container').style.display = 'none';
});
