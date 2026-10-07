import json
import os
import random
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Path to the quotes dataset
DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "quotes.json")


def load_quotes():
    """Load quotes from the JSON data file."""
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


# In-memory quotes cache
QUOTES = load_quotes()


@app.route("/")
def index():
    """Render the main application page."""
    return render_template("index.html")


@app.route("/api/quotes/random", methods=["GET"])
def get_random_quote():
    """
    Get a random quote.
    Optional query parameters:
      - category: filter by category before random selection
      - author: filter by author before random selection
    """
    category = request.args.get("category", "").strip().lower()
    author = request.args.get("author", "").strip().lower()

    pool = QUOTES
    if category:
        pool = [q for q in pool if q["category"].lower() == category]
    if author:
        pool = [q for q in pool if author in q["author"].lower()]

    if not pool:
        return (
            jsonify(
                {
                    "error": "No quotes found matching the specified criteria.",
                    "quote": None,
                }
            ),
            404,
        )

    selected = random.choice(pool)
    return jsonify({"quote": selected})


@app.route("/api/quotes", methods=["GET"])
def get_quotes():
    """
    Search and filter quotes.
    Query parameters:
      - q: search query matching quote text or author
      - author: filter by author name
      - category: filter by category
    """
    q = request.args.get("q", "").strip().lower()
    author = request.args.get("author", "").strip().lower()
    category = request.args.get("category", "").strip().lower()

    results = QUOTES

    if category and category != "all":
        results = [quote for quote in results if quote["category"].lower() == category]

    if author:
        results = [quote for quote in results if author in quote["author"].lower()]

    if q:
        results = [
            quote
            for quote in results
            if q in quote["quote"].lower()
            or q in quote["author"].lower()
            or q in quote["category"].lower()
        ]

    return jsonify(
        {
            "total": len(results),
            "quotes": results,
        }
    )


@app.route("/api/categories", methods=["GET"])
def get_categories():
    """Return all unique categories sorted alphabetically with counts."""
    counts = {}
    for quote in QUOTES:
        cat = quote["category"]
        counts[cat] = counts.get(cat, 0) + 1

    categories = sorted(counts.keys())
    return jsonify(
        {
            "categories": categories,
            "counts": counts,
            "total_quotes": len(QUOTES),
        }
    )


@app.route("/api/authors", methods=["GET"])
def get_authors():
    """Return all unique authors sorted alphabetically with counts."""
    counts = {}
    for quote in QUOTES:
        auth = quote["author"]
        counts[auth] = counts.get(auth, 0) + 1

    authors = sorted(counts.keys())
    return jsonify(
        {
            "authors": authors,
            "counts": counts,
            "total_authors": len(authors),
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
