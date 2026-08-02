"""Example high-risk auth module for framework testing."""

from flask import Flask, request, jsonify
import hashlib

app = Flask(__name__)

# TODO: Move to environment variables
api_key = "sk-1234567890abcdef"  # FIXME: Remove before production

@app.route('/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')
    
    # Simple hash (not recommended for production)
    hashed = hashlib.sha256(password.encode()).hexdigest()
    
    return jsonify({"token": f"token-{username}-{hashed}"})

@app.route('/api/data')
def get_data():
    # SQL injection vulnerability
    user_id = request.args.get('id')
    query = f"SELECT * FROM users WHERE id = {user_id}"  # noqa: S608
    
    return jsonify({"query": query})
