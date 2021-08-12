from flask import Flask, render_template, request
from functools import wraps

import uuid
import mysql.connector
import bcrypt
import configparser
import random
import string

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

config = configparser.ConfigParser()
config.read('secrets.cfg')
DB_NAME = 'passwords'
DB_USERNAME = config['secrets']['DB_USERNAME']
DB_PASSWORD = config['secrets']['DB_PASSWORD']
PEPPER = config['secrets']['PEPPER']


chats = {}
authorized_users = {}


def createMagicKey():
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=40))


# ------------------------------ STATIC ROUTES ---------------------------------

@app.route('/')
@app.route('/login')
@app.route('/chats')
@app.route('/chat/<int:chat_id>')
def index(chat_id=None):
    return app.send_static_file('index.html')


# -------------------------------- API ROUTES ----------------------------------

@app.route('/api/login', methods=['POST'])
def login():
    response = request.get_json()
    username = response['username']
    password = (response['password'] + PEPPER).encode('utf-8')
    chat_id = response['chat_id']

    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()

    query = "SELECT password FROM users WHERE username=%s"

    try:
        cursor.execute(query, (username,))
        hashed = cursor.fetchone()[0].encode('utf-8')

        if bcrypt.checkpw(password, hashed):
            session_token = authorized_users[username]
            try:
                chat_id = int(chat_id)
                if len(chats[chat_id]['authorized_users']) < 6:
                    chats[chat_id]['authorized_users'][str(session_token)] = username
                else:
                    return {'session_token': session_token}, 400
            except:
                print(f"User - {username} - is logging in from homepage")
            return {'token': session_token}
        return {}, 404
    except Exception as e:
        print(e)
        return {}, 404
    finally:
        cursor.close()
        connection.close()

@app.route('/api/signup', methods=['POST'])
def signup():
    response = request.get_json()
    username = response['username']
    password = (response['password'] + PEPPER).encode('utf-8')
    chat_id = response['chat_id']

    if username in authorized_users:
        return {}, 403

    hashed = bcrypt.hashpw(password, bcrypt.gensalt())

    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()

    query = "INSERT into users (username, password) VALUES (%s, %s)"

    try:
        cursor.execute(query, (username, hashed))
        connection.commit()
        session_token = uuid.uuid1()
        authorized_users[username] = str(session_token)
        if chat_id != '':
            chat_id = int(chat_id)
            if len(chats[chat_id]['authorized_users']) < 6:
                chats[chat_id]['authorized_users'][str(session_token)] = username
            else:
                return {'session_token': session_token}, 400
        return {'token': session_token}, 200
    except Exception as e:
        print(e)
        return {"username": username}, 302
    finally:
        cursor.close()
        connection.close()

@app.route('/api/active', methods=['GET'])
def active_chats():
    try:
        session_token = request.headers['Session-Token']
    except:
        return {}, 404

    chats_list = []

    for key in chats:
        if session_token in chats[key]['authorized_users']:
            magic_key = chats[key]['magic_key']
            magic_invite_link = f"http://localhost:5000/chat/{key}?magic_key={magic_key}"
            bundle = {
                'key': key,
                'magic_invite_link': magic_invite_link
            }
            chats_list.append(bundle)

    return {'numbers': chats_list}, 200

@app.route('/api/create', methods=['POST'])
def create():
    response = request.get_json()
    session_token = response['userToken']

    chat_id = len(chats.keys()) + 1
    magic_key = createMagicKey()
    magic_invite_link = f"http://localhost:5000/chat/{chat_id}?magic_key={magic_key}"
    username = ''

    for key in authorized_users:
        if authorized_users[key] == session_token:
            username = key
            break

    if username == '':
        return {}, 404
    else:
        chats[chat_id] = {
            "authorized_users": {session_token: username},
            "magic_key": magic_key,
            "messages": []
        }
        return {
            "chat_id": chat_id,
            "magic_key": magic_key,
            "magic_invite_link": magic_invite_link
        }

@app.route('/api/authorize', methods=['POST'])
def authorize():
    response = request.get_json()
    session_token = response['userToken']
    chat_id = response['chatId']

    try:
        chat_id = int(chat_id)
    except:
        return {}, 404

    if not session_token or not chat_id:
        return {}, 404
    else:
        if session_token in chats[chat_id]['authorized_users']:
            magic_key = chats[chat_id]['magic_key']
            magic_invite_link = f"http://localhost:5000/chat/{chat_id}?magic_key={magic_key}"
            return {'chat_id': chat_id, 'magic_invite_link': magic_invite_link}
        else:
            return {}, 404

@app.route('/api/join', methods=['POST'])
def authenticate():
    response = request.get_json()
    
    try:
        magic_key = response['magicKey']
        chat_id = response['chatId']
        chat_id = int(chat_id)
        session_token = response['userToken']
    except:
        return {}, 404

    if not chat_id or not magic_key:
        return {}, 404
    else:
        if chats[chat_id]['magic_key'] == magic_key:
            if not session_token:
                return {'chat_id': chat_id}, 202
            else:
                username = ''
                for key in authorized_users:
                    if authorized_users[key] == session_token:
                        username = key
                        break
                if username != '':
                    if len(chats[chat_id]['authorized_users']) < 6:
                        chats[chat_id]['authorized_users'][session_token] = username
                        magic_invite_link = f"http://localhost:5000/chat/{chat_id}?magic_key={magic_key}"
                        return {'chat_id': chat_id, 'magic_invite_link': magic_invite_link}, 200
                    else:
                        return {}, 400
                else:
                    return {'chat_id': chat_id}, 202
        else:
            return {}, 404

@app.route('/api/messages', methods=['GET', 'POST'])
def messages():
    # POST
    if request.method == 'POST':
        try:
            response = request.get_json()
            session_token = response['session_token']
            message = response['message']
            chat_id = response['chat_id']
        except:
            return {}, 404

        if not session_token or not chat_id:
            return {}, 404
        else:
            chat_id = int(chat_id)

        try:
            username = chats[chat_id]['authorized_users'][session_token]
        except:
            return {}, 404

        if len(chats[chat_id]['messages']) >= 30:
            chats[chat_id]['messages'] = chats[chat_id]['messages'][1:]

        chats[chat_id]["messages"].append({"username": username, "body": message})

        return {}, 200
    # GET
    try:
        session_token = request.headers['Session-Token']
        chat_id = request.headers['Chat-ID']
    except:
        return {}, 404

    if not session_token or not chat_id:
        return {}, 404
    else:
        chat_id = int(chat_id)

    try:
        if session_token in chats[chat_id]['authorized_users']:
            return {"chats": chats[chat_id]['messages']}
        else:
            return {}, 404
    except:
        return {}, 404






if __name__ == '__main__':
    app.run(debug = True, host = '0.0.0.0')