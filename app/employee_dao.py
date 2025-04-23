from sql_connection import get_sql_connection
import pymysql


def insert_new_employee(connection, employee):
    cursor = connection.cursor()
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
    cursor.execute(query, data)
    connection.commit()
    return cursor.lastrowid


def update_employee(connection, employee):
    cursor = connection.cursor()

    # Перевірка наявності id_employee
    if not employee['id_employee']:
        raise ValueError("id_employee is required for update")

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
        cursor.execute(query, data)
        connection.commit()
        return cursor.rowcount  # Повертаємо кількість оновлених рядків
    except pymysql.MySQLError as e:
        connection.rollback()
        print(f"Error: {e}")
        return None


def delete_employee(connection, employee_id):
    cursor = connection.cursor()
    query = "DELETE FROM employee WHERE id_employee = %s;"
    cursor.execute(query, (employee_id,))
    connection.commit()
    return cursor.rowcount

def get_contact_by_surname(connection, surname):
    cursor = connection.cursor()
    query = """
        SELECT phone_number, city, street, zip_code
        FROM employee
        WHERE empl_surname = %s;
    """
    cursor.execute(query, (surname,))
    result = cursor.fetchone()

    if result:
        return {
            'phone_number': result[0],
            'city': result[1],
            'street': result[2],
            'zip_code': result[3]
        }
    else:
        return None

def get_all_employees_ordered_by_surname(connection):
    cursor = connection.cursor()
    query = """
            SELECT id_employee, empl_surname, empl_name, empl_patronymic,
                   empl_role, salary, date_of_birth, date_of_start,
                   phone_number, city, street, zip_code
            FROM employee
            ORDER BY empl_surname;
        """
    cursor.execute(query)

    response = []
    for (id_employee, surname, name, patronymic,
         role, salary, birth, start,
         phone, city, street, zip_code) in cursor:
        response.append({
            'id_employee': id_employee,
            'empl_surname': surname,
            'empl_name': name,
            'empl_patronymic': patronymic,
            'empl_role': role,
            'salary': salary,
            'date_of_birth': birth,
            'date_of_start': start,
            'phone_number': phone,
            'city': city,
            'street': street,
            'zip_code': zip_code
        })
    return response

def get_cashiers_ordered_by_surname(connection):
    cursor = connection.cursor()
    query = """
            SELECT id_employee, empl_surname, empl_name, empl_patronymic,
                   empl_role, salary, date_of_birth, date_of_start,
                   phone_number, city, street, zip_code
            FROM employee
            WHERE empl_role = 'Cashier'
            ORDER BY empl_surname;  -- Сортуємо за прізвищем
        """
    cursor.execute(query)

    response = []
    for (id_employee, surname, name, patronymic,
         role, salary, birth, start,
         phone, city, street, zip_code) in cursor:
        response.append({
            'id_employee': id_employee,
            'empl_surname': surname,
            'empl_name': name,
            'empl_patronymic': patronymic,
            'empl_role': role,
            'salary': salary,
            'date_of_birth': birth,
            'date_of_start': start,
            'phone_number': phone,
            'city': city,
            'street': street,
            'zip_code': zip_code
        })
    return response



def get_all_employees(connection):
    cursor = connection.cursor()
    query = "SELECT * FROM employee;"
    cursor.execute(query)

    response = []
    for (id_employee,empl_surname, empl_name, empl_patronymic, empl_role, salary, date_of_birth,
         date_of_start, phone_number, city, street, zip_code) in cursor:
        response.append({
            'id_employee': id_employee,
            'empl_surname': empl_surname,
            'empl_name': empl_name,
            'empl_patronymic': empl_patronymic,
            'empl_role': empl_role,
            'salary': salary,
            'date_of_birth': date_of_birth,
            'date_of_start':date_of_start,
            'phone_number': phone_number,
            'city': city,
            'street': street,
            'zip_code': zip_code
        })
    return response

