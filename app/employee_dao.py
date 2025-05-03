from sql_connection import execute_query, get_sql_connection
from datetime import datetime
from credentials_utils import auto_generate_credentials, load_credentials, save_credentials, hash_password, delete_credentials
import secrets
import re



def insert_new_employee(connection, employee):
    validate_employee(employee)

    query = """
        INSERT INTO employee (
            id_employee, empl_surname, empl_name, empl_patronymic,
            empl_role, salary, date_of_birth, date_of_start,
            phone_number, city, street, zip_code
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
    """
    data = (
        employee['id_employee'],
        employee['empl_surname'],
        employee['empl_name'],
        employee['empl_patronymic'],
        employee['empl_role'],
        employee['salary'],
        employee['date_of_birth'],
        employee['date_of_start'],
        employee['phone_number'],
        employee['city'],
        employee['street'],
        employee['zip_code']
    )

    try:
        result = execute_query(connection, query, data)
        # Автоматичне створення облікових даних
        role = employee['empl_role'].lower()
        login = f"{role}{employee['id_employee']}"
        raw_password = login
        salt = secrets.token_hex(8)
        hashed_password = hash_password(raw_password, salt)

        creds = load_credentials()
        creds[str(employee['id_employee'])] = {
            "login": login,
            "password_hash": hashed_password,
            "salt": salt,
            "role": role
        }
        save_credentials(creds)
        return result
    except Exception as e:
        print(f"Помилка додавання працівника: {e}")
        raise


def update_employee(connection, employee):
    # Перевірка наявності id_employee
    validate_employee(employee)
    if not employee['id_employee']:
        raise ValueError("id_employee обов'язковий для оновлення")

    query = """
        UPDATE employee SET
            empl_surname = %s,
            empl_name = %s,
            empl_patronymic = %s,
            empl_role = %s,
            salary = %s,
            date_of_birth = %s,
            date_of_start = %s,
            phone_number = %s,
            city = %s,
            street = %s,
            zip_code = %s
        WHERE id_employee = %s;
    """
    data = (
        employee['empl_surname'],
        employee['empl_name'],
        employee['empl_patronymic'],
        employee['empl_role'],
        employee['salary'],
        employee['date_of_birth'],
        employee['date_of_start'],
        employee['phone_number'],
        employee['city'],
        employee['street'],
        employee['zip_code'],
        employee['id_employee']
    )

    try:
        result = execute_query(connection, query, data)
        # Оновлення облікових даних після зміни ролі або ідентифікатора
        role = employee['empl_role'].lower()
        login = f"{role}{employee['id_employee']}"
        raw_password = login
        salt = secrets.token_hex()
        hashed_password = hash_password(raw_password, salt)

        creds = load_credentials()
        creds[str(employee['id_employee'])] = {
            "login": login,
            "password_hash": hashed_password,
            "salt": salt,
            "role": role
        }
        save_credentials(creds)

        return result
    except Exception as e:
        print(f"Помилка оновлення працівника: {e}")
        raise


def delete_employee(connection, employee_id):
    query = "DELETE FROM employee WHERE id_employee = %s;"
    try:
        result = execute_query(connection, query, (employee_id,))
        delete_credentials(employee_id)
        return result
    except Exception as e:
        print(f"Помилка видалення працівника: {e}")
        raise


def get_contact_by_surname(connection, surname):
    query = """
        SELECT phone_number, city, street, zip_code
        FROM employee
        WHERE empl_surname = %s;
    """

    try:
        result = execute_query(connection, query, (surname,))
        if result and len(result) > 0:
            return result[0]
        else:
            return None
    except Exception as e:
        print(f"Помилка отримання контакту за прізвищем: {e}")
        raise


def get_all_employees_ordered_by_surname(connection):
    query = """
        SELECT id_employee, empl_surname, empl_name, empl_patronymic,
               empl_role, salary, date_of_birth, date_of_start,
               phone_number, city, street, zip_code
        FROM employee
        ORDER BY empl_surname;
    """

    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Помилка отримання списку працівників: {e}")
        raise


def get_cashiers_ordered_by_surname(connection):
    query = """
        SELECT id_employee, empl_surname, empl_name, empl_patronymic,
               empl_role, salary, date_of_birth, date_of_start,
               phone_number, city, street, zip_code
        FROM employee
        WHERE empl_role = 'Cashier'
        ORDER BY empl_surname;
    """

    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Помилка отримання списку касирів: {e}")
        raise


def get_all_employees(connection):
    query = "SELECT * FROM employee;"

    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Помилка отримання всіх працівників: {e}")
        raise


def validate_employee(employee):
    errors = []
    # Обов’язкові поля
    required_fields = [
        'id_employee', 'empl_surname', 'empl_name', 'empl_role',
        'salary', 'date_of_birth', 'date_of_start', 'phone_number',
        'city', 'street', 'zip_code'
    ]
    for field in required_fields:
        if not employee.get(field):
            errors.append(f"Field '{field}' is required.")

    try:
        name = employee['empl_name']
        if not name:
            errors.append("Name is required.")
        elif len(name) > 50:
            errors.append("Name must not exceed 50 characters.")
        elif not all(char.isalpha() or char in "'-" for char in name):
            errors.append("Name must contain only letters, apostrophes, or hyphens.")
        else:
            if not re.fullmatch(r"[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*(?:-[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)*(?:'[A-Za-zА-Яа-яіїєґ]*)?", name):
                errors.append(
                    "Name must start with a capital letter, and after any hyphen, the next part must start with a capital letter.")
    except Exception:
        errors.append("Invalid empl_name format.")

    # Перевірка прізвища — перша літера велика, інші малі, тільки літери
    try:
        surname = employee['empl_surname']
        if not surname:
            errors.append("Surname is required.")
        elif len(surname) > 50:
            errors.append("Surname must not exceed 50 characters.")
        elif not all(char.isalpha() or char in "'-" for char in surname):
            errors.append("Surname must contain only letters, apostrophes, or hyphens.")
        else:
            # Перевірка: перша літера велика, решта малі, після дефіса перша велика
            if not re.fullmatch(r"[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*(?:-[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)*(?:'[A-Za-zА-Яа-яіїєґ]*)?", surname):
                errors.append(
                    "Surname must start with a capital letter, and after any hyphen, the next part must start with a capital letter.")
    except Exception:
        errors.append("Invalid empl_surname format.")

    # Перевірка по-батькові — перша літера велика, інші малі, тільки літери
    try:
        patronymic = employee.get('empl_patronymic', '')
        if patronymic:  # Перевірка, чи не порожнє поле
            if len(patronymic) > 50:
                errors.append("Patronymic must not exceed 50 characters.")
            elif not all(char.isalpha() or char in "'-" for char in patronymic):
                errors.append("Patronymic must contain only letters, apostrophes, or hyphens.")
            else:
                # Перевірка: перша літера велика, решта малі, після дефіса перша велика
                if not re.fullmatch(r"[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*(?:-[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)*(?:'[A-Za-zА-Яа-яіїєґ]*)?", patronymic):
                    errors.append(
                        "Patronymic must start with a capital letter, and after any hyphen, the next part must start with a capital letter.")
    except Exception:
        errors.append("Invalid empl_patronymic format.")

    # Перевірка міста — перша літера велика, інші малі, тільки літери
    try:
        city = employee['city']
        if not city:
            errors.append("City is required.")
        elif len(city) > 50:
            errors.append("City must not exceed 50 characters.")
        elif not all(char.isalpha() or char in "'-" for char in city):
            errors.append("City must contain only letters, apostrophes, or hyphens.")
        else:
            # Перевірка: перша літера велика, решта малі, після дефіса перша велика
            if not re.fullmatch(r"[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*(?:-[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)?", city):
                errors.append(
                    "City must start with a capital letter, and after any hyphen, the next part must start with a capital letter.")
    except Exception:
        errors.append("Invalid city format.")

    # Перевірка zip_code — 5 цифр, тільки цифри
    try:
        zipcode = employee['zip_code']
        if not zipcode:
            errors.append("Zip Code is required.")
        if len(zipcode) != 5:
            errors.append("Zip Code must be exactly 5 characters long.")
        elif not zipcode.isdigit():
            errors.append("Zip Code must contain only digits.")
    except Exception:
        errors.append("Invalid zip code format.")

    try:
        street = employee['street']
        if not street:
            errors.append("Street is required.")
        else:
            pattern = r"^([A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)([-\s][A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)*,\s\d{1,3}[A-ZА-ЯІЇЄҐ]?$"
            if not re.match(pattern, street):
                errors.append(
                    "Street must have each word starting with an uppercase letter, if hyphen is used, the next letter should also be uppercase, followed by a comma and a number (up to three digits).")
    except Exception:
        errors.append("Invalid street format.")

    # Перевірка дати народження — обов’язково вказана, не молодше 18, не старше 135, не в майбутньому
    try:
        birthdate = employee.get('date_of_birth')
        if not birthdate:
            errors.append("Date of birth is required.")
        else:
            birth_date = datetime.strptime(birthdate, '%Y-%m-%d')
            today = datetime.today()

            # Перевірка, чи дата народження в майбутньому
            if birth_date > today:
                errors.append("Date of birth cannot be in the future.")
            else:
                age = (today - birth_date).days // 365
                if age < 18:
                    errors.append("Employee must be at least 18 years old.")
                elif age > 135:
                    errors.append("Employee must be no older than 135 years old.")
    except Exception:
        errors.append("Invalid date_of_birth format (expected YYYY-MM-DD).")

    # Перевірка зарплати — обов'язково вказана, числова і не від’ємна
    try:
        salary_raw = employee['salary']
        if salary_raw is None or salary_raw == '':
            errors.append("Salary is required.")
        else:
            salary = float(salary_raw)
            if salary < 0:
                errors.append("Salary must be non-negative.")
    except Exception:
        errors.append("Invalid salary format.")

    # Телефон — строго 13 символів: + і 12 цифр
    phone = employee.get('phone_number', '')
    if not re.fullmatch(r'\+\d{12}', phone):
        errors.append("Phone number must be in format +XXXXXXXXXXXX (12 digits).")

    if errors:
        raise ValueError("Validation errors: " + "; ".join(errors))


def get_employee_by_id(connection, id_employee):
    cursor = connection.cursor()
    query = "SELECT empl_name, empl_surname, empl_role FROM employee WHERE id_employee = %s"
    cursor.execute(query, (id_employee,))
    row = cursor.fetchone()
    cursor.close()

    if row:
        columns = ['empl_name', 'empl_surname', 'empl_role']
        return dict(zip(columns, row))
    else:
        return None

def get_employee_info_by_id(connection, id_employee):
    cursor = connection.cursor()
    query = """
        SELECT id_employee, empl_surname, empl_name, empl_patronymic, empl_role,
               salary, date_of_birth, date_of_start, phone_number,
               city, street, zip_code
        FROM employee
        WHERE id_employee = %s
    """
    cursor.execute(query, (id_employee,))
    row = cursor.fetchone()
    cursor.close()

    if row is None:
        return None

    # Повертаємо у вигляді словника вручну
    return {
        'id_employee': row[0],
        'empl_surname': row[1],
        'empl_name': row[2],
        'empl_patronymic': row[3],
        'empl_role': row[4],
        'salary': row[5],
        'date_of_birth': row[6],
        'date_of_start': row[7],
        'phone_number': row[8],
        'city': row[9],
        'street': row[10],
        'zip_code': row[11]
    }
def get_employees_never_sold_promotional_to_non_premium(connection):
    query = """
        SELECT 
            e.id_employee,
            e.empl_surname,
            e.empl_name
        FROM 
            employee e
        WHERE 
            NOT EXISTS (
                SELECT 1
                FROM `check` ch
                JOIN store_products sp ON sp.UPC IN (
                    SELECT UPC 
                    FROM store_products 
                    WHERE promotional_product = 1
                )
                JOIN customer_card cc ON ch.card_number = cc.card_number
                WHERE 
                    ch.id_employee = e.id_employee
                    AND cc.percent <= 20
            )
            AND EXISTS (
                SELECT 1
                FROM `check` ch
                WHERE ch.id_employee = e.id_employee
            )
        ORDER BY 
            e.empl_surname, e.empl_name;
    """
    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Помилка отримання працівників, які не продавали акційні товари непреміум-клієнтам: {e}")
        raise