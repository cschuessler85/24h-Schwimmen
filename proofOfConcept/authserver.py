from flask import Flask, request, redirect, url_for, session, render_template_string
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'geheim123'  # nötig für Sessions

# Dummy-Nutzer (normalerweise aus DB)
users = {
    "admin": generate_password_hash("passwort123")
}

# HTML-Templates (minimal)
login_form = """
<form method="POST">
  Benutzername: <input name="username"><br>
  Passwort: <input name="password" type="password"><br>
  <input type="submit" value="Login">
</form>
"""

welcome_page = """
<h2>Willkommen, {{user}}!</h2>
<a href="{{url_for('logout')}}">Logout</a>
"""

@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        name = request.form["username"]
        pw = request.form["password"]
        if name in users and check_password_hash(users[name], pw):
            session["user"] = name
            return redirect(url_for("protected"))
        return "Login fehlgeschlagen", 403
    return login_form

@app.route("/protected")
def protected():
    if "user" not in session:
        return redirect(url_for("login"))
    return render_template_string(welcome_page, user=session["user"])

@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("login"))

if __name__ == "__main__":
    #app.run(debug=True) #ohne SSL
    app.run(ssl_context=('cert.pem', 'key.pem'), debug=True)
