const express = require("express");
const session = require("express-session");
const MongoDBSession = require("connect-mongodb-session")(session);
const mongoose = require("mongoose");
const neo4j = require("neo4j-driver")
const { v4: uuidv4 } = require('uuid');

//https
const fs = require('fs');
const key = fs.readFileSync('localhost.decrypted.key');
const cert = fs.readFileSync('localhost.crt');
const https = require('https');
//https

const app = express();

//https
const server = https.createServer({ key, cert }, app);
const port = 443;
//https

const mongoURI = "mongodb://localhost:27017/sessions";
mongoose.connect(mongoURI)
.then((res) => {
  console.log("MongoDB connected");
});

const neo4jDriver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'neo4j444'));
const neo4jSession = neo4jDriver.session();

const store = new MongoDBSession({
  uri: mongoURI,
  collection: "mySessions",
});

app.use(
  session({
    secret: 'goiuytvjir413c',
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

// view engine
app.set('view engine', 'ejs');

const isAuth = (req, res, next) => {
  if(req.session.isAuth) {
    next();
  } else {
    res.redirect('/auth/login');
  }
}

const isModeratorOrAdmin = (req, res, next) => {
  if(req.session.role === "moderator" || req.session.role === "admin") {
    next();
  } else {
    res.status(403).send("Access denied.");
  }
}

const isAdmin = (req, res, next) => {
  if(req.session.role === "admin") {
    next();
  } else {
    res.status(403).send("Access denied.");
  }
}

const { Pool } = require('pg');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
//const port = 3000;
  
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'mydatabase',
    password: 'sql001',
    port: 5432,
  });
  pool.on('connect', () => {
    console.log('PostgreSQL connected');
  });

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

app.use(express.static('public'));

app.get('/user/dashboard', isAuth, (req, res) => {
    res.sendFile(__dirname + '/public/user/dashboard.html');
  });

// profile & followings
app.get('/user/my_profile', isAuth, async (req, res) => {
  res.sendFile(__dirname + '/public/user/myprofile.html');
});

app.get('/user/my_profile_info', isAuth, async (req, res) => {
  try {
    const neo4jSession = neo4jDriver.session();

    const neo4jResult = await neo4jSession.run(
      `
      MATCH (user:User {user_ID: $userID})
      RETURN user.username AS username
      `, 
      { userID: req.session.user_id }
    );

    neo4jSession.close();

    const userData = neo4jResult.records[0]._fields;
    const username = userData[0];

    const profileInfo = await getProfileInfoFromNeo4j(username);

    res.status(200).json(profileInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving user profile info from Neo4j' });
  }
});

app.get('/user/my_profile_bio', isAuth, async (req, res) => {
  try {
    const neo4jSession = neo4jDriver.session();

    const neo4jResult = await neo4jSession.run(
      `
      MATCH (user:User {user_ID: $userID})
      RETURN user.username AS username
      `, 
      { userID: req.session.user_id }
    );

    neo4jSession.close();

    const userData = neo4jResult.records[0]._fields;
    const username = userData[0];

    const profileNameBio = await getProfileInfoFromPostgres(username);

    res.status(200).json(profileNameBio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving user profile info from Postgres' });
  }
});

app.get('/user/get_profile_bio/:username', isAuth, async (req, res) => {
  const username = req.params.username;
  try {
    const profileNameBio = await getProfileInfoFromPostgres(username);
    res.status(200).json(profileNameBio);
  } 
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving user profile info from Postgres' });
  }
});

async function getProfileInfoFromNeo4j(username) {
  const neo4jSession = neo4jDriver.session();

  const neo4jUser = await neo4jSession.run(
    `
    MATCH (user:User {username: $userUsername})
    RETURN user.username AS username, 
           SIZE([()-[:FOLLOWS]->(user) | 1]) AS followers, 
           SIZE([(user)-[:FOLLOWS]->() | 1]) AS followings, 
           SIZE([(user)-[:POSTED]->() | 1]) AS posts
    `,
    { userUsername: username }
  );

  neo4jSession.close();

  if (neo4jUser.records.length > 0) {
    const userData = neo4jUser.records[0]._fields;
    const DataUsername = userData[0];
    const DataFollowers = userData[1].low;
    const DataFollowings = userData[2].low;
    const DataPosts = userData[3].low;

    return { username: DataUsername, followers: DataFollowers, followings: DataFollowings, posts: DataPosts };
  } else {
    throw new Error('User not found in Neo4j');
  }
}

async function getProfileInfoFromPostgres(username) {

  try {

  const postgresUserQuery = 'SELECT name, bio FROM users WHERE username = $1';
  const postgresUserParams = [username];
  
  const postgresUser = await pool.query(postgresUserQuery, postgresUserParams);


  if (postgresUser.rows.length > 0) {
    const user = postgresUser.rows[0];
    return { name: user.name, bio: user.bio };
  } else {
    throw new Error('Profile info not found (name, bio)');
  }
}
catch (error) {
  console.error('Error getting profile info from PostgreSQL:', error);
  throw error;
}
}



app.get('/user/user_profile/:username', isAuth, async (req, res) => {
  res.sendFile(__dirname + '/public/user/userprofile.html');
});


app.get('/user/followings', isAuth, (req, res) => {
  res.render(__dirname + '/public/user/followings.ejs')
});

app.get('/user/get_profile/:username', isAuth, async (req, res) => {
  const targetUser = req.params.username;
  try {
    const neo4jSession = neo4jDriver.session();

    const neo4jThisUser = await neo4jSession.run(
      `
      MATCH (user:User {user_ID: $userID})
      RETURN user.username AS username
      `, 
      { userID: req.session.user_id }
    );

    const ThisUser = neo4jThisUser.records[0]._fields;
    const thisUserUsername = ThisUser[0];

    if (targetUser == thisUserUsername) {
      neo4jSession.close();
      res.redirect('/user/my_profile');
    }
    else {
      const neo4jTargetUser = await neo4jSession.run(
        `
        MATCH (user:User {username: $TargetUser})
        RETURN user.username AS username
        `,
        { TargetUser: targetUser }
      );
      neo4jSession.close();

      if (neo4jTargetUser.records.length > 0) {
        const targetUserData = neo4jTargetUser.records[0]._fields;
        const targetusername = targetUserData[0];
        
        res.redirect(`/user/user_profile/${targetusername}`);
      }
      else {
        res.status(404).json({message:'User not found'});
      }
    }
  }
  catch(error) {
    console.error(error);
    res.status(500).send('Error retrieving user data from Neo4j');
  }
});

app.get('/user/getPosts', isAuth, async (req, res) => {
  const user = req.session.user_id;

  try {
    const neo4jSession = neo4jDriver.session();
    
    const neo4jUser = await neo4jSession.run(
      `
      MATCH (user:User {user_ID: $userID})-[:POSTED]->(post:Post)
      RETURN post AS post
      `,
      { userID: user }
    );
    neo4jSession.close();

    const posts = neo4jUser.records.map(record => record.get('post').properties);

    if (posts.length > 0) { res.status(200).json(posts); }
    else { res.status(404).json({ message: 'No posts found' }); }

  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Error, cannot get your posts.' });
  }
});

app.get('/user/getPosts/:username', isAuth, async (req, res) => {
  const user = req.params.username;

  try {
    const neo4jSession = neo4jDriver.session();
    
    const neo4jUser = await neo4jSession.run(
      `
      MATCH (user:User {username: $user})-[:POSTED]->(post:Post)
      RETURN post AS post
      `,
      { user: user }
    );
    neo4jSession.close();

    const posts = neo4jUser.records.map(record => record.get('post').properties);

    if (posts.length > 0) { res.status(200).json(posts); }
    else { res.status(404).json({ message: 'No posts found' }); }
  }
  catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Error, cannot get user posts.' });
  }
});


app.get('/user/get_profile_info/:username', isAuth, async (req, res) => {
  const username = req.params.username;

  try {
    const neo4jSession = neo4jDriver.session();
    
    const neo4jUser = await neo4jSession.run(
      `
      MATCH (user:User {username: $userUsername})
      RETURN user.username AS username, 
             SIZE([()-[:FOLLOWS]->(user) | 1]) AS followers, 
             SIZE([(user)-[:FOLLOWS]->() | 1]) AS followings, 
             SIZE([(user)-[:POSTED]->() | 1]) AS posts
      `,
      { userUsername: username }
    );
    neo4jSession.close();

    if (neo4jUser.records.length > 0) {
      const UserData = neo4jUser.records[0]._fields;
      const DataUsername = UserData[0];
      const DataFollowers = UserData[1].low;
      const DataFollowings = UserData[2].low;
      const DataPosts = UserData[3].low;

      res.status(200).json({ username: DataUsername, followers: DataFollowers, followings: DataFollowings, posts: DataPosts });
    } else {
      res.status(404).json({ message: 'User not found' }); // Объект JSON для сообщения об ошибке
    }

  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Error, cannot get user profile info.' }); // Объект JSON для сообщения об ошибке
  }
});


// profile & followings
  
app.get('/admin/dashboard', isAuth, isAdmin, (req, res) => {
  res.sendFile(__dirname + '/public/admin/dashboard.html');
});
  
app.get('/moderator/dashboard', isAuth, isModeratorOrAdmin, (req, res) => {
  res.sendFile(__dirname + '/public/moderator/dashboard.html');
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/home/home.html');
});

app.get('/auth/login', (req, res) => {
  res.sendFile(__dirname + '/public/login/login.html');
});
  
app.get('/auth/register', (req, res) => {
  res.sendFile(__dirname + '/public/register/register.html');
});

//search post
app.post('/user/search', isAuth, async (req, res) => {
  const { username: searchUsername } = req.body;

  try {
    const neo4jSession = neo4jDriver.session();

    const neo4jResult = await neo4jSession.run(
      `
      MATCH (user:User {username: $username})
      RETURN user.username AS username
      `, 
      { username: searchUsername }
    );

    neo4jSession.close();

    if (neo4jResult.records.length === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const userData = neo4jResult.records[0]._fields;
    const foundUsername = userData[0];

    res.status(200).json({ username: foundUsername });
  } catch (error) {
    console.error('Error searching for user:', error);
    return res.status(500).json({ message: 'Error searching for user' });
  }
});

// create new post
app.post('/user/create_new_post', isAuth, async (req, res) => {
  const postAuthor = req.session.user_id;
  const postContent = req.body.postText;
  const postID = uuidv4();

  const postgresQuery = 'INSERT INTO posts (id, content, author) VALUES ($1, $2, $3) RETURNING *';
  const postgresParams = [postID, postContent, postAuthor];
  
  const neo4jQuery = `
  CREATE (post:Post {post_ID: $postID, content: $postContent})
  WITH post
  MATCH (author:User {user_ID: $postAuthor})
  MATCH (post:Post {post_ID: $postID})
  MERGE (author)-[:POSTED]->(post)
  RETURN author, post`;
  const neo4jParams = {postID: postID, postContent: postContent, postAuthor: postAuthor};

  try {
    await pool.query('BEGIN');

    const postgresResult = await pool.query(postgresQuery, postgresParams);
    const newPost = postgresResult.rows[0];
    
    await neo4jSession.run(neo4jQuery, neo4jParams);

    await pool.query('COMMIT');

    res.status(200).json({message: 'post created successfully'});
  }
  catch (error) {
    await pool.query('ROLLBACK');
    console.error(error);
    res.status(500).send('Error creating post');
  }

  //add to postgreSQL
  //add to neo4j

});

// edit profile info
app.post('/user/edit_profile_info', isAuth, async (req, res) => {

  const user = req.session.user_id;
  const name = req.body.profileName;
  const bio = req.body.profileBio;

  const postgresQuery = 'UPDATE users SET name = $1, bio = $2 WHERE id = $3';
  const postgresParams = [name, bio, user];
  
  try {
    await pool.query('BEGIN');

    await pool.query(postgresQuery, postgresParams);
    
    await pool.query('COMMIT');

    res.status(200).json({message: 'profile edited'});
  }
  catch (error) {
    await pool.query('ROLLBACK');
    console.error(error);
    res.status(500).send('Error editing profile');
  }
});

// follow post
app.post('/user/follow/:username', isAuth, async (req, res) => {
  const followingUser = req.params.username;
  const followerUser = req.session.user_id;

  const neo4jSession = neo4jDriver.session();

  try {
      // Проверяем существование отношения "FOLLOWS" перед созданием нового отношения
      const checkResult = await neo4jSession.run(
          `
          MATCH (following:User {username: $followingUser})
          MATCH (follower:User {user_ID: $followerUser})
          RETURN EXISTS((follower)-[:FOLLOWS]->(following)) AS isFollowsRelationExists
          `,
          { followingUser, followerUser }
      );

      if (checkResult.records.length > 0 && checkResult.records[0].get('isFollowsRelationExists')) {
          neo4jSession.close();
          return res.status(200).json({ message: 'Follow relationship already exists' });
      } else {
        // Находим узлы пользователей, которые будут связаны отношением "FOLLOWS"
        const result = await neo4jSession.run(
          `
          MATCH (following:User {username: $followingUser})
          MATCH (follower:User {user_ID: $followerUser})
          MERGE (follower)-[:FOLLOWS]->(following)
          RETURN follower, following
          `,
          { followingUser, followerUser }
      );

      neo4jSession.close();

      if (result.records.length === 0) {
        return res.status(404).json({ message: 'One or both users not found' });
      } else {
        return res.status(200).json({ message: 'Follow relationship created successfully' });
      }
    }
  }
  
  catch (error) {
      console.error('Error creating follow relationship:', error);
      return res.status(500).json({ message: 'Error creating follow relationship' });
  }
});
// follow post


//admin panel

app.delete('/admin/deleteUser/:username', isAdmin, async (req, res) => {
  const username = req.params.username;

  const postgresQuery = 'DELETE FROM users WHERE username = $1';
  const postgresParams = [username];
  
  const neo4jQuery = `
  MATCH (user:User {username: $username})
  DETACH DELETE user`;
  const neo4jParams = {username: username};

  try {
    await pool.query('BEGIN');

    await pool.query(postgresQuery, postgresParams);

    const neo4jSession = neo4jDriver.session();
    
    await neo4jSession.run(neo4jQuery, neo4jParams);
    neo4jSession.close();

    await pool.query('COMMIT');

    res.status(200).json({message: 'user deleted'});
  }
  catch (error) {
    await pool.query('ROLLBACK');
    console.error(error);
    res.status(500).send('Error deleting user');
  }

  //delete in postgres
  //delete in neo4j
});

app.delete('/admin/deletePost/:postID', isAdmin, async (req, res) => {
  const postID = req.params.postID;

  const postgresQuery = 'DELETE FROM posts WHERE id = $1';
  const postgresParams = [postID];
  
  const neo4jQuery = `
  MATCH (post:Post {post_ID: $postID})
  DETACH DELETE post`;
  const neo4jParams = {postID: postID};

  try {
    await pool.query('BEGIN');

    await pool.query(postgresQuery, postgresParams);

    const neo4jSession = neo4jDriver.session();
    await neo4jSession.run(neo4jQuery, neo4jParams);
    neo4jSession.close();

    await pool.query('COMMIT');

    res.status(200).json({message: 'post deleted'});
  }
  catch (error) {
    await pool.query('ROLLBACK');
    console.error(error);
    res.status(500).send('Error deleting post');
  }
  //delete in postgres
  //delete in neo4j
});

app.put('/admin/updateUserRole/:username', isAdmin, async (req, res) => {
  const username = req.params.username;
  const newRole = req.body.role;

  try {
    await pool.query('UPDATE users SET role = $1 WHERE username = $2', [newRole, username]);
    
    res.status(200).json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Error updating user role' });
  }

  //edit in postgres
});

//admin panel

app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM users WHERE username = $1';
    const roleQuery = 'SELECT role FROM users WHERE username = $1';
    const idQuery = 'SELECT id FROM users WHERE username = $1';
    const values = [username];

    try {
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            res.status(401).send('Invalid username or password');
            return;
          }
          const user = result.rows[0];
          const isPasswordValid = await bcrypt.compare(password, user.password);
          
          if (isPasswordValid) {

            const idResult = await pool.query(idQuery, values);
            if (idResult.rows.length === 0) {
              res.status(500).send('Error retrieving user id');
              return;
            }
            const userID = idResult.rows[0].id;

            const roleResult = await pool.query(roleQuery, values);
            if (roleResult.rows.length === 0) {
              res.status(500).send('Error retrieving user role');
              return;
            }
            const userRole = roleResult.rows[0].role;
            
            let redirectPath = '/user/dashboard';
            if (user.role === 'admin') {
                redirectPath = '/admin/dashboard';
            } else if (user.role === 'moderator') {
                redirectPath = '/moderator/dashboard';
            }

            req.session.user_id = userID;
            req.session.role = userRole;
            req.session.isAuth = true;
            res.redirect(redirectPath);
          }
          else {res.status(401).send('Invalid username or password');}
            
    } catch (error) {
        console.error(error);
        res.status(500).send('Error during login');
    }
});

app.post('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                console.error('Error during logout:', err);
                res.status(500).send('Internal Server Error');
            } else {
                res.status(200).send('Logout successful');
            }
        });
    } else {
        res.status(400).send('No active session');
    }
});

app.post('/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    const role = "user";
    const hashedPassword = await bcrypt.hash(password, 10);

    const userID = uuidv4();
    const createUserQueryPostgres = 'INSERT INTO users (id, username, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const createUserParamsPostgres = [userID, username, email, hashedPassword, role];

    const createUserQueryNeo4j = 'CREATE (user:User {user_ID: $userID, username: $username}) RETURN user';
    const createUserParamsNeo4j = {
      userID: userID,
      username: username
    };

    try {
      const postgresResult = await pool.query(createUserQueryPostgres, createUserParamsPostgres);
      const postgresUserID = postgresResult.rows[0].id;

      await neo4jSession.run(createUserQueryNeo4j, createUserParamsNeo4j);

      await neo4jSession.close();
      
        //redirect to login page
        res.redirect('/auth/login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error registering user');
    }
});

//app.listen(port, () => {
//    console.log(`Server is running on http://localhost:${port}`);
//});

server.listen(port, () => {
  console.log(`Server is running on https://localhost:${port}`);
});

// Shyngyskhan Adyrbek