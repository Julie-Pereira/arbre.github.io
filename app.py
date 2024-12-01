from flask import Flask, send_from_directory, jsonify, request
import os

app = Flask(__name__, static_folder='frontend', static_url_path='/frontend')

# Données d'exemple pour l'arbre généalogique
tree_data = {
    'nom': 'Racine',
    'id': 1,
    'enfants': []
}

# Route principale pour afficher index.html
@app.route('/')
def index():
    return send_from_directory(os.getcwd(), 'index.html')

# Route pour récupérer l'arbre sous forme de JSON
@app.route('/get_tree')
def get_tree():
    return jsonify(tree_data)

# Route pour ajouter une personne
@app.route('/add_person', methods=['POST'])
def add_person():
    new_person = request.get_json()
    parent_id = new_person.get('parent_id')

    # Recherche du parent par ID
    def find_parent(node, parent_id):
        if node['id'] == parent_id:
            return node
        for child in node.get('enfants', []):
            found = find_parent(child, parent_id)
            if found:
                return found
        return None

    if parent_id:
        parent_node = find_parent(tree_data, parent_id)
        if parent_node:
            parent_node['enfants'].append({
                'nom': new_person['nom'],
                'id': new_person['id'],
                'enfants': []
            })
            return jsonify({'status': 'success'})
        else:
            return jsonify({'status': 'error', 'message': 'Parent non trouvé'})
    else:
        tree_data['enfants'].append({
            'nom': new_person['nom'],
            'id': new_person['id'],
            'enfants': []
        })
        return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True)
