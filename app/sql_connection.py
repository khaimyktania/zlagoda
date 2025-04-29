import pymysql
import time
from pymysql.constants import CLIENT

# Конфігурація бази даних
DB_CONFIG = {
    'user': 'root',
    'password': 'root',
    'host': '127.0.0.1',
    'database': 'zlagoda',
    'connect_timeout': 10,  # Збільшено timeout підключення
    'read_timeout': 60,  # Збільшено read timeout
    'write_timeout': 60,  # Збільшено write timeout
    'autocommit': True,
    'client_flag': CLIENT.MULTI_STATEMENTS
}

MAX_RETRY = 3
RETRY_DELAY = 1.5  # секунди між спробами


def get_sql_connection():
    """Створює і повертає підключення до MySQL з повторними спробами при невдачі"""
    retry_count = 0

    while retry_count < MAX_RETRY:
        try:
            connection = pymysql.connect(**DB_CONFIG)
            # Тестовий запит для перевірки з'єднання
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            return connection

        except pymysql.MySQLError as e:
            print(f"Помилка підключення до MySQL (спроба {retry_count + 1}/{MAX_RETRY}): {e}")
            retry_count += 1
            if retry_count < MAX_RETRY:
                time.sleep(RETRY_DELAY * retry_count)  # Прогресивне збільшення затримки

    raise Exception("Не вдалося підключитися до MySQL після декількох спроб")


def execute_query(connection, query, params=None, retry=True):
    """
    Виконує SQL запит з автоматичним повторенням при певних помилках
    :param connection: об'єкт підключення до MySQL
    :param query: SQL запит
    :param params: параметри для запиту
    :param retry: чи повторювати запит при помилках з'єднання
    :return: результат запиту
    """
    retry_count = 0

    while retry_count < MAX_RETRY:
        try:
            cursor = connection.cursor(pymysql.cursors.DictCursor)
            cursor.execute(query, params)

            if query.strip().upper().startswith("SELECT"):
                result = cursor.fetchall()
                cursor.close()
                return result
            else:
                affected_rows = cursor.rowcount
                cursor.close()
                return affected_rows

        except (pymysql.err.OperationalError, pymysql.err.InterfaceError) as e:
            error_code = e.args[0]
            # Список помилок, які вказують на проблеми з з'єднанням
            connection_errors = [2006, 2013, 2003, 2002, 0]  # 0 для InterfaceError

            if error_code in connection_errors and retry and retry_count < MAX_RETRY - 1:
                print(f"Помилка з'єднання: {e}. Спроба {retry_count + 1}/{MAX_RETRY}")
                retry_count += 1

                # Спроба отримати нове з'єднання
                try:
                    connection.close()
                except:
                    pass  # Ігноруємо помилки при закритті

                # Отримуємо нове з'єднання
                try:
                    connection = get_sql_connection()
                    time.sleep(RETRY_DELAY * retry_count)
                except Exception as conn_err:
                    print(f"Не вдалося відновити з'єднання: {conn_err}")
                    raise
            else:
                # Інші помилки або вичерпали спроби
                raise

        except Exception as e:
            print(f"Несподівана помилка при виконанні запиту: {e}")
            raise

    raise Exception("Не вдалося виконати запит після декількох спроб")