# from sql_connection import execute_query, get_sql_connection
#
# def get_all_customers(connection):
#     query = "SELECT * FROM customer_card;"
#     try:
#         result = execute_query(connection, query)
#         return result
#     except Exception as e:
#         print(f"Error in get_all_customers: {e}")
#         raise
#
# def insert_new_customer(connection, customer):
#     # Check if this is an update (card_number exists and is not empty)
#     if customer.get('card_number') and str(customer['card_number']).strip():
#         # This is an update - use the corresponding function
#         return update_customer(connection, customer)
#     else:
#         # This is a new insertion
#         query = (
#             "INSERT INTO customer_card "
#             "(card_number, cust_surname, cust_name, cust_patronymic, "
#             "phone_number, city, street, zip_code, percent) "
#             "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);"
#         )
#         data = (
#             customer["card_number"],
#             customer["cust_surname"],
#             customer["cust_name"],
#             customer["cust_patronymic"],
#             customer["phone_number"],
#             customer["city"],
#             customer["street"],
#             customer["zip_code"],
#             customer["percent"]
#         )
#
#         try:
#             result = execute_query(connection, query, data)
#             return result
#         except Exception as e:
#             print(f"Error adding customer: {e}")
#             raise
#
# def update_customer(connection, customer):
#     # Make sure we have a valid card number
#     if not customer.get('card_number') or not str(customer['card_number']).strip():
#         raise ValueError("card_number is required for update")
#
#     query = """
#         UPDATE customer_card SET
#             cust_surname = %s,
#             cust_name = %s,
#             cust_patronymic = %s,
#             phone_number = %s,
#             city = %s,
#             street = %s,
#             zip_code = %s,
#             percent = %s
#         WHERE card_number = %s;
#     """
#     data = (
#         customer['cust_surname'],
#         customer['cust_name'],
#         customer['cust_patronymic'],
#         customer['phone_number'],
#         customer['city'],
#         customer['street'],
#         customer['zip_code'],
#         customer['percent'],
#         customer['card_number']
#     )
#
#     try:
#         print(f"Updating customer with card number: {customer['card_number']}")
#         result = execute_query(connection, query, data)
#         return result
#     except Exception as e:
#         print(f"Error updating customer: {e}")
#         raise
#
# def delete_customer(connection, card_number):
#     query = "DELETE FROM customer_card WHERE card_number = %s"
#     try:
#         result = execute_query(connection, query, (card_number,))
#         return result
#     except Exception as e:
#         print(f"Error deleting customer: {e}")
#         raise
#
# def get_contact_by_surname(connection, surname):
#     query = """
#         SELECT phone_number, city, street, zip_code
#         FROM customer_card
#         WHERE cust_surname = %s;
#     """
#     try:
#         result = execute_query(connection, query, (surname,))
#         if result and len(result) > 0:
#             return {
#                 'phone_number': result[0]['phone_number'],
#                 'city': result[0]['city'],
#                 'street': result[0]['street'],
#                 'zip_code': result[0]['zip_code']
#             }
#         else:
#             return None
#     except Exception as e:
#         print(f"Error in get_contact_by_surname: {e}")
#         raise
#
# def get_all_customers_ordered_by_surname(connection):
#     query = "SELECT * FROM customer_card ORDER BY cust_surname ASC;"
#     try:
#         result = execute_query(connection, query)
#         return result
#     except Exception as e:
#         print(f"Error in get_all_customers_ordered_by_surname: {e}")
#         raise
#
# def get_discount_customers(connection):
#     query = """
#         SELECT * FROM customer_card
#         WHERE percent > 0
#         ORDER BY percent DESC;
#     """
#     try:
#         result = execute_query(connection, query)
#         return result
#     except Exception as e:
#         print(f"Error in get_discount_customers: {e}")
#         raise