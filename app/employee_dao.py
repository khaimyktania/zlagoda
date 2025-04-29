from sql_connection import execute_query, get_sql_connection


def insert_new_employee(connection, employee):
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
        return result
    except Exception as e:
        print(f"Помилка додавання працівника: {e}")
        raise


def update_employee(connection, employee):
    # Перевірка наявності id_employee
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