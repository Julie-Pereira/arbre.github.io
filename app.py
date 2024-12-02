from flask import Flask, send_from_directory, jsonify, request
from supabase import create_client, Client
import os
import json
from flask_cors import CORS  # Import de CORS

app = Flask(__name__, static_folder='frontend', static_url_path='/frontend')
CORS(app)  # Active CORS pour toutes les routes

# Configuration Supabase
SUPABASE_URL = 'https://uwqimphpkzcjinlucwwl.supabase.co' # URL locale
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cWltcGhwa3pjamlubHVjd3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxMzA1ODcsImV4cCI6MjA0ODcwNjU4N30.IA-ZS1tu3FuUdrTioALpWuiJvgkkZRn4qX_ghcW4tXI"          # Clé anon générée par Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Route principale pour afficher index.html
@app.route('/')
def index():
    return send_from_directory(os.getcwd(), 'index.html')

# # Fonction pour charger l'arbre généalogique depuis le fichier JSON
# def load_tree():
#     try:
#         with open(ARBRE_FILE, 'r', encoding='utf-8') as file:
#             return json.load(file)
#     except FileNotFoundError:
#         return {"id": 1, "nom": "Root", "prenom": "Root", "sexe": "homme", "dob": "1900-01-01", "enfants": []}

# # Fonction pour enregistrer l'arbre généalogique dans le fichier JSON
# def save_tree(tree_data):
#     with open(ARBRE_FILE, 'w', encoding='utf-8') as file:
#         json.dump(tree_data, file, indent=4, ensure_ascii=False)


# Route pour récupérer l'arbre généalogique
@app.route('/get_tree', methods=['GET'])
def get_tree():
    response = supabase.table('members').select('*').execute()
    
    if response.status_code != 200:
        return jsonify({"status": "error", "message": f"Erreur {response.status_code}: {response.data}"}), 500
    
    members = response.data
    tree = build_tree(members)
    return jsonify(tree)

# Fonction pour construire l'arbre généalogique
def build_tree(members):
    member_map = {member['id']: member for member in members}
    root = []

    for member in members:
        member['enfants'] = []
        if member['parent_id']:
            parent = member_map.get(member['parent_id'])
            if parent:
                parent['enfants'].append(member)
        else:
            root.append(member)

    return root

# Route pour ajouter une personne
@app.route('/add_person', methods=['POST'])
def add_person():
    data = request.get_json()

    if not data or not all(k in data for k in ['nom', 'prenom', 'sexe', 'dob']):
        return jsonify({"status": "error", "message": "Données manquantes ou invalides"}), 400

    response = supabase.table('members').insert({
        "nom": data['nom'],
        "prenom": data['prenom'],
        "sexe": data['sexe'],
        "dob": data['dob'],
        "parent_id": data.get('parent_id', None)  # Peut être null
    }).execute()

    if response.error:
        return jsonify({"status": "error", "message": response.error.message}), 500

    return jsonify({"status": "success", "new_person": response.data[0]})

if __name__ == '__main__':
    app.run(debug=True)