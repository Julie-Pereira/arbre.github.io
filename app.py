from flask import Flask, send_from_directory, jsonify, request
import os
import json

app = Flask(__name__, static_folder='frontend', static_url_path='/frontend')

# Le chemin vers le fichier JSON contenant l'arbre
ARBRE_FILE = 'frontend/data/arbre.json'

# Route principale pour afficher index.html
@app.route('/')
def index():
    return send_from_directory(os.getcwd(), 'index.html')

# Fonction pour charger l'arbre généalogique depuis le fichier JSON
def load_tree():
    try:
        with open(ARBRE_FILE, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        return {"id": 1, "nom": "Root", "prenom": "Root", "sexe": "homme", "dob": "1900-01-01", "enfants": []}

# Fonction pour enregistrer l'arbre généalogique dans le fichier JSON
def save_tree(tree_data):
    with open(ARBRE_FILE, 'w', encoding='utf-8') as file:
        json.dump(tree_data, file, indent=4, ensure_ascii=False)


# Route pour récupérer l'arbre généalogique
@app.route('/get_tree')
def get_tree():
    tree = load_tree()
    return jsonify(tree)

# Route pour ajouter une personne à l'arbre généalogique
@app.route('/add_person', methods=['POST'])
def add_person():
    data = request.get_json()
    
    # Charger l'arbre existant
    tree = load_tree()

    # Ajouter la nouvelle personne à l'arbre
    new_person = {
        "id": data['id'],
        "nom": data['nom'],
        "prenom": data['prenom'],
        "sexe": data['sexe'],
        "dob": data['dob'],
        "enfants": []
    }

    # Trouver le parent et ajouter la nouvelle personne à ses enfants
    if data['parent_id']:
        parent = find_person_by_id(tree, data['parent_id'])
        if parent:
            parent['enfants'].append(new_person)
        else:
            return jsonify({"status": "error", "message": "Parent non trouvé"})
    else:
        tree['enfants'].append(new_person)

    # Sauvegarder l'arbre mis à jour
    save_tree(tree)
    
    return jsonify({"status": "success", "message": "Personne ajoutée avec succès"})

# Fonction pour trouver une personne par son ID
def find_person_by_id(tree, person_id):
    if tree['id'] == person_id:
        return tree
    for child in tree['enfants']:
        result = find_person_by_id(child, person_id)
        if result:
            return result
    return None

if __name__ == '__main__':
    app.run(debug=True)
