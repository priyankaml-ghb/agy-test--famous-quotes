# 100 Quotes Web Application

A web application built using **Python Flask**, **plain vanilla JavaScript**, **HTML5**, and modern **CSS3**. It displays curated quotes from 100 well-known philosophers, scientists, writers, and leaders, with instant random quote generation, author searching, and category filtering.

---

## Features

- **100 Curated Quotes**: Diverse dataset across *Philosophy, Science, Literature, Leadership, Motivation, Wisdom, and Art*.
- **Random Quote Generator**: Click "Get Random Quote" to instantly fetch and display a new inspiring quote.
- **Author Search & Filter**: Search quotes by author name or use the author dropdown selector with real-time count badges.
- **Category Filtering**: Interactive category pills allowing quick filtering (e.g. *Philosophy (21)*, *Wisdom (20)*, *Science (11)*).
- **Free-Text Search**: Instant search bar with debouncing across quotes, authors, and categories.
- **Copy to Clipboard**: One-click copy for both the featured hero quote and any card in the grid, complete with toast notifications.
- **Zero JS Frameworks**: 100% vanilla JavaScript, clean DOM manipulation, and asynchronous `fetch` calls.

---

## Project Structure

```text
quote-app/
├── app.py                  # Flask backend with REST API routes
├── data/
│   └── quotes.json         # Curated 100 quotes dataset
├── requirements.txt        # Dependencies (Flask, pytest)
├── pytest.ini              # Pytest configuration
├── static/
│   ├── css/
│   │   └── style.css       # Responsive styling & typography
│   └── js/
│       └── app.js          # Vanilla JavaScript client logic
├── templates/
│   └── index.html          # Semantic HTML5 layout
└── tests/
    └── test_app.py         # Pytest test suite (10 test cases)
```

---

## Quickstart

### 1. Activate the Virtual Environment
```bash
cd quote-app
source .venv/bin/activate
```
*(If setting up on a new machine, run `python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`)*

### 2. Run the Web Application
```bash
python3 app.py
```
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

### 3. Run Automated Tests
```bash
pytest
```
All 10 unit and integration tests will run and validate the dataset integrity, API endpoints, search filters, and templates.

---

## REST API Endpoints

- `GET /`: Serves the web UI.
- `GET /api/quotes/random`: Returns a random quote (supports optional `?category=` and `?author=` params).
- `GET /api/quotes`: Returns quotes filtered by `?q=`, `?author=`, and `?category=`.
- `GET /api/categories`: Returns all categories and their respective quote counts.
- `GET /api/authors`: Returns all authors and their quote counts.
