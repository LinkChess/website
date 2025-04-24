#!/usr/bin/env python
"""
Simple SocketIO client for testing the Flask-SocketIO server
"""

import socketio
import time

# Create a SocketIO client
sio = socketio.Client()

# Define event handlers
@sio.event
def connect():
    print("Connected to the server!")

@sio.event
def disconnect():
    print("Disconnected from the server!")

@sio.on('status')
def on_status(data):
    print(f"Received status: {data}")

@sio.on('response')
def on_response(data):
    print(f"Received response: {data}")

@sio.on('pong')
def on_pong(data):
    print(f"Received pong: {data}")

def main():
    print("SocketIO Test Client")
    print("Connecting to server...")
    
    try:
        # Connect to the server
        sio.connect('http://localhost:8765')
        
        # Send a test message
        print("Sending test message...")
        sio.emit('message', {'data': 'Hello Server!'})
        
        # Send a ping
        print("Sending ping...")
        sio.emit('ping', {'data': 'Ping!'})
        
        # Wait for responses
        print("Waiting for responses...")
        time.sleep(2)
        
        # Disconnect
        print("Disconnecting...")
        sio.disconnect()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main() 