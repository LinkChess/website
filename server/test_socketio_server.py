#!/usr/bin/env python
"""
Simple Flask-SocketIO server for testing WebSocket functionality
"""

from flask import Flask
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('connect')
def handle_connect():
    print("Client connected!")
    emit('status', {'message': 'Connected to the server!'})

@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected!")

@socketio.on('message')
def handle_message(data):
    print(f"Received message: {data}")
    emit('response', {'message': 'Message received!'})

@socketio.on('ping')
def handle_ping(data):
    print(f"Received ping: {data}")
    emit('pong', {'message': 'Pong!'})

@app.route('/')
def index():
    return "SocketIO Test Server"

if __name__ == '__main__':
    print("Starting simple Flask-SocketIO server on port 8765...")
    socketio.run(app, host='127.0.0.1', port=8765, debug=True, allow_unsafe_werkzeug=True) 