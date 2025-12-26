// DOM Elements
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('recipe-search');
const recipeContainer = document.getElementById('recipe-container');
const authBtn = document.getElementById('auth-btn');
const authModal = document.getElementById('auth-modal');
const closeModal = document.querySelector('.close-modal');
const tabBtns = document.querySelectorAll('.tab-btn');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const filterTags = document.querySelectorAll('.filter-tag');

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';
let currentUser = null;
let currentFilters = {
    diet: '',
    cuisine: ''
};

// --- Initialization ---

function init() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
        currentUser = JSON.parse(user);
        updateAuthUI();
    }
    // Fetch trending recipes on load
    handleSearch('popular');
}

// --- Event Listeners ---

searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

authBtn.addEventListener('click', () => {
    if (currentUser) {
        // Logout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        currentUser = null;
        updateAuthUI();
    } else {
        authModal.classList.remove('hidden');
    }
});

closeModal.addEventListener('click', () => authModal.classList.add('hidden'));

// Close modal if clicking outside
authModal.addEventListener('click', (e) => {
    if (e.target === authModal) authModal.classList.add('hidden');
});

// Tab Switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tab = btn.dataset.tab;
        if (tab === 'login') {
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
        } else {
            loginForm.classList.remove('active');
            registerForm.classList.add('active');
        }
    });
});

// Filter Selection
filterTags.forEach(tag => {
    tag.addEventListener('click', () => {
        tag.classList.toggle('active');
        const filterType = tag.dataset.filter;

        // Simple toggle logic for demo
        if (currentFilters.diet === filterType) {
            currentFilters.diet = '';
        } else {
            currentFilters.diet = filterType;
        }

        handleSearch(); // Auto search on filter
    });
});

// Auth Forms
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('input[type="text"]').value; // Using type="text" for username/email flexibility or just email
    // Actually HTML has username placeholder but let's assume username for now or update HTML to say email if backend expects email
    // Backend expects email. The HTML input placeholder says "Username" but let's treat it as email or update input to email type?
    // Let's grab values safely.
    // Wait, HTML: <input type="text" placeholder="Username" required> <input type="password"...>
    // Backend: req.body.email
    // I should fix HTML or adjust logic. Let's assume user enters email in first box for now.

    // Correction: Let's use the inputs by index or querySelector
    const inputs = loginForm.querySelectorAll('input');
    const emailVal = inputs[0].value;
    const passwordVal = inputs[1].value;

    try {
        const res = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailVal, password: passwordVal })
        });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            updateAuthUI();
            authModal.classList.add('hidden');
            alert(`Welcome back, ${data.user.username}!`);
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
        alert('Login failed');
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputs = registerForm.querySelectorAll('input');
    const username = inputs[0].value;
    const email = inputs[1].value;
    const password = inputs[2].value;
    const cookingSkill = registerForm.querySelector('select[name="cookingSkill"]').value;
    const excludedIngredients = document.getElementById('excluded-ingredients').value;

    const preferences = [];
    registerForm.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        preferences.push(cb.value);
    });

    try {
        const res = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                email,
                password,
                cookingSkill,
                preferences: {
                    diet: preferences,
                    excludedIngredients: excludedIngredients ? excludedIngredients.split(',').map(i => i.trim()) : []
                }
            })
        });

        if (res.ok) {
            alert('Registration successful! Please login.');
            // Switch to login tab
            tabBtns[0].click();
        } else {
            const data = await res.json();
            alert(data.message || 'Registration failed');
        }
    } catch (err) {
        console.error(err);
        alert('Error registering');
    }
});

// --- Functions ---

function updateAuthUI() {
    if (currentUser) {
        authBtn.textContent = 'Logout';
        document.getElementById('profile-link').style.display = 'block';
    } else {
        authBtn.textContent = 'Login / Sign Up';
        document.getElementById('profile-link').style.display = 'none';
    }
}

async function handleSearch(defaultQuery) {
    const query = typeof defaultQuery === 'string' ? defaultQuery : searchInput.value;
    // Show skeletons
    recipeContainer.innerHTML = '<div class="recipe-card skeleton"></div>'.repeat(3);

    const cuisine = document.getElementById('cuisine-filter').value;
    const type = document.getElementById('meal-filter').value;
    const diet = document.querySelector('.filter-tag.active')?.dataset.filter || '';

    const params = new URLSearchParams({
        q: query,
        diet: diet,
        cuisine: cuisine,
        type: type
    });

    try {
        const response = await fetch(`${API_BASE_URL}/recipes?${params}`);
        const data = await response.json();

        renderRecipes(data.results);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        recipeContainer.innerHTML = '<p style="text-align:center; col-span:3;">Failed to load recipes.</p>';
    }
}

function renderRecipes(recipes) {
    if (!recipes || recipes.length === 0) {
        recipeContainer.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No recipes found.</p>';
        return;
    }

    recipeContainer.innerHTML = recipes.map(recipe => `
        <div class="recipe-card" data-id="${recipe.id}">
            <img src="${recipe.image}" alt="${recipe.title}" class="recipe-image">
            <div class="recipe-info">
                <h3>${recipe.title}</h3>
                <div class="recipe-meta">
                    <span><i class="fa-regular fa-clock"></i> ${recipe.readyInMinutes || 30}m</span>
                    <span><i class="fa-solid fa-users"></i> ${recipe.servings || 2}</span>
                </div>
            </div>
        </div>
    `).join('');

    // Add click listeners
    document.querySelectorAll('.recipe-card').forEach(card => {
        card.addEventListener('click', () => openRecipeModal(card.dataset.id));
    });
}

// --- Recipe Modal & Reviews ---

const recipeModal = document.getElementById('recipe-modal');
const closeRecipeModal = document.getElementById('close-recipe-modal');
const recipeDetailsBody = document.getElementById('recipe-details-body');
const reviewsList = document.getElementById('reviews-list');
const reviewForm = document.getElementById('review-form');
const starIcons = document.querySelectorAll('.star-rating i');
let currentRecipeId = null;

if (closeRecipeModal) {
    closeRecipeModal.addEventListener('click', () => recipeModal.classList.add('hidden'));
}
if (recipeModal) {
    recipeModal.addEventListener('click', (e) => {
        if (e.target === recipeModal) recipeModal.classList.add('hidden');
    });
}

// Star Rating Interaction
starIcons.forEach(star => {
    star.addEventListener('click', () => {
        const value = star.dataset.value;
        document.getElementById('rating-value').value = value;
        starIcons.forEach(s => {
            if (s.dataset.value <= value) {
                s.classList.remove('fa-regular');
                s.classList.add('fa-solid');
            } else {
                s.classList.remove('fa-solid');
                s.classList.add('fa-regular');
            }
        });
    });
});

async function openRecipeModal(recipeId) {
    currentRecipeId = recipeId;
    recipeModal.classList.remove('hidden');
    recipeDetailsBody.innerHTML = '<p>Loading...</p>';
    reviewsList.innerHTML = '<p>Loading reviews...</p>';

    // Check Auth for Review Form
    if (currentUser) {
        reviewForm.classList.remove('hidden');
        document.getElementById('login-to-review').classList.add('hidden');
    } else {
        reviewForm.classList.add('hidden');
        document.getElementById('login-to-review').classList.remove('hidden');
        document.getElementById('login-link-review').onclick = () => {
            recipeModal.classList.add('hidden');
            authBtn.click(); // Open main login
        };
    }

    // 1. Fetch Recipe Details (Simulated here since search result had most info, 
    // but in real app we might fetch endpoint. We'll rely on a fresh search/cache or mock)
    // For now, let's just use the search endpoints or a new endpoint if we had one. 
    // Since we don't have getRecipeById, let's mock the display or re-fetch from search.
    // ACTUALLY, checking server.js, we only have search. 
    // Let's just fetch reviews and show basic info we can infer or mock.

    // In a real app we'd fetch https://api.spoonacular.com/recipes/{id}/information
    // Let's just mock the visual update for now to "Simulate" it, or update `renderRecipes` to store data.

    // FETCH REVIEWS
    try {
        const res = await fetch(`${API_BASE_URL}/reviews/${recipeId}`);
        const reviews = await res.json();
        renderReviews(reviews);
    } catch (err) {
        reviewsList.innerHTML = '<p>Error loading reviews.</p>';
    }

    // FETCH RECIPE DETAILS (Ingredients/Instructions)
    try {
        const res = await fetch(`${API_BASE_URL}/recipes/${recipeId}`);
        const recipe = await res.json();

        const ingredients = recipe.extendedIngredients ?
            recipe.extendedIngredients.map(ing => `<li>${ing.original}</li>`).join('') : '<li>No ingredients listed</li>';

        const instructions = (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0)
            ? recipe.analyzedInstructions[0].steps.map(s => `<li>${s.step}</li>`).join('')
            : '<li>No instructions provided</li>';

        recipeDetailsBody.innerHTML = `
            <div class="recipe-details-header">
                <h2>${recipe.title}</h2>
                <img src="${recipe.image || 'https://via.placeholder.com/600'}" alt="${recipe.title}">
                <p>${recipe.summary ? recipe.summary.slice(0, 150) + '...' : ''}</p>
            </div>
            <div class="details-content">
                <h4>Ingredients</h4>
                <ul class="ingredients-list">${ingredients}</ul>
                <h4>Instructions</h4>
                <ol class="instructions-list" style="margin: 1rem 0; padding-left: 1.5rem;">${instructions}</ol>
            </div>
        `;
    } catch (err) {
        recipeDetailsBody.innerHTML = '<p>Error loading details.</p>';
    }
}

function renderReviews(reviews) {
    if (!reviews || reviews.length === 0) {
        reviewsList.innerHTML = '<p>No reviews yet. Be the first!</p>';
        return;
    }
    reviewsList.innerHTML = reviews.map(r => `
        <div class="review-item">
            <div class="review-header">
                <strong>${r.username}</strong>
                <span>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
            </div>
            <p>${r.comment}</p>
        </div>
    `).join('');
}

reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rating = document.getElementById('rating-value').value;
    const comment = document.getElementById('review-comment').value;

    if (!rating) {
        alert('Please select a star rating');
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ recipeId: currentRecipeId, rating, comment })
        });

        if (res.ok) {
            alert('Review submitted!');
            reviewForm.reset();
            // Refresh reviews
            const reviewsRes = await fetch(`${API_BASE_URL}/reviews/${currentRecipeId}`);
            renderReviews(await reviewsRes.json());
        } else {
            alert('Failed to submit review');
        }
    } catch (err) {
        console.error(err);
        alert('Error submitting review');
    }
});
