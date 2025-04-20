# This file now simply imports and runs the server from server.py
from app.server import app

if __name__ == "__main__":
    app.run(debug=True)