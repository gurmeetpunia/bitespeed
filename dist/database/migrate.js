"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = void 0;
const connection_1 = __importDefault(require("./connection"));
const createContactTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS Contact (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phoneNumber TEXT,
      email TEXT,
      linkedId INTEGER,
      linkPrecedence TEXT NOT NULL CHECK (linkPrecedence IN ('primary', 'secondary')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      deletedAt DATETIME,
      FOREIGN KEY (linkedId) REFERENCES Contact(id)
    )
  `;
    return new Promise((resolve, reject) => {
        connection_1.default.run(sql, (err) => {
            if (err) {
                console.error('Error creating Contact table:', err);
                reject(err);
            }
            else {
                console.log('Contact table created successfully');
                resolve();
            }
        });
    });
};
const runMigrations = async () => {
    try {
        await createContactTable();
        console.log('All migrations completed successfully');
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};
exports.runMigrations = runMigrations;
// Run migrations if this file is executed directly
if (require.main === module) {
    runMigrations().then(() => {
        connection_1.default.close();
    });
}
//# sourceMappingURL=migrate.js.map