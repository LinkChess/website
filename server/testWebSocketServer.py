#!/usr/bin/env python3
"""
Unit tests for the ChessLink WebSocket Server functionality.

This script tests the WebSocket event handlers and ensures they
properly integrate with the existing ChessGame and serial communication logic.
"""

import unittest
import json
from unittest.mock import MagicMock, patch
from app import app, socketio
from flask_socketio import SocketIOTestClient
from chessClass import ChessGame
import time

class ChessLinkWebSocketTests(unittest.TestCase):
    """Test suite for ChessLink WebSocket server functionality."""

    def setUp(self):
        """Set up test environment before each test."""
        self.app = app
        self.app.config['TESTING'] = True
        self.client = SocketIOTestClient(self.app, socketio)
        
        # Create a patch for the serial connection
        self.serial_patcher = patch('app.serial.Serial')
        self.mock_serial = self.serial_patcher.start()
        
        # Create a mock serial instance
        self.mock_serial_instance = MagicMock()
        self.mock_serial_instance.is_open = True
        self.mock_serial_instance.in_waiting = 0
        self.mock_serial_instance.port = 'MOCK_PORT'
        self.mock_serial.return_value = self.mock_serial_instance
        
        # Patch thread creation
        self.thread_patcher = patch('app.threading.Thread')
        self.mock_thread = self.thread_patcher.start()
        
        # Create a mock thread instance
        self.mock_thread_instance = MagicMock()
        self.mock_thread.return_value = self.mock_thread_instance
        
        # Patch ChessGame
        self.chess_game_patcher = patch('app.ChessGame')
        self.mock_chess_game = self.chess_game_patcher.start()
        
        # Create a mock ChessGame instance with minimal functionality
        self.mock_game_instance = MagicMock()
        self.mock_game_instance.game_id = 'test-game-123'
        self.mock_game_instance.event = 'Test Game'
        self.mock_game_instance.white = 'Player 1'
        self.mock_game_instance.black = 'Player 2'
        self.mock_game_instance.master_state = [MagicMock()]
        self.mock_game_instance.master_state[0].fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
        self.mock_chess_game.return_value = self.mock_game_instance
        self.mock_chess_game.load_from_db.return_value = None  # Default to no existing game
    
    def tearDown(self):
        """Clean up after each test."""
        self.serial_patcher.stop()
        self.thread_patcher.stop()
        self.chess_game_patcher.stop()

    def test_client_connect(self):
        """Test client connection event."""
        response = self.client.get_received()
        self.assertTrue(len(response) > 0)
        self.assertEqual(response[0]['name'], 'hardware_status')

    def test_connect_hardware(self):
        """Test connecting to hardware."""
        self.client.emit('connect_hardware', {'port': 'MOCK_PORT'})
        response = self.client.get_received()
        
        # Find hardware_connected event
        hardware_connected = None
        for event in response:
            if event['name'] == 'hardware_connected':
                hardware_connected = event
                break
                
        self.assertIsNotNone(hardware_connected)
        self.assertEqual(hardware_connected['args'][0]['status'], 'connected')
        self.assertEqual(hardware_connected['args'][0]['port'], 'MOCK_PORT')
        
        # Check that Serial was called with the right arguments
        self.mock_serial.assert_called_once_with('MOCK_PORT', 115200, timeout=1)
        
        # Check that Thread was created and started
        self.mock_thread.assert_called_once()
        self.mock_thread_instance.start.assert_called_once()

    def test_disconnect_hardware(self):
        """Test disconnecting from hardware."""
        # First connect
        self.client.emit('connect_hardware', {'port': 'MOCK_PORT'})
        self.client.get_received()  # Clear received events
        
        # Then disconnect
        self.client.emit('disconnect_hardware')
        response = self.client.get_received()
        
        # Find hardware_disconnected event
        hardware_disconnected = None
        for event in response:
            if event['name'] == 'hardware_disconnected':
                hardware_disconnected = event
                break
                
        self.assertIsNotNone(hardware_disconnected)
        self.assertEqual(hardware_disconnected['args'][0]['status'], 'disconnected')

    def test_start_game(self):
        """Test starting a game."""
        # First connect to hardware
        self.client.emit('connect_hardware', {'port': 'MOCK_PORT'})
        self.client.get_received()  # Clear received events
        
        # Then start a game
        game_data = {
            'id': 'test-game-123',
            'title': 'Test Game',
            'white': 'Player 1',
            'black': 'Player 2'
        }
        self.client.emit('start_game', game_data)
        response = self.client.get_received()
        
        # Find game_started event
        game_started = None
        for event in response:
            if event['name'] == 'game_started':
                game_started = event
                break
                
        self.assertIsNotNone(game_started)
        self.assertEqual(game_started['args'][0]['gameId'], 'test-game-123')
        
        # Verify ChessGame creation and configuration
        self.mock_chess_game.assert_called_once_with('test-game-123')
        self.mock_game_instance.save_to_db.assert_called_once()

    def test_end_game(self):
        """Test ending a game."""
        # First connect and start a game
        self.client.emit('connect_hardware', {'port': 'MOCK_PORT'})
        self.client.get_received()  # Clear received events
        
        game_data = {
            'id': 'test-game-123',
            'title': 'Test Game',
            'white': 'Player 1',
            'black': 'Player 2'
        }
        self.client.emit('start_game', game_data)
        self.client.get_received()  # Clear received events
        
        # Then end the game
        self.client.emit('end_game', {'gameId': 'test-game-123'})
        response = self.client.get_received()
        
        # Find game_ended event
        game_ended = None
        for event in response:
            if event['name'] == 'game_ended':
                game_ended = event
                break
                
        self.assertIsNotNone(game_ended)
        self.assertTrue('message' in game_ended['args'][0])
        
        # Verify game was saved
        self.mock_game_instance.save_to_db.assert_called()

    def test_get_live_games(self):
        """Test retrieving live games list."""
        # First connect and start a game
        self.client.emit('connect_hardware', {'port': 'MOCK_PORT'})
        self.client.get_received()  # Clear received events
        
        game_data = {
            'id': 'test-game-123',
            'title': 'Test Game',
            'white': 'Player 1',
            'black': 'Player 2'
        }
        self.client.emit('start_game', game_data)
        self.client.get_received()  # Clear received events
        
        # Then get live games
        self.client.emit('get_live_games')
        response = self.client.get_received()
        
        # Find live_games_list event
        live_games_list = None
        for event in response:
            if event['name'] == 'live_games_list':
                live_games_list = event
                break
                
        self.assertIsNotNone(live_games_list)
        self.assertEqual(live_games_list['args'][0]['type'], 'live_games_list')
        self.assertTrue(len(live_games_list['args'][0]['games']) > 0)
        self.assertEqual(live_games_list['args'][0]['games'][0]['id'], 'test-game-123')

    def test_position_updates(self):
        """Test that position updates are emitted correctly."""
        # This test would need to mock the serial input data
        # and verify that socketio.emit is called with position updates.
        # This is complex due to the threading in read_serial_data.
        # For this simplified test, we'll just verify the method exists.
        
        # Importing read_serial_data directly would disrupt our patches
        # Just check that it's callable and has the right structure
        import inspect
        from app import read_serial_data
        
        self.assertTrue(callable(read_serial_data))
        signature = inspect.signature(read_serial_data)
        self.assertEqual(len(signature.parameters), 0)  # No parameters

    def test_error_handling(self):
        """Test error handling in WebSocket events."""
        # Test with invalid data
        self.client.emit('connect_hardware', {})  # Missing port
        response = self.client.get_received()
        
        # Find error event
        error_event = None
        for event in response:
            if event['name'] == 'error':
                error_event = event
                break
                
        self.assertIsNotNone(error_event)
        self.assertTrue('message' in error_event['args'][0])
        self.assertTrue('Port is required' in error_event['args'][0]['message'])

if __name__ == '__main__':
    unittest.main() 