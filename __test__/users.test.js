process.env.NODE_ENV = "test";
const request = require("supertest");
const db = require("../db");
const app = require("../app");

const { hashPassword, generateToken } = require("../common");

const auth = {
  userAdmin: {},
  userNormal: {},
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

// User is another user or user is not admin
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
