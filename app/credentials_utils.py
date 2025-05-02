import json
import os
import hashlib
import secrets  # для генерації солі

CREDENTIALS_FILE = 'employee_credentials.json'

def load_credentials():
    if not os.path.exists(CREDENTIALS_FILE):
        return {}
    with open(CREDENTIALS_FILE, 'r') as file:
        return json.load(file)

def save_credentials(credentials):
    with open(CREDENTIALS_FILE, 'w') as file:
        json.dump(credentials, file, indent=2)

def hash_password(password, salt):
    # Створюємо хеш на основі пароля + солі
    return hashlib.sha256((salt + password).encode('utf-8')).hexdigest()

def auto_generate_credentials(employees):
    credentials = {}
    for emp in employees:
        role = emp['empl_role'].lower()
        user_id = emp['id_employee']
        login = f"{role}{user_id}"
        raw_password = login  # простий пароль такий самий як логін
        salt = secrets.token_hex(8)  # генеруємо 16-символьну сіль
        hashed_password = hash_password(raw_password, salt)
        credentials[str(user_id)] = {
            "login": login,
            "salt": salt,
            "password_hash": hashed_password,
            "role": role
        }
    save_credentials(credentials)

def check_password(input_password, stored_hash, salt):
    return hash_password(input_password, salt) == stored_hash

def delete_credentials(user_id):
    credentials = load_credentials()
    if str(user_id) in credentials:
        del credentials[str(user_id)]
        save_credentials(credentials)
        print(f"Credentials for user {user_id} deleted.")
    else:
        print(f"No credentials found for user {user_id}.")

