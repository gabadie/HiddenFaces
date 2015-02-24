
from flask import Flask, render_template, jsonify, request, Response
import xmlrpclib
import os.path
import json
import socket
import time

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
