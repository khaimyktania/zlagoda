from sql_connection import execute_query, get_sql_connection
import re

def validate_customer(customer):
    errors = []

    # Обов'язкові поля
    required_fields = ['card_number', 'cust_surname', 'cust_name', 'phone_number', 'percent']
    for field in required_fields:
        if not customer.get(field):
            errors.append(f"Field '{field}' is required.")
    # Перевірка імені — перша літера велика, інші малі, тільки літери
    try:
        name = customer['cust_name']
        if not name[0].isupper():
            errors.append("Name must start with an uppercase letter.")
        if not name.isalpha():
            errors.append("Name must contain only letters.")
        if name != name.capitalize():
            errors.append("Name must have only the first letter capitalized.")
    except Exception:
        errors.append("Invalid cust_name format.")

    # Перевірка прізвища — перша літера велика, інші малі, тільки літери
    try:
        surname = customer['cust_surname']
        if not surname[0].isupper():
            errors.append("Surname must start with an uppercase letter.")
        if not surname.isalpha():
            errors.append("Surname must contain only letters.")
        if surname != surname.capitalize():
            errors.append("Surname must have only the first letter capitalized.")
    except Exception:
        errors.append("Invalid cust_surname format.")

    # Перевірка по-батькові — перша літера велика, інші малі, тільки літери
    try:
        patronymic = customer['cust_patronymic']
        if patronymic:  # Перевірка, чи не порожнє поле
            if not patronymic[0].isupper():
                errors.append("Patronymic must start with an uppercase letter.")
            if not patronymic.isalpha():
                errors.append("Patronymic must contain only letters.")
            if patronymic != patronymic.capitalize():
                errors.append("Patronymic must have only the first letter capitalized.")
    except Exception:
        errors.append("Invalid cust_patronymic format.")

    # Отримуємо значення з customer
    city = customer.get('city', '').strip()
    zipcode = customer.get('zip_code', '').strip()
    street = customer.get('street', '').strip()

    # Якщо хоч одне з полів адреси не порожнє — перевіряємо всі
    if city or zipcode or street:
        # Перевірка міста
        try:
            if not city:
                errors.append("City is required if address is partially filled.")
            elif not city[0].isupper():
                errors.append("City must start with an uppercase letter.")
            elif not city.isalpha():
                errors.append("City must contain only letters.")
            elif city != city.capitalize():
                errors.append("City must have only the first letter capitalized.")
        except Exception:
            errors.append("Invalid city format.")

        # Перевірка zip_code — 5 цифр, тільки цифри
        try:
            if not zipcode:
                errors.append("Zip Code is required if address is partially filled.")
            elif len(zipcode) != 5:
                errors.append("Zip Code must be exactly 5 characters long.")
            elif not zipcode.isdigit():
                errors.append("Zip Code must contain only digits.")
        except Exception:
            errors.append("Invalid zip code format.")

        # Перевірка street
        try:
            if not street:
                errors.append("Street is required if address is partially filled.")
            else:
                pattern = r"^[A-Za-zА-Яа-яЇїІіЄєҐґ]+(?:\s[A-Za-zА-Яа-яЇїІіЄєҐґ]*)?,\s\d{1,2}$"
                if not re.match(pattern, street):
                    errors.append("Street must be in format 'Name, number' (e.g. Курчатова, 1).")
        except Exception:
            errors.append("Invalid street format.")

    # Відсоток має бути в межах 0–100
    try:
        percent = float(customer['percent'])
        if percent < 0 or percent > 100:
            errors.append("Percent must be between 0 and 100.")
    except Exception:
        errors.append("Invalid format for percent.")

    # Перевірка номеру картки — літерa 'C' (українська або англійська), за якою йде 4 цифри
    try:
        card_number = customer['card_number']
        # Перевірка, чи є номер картки у форматі "Cxxxx", де x - цифра
        pattern = r"^[СсCс]\d{4}$"
        if not re.match(pattern, card_number):
            errors.append(
                "Card number must start with 'C' (either Ukrainian or English), followed by 4 digits.")
    except Exception:
        errors.append("Invalid card number format.")

    # Телефон не довший за 13 символів
    if len(customer.get('phone_number', '')) > 13:
        errors.append("Phone number must be ≤ 13 characters.")

    # Якщо хоч одне поле адреси вказане — усі мають бути
    has_any_address_field = any(customer.get(field) for field in ['city', 'street', 'zip_code'])
    if has_any_address_field:
        for field in ['city', 'street', 'zip_code']:
            if not customer.get(field):
                errors.append(f"If address is provided, '{field}' must not be empty.")


    if errors:
        raise ValueError("Validation error(s): " + "; ".join(errors))


def insert_new_customer(connection, customer):
    validate_customer(customer)
    query = """
        INSERT INTO customer_card (
            card_number, cust_surname, cust_name, cust_patronymic,
            phone_number, city, street, zip_code, percent
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
    """
    data = (
        customer['card_number'],
        customer['cust_surname'],
        customer['cust_name'],
        customer['cust_patronymic'],
        customer['phone_number'],
        customer['city'],
        customer['street'],
        customer['zip_code'],
        customer['percent']
    )

    try:
        result = execute_query(connection, query, data)
        return result
    except Exception as e:
        print(f"Error adding customer: {e}")
        raise


def update_customer(connection, customer):
    validate_customer(customer)
    if not customer['card_number']:
        raise ValueError("card_number is required for update")

    query = """
        UPDATE customer_card SET
            cust_surname = %s,
            cust_name = %s,
            cust_patronymic = %s,
            phone_number = %s,
            city = %s,
            street = %s,
            zip_code = %s,
            percent = %s
        WHERE card_number = %s;
    """
    data = (
        customer['cust_surname'],
        customer['cust_name'],
        customer['cust_patronymic'],
        customer['phone_number'],
        customer['city'],
        customer['street'],
        customer['zip_code'],
        customer['percent'],
        customer['card_number']
    )

    try:
        result = execute_query(connection, query, data)
        return result
    except Exception as e:
        print(f"Error updating customer: {e}")
        raise


def delete_customer(connection, card_number):
    query = "DELETE FROM customer_card WHERE card_number = %s;"
    try:
        result = execute_query(connection, query, (card_number,))
        return result
    except Exception as e:
        print(f"Error deleting customer: {e}")
        raise


def get_contact_by_surname(connection, surname):
    query = """
        SELECT phone_number, city, street, zip_code
        FROM customer_card
        WHERE cust_surname = %s;
    """

    try:
        result = execute_query(connection, query, (surname,))
        if result and len(result) > 0:
            return result[0]
        else:
            return None
    except Exception as e:
        print(f"Error getting contact by surname: {e}")
        raise


def get_all_customers_ordered_by_surname(connection):
    query = """
        SELECT card_number, cust_surname, cust_name, cust_patronymic,
               phone_number, city, street, zip_code, percent
        FROM customer_card
        ORDER BY cust_surname;
    """

    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Error getting customer list: {e}")
        raise


def get_premium_customers(connection):
    query = """
        SELECT card_number, cust_surname, cust_name, cust_patronymic,
               phone_number, city, street, zip_code, percent
        FROM customer_card
        WHERE percent >= 10
        ORDER BY cust_surname;
    """

    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Error getting premium customers: {e}")
        raise


def get_all_customers(connection):
    query = "SELECT * FROM customer_card;"

    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Error getting all customers: {e}")
        raise