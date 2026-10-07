import json
import os
import pytest
from app import app, DATA_FILE


@pytest.fixture
def client():
    """Create Flask test client."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_dataset_integrity():
    """Verify that quotes.json contains exactly 100 valid quotes."""
    assert os.path.exists(DATA_FILE), "quotes.json file does not exist"
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        quotes = json.load(f)

    assert len(quotes) == 100, f"Expected 100 quotes, found {len(quotes)}"

    seen_ids = set()
    for quote in quotes:
        assert "id" in quote and isinstance(quote["id"], int)
        assert "quote" in quote and isinstance(quote["quote"], str) and len(quote["quote"].strip()) > 0
        assert "author" in quote and isinstance(quote["author"], str) and len(quote["author"].strip()) > 0
        assert "category" in quote and isinstance(quote["category"], str) and len(quote["category"].strip()) > 0

        assert quote["id"] not in seen_ids, f"Duplicate quote id: {quote['id']}"
        seen_ids.add(quote["id"])


def test_index_route(client):
    """Test that the index HTML page loads successfully."""
    response = client.get("/")
    assert response.status_code == 200
    html = response.get_data(as_text=True)
    assert "Quotes of Wisdom" in html
    assert "random-quote-card" in html
    assert "search-input" in html


def test_random_quote(client):
    """Test the random quote API endpoint."""
    response = client.get("/api/quotes/random")
    assert response.status_code == 200
    data = response.get_json()
    assert "quote" in data
    assert "id" in data["quote"]
    assert "quote" in data["quote"]
    assert "author" in data["quote"]
    assert "category" in data["quote"]


def test_random_quote_filtered(client):
    """Test random quote API with category and author filtering."""
    # Category filter
    response = client.get("/api/quotes/random?category=philosophy")
    assert response.status_code == 200
    data = response.get_json()
    assert data["quote"]["category"].lower() == "philosophy"

    # Non-existent category
    bad_response = client.get("/api/quotes/random?category=nonexistent_xyz")
    assert bad_response.status_code == 404


def test_get_all_quotes(client):
    """Test fetching all quotes without filters."""
    response = client.get("/api/quotes")
    assert response.status_code == 200
    data = response.get_json()
    assert data["total"] == 100
    assert len(data["quotes"]) == 100


def test_filter_by_author(client):
    """Test filtering quotes by author."""
    response = client.get("/api/quotes?author=Einstein")
    assert response.status_code == 200
    data = response.get_json()
    assert data["total"] > 0
    for q in data["quotes"]:
        assert "einstein" in q["author"].lower()


def test_filter_by_category(client):
    """Test filtering quotes by category."""
    response = client.get("/api/quotes?category=science")
    assert response.status_code == 200
    data = response.get_json()
    assert data["total"] > 0
    for q in data["quotes"]:
        assert q["category"].lower() == "science"


def test_search_keyword(client):
    """Test free-text search query."""
    response = client.get("/api/quotes?q=wisdom")
    assert response.status_code == 200
    data = response.get_json()
    assert data["total"] > 0
    for q in data["quotes"]:
        match = (
            "wisdom" in q["quote"].lower()
            or "wisdom" in q["author"].lower()
            or "wisdom" in q["category"].lower()
        )
        assert match


def test_categories_endpoint(client):
    """Test categories listing endpoint."""
    response = client.get("/api/categories")
    assert response.status_code == 200
    data = response.get_json()
    assert "categories" in data
    assert "counts" in data
    assert data["total_quotes"] == 100
    assert sum(data["counts"].values()) == 100
    assert "Philosophy" in data["categories"]
    assert "Science" in data["categories"]


def test_authors_endpoint(client):
    """Test authors listing endpoint."""
    response = client.get("/api/authors")
    assert response.status_code == 200
    data = response.get_json()
    assert "authors" in data
    assert "counts" in data
    assert data["total_authors"] > 0
    assert sum(data["counts"].values()) == 100
