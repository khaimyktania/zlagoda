import pymysql

__cnx = None

def get_sql_connection():
    global __cnx
    if __cnx is None or __cnx.open != 1:  # Перевірка, чи з'єднання активне
        __cnx = pymysql.connect(
            user='root',
            password='root',
            host='127.0.0.1',
            database='zlagoda'
        )
    return __cnx
