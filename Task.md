# { API Exercise. }

For this application you will be building an API to store and display user information. Your users should be stored in a database with the following columns:

-   a unique id
-   a unique username which should be not null
-   a password which should be not null
-   a boolean called isAdmin which should default to false

You should implement the following routes and can test these routes out using `httpie` or `postman`

-   `GET /api/users` \- this page should list all of the users, but should only be accessible if the user has an `isAdmin` property of `true`.
    
-   `GET /api/users/:id` \- this page should show a specific user's information and should only be accessible by the user logged in or another user that has an `isAdmin` property of `true`.
    
-   `PATCH /api/users/:id` \- this route should update a users information and should only be accessible by the user logged in or another user that has an `isAdmin` property of `true`. It should respond with a `200` and the JSON for the updated user
    
-   `DELETE /api/users/:id` \- this route should delete user and should only be accessible by the user logged in or another user that has an `isAdmin` property of `true`. It should respond with a `204` and a message that says "deleted".
    
-   `POST /api/users` \- this page should create a new user and log them in. It should respond with a status code of `201` and the JSON for the new user created.
    
-   `POST /api/users/login` \- this page should authenticate a user and if the user successfully authenticates, it should log in the user by responding with a JSON Web Token. Otherwise it should respond with a `400` and an error message
    

When you're ready, move on to [Production Directory Structure](https://www.rithmschool.com/courses/intermediate-node-express/production-directory-structure)
