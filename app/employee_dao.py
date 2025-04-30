from sql_connection import execute_query, get_sql_connection
from datetime import datetime
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
        add_or_update_credential(new_id, login='newuser', password='default123')
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
        return result
    except Exception as e:
        print(f"Помилка оновлення працівника: {e}")
        raise


def delete_employee(connection, employee_id):
    query = "DELETE FROM employee WHERE id_employee = %s;"
    try:
        result = execute_query(connection, query, (employee_id,))
        delete_credential(employee_id)
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

    # Перевірка імені — перша літера велика, інші малі, тільки літери
    try:
        name = employee['empl_name']
        if not name[0].isupper():
            errors.append("Name must start with an uppercase letter.")
        if not name.isalpha():
            errors.append("Name must contain only letters.")
        if name != name.capitalize():
            errors.append("Name must have only the first letter capitalized.")
    except Exception:
        errors.append("Invalid empl_name format.")

    # Перевірка прізвища — перша літера велика, інші малі, тільки літери
    try:
        surname = employee['empl_surname']
        if not surname[0].isupper():
            errors.append("Surname must start with an uppercase letter.")
        if not surname.isalpha():
            errors.append("Surname must contain only letters.")
        if surname != surname.capitalize():
            errors.append("Surname must have only the first letter capitalized.")
    except Exception:
        errors.append("Invalid empl_surname format.")

    # Перевірка по-батькові — перша літера велика, інші малі, тільки літери
    try:
        patronymic = employee.get('empl_patronymic', '')
        if patronymic:  # Перевірка, чи не порожнє поле
            if not patronymic[0].isupper():
                errors.append("Patronymic must start with an uppercase letter.")
            if not patronymic.isalpha():
                errors.append("Patronymic must contain only letters.")
            if patronymic != patronymic.capitalize():
                errors.append("Patronymic must have only the first letter capitalized.")
    except Exception:
        errors.append("Invalid empl_patronymic format.")

    # Перевірка міста — перша літера велика, інші малі, тільки літери
    try:
        city = employee['city']
        if not city[0].isupper():
            errors.append("City must start with an uppercase letter.")
        if not city.isalpha():
            errors.append("City must contain only letters.")
        if city != city.capitalize():
            errors.append("City must have only the first letter capitalized.")
    except Exception:
        errors.append("Invalid city format.")

    # Перевірка zip_code — 5 цифр, тільки цифри
    try:
        zipcode = employee['zip_code']
        if len(zipcode) != 5:
            errors.append("Zip Code must be exactly 5 characters long.")
        elif not zipcode.isdigit():
            errors.append("Zip Code must contain only digits.")
    except Exception:
        errors.append("Invalid zip code format.")

    # Перевірка street — перша літера велика, потім назва вулиці, кома і цифра (максимум дві цифри)
    try:
        street = employee['street']
        # Перевірка, чи є вулиця у форматі "Назва вулиці, номер" (українські літери, кома, дві цифри)
        pattern = r"^[A-Za-zА-ЯЁа-яё]+(?:\s?[A-Za-zА-ЯЁа-яё]*)?,\s\d{1,2}$"
        if not re.match(pattern, street):
            errors.append(
                "Street must start with an uppercase letter, followed by lowercase letters, a comma, and a number (up to two digits).")
    except Exception:
        errors.append("Invalid street format.")

    # Перевірка дати народження — не молодше 18
    try:
        birth_date = datetime.strptime(employee['date_of_birth'], '%Y-%m-%d')
        age = (datetime.today() - birth_date).days // 365
        if age < 18:
            errors.append("Employee must be at least 18 years old.")
    except Exception:
        errors.append("Invalid date_of_birth format (expected YYYY-MM-DD).")

    # Перевірка зарплати — не від’ємна
    try:
        if float(employee['salary']) < 0:
            errors.append("Salary must be non-negative.")
    except Exception:
        errors.append("Invalid salary format.")

    # Телефон — не більше 13 символів
    if len(employee.get('phone_number', '')) > 13:
        errors.append("Phone number must be ≤ 13 characters.")

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

