process.env.NODE_ENV = "test";
const request = require("supertest");
const db = require("../db");
const app = require("../app");

const { hashPassword, generateToken, getUsers } = require("../common");

const auth = {
  userAdmin: {},
  userNormal: {},
  other: {},
};

beforeAll(async () => {
  await db.query(
    "CREATE TABLE users (id SERIAL PRIMARY KEY, username TEXT NOT NULL, password VARCHAR(100) NOT NULL, isAdmin BOOL DEFAULT false)"
  );
});

beforeEach(async () => {
  const hashedPassword = await hashPassword("secret");
  // User with admin privilages
  const userAdmin = await db.query(
    "INSERT INTO users (username, password, isAdmin) VALUES ($1, $2, $3) RETURNING *",
    ["admin", hashedPassword, true]
  );

  // Storing Admin User Values in auth
  // auth.userAdmin = userAdmin.rows[0];
  auth.userAdmin.current_user_id = userAdmin.rows[0].id;
  auth.userAdmin.isAdmin = userAdmin.rows[0].isadmin;

  // Generate token
  const userAdmintoken = await generateToken(
    auth.userAdmin.current_user_id,
    auth.userAdmin.isAdmin
  );
  auth.userAdmin.token = userAdmintoken;

  // User without admin privilages
  const userNormal = await db.query(
    "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
    ["normal", hashedPassword]
  );

  // Storing Normal User Values in auth
  // auth.userNormal = userNormal.rows[0];
  auth.userNormal.current_user_id = userNormal.rows[0].id;
  auth.userNormal.isAdmin = userNormal.rows[0].isadmin;

  // Generate token
  const userNormaltoken = await generateToken(
    auth.userNormal.current_user_id,
    auth.userNormal.isAdmin
  );
  auth.userNormal.token = userNormaltoken;
});

afterEach(async () => {
  await db.query("DELETE FROM users");
});

afterAll(async () => {
  await db.query("DROP TABLE users");
  db.end();
});

// Get Users if User is admin
describe("GET /api/users", () => {
  test("Request as admin, response return all users", async () => {
    const response = await request(app)
      .get("/api/users")
      .set("Authorization", auth.userAdmin.token);
    expect(response.body.length).toBe(2);
    expect(response.statusCode).toBe(200);
  });
});

// Return error if user is not admin
describe("GET /api/users", () => {
  test("Request as normalUser, response return error", async () => {
    const response = await request(app)
      .get("/api/users")
      .set("Authorization", auth.userNormal.token);
    expect(response.body.message).toBe("unauthorized");
    expect(response.statusCode).toBe(401);
  });
});

// Return error without auth
describe("GET /api/users", () => {
  test("Request without auth response return error", async () => {
    const response = await request(app).get("/api/users");
    expect(response.body.message).toBe("unauthorized");
    expect(response.statusCode).toBe(401);
  });
});

// If user is admin show other user
describe("GET /api/users/:id", () => {
  test("Request as Admin, reponse return normal user", async () => {
    const response = await request(app)
      .get(`/api/users/${auth.userNormal.current_user_id}`)
      .set("Authorization", auth.userAdmin.token);

    expect(response.body.username).toBe("normal");
    expect(response.statusCode).toBe(200);
  });
});

// Show user if logged in user is user
describe("GET /api/users/:id", () => {
  test("Request as normal user for normal user id, reponse return normal user", async () => {
    const response = await request(app)
      .get(`/api/users/${auth.userNormal.current_user_id}`)
      .set("Authorization", auth.userNormal.token);

    expect(response.body.username).toBe("normal");
    expect(response.statusCode).toBe(200);
  });
});

// Get another user detail for normal user
describe("GET /api/users/:id", () => {
  test("Request as nomalUser for other user ,reponse return error", async () => {
    const response = await request(app)
      .get(`/api/users/${auth.userAdmin.current_user_id}`)
      .set("Authorization", auth.userNormal.token);

    expect(response.body.message).toBe("unauthorized");
    expect(response.statusCode).toBe(401);
  });
});

// Without Auth request user
describe("GET /api/users/:id", () => {
  test("Request without auth for user ,reponse return error", async () => {
    const response = await request(app).get(
      `/api/users/${auth.userNormal.current_user_id}`
    );

    expect(response.body.message).toBe("unauthorized");
    expect(response.statusCode).toBe(401);
  });
});

// Update User Info
describe("PATCH /api/users/:id", () => {
  test("Updating same user info", async () => {
    const hashedPassword = await hashPassword("password");
    const newUser = await db.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
      ["user", hashedPassword]
    );

    // Make sure user created successfully
    let users = await getUsers();
    expect(users.length).toBe(3);
    expect(users[users.length - 1].username).toBe("user");
    expect(users[users.length - 1].password).toBe(hashedPassword);

    auth.other.newUser = newUser.rows[0];

    // Generate Token for login
    const newUserToken = await generateToken(
      auth.other.newUser.id,
      auth.other.newUser.isadmin
    );

    // console.log(newUser.rows, newUserToken);

    // Update Values
    const response = await request(app)
      .patch(`/api/users/${newUser.rows[0].id}`)
      .set("Authorization", newUserToken)
      .send({
        username: "newUsername",
        password: "secret",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.username).toBe("newUsername");
  });
});

// Updating Normal User Info by admin user
describe("PATCH /api/users/:id", () => {
  test("Updating user info by admin user", async () => {
    const hashedPassword = await hashPassword("password");
    const newUser = await db.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
      ["user", hashedPassword]
    );

    // Make sure user created successfully
    let users = await getUsers();
    expect(users.length).toBe(3);
    expect(users[users.length - 1].username).toBe("user");
    expect(users[users.length - 1].password).toBe(hashedPassword);

    auth.other.newUser = newUser.rows[0];

    // Update Values
    const response = await request(app)
      .patch(`/api/users/${newUser.rows[0].id}`)
      .set("Authorization", auth.userAdmin.token)
      .send({
        username: "newUsername",
        password: "secret",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.username).toBe("newUsername");
  });
});

// Try Updating normal user by another user
describe("PATCH /api/users/:id", () => {
  test("Trying Updating user info by admin user, reponse return error", async () => {
    const hashedPassword = await hashPassword("password");
    const newUser = await db.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
      ["user", hashedPassword]
    );

    // Make sure user created successfully
    let users = await getUsers();
    expect(users.length).toBe(3);
    expect(users[users.length - 1].username).toBe("user");
    expect(users[users.length - 1].password).toBe(hashedPassword);

    auth.other.newUser = newUser.rows[0];

    // Update Values
    const response = await request(app)
      .patch(`/api/users/${newUser.rows[0].id}`)
      .set("Authorization", auth.userNormal.token)
      .send({
        username: "newUsername",
        password: "secret",
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("unauthorized");
  });
});

// Deleting User

// Deleting User
describe("DELETE /api/users/:id", () => {
  test("Deleting user", async () => {
    // Creating New User
    const hashedPassword = await hashPassword("password");
    const newUser = await db.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
      ["user", hashedPassword]
    );

    // Make sure user created successfully
    let users = await getUsers();
    expect(users.length).toBe(3);
    expect(users[users.length - 1].username).toBe("user");
    expect(users[users.length - 1].password).toBe(hashedPassword);

    auth.other.newUser = newUser.rows[0];

    // Generate Token for login
    const newUserToken = await generateToken(
      auth.other.newUser.id,
      auth.other.newUser.isadmin
    );

    // Deleting User
    const response = await request(app)
      .delete(`/api/users/${newUser.rows[0].id}`)
      .set("Authorization", newUserToken);

    // expect(response.statusCode).toBe(204);
    expect(response.body.message).toBe("Deleted...");

    // Make sure user deleted successfully
    users = await getUsers();
    expect(users.length).toBe(2);
  });
});

// Deleted User by admin
describe("DELETE /api/users/:id", () => {
  test("Deleted user by admin", async () => {
    // Creating New User
    const hashedPassword = await hashPassword("password");
    const newUser = await db.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
      ["user", hashedPassword]
    );

    // Make sure user created successfully
    let users = await getUsers();
    expect(users.length).toBe(3);
    expect(users[users.length - 1].username).toBe("user");
    expect(users[users.length - 1].password).toBe(hashedPassword);

    // Deleting User
    const response = await request(app)
      .delete(`/api/users/${newUser.rows[0].id}`)
      .set("Authorization", auth.userAdmin.token);

    // expect(response.statusCode).toBe(204);
    expect(response.body.message).toBe("Deleted...");

    // Make sure user deleted successfully
    users = await getUsers();
    expect(users.length).toBe(2);
  });
});

// Trying Deleting User from Another user
describe("DELETE /api/users/:id", () => {
  test("Trying Deleting User from another normal user, response return message unauthorized", async () => {
    // Creating New User
    const hashedPassword = await hashPassword("password");
    const newUser = await db.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
      ["user", hashedPassword]
    );

    // Make sure user created successfully
    let users = await getUsers();
    expect(users.length).toBe(3);
    expect(users[users.length - 1].username).toBe("user");
    expect(users[users.length - 1].password).toBe(hashedPassword);

    // Deleting User
    const response = await request(app)
      .delete(`/api/users/${newUser.rows[0].id}`)
      .set("Authorization", auth.userNormal.token);

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("unauthorized");
  });
});
