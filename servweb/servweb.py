
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

    awnser = {
        'status' : 'ok'
    }

    page_path = request_params['page_request']

    try:
        with open(page_path) as myFile:
            page_content = myFile.read().replace("\n","")

        awnser['page_content'] = page_content
    except:
        awnser['status'] = 'failded'
        awnser['error'] = '404'

    return jsonify(awnser)

# ------------------------------------------------------------------------------ DATA CHUNK

@app.route('/api/', methods=['POST'])
def get_data_chunk():
    request_params = request.get_json()

    awnser = {
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
            chunk = json.loads(server.read_chunk(request_params['chunk_name']))
            awnser['chunk_content'] = chunk["content"]
        except:
            awnser['status'] = 'failed'

    elif request_params['operation'] == 'delete':
        server.delete_chunk(request_params['chunk_name'], request_params['user_hash'])

    else:
        awnser['error'] = 'unknown operation'
        awnser['status'] = 'failed'

    return jsonify(awnser)


# ------------------------------------------------------------------------------ MAIN

if __name__ == "__main__":
    app.run()
