
from flask import Flask, render_template, jsonify, request
import xmlrpclib
import os.path
import json

app = Flask(__name__)
app.debug = True
server = xmlrpclib.Server('http://localhost:7080/')

# ------------------------------------------------------------------------------ INDEX

@app.route("/")
def index_page():
    return render_template('index.html')

@app.route("/test.html")
def test_page():
    return render_template('index.html', test=True)

@app.route("/template/",methods=['POST'])
def read_page():
    request_params = request.get_json()

    answer = {
        'status' : 'ok'
    }
    print request_params
    page_path = request_params['page_request']

    try:
        with open(page_path) as myFile:
            page_content = myFile.read().replace("\n","")

        answer['page_content'] = page_content
    except:
        answer['status'] = 'failded'
        answer['error'] = '404'

    return jsonify(answer)

# ------------------------------------------------------------------------------ DATA CHUNK

@app.route('/api/', methods=['POST'])
def get_data_chunk():
    request_params = request.get_json()

    answer = {
        'request_params': request_params,
        'status': 'ok'
    }

    if request_params['operation'] == 'create':
        server.new_chunk(request_params['chunk_name'], request_params['user_hash'], request_params['chunk_content'], request_params['public_append'])

    elif request_params['operation'] == 'write':
        server.write_chunk(request_params['chunk_name'], request_params['user_hash'], request_params['chunk_content'])

    elif request_params['operation'] == 'append':
        server.append_content(request_params['chunk_name'], request_params['chunk_content'])

    elif request_params['operation'] == 'get':
        try:
            content = json.loads(server.read_chunk(request_params['chunk_name']))
            answer['chunk_content'] = content
        except:
            answer['status'] = 'failed'

    elif request_params['operation'] == 'delete':
        server.delete_chunk(request_params['chunk_name'], request_params['user_hash'])

    elif request_params['operation'] == 'testing:drop_database':
        server.testing_drop_database()

    else:
        answer['error'] = 'unknown operation'
        answer['status'] = 'failed'

    return jsonify(answer)


# ------------------------------------------------------------------------------ MAIN

if __name__ == "__main__":
    app.run()
