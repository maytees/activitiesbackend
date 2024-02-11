# API Endpoints

## `GET /`

- **Description:** This endpoint is used to increment the UUID and visits in the data file.
- **Inputs:** None
- **Outputs:** None
- **Side Effects:** Increments the UUID and visits in the data file.

## `GET /check`

- **Description:** This endpoint is used to check the login status of a user.
- **Inputs:** Query parameters - `name`, `passphrase`, and `uuid`.
- **Outputs:** Returns a boolean indicating the login status.

## `GET /people`

- **Description:** This endpoint is used to get all the people from the data file.
- **Inputs:** None
- **Outputs:** Returns an array of people.

## `GET /people/:name`

- **Description:** This endpoint is used to get a specific person from the data file.
- **Inputs:** Path parameter - `name`.
- **Outputs:** Returns the person object if found, otherwise sends a 404 status with 'Person not found'.

## `GET /flags`

- **Description:** This endpoint is used to get all the flags from the data file.
- **Inputs:** None
- **Outputs:** Returns an array of flags.

## `POST /people`

- **Description:** This endpoint is used to add a new person to the data file.
- **Inputs:** Body - `Person` object.
- **Outputs:** Returns the newly added person object.

## `PUT /passphrase/:name`

- **Description:** This endpoint is used to update the passphrase of a user.
- **Inputs:** Path parameter - `name`, Body - `passphrase`.
- **Outputs:** Returns the updated person object if found, otherwise sends a 404 status with 'Person not found'.

> Please note that all the endpoints are asynchronous and may throw an error if something goes wrong.
