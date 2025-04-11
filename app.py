from flask import Flask, render_template

app = Flask(__name__, static_folder='web', template_folder='web')

@app.route("/")
def home():
    return render_template("main.html")

if __name__ == "__main__":
    app.run(debug=True)
