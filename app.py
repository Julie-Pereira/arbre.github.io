from flask import Flask, render_template, request, jsonify
import json

app = Flask(__name__)

# Fichier JSON pour sauvegarder les données
DATA_FILE = 'data/arbre.json'

# Charger les données de l'arbre
def load_data():
    try:
        with open(DATA_FILE, 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        return {"nom": "Racine", "enfants": []}  # Arbre vide par défaut

# Sauvegarder les données de l'arbre
def save_data(data):
    with open(DATA_FILE, 'w') as file:
        json.dump(data, file, indent=4)

@app.route('/')
def index():
    arbre = load_data()
    return render_template('index.html', arbre=arbre)

@app.route('/add_person', methods=['POST'])
def add_person():
    data = request.json
    arbre = load_data()
    parent_id = data.get('parent_id')
    new_person = {
        "id": data.get('id'),
        "nom": data.get('nom'),
        "enfants": []
    }

    def add_child(parent, new_person):
        if parent['id'] == parent_id:
            parent['enfants'].append(new_person)
            return True
        for enfant in parent['enfants']:
            if add_child(enfant, new_person):
                return True
        return False

    if parent_id:
        add_child(arbre, new_person)
    else:
        arbre['enfants'].append(new_person)

    save_data(arbre)
    return jsonify({"status": "success", "arbre": arbre})

if __name__ == '__main__':
    app.run(debug=True)
