from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        return redirect(url_for('game'))
    return render_template('login.html')

@app.route('/game')
def game():
    return render_template('game.html')

if __name__ == '__main__':
    app.run(debug=True)
    