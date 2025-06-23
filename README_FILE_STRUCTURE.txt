backend/
│
├── app.js                  # Main entry file (Express app or HTTP server)
├── package.json
│
├── routes/                 # Route handlers per role
│   ├── adminRoutes.js
│   ├── creatorRoutes.js
│   └── customerRoutes.js
│
├── controllers/            # Route controller logic
│
├── models/                 # CouchDB document schemas/wrappers
│
├── middleware/             # e.g., Auth.js
│
└── config/                 # DB connection config
