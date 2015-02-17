
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)
app.debug = True


# ------------------------------------------------------------------------------ INDEX

@app.route("/")
def hello():
    return render_template('index.html')


# ------------------------------------------------------------------------------ DATA CHUNK

@app.route('/api/', methods=['POST'])
def get_data_chunk():
    request_params = request.get_json()

    awnser = {
        'request_params': request_params,
        'status': 'ok'
    }

    if request_params['operation'] == 'create':
        pass

    elif request_params['operation'] == 'write':
        pass

    elif request_params['operation'] == 'append':
        pass

    elif request_params['operation'] == 'get':
        awnser['chunk_content'] = ['this is ', 'my chunk']
        pass

    elif request_params['operation'] == 'delete':
        pass

    else:
        awnser['error'] = 'unknown operation'
        awnser['status'] = 'failed'

    return jsonify(awnser)


# ------------------------------------------------------------------------------ MAIN

if __name__ == "__main__":
    app.run()
