
from flask import Flask, render_template, jsonify, request
import xmlrpclib

app = Flask(__name__)
app.debug = True
server = xmlrpclib.Server('http://localhost:7080/',allowNone=True)

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
        chunk = server.read_chunk(request_params['chunk_name'])
        awnser['chunk_content'] = chunk['content']

    elif request_params['operation'] == 'delete':
        server.delete_chunk(request_params['chunk_name'], request_params['user_hash'])

    else:
        awnser['error'] = 'unknown operation'
        awnser['status'] = 'failed'

    return jsonify(awnser)


# ------------------------------------------------------------------------------ MAIN

if __name__ == "__main__":
    app.run()
