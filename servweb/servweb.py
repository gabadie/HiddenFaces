
from flask import Flask, render_template, jsonify

app = Flask(__name__)
app.debug = True


# ------------------------------------------------------------------------------ INDEX

@app.route("/")
def hello():
    return render_template('index.html')


# ------------------------------------------------------------------------------ DATA CHUNK

REST_FORMAT='/api/<file_id>/<user_id>'

@app.route(REST_FORMAT, methods=['GET'])
def get_data_chunk(file_id, user_id):
    awnser = {
        'file_id': file_id,
        'file_content': ['this is', ' some content']
    }

    return jsonify(awnser)

@app.route(REST_FORMAT, methods=['POST'])
def write_data_chunk(file_id, user_id):
    return jsonify({'result': True})

@app.route(REST_FORMAT, methods=['PUT'])
def append_data_chunk(file_id, user_id):
    return jsonify({'result': True})

@app.route(REST_FORMAT, methods=['DELETE'])
def delete_data_chunk(file_id, user_id):
    return jsonify({'result': True})


# ------------------------------------------------------------------------------ MAIN

if __name__ == "__main__":
    app.run()
