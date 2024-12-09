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
        if (member.parent_id && memberMap[member.parent_id]) {
            memberMap[member.parent_id].children.push(memberMap[member.id]);
        }
    });

    const root = members.filter(member => !member.parent_id).map(member => memberMap[member.id])[0];

    const width = 1000;
    const height = 600;

    const svg = d3.select(treeContainer)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const defs = svg.append('defs');

    defs.append('filter')
        .attr('id', 'shadow')
        .append('feDropShadow')
        .attr('dx', 2)
        .attr('dy', 2)
        .attr('stdDeviation', 3)
        .attr('flood-color', '#555');

    const treeLayout = d3.tree().size([width - 200, height - 200]);
    const hierarchyData = d3.hierarchy(root, d => d.children);

    treeLayout(hierarchyData);

    const g = svg.append('g').attr('transform', 'translate(100,100)');

    // Dessiner les liens
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
        .style('stroke-width', 3);

    const node = g.selectAll('.node')
        .data(hierarchyData.descendants())
        .enter()
        .append('g')
        .classed('node', true)
        .attr('transform', d => `translate(${d.x},${d.y})`);

    // Calculer la largeur maximale pour adapter la taille du cercle
    node.each(function (d) {
        const lines = [
            `ID: ${d.data.id}`,
            `${d.data.prenom} ${d.data.nom}`,
            `${d.data.dob}`
        ];

        // Crée temporairement un élément texte pour mesurer la largeur
        const textWidths = lines.map(line => {
            const tempText = d3.select(this)
                .append('text')
                .style('font-size', '12px')
                .style('font-family', 'Arial')
                .text(line);

            const width = tempText.node().getBBox().width; // Obtenir la largeur
            tempText.remove(); // Nettoyer après mesure
            return width;
        });

        // Déterminer la largeur maximale du texte
        d.maxTextWidth = Math.max(...textWidths);
    });

    // Dessiner les cercles dynamiques
    node.append('circle')
    .attr('r', d => {
        // Largeur maximale du texte
        const padding = 15; // Marge supplémentaire pour éviter les débordements
        return Math.max(50, d.maxTextWidth / 2 + padding); // Rayon dynamique
    })
        .style('fill', d => d.data.sexe === 'femme' ? '#ffb6c1' : '#add8e6')
        .style('stroke', '#333')
        .style('stroke-width', 2)
        .style('filter', 'url(#shadow)');


    // Texte à l'intérieur des cercles (centré dynamiquement)
    node.append('text')
        .attr('text-anchor', 'middle') // Centrer horizontalement
        .style('font-size', '12px')
        .style('font-family', 'Arial')
        .selectAll('tspan')
        .data(d => {
            // Définir les lignes de texte
            return [
                `ID: ${d.data.id}`,                // Ligne 1 : ID
                `${d.data.prenom} ${d.data.nom}`,  // Ligne 2 : Nom/Prénom
                `${d.data.dob}`                    // Ligne 3 : Date de naissance
            ];
        })
        .enter()
        .append('tspan')
        .attr('x', 0) // Centrer chaque ligne horizontalement
        .attr('dy', (d, i, nodes) => {
            // Calculer l'espacement vertical
            const lineHeight = 1.2; // Espacement entre les lignes en em
            const offset = (nodes.length - 1) / 2; // Décalage pour centrer verticalement
            return `${(i - offset) * lineHeight}em`; // Ajustement dynamique des lignes
        })
        .text(d => d); // Ajouter le texte

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

// Gestion du formulaire d'ajout
document.getElementById('addPersonForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const gender = document.getElementById('gender').value;
    const dob = document.getElementById('dob').value;
    const parentId = document.getElementById('parent-id').value || null;

    try {
        await supabase.from('members').insert([
            {
                prenom: firstName,
                nom: lastName,
                sexe: gender,
                dob: dob,
                parent_id: parentId ? parseInt(parentId) : null,
            }
        ]);

        alert("Personne ajoutée avec succès !");
        await loadTree(); // Recharge l’arbre après ajout
    } catch (error) {
        console.error("Erreur lors de l'ajout :", error);
    }
});

// Afficher le formulaire d'ajout
document.getElementById('addPersonButton').addEventListener('click', function () {
    document.getElementById('form-container').style.display = 'block';
});
