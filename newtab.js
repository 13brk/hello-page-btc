// Update time
function updateTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeString = `${hours}:${minutes.toString().padStart(2, '0')}`;
    document.getElementById('time').textContent = timeString;
}

// Get random quote from Chuck Norris  API
async function updateQuote() {
    try {
        const response = await fetch('https://api.chucknorris.io/jokes/random');
        const data = await response.json();
        const quoteElement = document.getElementById('quote');
        const iconElement = document.getElementById('chuck-icon');

        quoteElement.textContent = data.value;
        iconElement.src = data.icon_url;
    } catch (error) {
        console.error('Error fetching Chuck Norris joke:', error);
        document.getElementById('quote').textContent = 'Loading...';
    }
}

// Update background using images from Bing Wallpaper API
async function updateBackground() {
    try {
        document.body.style.backgroundImage = `url(https://bingw.jasonzeng.dev/?index=random)`;

        // Update description if needed
        const descriptionElement = document.getElementById('image-description');
        if (descriptionElement) {
            descriptionElement.textContent = 'Random Bing Wallpaper';
        }
    } catch (error) {
        console.error('Error loading background:', error);
        // Fallback to a solid color if image fails to load
        document.body.style.backgroundColor = '#1a1a1a';
        document.getElementById('image-description').textContent = '';
    }
}

// Get user's preferred currency
function getPreferredCurrency() {
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency) return savedCurrency;

    // Get browser's locale currency
    const browserLocale = navigator.language;
    try {
        const currency = new Intl.NumberFormat(browserLocale, {
            style: 'currency',
            currency: 'USD'
        }).resolvedOptions().currency;
        return currency.toLowerCase();
    } catch (error) {
        return 'usd'; // fallback to USD
    }
}

// Format price according to locale
function formatPrice(price, currency) {
    const locale = navigator.language;
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

// Update Bitcoin price and animation
let countdownInterval;

function startCountdown() {
    let seconds = 60;
    const countdownElement = document.getElementById('countdown');

    // Clear any existing interval
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    // Update immediately
    countdownElement.textContent = `${seconds}s`;

    // Start the countdown
    countdownInterval = setInterval(() => {
        seconds--;
        countdownElement.textContent = `${seconds}s`;

        if (seconds <= 0) {
            clearInterval(countdownInterval);
            updateBitcoinPrice();
        }
    }, 1000);
}

async function updateBitcoinPrice() {
    const currency = getPreferredCurrency();
    const currencySelect = document.getElementById('currency-select');
    if (currencySelect.value !== currency) {
        currencySelect.value = currency;
    }

    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currency}`);
        const data = await response.json();
        const price = data.bitcoin[currency];
        document.getElementById('bitcoin-price').textContent = formatPrice(price, currency);
        startCountdown(); // Start a new countdown after updating the price
    } catch (error) {
        console.error('Error fetching Bitcoin price:', error);
        document.getElementById('bitcoin-price').textContent = 'Unavailable';
        startCountdown(); // Still start countdown even if there's an error
    }
}

// Handle currency change
function handleCurrencyChange(event) {
    const currency = event.target.value;
    localStorage.setItem('preferredCurrency', currency);
    updateBitcoinPrice(); // This will reset the countdown as well
}

// Update the updateBookmarks function
async function updateBookmarks() {
    try {
        if (!chrome?.bookmarks?.getChildren) {
            throw new Error('Bookmarks API not available');
        }

        const bookmarksBar = await chrome.bookmarks.getChildren('1');
        const bookmarksContainer = document.getElementById('bookmarks');

        const validBookmarks = bookmarksBar.filter(bookmark => bookmark.url);

        if (validBookmarks.length === 0) {
            bookmarksContainer.innerHTML = '<div class="bookmark-empty">No bookmarks found</div>';
            return;
        }

        bookmarksContainer.innerHTML = validBookmarks
            .map(bookmark => {
                try {
                    const url = new URL(bookmark.url);
                    const faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
                    return `
                        <a href="${bookmark.url}" class="bookmark-item" title="${bookmark.title}" target="_blank">
                            <img src="${faviconUrl}" class="bookmark-icon"
                                 alt="${bookmark.title}"
                                 onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔖</text></svg>'">
                        </a>
                    `;
                } catch (e) {
                    console.error('Error processing bookmark:', e);
                    return '';
                }
            })
            .join('');
    } catch (error) {
        console.error('Error fetching bookmarks:', error);
        const bookmarksContainer = document.getElementById('bookmarks');
        bookmarksContainer.innerHTML = '<div class="bookmark-empty">Unable to load bookmarks</div>';
    }
}

// Add this new function
function setupBackgroundClick() {
    document.body.addEventListener('click', (event) => {
        // Only trigger if clicking directly on the body, not on any containers
        if (event.target === document.body) {
            document.querySelectorAll('.container, .bookmarks-container, .quote-container').forEach(el => {
                el.classList.toggle('hidden');
            });
        }
    });
}

// Add CSS for the hidden class
function addHiddenStyle() {
    const style = document.createElement('style');
    style.textContent = `
        .hidden {
            opacity: 0;
            transition: opacity 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

// Update the init function to include the new setup
function init() {
    updateTime();
    updateQuote();
    updateBackground();
    updateBitcoinPrice();
    updateBookmarks();

    addHiddenStyle();
    setupBackgroundClick();

    // Set up currency selector
    const currencySelect = document.getElementById('currency-select');
    currencySelect.value = getPreferredCurrency();
    currencySelect.addEventListener('change', handleCurrencyChange);

    // Update time every minute
    setInterval(updateTime, 60000);
    // Update quote every hour
    setInterval(updateQuote, 3600000);
}

// Start when page loads
document.addEventListener('DOMContentLoaded', init);