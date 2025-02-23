#!/usr/bin/env python3
import argparse
import sys
import os
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Dict, Any
import logging

# Add the packages directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'packages'))

from biztools_recommender import LlamaBloomRecommender

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RecommenderHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, recommender=None, **kwargs):
        self.recommender = recommender
        super().__init__(*args, **kwargs)

    def _send_response(self, data: Dict[str, Any], status: int = 200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def _read_json(self) -> Dict[str, Any]:
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        return json.loads(body.decode())

    def do_GET(self):
        try:
            if self.path == '/health':
                self._send_response({
                    'status': 'healthy',
                    'version': '0.1.0'
                })
            elif self.path.startswith('/similar-items/'):
                item_id = self.path.split('/')[-1].split('?')[0]
                limit = int(self.path.split('limit=')[-1]) if 'limit=' in self.path else 10
                similar_items = self.recommender.similar_items(item_id, limit)
                self._send_response({'items': similar_items})
            else:
                self._send_response({'error': 'Not found'}, 404)

        except Exception as e:
            logger.error(f"Error processing request: {e}", exc_info=True)
            self._send_response({'error': str(e)}, 500)

    def do_POST(self):
        try:
            if self.path == '/recommendations':
                data = self._read_json()
                recommendations = self.recommender.recommend(
                    data['userId'],
                    data.get('context'),
                    data.get('limit', 10)
                )
                self._send_response({'recommendations': recommendations})
            
            elif self.path == '/items':
                data = self._read_json()
                self.recommender.add_item(
                    data['id'],
                    data['title'],
                    data['description'],
                    data['categories'],
                    data['features']
                )
                self._send_response({'status': 'success'})
            
            elif self.path == '/interactions':
                data = self._read_json()
                self.recommender.add_user_interaction(
                    data['userId'],
                    data['itemId'],
                    data['interactionType'],
                    data['timestamp']
                )
                self._send_response({'status': 'success'})
            
            else:
                self._send_response({'error': 'Not found'}, 404)

        except Exception as e:
            logger.error(f"Error processing request: {e}", exc_info=True)
            self._send_response({'error': str(e)}, 500)

def main():
    parser = argparse.ArgumentParser(description='Start the LLaMA-Bloom recommender service')
    parser.add_argument('--llama-model', required=True, help='Path to LLaMA model')
    parser.add_argument('--cache-size', type=int, default=10000, help='Bloom filter cache size')
    parser.add_argument('--fp-rate', type=float, default=0.01, help='False positive rate')
    parser.add_argument('--host', default='localhost', help='Host to bind to')
    parser.add_argument('--port', type=int, default=8000, help='Port to listen on')
    
    args = parser.parse_args()

    # Initialize recommender
    recommender = LlamaBloomRecommender(
        llama_model_path=args.llama_model,
        cache_size=args.cache_size,
        false_positive_rate=args.fp_rate
    )

    # Create server
    def handler(*handler_args):
        return RecommenderHandler(*handler_args, recommender=recommender)

    server = HTTPServer((args.host, args.port), handler)
    logger.info(f"Recommender initialized and listening on {args.host}:{args.port}")
    print("Recommender initialized") # Signal for startup script
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down recommender service")
        server.server_close()

if __name__ == '__main__':
    main() 