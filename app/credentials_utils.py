import json
import os

CREDENTIALS_FILE = 'employee_credentials.json'

def load_credentials():
    if not os.path.exists(CREDENTIALS_FILE):
        return {}
    with open(CREDENTIALS_FILE, 'r') as file:
        return json.load(file)

def save_credentials(credentials):
    with open(CREDENTIALS_FILE, 'w') as file:
        json.dump(credentials, file, indent=2)

def auto_generate_credentials(employees):
    credentials = {}
    for emp in employees:
        role = emp['empl_role'].lower()
        user_id = emp['id_employee']
        login = f"{role}{user_id}"
        password = login  # пароль такий самий як логін
        credentials[str(user_id)] = {
            "login": login,
            "password": password,
            "role": role  # ✅ додано role
        }
    save_credentials(credentials)
