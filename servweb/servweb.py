
from flask import Flask, render_template, jsonify, request, Response
import xmlrpclib
import os.path
import json
import socket
import time


import subprocess
from subprocess import Popen, PIPE
import tempfile
from sys import platform as _platform
from itertools import islice

app = Flask(__name__)
app.debug = True

server = xmlrpclib.Server('http://localhost:7090/')


# ------------------------------------------------------------------------------ INDEX

@app.route("/")
def index_page():
    return render_template('index.html')

@app.route("/test.html")
def test_page():
    return render_template('index.html', test=True)

@app.route("/static/css/main.css")
def css_main():
    theme = {}
    with open(os.path.dirname(os.path.abspath(__file__)) + '/theme.json') as f:
        theme = json.loads(f.read())

    return Response(
        render_template('main.css', theme=theme),
        mimetype='text/css'
    )


# ------------------------------------------------------------------------------ TEMPLATE

@app.route("/template/",methods=['POST'])
def read_page():
    request_params = request.get_json()

    answer = {
        'status' : 'ok'
    }

    template_name = request_params['template_name']

    try:
        template_source = ''
        template_path = os.path.abspath('{}/static/view/{}'.format(
            os.path.dirname(__file__),
            template_name
        ))

        print template_path

        with open(template_path) as myFile:
            template_source = myFile.read()

        answer['template_source'] = template_source

    except Exception as e:
        print e
        answer['status'] = 'failed'

    return jsonify(answer)


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
        answer["private_key"], answer["public_key"] = generate_rsa_keys

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

def generate_rsa_keys():

    tp1 = tempfile.mktemp()
    openssl_bin = 'openssl'

    if _platform == 'win32':
        openssl_bin += '.exe'

    private_key = subprocess.Popen([openssl_bin, 'genrsa', '-out', tp1, '1024'],
    stdout = subprocess.PIPE
    )

    private_key.wait()
    assert private_key.returncode == 0

    assert os.path.exists(tp1)
    with open(tp1) as myfile:
        private_key = myfile.read()
    print private_key
    assert private_key.startswith('-----BEGIN RSA PRIVATE KEY-----\n')

    tp2 = tempfile.mktemp()

    public_key = subprocess.Popen([openssl_bin, 'rsa', '-pubout', '-in', tp1,'-out', tp2],
    stdout=subprocess.PIPE
    )

    public_key.wait()
    assert public_key.returncode == 0

    assert os.path.exists(tp2)
    with open(tp2) as myfile1:
        public_key = myfile1.read()
    print public_key
    assert public_key.startswith('-----BEGIN PUBLIC KEY-----\n')

    return private_key, public_key












