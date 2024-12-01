from flask import Flask, send_from_directory, jsonify, request
import os
import json

app = Flask(
    __name__,
    static_folder="frontend/static",  # Fichiers CSS, JS, images
    template_folder="frontend"        # Fichiers HTML
)

# Fichier JSON pour sauvegarder les données
DATA_FILE = os.path.join("frontend", "data", "arbre.json")

# Charger les données de l'arbre
def load_data():
    try:
        with open(DATA_FILE, "r") as file:
            return json.load(file)
    except FileNotFoundError:
        return {"id": 1, "nom": "Racine", "enfants": []}

# Sauvegarder les données de l'arbre
def save_data(data):
    with open(DATA_FILE, "w") as file:
        json.dump(data, file, indent=4)

@app.route("/")
def index():
    return send_from_directory(app.template_folder, "index.html")

@app.route("/get_tree", methods=["GET"])
def get_tree():
    arbre = load_data()
    return jsonify(arbre)

@app.route("/add_person", methods=["POST"])
def add_person():
    data = request.json
    arbre = load_data()
    parent_id = data.get("parent_id")
    new_person = {
        "id": data.get("id"),
        "nom": data.get("nom"),
        "enfants": []
    }

    # Fonction récursive pour ajouter un enfant
    def add_child(node, new_person):
        if node["id"] == parent_id:
            node["enfants"].append(new_person)
            return True
        for enfant in node["enfants"]:
            if add_child(enfant, new_person):
                return True
        return False

    if parent_id:
        success = add_child(arbre, new_person)
        if not success:
            return jsonify({"status": "error", "message": "Parent introuvable"}), 400
    else:
        arbre["enfants"].append(new_person)

    save_data(arbre)
    return jsonify({"status": "success", "arbre": arbre})

if __name__ == "__main__":
    app.run(debug=True)
