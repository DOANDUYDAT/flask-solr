import functools

from flask import jsonify
from flask_cors import CORS, cross_origin
from flask import Blueprint
from flask import flash
from flask import g
from flask import redirect
from flask import render_template
from flask import request
from flask import session
from flask import url_for
from werkzeug.security import check_password_hash
from werkzeug.security import generate_password_hash
import requests

from flaskr.db import get_db

import json



bp = Blueprint("auth", __name__, url_prefix="/auth")
CORS(bp)
# bp.config['CORS_HEADERS'] = 'Content-Type'

def login_required(view):
    """View decorator that redirects anonymous users to the login page."""

    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if g.user is None:
            return redirect(url_for("auth.login"))

        return view(**kwargs)

    return wrapped_view


@bp.before_app_request
def load_logged_in_user():
    """If a user id is stored in the session, load the user object from
    the database into ``g.user``."""
    user_id = session.get("user_id")

    if user_id is None:
        g.user = None
    else:
        g.user = (
            get_db().execute("SELECT * FROM user WHERE id = ?", (user_id,)).fetchone()
        )


@bp.route("/register", methods=("GET", "POST"))
def register():
    """Register a new user.

    Validates that the username is not already taken. Hashes the
    password for security.
    """
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        db = get_db()
        error = None

        if not username:
            error = "Username is required."
        elif not password:
            error = "Password is required."
        elif (
            db.execute("SELECT id FROM user WHERE username = ?", (username,)).fetchone()
            is not None
        ):
            error = "User {0} is already registered.".format(username)

        if error is None:
            # the name is available, store it in the database and go to
            # the login page
            db.execute(
                "INSERT INTO user (username, password) VALUES (?, ?)",
                (username, generate_password_hash(password)),
            )
            db.commit()
            return redirect(url_for("auth.login"))

        flash(error)

    return render_template("auth/register.html")


def get_solr(data):
    search = data["search"]
    category = data["category"]
    # if(category == ''):
    #     category = 'doi-song.chn'
    # if(category == ''):
    #     category = 'an-quay-di.chn'
    # if(category == ''):
    #     category = 'xa-hoi.chn'
    # if(category == ''):
    #     category = 'the-gioi.chn'
    # if(category == ''):
    #     category = 'sport.chn'
    # if(category == ''):
    #     category = 'hoc-duong.chn'
    # if(category == ''):
    #     category = 'cine.chn'
    # if(category == ''):
    #     category = 'tv-show.chn'
    # if(category == ''):
    #     category = 'star.chn'
    param={
        'q':'title:'+search+' OR content:'+search
        # 'fq':'cat:'+category
    }
    f = requests.post('http://localhost:8983/solr/coreaa/select',data=param)
    x = f.json()["response"]["docs"]
    return x

@bp.route("/login", methods=("GET", "POST"))
def login():
    """Log in a registered user by adding the user id to the session."""
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        db = get_db()
        error = None
        user = db.execute(
            "SELECT * FROM user WHERE username = ?", (username,)
        ).fetchone()

        if user is None:
            error = "Incorrect username."
        elif not check_password_hash(user["password"], password):
            error = "Incorrect password."

        if error is None:
            # store the user id in a new session and return to the index
            session.clear()
            session["user_id"] = user["id"]
            return redirect(url_for("index"))

        flash(error)

    return render_template("auth/login.html")


@bp.route("/search", methods=("GET", "POST"))
# @cross_origin()
def search():
    """Log in a registered user by adding the user id to the session."""
    if request.method == "POST":
        # print(request.get_json())
        data = request.get_json()
        # search = getattr(request.data, 'search')
        category = data["category"]
        search = data['search']
        x = {'search':search, "category":category}
        result = get_solr(x)
        # print(category)
        print(result)
        return jsonify(data=result)

    return render_template("auth/search.html")

    


@bp.route("/logout")
def logout():
    """Clear the current session, including the stored user id."""
    session.clear()
    return redirect(url_for("index"))

