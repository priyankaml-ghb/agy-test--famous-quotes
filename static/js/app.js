/**
 * Quotes Web Application - Vanilla JavaScript Client
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    selectedCategory: 'all',
    selectedAuthor: '',
    searchQuery: '',
    heroQuote: null,
  };

  // DOM Elements
  const heroCard = document.getElementById('random-quote-card');
  const heroText = document.getElementById('hero-text');
  const heroAuthor = document.getElementById('hero-author');
  const heroCategory = document.getElementById('hero-category');
  const newQuoteBtn = document.getElementById('new-quote-btn');
  const copyHeroBtn = document.getElementById('copy-hero-btn');

  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const authorSelect = document.getElementById('author-select');
  const categoryPills = document.getElementById('category-pills');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const emptyResetBtn = document.getElementById('empty-reset-btn');

  const quotesGrid = document.getElementById('quotes-grid');
  const resultsCount = document.getElementById('results-count');
  const resultsTitle = document.getElementById('results-title');
  const emptyState = document.getElementById('empty-state');
  const toast = document.getElementById('toast');

  let searchDebounceTimeout = null;
  let toastTimeout = null;

  // Initialize
  init();

  async function init() {
    await Promise.all([
      fetchCategories(),
      fetchAuthors(),
      fetchRandomQuote(),
      fetchQuotes(),
    ]);

    bindEvents();
  }

  // Event Listeners
  function bindEvents() {
    // Random quote button
    newQuoteBtn.addEventListener('click', () => {
      fetchRandomQuote();
    });

    // Copy hero quote
    copyHeroBtn.addEventListener('click', () => {
      if (state.heroQuote) {
        copyQuoteToClipboard(state.heroQuote.quote, state.heroQuote.author);
      }
    });

    // Hero category / author clicks filter directly
    heroCategory.addEventListener('click', () => {
      if (state.heroQuote) {
        setCategory(state.heroQuote.category);
      }
    });

    heroAuthor.addEventListener('click', () => {
      if (state.heroQuote) {
        setAuthor(state.heroQuote.author);
      }
    });

    // Real-time Search with Debounce
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';

      clearTimeout(searchDebounceTimeout);
      searchDebounceTimeout = setTimeout(() => {
        fetchQuotes();
      }, 250);
    });

    // Clear search
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      state.searchQuery = '';
      clearSearchBtn.style.display = 'none';
      fetchQuotes();
      searchInput.focus();
    });

    // Author selection
    authorSelect.addEventListener('change', (e) => {
      state.selectedAuthor = e.target.value;
      fetchQuotes();
    });

    // Reset filters
    resetFiltersBtn.addEventListener('click', resetAllFilters);
    emptyResetBtn.addEventListener('click', resetAllFilters);
  }

  // Fetch a random quote for Hero card
  async function fetchRandomQuote() {
    try {
      heroText.style.opacity = '0.5';
      const response = await fetch('/api/quotes/random');
      if (!response.ok) throw new Error('Failed to load random quote');
      const data = await response.json();
      state.heroQuote = data.quote;
      renderHeroQuote(data.quote);
    } catch (err) {
      console.error(err);
      heroText.textContent = 'Failed to load quote. Please try again.';
    } finally {
      heroText.style.opacity = '1';
    }
  }

  // Render hero quote
  function renderHeroQuote(quote) {
    heroText.textContent = quote.quote;
    heroAuthor.textContent = `— ${quote.author}`;
    heroCategory.textContent = quote.category;
  }

  // Fetch category list
  async function fetchCategories() {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();

      // Clear existing except 'All'
      categoryPills.innerHTML = '';

      // Add 'All' pill
      const allPill = createCategoryPill('all', 'All', data.total_quotes);
      allPill.classList.add('active');
      categoryPills.appendChild(allPill);

      data.categories.forEach((cat) => {
        const count = data.counts[cat] || 0;
        const pill = createCategoryPill(cat.toLowerCase(), cat, count);
        categoryPills.appendChild(pill);
      });
    } catch (err) {
      console.error(err);
    }
  }

  function createCategoryPill(categoryId, label, count) {
    const pill = document.createElement('button');
    pill.className = 'pill';
    pill.dataset.category = categoryId;
    pill.textContent = `${label} (${count})`;

    pill.addEventListener('click', () => {
      setCategory(categoryId);
    });

    return pill;
  }

  // Fetch authors list
  async function fetchAuthors() {
    try {
      const response = await fetch('/api/authors');
      if (!response.ok) throw new Error('Failed to fetch authors');
      const data = await response.json();

      authorSelect.innerHTML = '<option value="">All Authors</option>';
      data.authors.forEach((author) => {
        const count = data.counts[author] || 0;
        const opt = document.createElement('option');
        opt.value = author;
        opt.textContent = `${author} (${count})`;
        authorSelect.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Fetch Quotes matching search and filters
  async function fetchQuotes() {
    try {
      const params = new URLSearchParams();
      if (state.searchQuery) params.append('q', state.searchQuery);
      if (state.selectedAuthor) params.append('author', state.selectedAuthor);
      if (state.selectedCategory && state.selectedCategory !== 'all') {
        params.append('category', state.selectedCategory);
      }

      const url = `/api/quotes?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch quotes');
      const data = await response.json();

      renderQuotesGrid(data.quotes, data.total);
    } catch (err) {
      console.error(err);
    }
  }

  // Render quotes cards in grid
  function renderQuotesGrid(quotes, total) {
    quotesGrid.innerHTML = '';

    // Update count & headers
    resultsCount.textContent = `Showing ${quotes.length} of ${total} ${total === 1 ? 'quote' : 'quotes'}`;

    let title = 'Explore Quotes';
    if (state.selectedAuthor) {
      title = `Quotes by ${state.selectedAuthor}`;
    } else if (state.selectedCategory !== 'all') {
      const capCat = state.selectedCategory.charAt(0).toUpperCase() + state.selectedCategory.slice(1);
      title = `${capCat} Quotes`;
    } else if (state.searchQuery) {
      title = `Results for "${state.searchQuery}"`;
    }
    resultsTitle.textContent = title;

    if (quotes.length === 0) {
      emptyState.classList.remove('hidden');
      quotesGrid.style.display = 'none';
      return;
    }

    emptyState.classList.add('hidden');
    quotesGrid.style.display = 'grid';

    quotes.forEach((quote) => {
      const card = createQuoteCard(quote);
      quotesGrid.appendChild(card);
    });
  }

  // Create single quote card element
  function createQuoteCard(quote) {
    const card = document.createElement('article');
    card.className = 'quote-card';

    // Top Bar
    const topBar = document.createElement('div');
    topBar.className = 'quote-card-top';

    const catBadge = document.createElement('span');
    catBadge.className = 'card-category-badge';
    catBadge.textContent = quote.category;
    catBadge.title = `Filter by ${quote.category}`;
    catBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      setCategory(quote.category.toLowerCase());
    });
    topBar.appendChild(catBadge);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-card-btn';
    copyBtn.title = 'Copy quote';
    copyBtn.setAttribute('aria-label', 'Copy quote');
    copyBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyQuoteToClipboard(quote.quote, quote.author);
    });
    topBar.appendChild(copyBtn);

    // Text
    const textEl = document.createElement('p');
    textEl.className = 'quote-card-text';
    textEl.textContent = `“${quote.quote}”`;

    // Bottom Bar
    const bottomBar = document.createElement('div');
    bottomBar.className = 'quote-card-bottom';

    const authorEl = document.createElement('cite');
    authorEl.className = 'card-author';
    authorEl.textContent = `— ${quote.author}`;
    authorEl.title = `Filter quotes by ${quote.author}`;
    authorEl.addEventListener('click', (e) => {
      e.stopPropagation();
      setAuthor(quote.author);
    });
    bottomBar.appendChild(authorEl);

    card.appendChild(topBar);
    card.appendChild(textEl);
    card.appendChild(bottomBar);

    return card;
  }

  // Helper: Set category filter
  function setCategory(categoryId) {
    state.selectedCategory = categoryId.toLowerCase();

    // Update active pill
    document.querySelectorAll('.pill').forEach((pill) => {
      if (pill.dataset.category.toLowerCase() === state.selectedCategory) {
        pill.classList.add('active');
        pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        pill.classList.remove('active');
      }
    });

    fetchQuotes();
  }

  // Helper: Set author filter
  function setAuthor(author) {
    state.selectedAuthor = author;
    authorSelect.value = author;
    fetchQuotes();
  }

  // Helper: Reset all filters
  function resetAllFilters() {
    state.selectedCategory = 'all';
    state.selectedAuthor = '';
    state.searchQuery = '';

    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    authorSelect.value = '';

    document.querySelectorAll('.pill').forEach((pill) => {
      if (pill.dataset.category === 'all') {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    fetchQuotes();
  }

  // Helper: Copy quote to clipboard & show toast
  async function copyQuoteToClipboard(quoteText, author) {
    const formatted = `"${quoteText}" — ${author}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(formatted);
      } else {
        // Fallback for non-https or older environments
        const textArea = document.createElement('textarea');
        textArea.value = formatted;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      showToast('Quote copied to clipboard!');
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      showToast('Copied!');
    }
  }

  // Helper: Toast notification
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }
});
