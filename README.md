# Bitespeed Identity Reconciliation Service

A Node.js/TypeScript web service that helps FluxKart.com identify and track customers across multiple purchases by linking different contact information to the same person.

## 🚀 Features

- **Identity Reconciliation**: Links contacts with common email or phone numbers
- **Primary/Secondary Contact System**: Maintains hierarchy with oldest contact as primary
- **Dynamic Contact Merging**: Automatically merges separate contact groups when new linking information is discovered
- **RESTful API**: Simple HTTP POST endpoint for contact identification
- **SQLite Database**: Lightweight, embedded database for easy deployment

## 📋 Requirements

- Node.js (v16 or higher)
- npm or yarn
- TypeScript

## 🛠️ Installation & Setup

1. **Clone/Download the project files**
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Run database migrations**:
   ```bash
   npm run migrate
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

   Or for production:
   ```bash
   npm start
   ```

The server will start on `http://localhost:3000`

## 🔗 API Endpoints

### Health Check
- **GET** `/health`
- Returns service status

### Identify Contact
- **POST** `/identify`
- **Content-Type**: `application/json`

**Request Body**:
```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
```

**Response**:
```json
{
  "contact": {
    "primaryContatctId": "number",
    "emails": ["string[]"],
    "phoneNumbers": ["string[]"], 
    "secondaryContactIds": ["number[]"]
  }
}
```

## 📝 Example Usage

### Test with curl:

1. **Create first contact**:
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "lorraine@hillvalley.edu", "phoneNumber": "123456"}'
```

2. **Link with new email**:
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "mcfly@hillvalley.edu", "phoneNumber": "123456"}'
```

3. **Query existing contact**:
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "lorraine@hillvalley.edu"}'
```

## 🗄️ Database Schema

The service uses a SQLite database with the following `Contact` table structure:

```sql
CREATE TABLE Contact (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phoneNumber TEXT,
  email TEXT,
  linkedId INTEGER,
  linkPrecedence TEXT CHECK (linkPrecedence IN ('primary', 'secondary')),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  deletedAt DATETIME,
  FOREIGN KEY (linkedId) REFERENCES Contact(id)
);
```

## 🏗️ Project Structure

```
src/
├── controllers/
│   └── identifyController.ts    # Request handlers
├── database/
│   ├── connection.ts           # Database connection
│   └── migrate.ts             # Database migrations
├── routes/
│   └── index.ts               # API routes
├── services/
│   └── contactService.ts      # Business logic
├── types/
│   └── database.ts            # TypeScript interfaces
└── server.ts                  # Express app setup
```

## 🧪 Testing Scenarios

The service handles various scenarios including:

1. **New Contact Creation**: Creates primary contact when no matches found
2. **Contact Linking**: Links contacts with common email/phone
3. **Contact Merging**: Merges separate contact groups when linking information connects them
4. **Primary Conversion**: Converts primary contacts to secondary when merged with older contacts

## 🚀 Deployment

### For hosting on services like Render.com:

1. **Build Command**: `npm install && npm run build && npm run migrate`
2. **Start Command**: `npm start`
3. **Environment**: Node.js

The service includes all necessary files and will automatically set up the database on deployment.

**Live link**: https://bitespeed-wp8m.onrender.com/( this will only shows **Cannot GET /** or **Cannot GET /identity** but everything is working great on Postman).

## 📊 Performance Considerations

- Uses SQLite for simple deployment and good performance for moderate loads
- Indexed queries on email and phoneNumber fields
- Efficient contact linking algorithm that minimizes database operations
- Connection pooling ready for scaling to PostgreSQL/MySQL if needed

## 🔐 Security Features

- Helmet.js for security headers
- CORS protection
- Input validation
- SQL injection protection through parameterized queries

---

**Built for the Bitespeed Backend Assignment** 🚀
