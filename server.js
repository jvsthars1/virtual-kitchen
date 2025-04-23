const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
const url = require('url');
const bcrypt = require('bcryptjs');

// Connect to MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'u-230235494',
  password: 's2fvi58sF0KH3qv',
  database: 'u_230235494_db'
});



db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to MySQL database!');
  }
});

// Helper: Build Navbar based on login status
function buildNavbar(isLoggedIn) {
  return `
  <div class="logo">
    <a href="/home"><img src="/public/images/logo.jpg" alt="Logo"></a>
  </div>
  <ul>
    <li><a href="/home">Home</a></li>
    <li><a href="/viewRecipes">Recipes</a></li>
    ${isLoggedIn ? `
    <li><a href="/addRecipe">Add Recipe</a></li>
    <li><a href="/dashboard">Dashboard</a></li>
    <li><a href="/logout">Logout</a></li>` : `
    <li><a href="/register">Register</a></li>
    <li><a href="/login">Login</a></li>`}
  </ul>
  <form action="/viewRecipes" method="GET" class="search-form">
    <input type="text" name="search" placeholder="Search Recipes..." required>
    <button type="submit">🔍</button>
  </form>
  `;
}

// Create server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const cookies = req.headers.cookie || '';
  const isLoggedIn = cookies.includes('loggedIn=true');

  if (req.method === 'GET') {
    if (parsedUrl.pathname === '/' || parsedUrl.pathname === '/home') {
      servePage(res, './views/home.html', isLoggedIn);
    } else if (parsedUrl.pathname === '/login') {
      servePage(res, './views/login.html', isLoggedIn);
    } else if (parsedUrl.pathname === '/register') {
      servePage(res, './views/register.html', isLoggedIn);
    } else if (parsedUrl.pathname === '/dashboard') {
      servePage(res, './views/dashboard.html', isLoggedIn);
    } else if (parsedUrl.pathname === '/addRecipe') {
      if (isLoggedIn) {
        servePage(res, './views/addRecipe.html', isLoggedIn);
      } else {
        res.writeHead(302, { Location: '/login' });
        res.end();
      }
    } else if (parsedUrl.pathname === '/viewRecipes') {
      viewRecipes(req, res, isLoggedIn, cookies);
    } else if (parsedUrl.pathname === '/editRecipe') {
      serveEditRecipePage(req, res);
    } else if (parsedUrl.pathname === '/deleteRecipe') {
      handleDeleteRecipe(req, res);
    } else if (parsedUrl.pathname === '/recipeDetails') {
      viewSingleRecipe(req, res, isLoggedIn);
    } else if (parsedUrl.pathname === '/logout') {
      res.writeHead(302, {
        'Set-Cookie': 'loggedIn=false; Max-Age=0',
        Location: '/home'
      });
      res.end();
    } else if (parsedUrl.pathname.startsWith('/public/')) {
      serveStatic(res, '.' + parsedUrl.pathname);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Page Not Found');
    }

  } else if (req.method === 'POST') {
    if (parsedUrl.pathname === '/register') {
      handleRegister(req, res);
    } else if (parsedUrl.pathname === '/login') {
      handleLogin(req, res);
    } else if (parsedUrl.pathname === '/addRecipe') {
      handleAddRecipe(req, res);
    } else if (parsedUrl.pathname === '/editRecipe') {
      handleEditRecipe(req, res);
    }
  }
});

// Serve static pages with navbar replacement
function servePage(res, filepath, isLoggedIn) {
  fs.readFile(filepath, 'utf-8', (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading page');
    } else {
      const finalHtml = data.replace('<!--NAVBAR-->', buildNavbar(isLoggedIn));
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(finalHtml);
    }
  });
}

// Serve Static Files
function serveStatic(res, filepath) {
  const ext = path.extname(filepath);
  let contentType = 'text/plain';
  if (ext === '.css') contentType = 'text/css';
  if (ext === '.js') contentType = 'application/javascript';
  if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  if (ext === '.png') contentType = 'image/png';

  fs.readFile(filepath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}

// View All Recipes
function viewRecipes(req, res, isLoggedIn, cookies) {

  let sql = 'SELECT * FROM recipes';
  const search = url.parse(req.url, true).query.search;

  if (search) {
    sql = 'SELECT * FROM recipes WHERE name LIKE ? OR type LIKE ?';
  }

  const params = search ? [`%${search}%`, `%${search}%`] : [];

  db.query(sql, params, (err, results) => {
    if (err) {
      res.writeHead(500);
      res.end('Error fetching recipes');
      return;
    }

    let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Recipes</title>
      <link rel="stylesheet" href="/public/css/style.css">
    </head>
    <body>
      <header>
        <nav>
          ${buildNavbar(isLoggedIn)}
        </nav>
      </header>

      <main class="recipes">
        <h1>Our Recipes</h1>
    `;

    const uidMatch = cookies.match(/uid=(\d+)/);
const currentUid = uidMatch ? parseInt(uidMatch[1]) : null;

results.forEach(recipe => {
  html += `
    <div class="recipe">
      <h2 class="title">
        <a href="/recipeDetails?rid=${recipe.rid}">${recipe.name}</a>
      </h2>
      <p><strong>Type:</strong> ${recipe.type}</p>
      <p><strong>Description:</strong> ${recipe.description}</p>`;

  if (isLoggedIn && currentUid === recipe.uid) {
    html += `
      <div class="recipe-actions">
        <a href="/editRecipe?rid=${recipe.rid}">Edit</a> |
        <a href="/deleteRecipe?rid=${recipe.rid}" onclick="return confirm('Are you sure?')">Delete</a>
      </div>`;
  }

  html += `</div>`;
});

    

    html += `
      </main>
      <footer>
        <p style="text-align: center;">© 2025 My Virtual Kitchen</p>
      </footer>
    </body>
    </html>
    `;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  });
}

// View Single Recipe
function viewSingleRecipe(req, res, isLoggedIn) {
  const rid = url.parse(req.url, true).query.rid;
  if (!rid) {
    res.writeHead(400);
    res.end('Recipe ID missing.');
    return;
  }

  db.query('SELECT * FROM recipes WHERE rid = ?', [rid], (err, results) => {
    if (err || results.length === 0) {
      res.writeHead(404);
      res.end('Recipe not found.');
      return;
    }

    const recipe = results[0];
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${recipe.name} - Details</title>
      <link rel="stylesheet" href="/public/css/style.css">
    </head>
    <body>
      <header>
        <nav>
          ${buildNavbar(isLoggedIn)}
        </nav>
      </header>

      <main class="recipe-details">
        <h1>${recipe.name}</h1>
        <img src="/public/images/${recipe.image}" alt="${recipe.name}" style="max-width:400px;">
        <p><strong>Type:</strong> ${recipe.type}</p>
        <p><strong>Description:</strong> ${recipe.description}</p>
        <p><strong>Cooking Time:</strong> ${recipe.cookingtime} minutes</p>
        <div class="ingredient-list">
          <h3>Ingredients:</h3>
          <p>${recipe.ingredients}</p>
        </div>
        <h3>Instructions:</h3>
        <p>${recipe.instructions}</p>
      </main>

      <footer>
        <p style="text-align: center;">© 2025 My Virtual Kitchen</p>
      </footer>
    </body>
    </html>
    `;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  });
}
// --- Edit Recipe Page ---
function serveEditRecipePage(req, res) {
  const rid = url.parse(req.url, true).query.rid;
  if (!rid) {
    res.writeHead(302, { Location: '/viewRecipes' });
    res.end();
    return;
  }

  db.query('SELECT * FROM recipes WHERE rid = ?', [rid], (err, results) => {
    if (err || results.length === 0) {
      res.writeHead(404);
      res.end('Recipe not found');
      return;
    }

    const recipe = results[0];
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Edit Recipe</title>
        <link rel="stylesheet" href="/public/css/style.css">
      </head>
      <body>
        <header><nav>${buildNavbar(true)}</nav></header>
        <main style="margin: 30px auto; width: 400px;">
          <h1>Edit Recipe</h1>
          <form method="POST" action="/editRecipe">
            <input type="hidden" name="rid" value="${recipe.rid}" />
            <label>Name:</label><br>
            <input type="text" name="name" value="${recipe.name}" required><br><br>
            <label>Description:</label><br>
            <textarea name="description">${recipe.description}</textarea><br><br>
            <label>Type:</label><br>
            <input type="text" name="type" value="${recipe.type}" required><br><br>
            <label>Cooking Time:</label><br>
            <input type="number" name="cookingtime" value="${recipe.cookingtime}" required><br><br>
            <label>Ingredients:</label><br>
            <textarea name="ingredients">${recipe.ingredients}</textarea><br><br>
            <label>Instructions:</label><br>
            <textarea name="instructions">${recipe.instructions}</textarea><br><br>
            <button type="submit">Update</button>
          </form>
        </main>
      </body>
      </html>
    `;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  });
}

// --- Update Recipe ---
function handleEditRecipe(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const cookies = req.headers.cookie || '';
    const uidMatch = cookies.match(/uid=(\d+)/);
    const uid = uidMatch ? parseInt(uidMatch[1]) : null;

    if (!uid) {
      res.writeHead(401);
      res.end('Unauthorized: User not logged in');
      return;
    }

    const params = new URLSearchParams(body);
    const rid = params.get('rid');
    const name = params.get('name');
    const description = params.get('description');
    const type = params.get('type');
    const cookingtime = params.get('cookingtime');
    const ingredients = params.get('ingredients');
    const instructions = params.get('instructions');

    db.query('SELECT uid FROM recipes WHERE rid = ?', [rid], (err, results) => {
      if (err || results.length === 0) {
        res.writeHead(404);
        res.end('Recipe not found');
        return;
      }

      const recipeOwnerUid = results[0].uid;
      if (recipeOwnerUid !== uid) {
        res.writeHead(403);
        res.end('Forbidden: You do not own this recipe');
        return;
      }

      db.query(
        'UPDATE recipes SET name=?, description=?, type=?, cookingtime=?, ingredients=?, instructions=? WHERE rid=?',
        [name, description, type, cookingtime, ingredients, instructions, rid],
        (err) => {
          if (err) {
            res.writeHead(500);
            res.end('Error updating recipe');
          } else {
            res.writeHead(302, { Location: '/viewRecipes' });
            res.end();
          }
        }
      );
    });
  });
}

// --- Delete Recipe ---
function handleDeleteRecipe(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const rid = parsedUrl.query.rid;

  if (!rid) {
    res.writeHead(400);
    res.end('Recipe ID missing');
    return;
  }

  const cookies = req.headers.cookie || '';
  const uidMatch = cookies.match(/uid=(\d+)/);
  const uid = uidMatch ? parseInt(uidMatch[1]) : null;

  if (!uid) {
    res.writeHead(401);
    res.end('Unauthorized: User not logged in');
    return;
  }

  db.query('SELECT uid FROM recipes WHERE rid = ?', [rid], (err, results) => {
    if (err) {
      res.writeHead(500);
      res.end('Database error while verifying ownership');
      return;
    }

    if (results.length === 0) {
      res.writeHead(404);
      res.end('Recipe not found');
      return;
    }

    const recipeOwnerUid = results[0].uid;
    if (recipeOwnerUid !== uid) {
      res.writeHead(403);
      res.end('Forbidden: You do not own this recipe');
      return;
    }

    db.query('DELETE FROM recipes WHERE rid = ?', [rid], (err) => {
      if (err) {
        res.writeHead(500);
        res.end('Error deleting recipe');
      } else {
        res.writeHead(302, { Location: '/viewRecipes' });
        res.end();
      }
    });
  });
}

// --- Route bindings for edit/delete ---
server.on('request', (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  if (req.method === 'GET' && parsedUrl.pathname === '/editRecipe') {
    serveEditRecipePage(req, res);
  } else if (req.method === 'POST' && parsedUrl.pathname === '/editRecipe') {
    handleEditRecipe(req, res);
  } else if (req.method === 'GET' && parsedUrl.pathname === '/deleteRecipe') {
    handleDeleteRecipe(req, res);
  }
});


// Handle Register
function handleRegister(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    const params = new URLSearchParams(body);
    const username = params.get('username');
    const email = params.get('email');
    const password = params.get('password');

    const checkSql = 'SELECT * FROM users WHERE username = ? OR email = ?';
    db.query(checkSql, [username, email], (err, results) => {
      if (err) {
        res.writeHead(500);
        res.end('Error checking existing users');
        return;
      }
      if (results.length > 0) {
        const errorMsg = encodeURIComponent('Username or email already exists.');
        res.writeHead(302, { Location: `/register?error=${errorMsg}` });
        res.end();
        return;
      }

      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          res.writeHead(500);
          res.end('Error hashing password');
          return;
        }
        const insertSql = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
        db.query(insertSql, [username, hash, email], (err) => {
          if (err) {
            res.writeHead(500);
            res.end('Error registering user');
            return;
          }
          res.writeHead(302, { Location: '/login' });
          res.end();
        });
      });
    });
  });
}

// Handle Login
function handleLogin(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    const params = new URLSearchParams(body);
    const username = params.get('username');
    const password = params.get('password');

    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
      if (err || results.length === 0) {
        const errorMsg = encodeURIComponent('Incorrect username or password.');
        res.writeHead(302, { Location: `/login?error=${errorMsg}` });
        res.end();
        return;
      }
      const user = results[0];
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (isMatch) {
          res.writeHead(302, {
            'Set-Cookie': `loggedIn=true; uid=${user.uid}`,
            Location: '/dashboard'
          });
          res.end();
        } else {
          const errorMsg = encodeURIComponent('Incorrect username or password.');
          res.writeHead(302, { Location: `/login?error=${errorMsg}` });
          res.end();
        }
      });
    });
  });
}

// Handle Add Recipe
function handleAddRecipe(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    const params = new URLSearchParams(body);
    const name = params.get('name');
    const description = params.get('description');
    const type = params.get('type');
    const cookingtime = params.get('cookingtime');
    const ingredients = params.get('ingredients');
    const instructions = params.get('instructions');
    const image = params.get('image') || 'default.jpg';
    const cookies = req.headers.cookie || '';
const uidMatch = cookies.match(/uid=(\d+)/);
const uid = uidMatch ? parseInt(uidMatch[1]) : null;

if (!uid) {
  res.writeHead(401);
  res.end('Unauthorized: User not logged in');
  return;
}


    const sql = 'INSERT INTO recipes (name, description, type, cookingtime, ingredients, instructions, image, uid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [name, description, type, cookingtime, ingredients, instructions, image, uid], (err) => {
      if (err) {
        res.writeHead(500);
        res.end('Error adding recipe');
        return;
      }
      res.writeHead(302, { Location: '/dashboard' });
      res.end();
    });
  });
}

// Start server
server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
