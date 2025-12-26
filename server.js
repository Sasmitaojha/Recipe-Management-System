const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });


const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '../client')));

// --- Auth Routes ---

app.post('/api/register', async (req, res) => {
    const { username, email, password, preferences, cookingSkill } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (username, email, password_hash, preferences, cooking_skill) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, JSON.stringify(preferences || {}), cookingSkill || 'intermediate']
        );
        res.status(201).json({ message: 'User registered', userId: result.insertId });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Username or Email already exists. Please Login.' });
        }
        res.status(500).json({ message: 'Error registering user' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body; // 'email' holds the input value (email or username)
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, email]);
        if (users.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, username: user.username, preferences: user.preferences } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Login failed' });
    }
});

// --- Recipe Routes ---

app.get('/api/recipes', async (req, res) => {
    const { q, diet, cuisine } = req.query;
    const apiKey = process.env.SPOONACULAR_API_KEY;

    // Simulate API call if no key provided (Fallback Mode)
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
        return res.json({
            results: [
                { id: 101, title: 'Pasta Carbonara (Mock)', image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=600&q=80', summary: 'A classic creamy pasta dish.', readyInMinutes: 30, servings: 2 },
                { id: 104, title: 'Chicken Biryani (Mock)', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80', summary: 'Aromatic basmati rice with spiced chicken.', readyInMinutes: 60, servings: 4 },
                { id: 105, title: 'Chocolate Lava Cake (Mock)', image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=600&q=80', summary: 'Decadent chocolate cake with a molten center.', readyInMinutes: 25, servings: 2 },
                { id: 102, title: 'Veggie Burger (Mock)', image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=600&q=80', summary: 'Healthy veggie burger.', readyInMinutes: 20, servings: 1 },
                { id: 103, title: 'Sushi Roll (Mock)', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80', summary: 'Fresh fancy sushi.', readyInMinutes: 45, servings: 4 },
                { id: 106, title: 'Street Tacos (Mock)', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80', summary: 'Authentic Mexican street tacos.', readyInMinutes: 20, servings: 3 },
                { id: 107, title: 'Classic Pizza Margherita (Mock)', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80', summary: 'Simple and delicious Italian pizza.', readyInMinutes: 40, servings: 2 },
                { id: 108, title: 'Shrimp Pad Thai (Mock)', image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=600&q=80', summary: 'Tangy and sweet noodle stir-fry.', readyInMinutes: 35, servings: 2 },
                { id: 109, title: 'Fluffy Pancakes (Mock)', image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80', summary: 'Perfect breakfast stack.', readyInMinutes: 15, servings: 4 },
                { id: 110, title: 'Chicken Caesar Salad (Mock)', image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=600&q=80', summary: 'Fresh salad with grilled chicken.', readyInMinutes: 20, servings: 1 },
                { id: 111, title: 'Spicy Ramen Bowl (Mock)', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80', summary: 'Warm and comforting noodle soup.', readyInMinutes: 50, servings: 2 },
                { id: 112, title: 'Grilled Beef Steak (Mock)', image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=600&q=80', summary: 'Juicy steak with herbs.', readyInMinutes: 30, servings: 2 },
                { id: 113, title: 'Avocado Toast (Mock)', image: 'https://images.unsplash.com/photo-1588137372308-15f75323ca8d?auto=format&fit=crop&w=600&q=80', summary: 'Healthy and trendy breakfast.', readyInMinutes: 10, servings: 1 },
                { id: 114, title: 'New York Cheesecake (Mock)', image: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?auto=format&fit=crop&w=600&q=80', summary: 'Creamy classic cheesecake.', readyInMinutes: 90, servings: 8 },
                { id: 115, title: 'Berry Smoothie Bowl (Mock)', image: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=600&q=80', summary: 'Refreshing fruit smoothie bowl.', readyInMinutes: 10, servings: 1 },
                { id: 116, title: 'Butter Chicken (Mock)', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80', summary: 'Creamy tomato curry with tender chicken.', readyInMinutes: 45, servings: 4 },
                { id: 117, title: 'Paneer Tikka Masala (Mock)', image: 'https://images.unsplash.com/photo-1567188040706-fb8d89f3d9b6?auto=format&fit=crop&w=600&q=80', summary: 'Vegetarian cottage cheese in spiced gravy.', readyInMinutes: 40, servings: 4 },
                { id: 118, title: 'Masala Dosa (Mock)', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', summary: 'Crispy crepe with potato filling.', readyInMinutes: 30, servings: 3 },
                { id: 119, title: 'Eggs Benedict (Mock)', image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=600&q=80', summary: 'Classic breakfast with hollandaise sauce.', readyInMinutes: 25, servings: 2 },
                { id: 120, title: 'Belgian Waffles (Mock)', image: 'https://images.unsplash.com/photo-1558584724-0e4d32ca00a4?auto=format&fit=crop&w=600&q=80', summary: 'Crispy waffles with berries and syrup.', readyInMinutes: 20, servings: 4 },
                { id: 121, title: 'French Toast (Mock)', image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=600&q=80', summary: 'Golden brioche french toast.', readyInMinutes: 15, servings: 2 },
                { id: 122, title: 'Club Sandwich (Mock)', image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80', summary: 'Triple-decker classic lunch sandwich.', readyInMinutes: 10, servings: 1 },
                { id: 123, title: 'Greek Salad (Mock)', image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80', summary: 'Fresh salad with feta and olives.', readyInMinutes: 10, servings: 2 },
                { id: 124, title: 'Tomato Soup & Grilled Cheese (Mock)', image: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80', summary: 'Comforting lunch combo.', readyInMinutes: 20, servings: 2 },
                { id: 125, title: 'Roast Chicken (Mock)', image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=600&q=80', summary: 'Herb-roasted whole chicken.', readyInMinutes: 90, servings: 4 },
                { id: 126, title: 'Grilled Salmon (Mock)', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a3a2720?auto=format&fit=crop&w=600&q=80', summary: 'Healthy dinner with asparagus.', readyInMinutes: 25, servings: 2 },
                { id: 127, title: 'Vegetable Lasagna (Mock)', image: 'https://images.unsplash.com/photo-1574868233977-458734e5c147?auto=format&fit=crop&w=600&q=80', summary: 'Cheesy layered pasta dinner.', readyInMinutes: 60, servings: 6 }
            ]
        });
    }

    try {
        const response = await axios.get('https://api.spoonacular.com/recipes/complexSearch', {
            params: {
                apiKey,
                query: q,
                diet,
                cuisine,
                addRecipeInformation: true,
                number: 9
            }
        });
        res.json(response.data);
    } catch (err) {
        console.error('API Error:', err.message);
        res.status(500).json({ message: 'External API Error' });
    }
});

// Get Recipe Details (with Caching)
app.get('/api/recipes/:id', async (req, res) => {
    const { id } = req.params;
    const apiKey = process.env.SPOONACULAR_API_KEY;

    // 1. Check Cache
    try {
        const [rows] = await db.query('SELECT data, cached_at FROM recipe_cache WHERE recipe_id = ?', [id]);
        if (rows.length > 0) {
            // Check expiry (e.g., 24 hours)
            const cachedTime = new Date(rows[0].cached_at).getTime();
            const now = new Date().getTime();
            if (now - cachedTime < 24 * 60 * 60 * 1000) {
                console.log(`Serving recipe ${id} from cache`);
                return res.json(JSON.parse(rows[0].data)); // Return cached data
            }
        }
    } catch (err) {
        console.error('Cache read error:', err);
    }

    // 2. Fetch from API
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
        // Mock Response
        // Mock Response
        if (id == 101) {
            return res.json({
                id: 101,
                title: 'Pasta Carbonara (Mock)',
                image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=600&q=80',
                summary: 'Mock Pasta Carbonara description...',
                extendedIngredients: [
                    { original: '200 g spaghetti pasta' },
                    { original: '2 tbsp olive oil' },
                    { original: '3 cloves garlic (finely chopped)' },
                    { original: '1 cup fresh cream' },
                    { original: '1/2 cup grated cheese' },
                    { original: '1 tsp black pepper' }
                ],
                analyzedInstructions: [{
                    steps: [
                        { step: 'Boil the spaghetti in salted water until al dente. Drain and keep aside.' },
                        { step: 'Heat olive oil in a pan and sauté garlic until lightly golden.' },
                        { step: 'Lower the heat and add fresh cream, stirring continuously.' },
                        { step: 'Add grated cheese, salt, and black pepper. Mix well.' },
                        { step: 'Add the cooked pasta and toss until evenly coated.' }
                    ]
                }]
            });
        }
        if (id == 104) {
            return res.json({
                id: 104,
                title: 'Chicken Biryani (Mock)',
                image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80',
                summary: 'Rich and aromatic Chicken Biryani...',
                extendedIngredients: [
                    { original: '500g Chicken' },
                    { original: '2 cups Basmati Rice' },
                    { original: '1 cup Yogurt' },
                    { original: 'Spices (Cardamom, Clove, Cinnamon)' },
                    { original: 'Saffron milk' },
                    { original: 'Fried Onions' }
                ],
                analyzedInstructions: [{
                    steps: [
                        { step: 'Marinate chicken with yogurt and spices for 1 hour.' },
                        { step: 'Par-boil rice with whole spices.' },
                        { step: 'Layer chicken and rice in a pot.' },
                        { step: 'Add saffron milk and fried onions.' },
                        { step: 'Cook on low heat (dum) for 30 minutes.' }
                    ]
                }]
            });
        }
        if (id == 105) {
            return res.json({
                id: 105,
                title: 'Chocolate Lava Cake (Mock)',
                image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=600&q=80',
                summary: 'Warm chocolate cake with a gooey center...',
                extendedIngredients: [
                    { original: '100g Dark Chocolate' },
                    { original: '100g Butter' },
                    { original: '2 Eggs' },
                    { original: '2 tbsp Sugar' },
                    { original: '2 tbsp Flour' }
                ],
                analyzedInstructions: [{
                    steps: [
                        { step: 'Melt chocolate and butter together.' },
                        { step: 'Whisk eggs and sugar until pale.' },
                        { step: 'Fold in melted chocolate and flour.' },
                        { step: 'Pour into greased ramekins.' },
                        { step: 'Bake at 200°C for 10-12 minutes provided center is still wobbly.' }
                    ]
                }]
            });
        }

        // Detailed Indian Recipes
        if (id == 116) {
            return res.json({
                id: 116,
                title: 'Butter Chicken (Mock)',
                image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80',
                summary: 'Delicious North Indian curry...',
                extendedIngredients: [
                    { original: '500g Chicken Thighs' }, { original: '1 cup Tomato Puree' }, { original: '1/2 cup Heavy Cream' }, { original: '2 tbsp Butter' }, { original: 'Garam Masala' }
                ],
                analyzedInstructions: [{
                    steps: [
                        { step: 'Marinate chicken in yogurt and spices.' },
                        { step: 'Cook chicken in tandoor or pan.' },
                        { step: 'Simmer tomato sauce with butter and cream.' },
                        { step: 'Add chicken to sauce and cook.' }
                    ]
                }]
            });
        }
        if (id == 117) {
            return res.json({
                id: 117,
                title: 'Paneer Tikka Masala (Mock)',
                image: 'https://images.unsplash.com/photo-1567188040706-fb8d89f3d9b6?auto=format&fit=crop&w=600&q=80',
                summary: 'Popular vegetarian Indian dish...',
                extendedIngredients: [
                    { original: '250g Paneer Cubes' }, { original: '1 cup Yogurt' }, { original: '2 Onions' }, { original: '2 Tomatoes' }, { original: 'Spices' }
                ],
                analyzedInstructions: [{
                    steps: [
                        { step: 'Marinate paneer cubes.' },
                        { step: 'Grill or shallow fry paneer.' },
                        { step: 'Prepare masala gravy with onions and tomatoes.' },
                        { step: 'Mix paneer into gravy.' }
                    ]
                }]
            });
        }
        if (id == 118) {
            return res.json({
                id: 118,
                title: 'Masala Dosa (Mock)',
                image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
                summary: 'South Indian breakfast classic...',
                extendedIngredients: [
                    { original: '2 cups Dosa Batter' }, { original: '4 Potatoes (boiled)' }, { original: '1 Onion' }, { original: 'Mustard Seeds' }, { original: 'Curry Leaves' }
                ],
                analyzedInstructions: [{
                    steps: [
                        { step: 'Prepare potato masala filling.' },
                        { step: 'Spread batter on hot griddle.' },
                        { step: 'Add oil and cook until crisp.' },
                        { step: 'Place filling inside and fold.' }
                    ]
                }]
            });
        }

        // Add details for new mock recipes 106-127 (generic fallback)
        if (id >= 106 && id <= 127) {
            return res.json({
                id: parseInt(id),
                title: `Mock Recipe ${id}`,
                image: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=600&q=80', // Generic food image
                summary: 'Delicious mock recipe details...',
                extendedIngredients: [
                    { original: 'Ingredient 1' }, { original: 'Ingredient 2' }, { original: 'Ingredient 3' }
                ],
                analyzedInstructions: [{
                    steps: [
                        { step: 'Prepare ingredients.' },
                        { step: 'Cook carefully.' },
                        { step: 'Serve and enjoy.' }
                    ]
                }]
            });
        }

        return res.json({
            id,
            title: `Mock Recipe ${id}`,
            extendedIngredients: [{ original: '1 cup mock flour' }],
            analyzedInstructions: [{ steps: [{ step: 'Mix mock ingredients.' }] }]
        });
    }

    try {
        const response = await axios.get(`https://api.spoonacular.com/recipes/${id}/information`, {
            params: { apiKey }
        });
        const data = response.data;

        // 3. Save to Cache
        try {
            await db.query(
                'INSERT INTO recipe_cache (recipe_id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = ?, cached_at = CURRENT_TIMESTAMP',
                [id, JSON.stringify(data), JSON.stringify(data)]
            );
        } catch (err) {
            console.error('Cache write error:', err);
        }

        res.json(data);
    } catch (err) {
        console.error('API Error:', err.message);
        res.status(500).json({ message: 'External API Error' });
    }
});

// --- Review Routes ---
// Get reviews for a recipe
app.get('/api/reviews/:recipeId', async (req, res) => {
    const { recipeId } = req.params;
    try {
        const [reviews] = await db.query(
            'SELECT r.*, u.username FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.recipe_id = ? ORDER BY r.created_at DESC',
            [recipeId]
        );
        res.json(reviews);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching reviews' });
    }
});

// Post a review
app.post('/api/reviews', async (req, res) => {
    // Basic auth check inline for simplicity, or use middleware 
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    let userId;
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    const { recipeId, rating, comment } = req.body;
    if (!recipeId || !rating) return res.status(400).json({ message: 'Missing fields' });

    try {
        await db.query(
            'INSERT INTO reviews (user_id, recipe_id, rating, comment) VALUES (?, ?, ?, ?)',
            [userId, recipeId, rating, comment]
        );
        res.status(201).json({ message: 'Review added' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error adding review' });
    }
});

// Health check
app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1');
        res.json({ status: 'ok', db: 'connected' });
    } catch (err) {
        console.error('Database connection failed:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
