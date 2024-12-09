import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

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
        const { data, error } = await supabase.from('members').select('*');

        if (error) {
            console.error("Erreur lors du chargement des membres :", error);
        } else {
            renderTree(data);
        }
    } catch (error) {
        console.error("Erreur lors du chargement de l'arbre :", error);
    }
}

function renderTree(members) {
    const treeContainer = document.getElementById('tree-container');
    treeContainer.innerHTML = '';

    const memberMap = members.reduce((acc, member) => {
        acc[member.id] = { ...member, children: [] };
        return acc;
    }, {});

    members.forEach(member => {
        if (member.parent_id) {
            const parent = memberMap[member.parent_id];
            if (parent) {
                parent.children.push(memberMap[member.id]);
            }
        }
    });

    const centralNode = members[0];
    if (!centralNode) {
        console.error("Aucun membre pour définir le nœud central.");
        return;
    }

    const root = {
        ...centralNode,
        children: members.filter(m => m.parent_id === centralNode.id).map(m => memberMap[m.id]),
    };

    const width = 1000;
    const height = 600;

    const svg = d3.select(treeContainer)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const treeLayout = d3.tree().size([width - 200, height - 200]);
    const hierarchyData = d3.hierarchy(root, d => d.children);

    treeLayout(hierarchyData);

    const g = svg.append('g').attr('transform', 'translate(100, 100)');

    g.selectAll('.link')
        .data(hierarchyData.links())
        .enter()
        .append('line')
        .classed('link', true)
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
        .style('stroke', '#555')
        .style('stroke-width', 2);

    const node = g.selectAll('.node')
        .data(hierarchyData.descendants())
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
}



// Fonction pour supprimer un membre
async function deletePerson(memberId) {
    try {
        const { error } = await supabase.from('members').delete().eq('id', memberId);

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

async function addAncestors(personData, depth = 3) {
    /**
     * Fonction pour ajouter dynamiquement parents, leurs frères/sœurs, 
     * et remonter dans l'arbre généalogique jusqu'à une profondeur définie.
     */
    let currentPerson = personData;
    let currentDepth = 0;

    while (currentDepth < depth) {
        try {
            // Ajouter le membre actuel
            const { data, error } = await supabase
                .from('members')
                .insert([{ prenom: currentPerson.prenom, nom: currentPerson.nom, sexe: currentPerson.sexe, dob: currentPerson.dob }]);

            if (error) {
                console.error("Erreur d'ajout dans la base de données", error);
                break;
            }

            const personId = data[0].id;

            // Ajouter les parents de la personne
            const parents = [
                { prenom: "Père", nom: `${currentPerson.nom}_p`, sexe: "homme", dob: "1940-01-01", parent_id: personId },
                { prenom: "Mère", nom: `${currentPerson.nom}_m`, sexe: "femme", dob: "1942-02-15", parent_id: personId }
            ];

            const { data: addedParents, error: parentError } = await supabase
                .from('members')
                .insert(parents);

            if (parentError) {
                console.error("Erreur lors de l'ajout des parents", parentError);
                break;
            }

            const fatherId = addedParents[0].id;
            const motherId = addedParents[1].id;

            // Ajouter leurs frères et sœurs dynamiquement
            const siblings = [
                { prenom: "Oncle", nom: `${currentPerson.nom}_oncle`, sexe: "homme", dob: "1938-09-01", parent_id: fatherId },
                { prenom: "Tante", nom: `${currentPerson.nom}_tante`, sexe: "femme", dob: "1944-11-05", parent_id: motherId }
            ];

            const { error: siblingsError } = await supabase
                .from('members')
                .insert(siblings);

            if (siblingsError) {
                console.error("Erreur lors de l'ajout de frères/sœurs", siblingsError);
                break;
            }

            // Mettre à jour la personne actuelle pour remonter dans l'arbre
            currentPerson.parent_id = personId;
            currentDepth++;
        } catch (error) {
            console.error("Erreur inattendue lors de la logique dynamique", error);
            break;
        }
    }

    await loadTree();
}


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
        relation: relation, // Ajout de la relation
        parent_id: null
    };

    await addPersonWithRelation(personData);
});

async function addPersonWithRelation(personData) {
    try {
        if (personData.relation === 'none') {
            // Si aucune relation spécifiée, ajoute juste la personne comme une nouvelle entrée
            await insertPerson(personData);
        } else {
            // Sinon, établissez une relation appropriée
            const { data: parents, error } = await supabase
                .from('members')
                .select('*')
                .eq('relation', personData.relation); // Trouver la personne liée par la relation

            if (error) {
                console.error('Erreur lors de la recherche du parent : ', error);
                return;
            }

            const parent = parents[0];

            if (parent) {
                personData.parent_id = parent.id;
                await insertPerson(personData);
            } else {
                console.error('Aucun membre correspondant à la relation spécifiée');
            }
        }
    } catch (error) {
        console.error('Erreur inattendue : ', error);
    }
}

async function insertPerson(personData) {
    const { data, error } = await supabase
        .from('members')
        .insert([personData]);

    if (error) {
        console.error('Erreur lors de l\'insertion dans la base de données : ', error);
    } else {
        console.log('Personne ajoutée avec succès : ', data);
        await loadTree();
    }
}

// Afficher le formulaire d'ajout
document.getElementById('addPersonButton').addEventListener('click', function () {
    document.getElementById('form-container').style.display = 'block';
});
