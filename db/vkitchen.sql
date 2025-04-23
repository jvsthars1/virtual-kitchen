-- USE vkitchen;

DROP TABLE IF EXISTS recipes;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  uid INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE recipes (
  rid INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(255) NOT NULL,
  cookingtime INT NOT NULL,
  ingredients TEXT,
  instructions TEXT,
  image VARCHAR(255) DEFAULT 'default.jpg',
  uid INT NULL
);

-- Insert Users
INSERT INTO users (uid, username, password, email) VALUES
(1, '1234', '$2b$10$n9e905DDu7.DSQ.ONHfhJ.ObEYFfYJuJ5KiLO1oFLvHvSa37SFs1G', 'sharsukhjit2004@gmail.com'),
(6, 'jojosiwa', '$2b$10$o5g0NGoWDC81EKKyWgY0XekX/cQZvhml5SJPQ9s38my/qBpc5Fewe', 'bewake4683@calmpros.com'),
(7, 'hars', '$2b$10$jgdvW9dzQqAO9afEp7Wrr.iPxduNEdLSEHrKCo3WhgexWDKYViULW', 'sdfs@fff.com'),
(11, 'abra', '$2b$10$IkM2Opl2M5478NBtG8X/BO2ypdt6iWuSh4UT4bL7Ey20y5ppQprfi', 's@gmail.com'),
(14, 'jojos', '$2b$10$j1o6Cta8Eupo.AACC4PuVu3Jv/6GKAfShTkXFMjRA2MZ0KUr8pchK', 'shar1sukhjit2004@gmail.com');

-- Insert Recipes (converted to match `title`, `category`)
INSERT INTO recipes (rid, title, description, category, cookingtime, ingredients, instructions, image, uid) VALUES
(1, 'Butter Chicken', 'A creamy, flavorful tomato-based curry with tender chicken.', 'Indian', 45, 'Chicken, Tomato Puree, Cream, Butter, Spices', 'Cook chicken, add tomato puree, simmer with cream and spices.', 'butter-chicken.jpg', NULL),
(2, 'Paneer Tikka Masala', 'Grilled paneer cubes in a rich masala sauce.', 'Indian', 30, 'Paneer, Yogurt, Spices, Onion, Tomato Puree', 'Marinate paneer, grill, cook with sauce.', 'paneer-tikka.jpg', NULL),
(3, 'Hyderabadi Biryani', 'Fragrant rice cooked with marinated chicken or veggies.', 'Indian', 60, 'Rice, Chicken, Biryani Masala, Onions', 'Layer rice and chicken, cook on low heat.', 'biryani.jpg', NULL),
(4, 'Spaghetti Carbonara', 'Classic Italian pasta with creamy sauce.', 'Italian', 25, 'Spaghetti, Eggs, Parmesan, Pancetta', 'Cook pasta, mix with eggs and cheese.', 'carbonara.jpg', NULL),
(5, 'Kung Pao Chicken', 'Spicy stir-fried chicken with peanuts.', 'Chinese', 20, 'Chicken, Peanuts, Chilies, Soy Sauce', 'Stir-fry chicken and vegetables with sauce.', 'kungpao.jpg', NULL),
(11, 'sticky toffee pudding', 'british desert', 'Others', 120, 'sugar, flour, butter, dates, bi carsds, eggs', '1. cook the dates\r\n2.butter sugar needs tyo be mixed\r\n3. add flur nd egg slowly\r\n4. whish until cooked', 'default.jpg', NULL),
(12, 'pho', 'pho ice tea\r\n', 'Others', 12, 'ice, tea', 'ice in tea', 'default.jpg', NULL);


ALTER TABLE recipes
  ADD KEY uid (uid);


-- Auto Increment Fix
ALTER TABLE users MODIFY uid INT NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;
ALTER TABLE recipes MODIFY rid INT NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

-- Foreign Key
ALTER TABLE recipes
  ADD CONSTRAINT recipes_ibfk_1 FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE;

COMMIT;
