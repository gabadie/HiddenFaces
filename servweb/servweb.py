
from flask import Flask, render_template, jsonify, request, Response

import fnmatch
import json
import os
import socket
import subprocess
import tempfile
import time
import xmlrpclib

from subprocess import Popen, PIPE
from sys import platform as _platform
from itertools import islice

app = Flask(__name__)
app.debug = True

server = xmlrpclib.Server('http://localhost:7090/')

def generate_rsa_keys():
    """ Generates valide RSA public an private keys
    """
    openssl_bin = 'openssl'

    if _platform == 'win32':
        openssl_bin += '.exe'

    tp1 = tempfile.mktemp()
    private_key = subprocess.Popen(
        [openssl_bin, 'genrsa', '-out', tp1, '1024'],
        stdout = subprocess.PIPE
    )

    private_key.wait()
    assert private_key.returncode == 0
    assert os.path.exists(tp1)

    with open(tp1) as myfile:
        private_key = myfile.read()
        private_key = 'RSA-1024-Private\n' + private_key

    tp2 = tempfile.mktemp()

    public_key = subprocess.Popen(
        [openssl_bin, 'rsa', '-pubout', '-in', tp1,'-out', tp2],
        stdout=subprocess.PIPE
    )

    public_key.wait()
    assert public_key.returncode == 0
    assert os.path.exists(tp2)

    with open(tp2) as myfile1:
        public_key = myfile1.read()
        public_key = 'RSA-1024-Public\n' + public_key

    os.remove(tp1)
    os.remove(tp2)
    assert not os.path.exists(tp1)
    assert not os.path.exists(tp2)

    assert private_key.startswith('RSA-1024-Private\n')
    assert public_key.startswith('RSA-1024-Public\n')

    return private_key, public_key


def load_views_templates():
    template_path_dir = os.path.abspath('{}/static/view/'.format(
        os.path.dirname(os.path.abspath(__file__))
    ))

    templates_json = []

    for root, dirnames, filenames in os.walk(template_path_dir):
        for filename in fnmatch.filter(filenames, '*.html'):
            template_path = os.path.join(root,filename)

            assert os.path.exists(template_path)

            template_json = {
                'name': os.path.relpath(template_path, template_path_dir),
                'source': ''
            }


            template_json['name'] = template_json['name'].replace("\\","/")

            with open(template_path) as myFile:
                template_json['source'] = myFile.read()

            templates_json.append(template_json)

    return templates_json


# ------------------------------------------------------------------------------ INDEX

@app.route("/")
def index_page():
    return render_template('index.html')

@app.route("/test.html")
def test_page():
    return render_template('index.html', test=True)


# ------------------------------------------------------------------------------ DATA CHUNK

@app.route('/api/', methods=['POST'])
def get_data_chunk():
    request_params = request.get_json()

    answer = {
        'request_params': request_params,
        'status': 'ok'
    }

    if request_params['operation'] == 'transaction':
        transaction_result = server.data_chunk_transaction(request_params['operations'])

        if transaction_result == False:
            answer['status'] = 'failed'

        else:
            for operation_status in transaction_result['status']:
                if operation_status != 'commited':
                    answer['status'] = 'failed'

        answer['operations_status'] = transaction_result['status']
        answer['operations_return'] = transaction_result['return']

    elif request_params['operation'] == 'get':
        try:
            content = json.loads(server.read_chunk(request_params['chunk_name']))
            answer['chunk_content'] = content
        except:
            answer['status'] = 'failed'

    elif request_params['operation'] == 'testing:drop_database':
        server.testing_drop_database()

    elif request_params['operation'] == 'generate_rsa_keys':
        answer["private_key"], answer["public_key"] = generate_rsa_keys()

    elif request_params['operation'] == 'views_templates':
        answer['templates'] = load_views_templates()

    else:
        answer['error'] = 'unknown operation'
        answer['status'] = 'failed'

    return jsonify(answer)


# ------------------------------------------------------------------------------ MAIN

if __name__ == "__main__":

    connected = False
    #verification RPC connexion
    while not connected:
        try:
            server.read_chunk("")
            connected = True
        except socket.error as e:
            print e
            time.sleep(1)

    app.run()
