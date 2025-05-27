"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactService = void 0;
const connection_1 = __importDefault(require("../database/connection"));
class ContactService {
    // Find contacts by email or phone number
    findContactsByEmailOrPhone(email, phoneNumber) {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM Contact WHERE deletedAt IS NULL AND (';
            const params = [];
            if (email) {
                sql += 'email = ?';
                params.push(email);
            }
            if (phoneNumber) {
                if (email)
                    sql += ' OR ';
                sql += 'phoneNumber = ?';
                params.push(phoneNumber);
            }
            sql += ') ORDER BY createdAt ASC';
            connection_1.default.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    const contacts = rows.map(row => ({
                        ...row,
                        createdAt: new Date(row.createdAt),
                        updatedAt: new Date(row.updatedAt),
                        deletedAt: row.deletedAt ? new Date(row.deletedAt) : null
                    }));
                    resolve(contacts);
                }
            });
        });
    }
    // Get all linked contacts for a primary contact
    getAllLinkedContacts(primaryId) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT * FROM Contact 
        WHERE deletedAt IS NULL AND (id = ? OR linkedId = ?)
        ORDER BY createdAt ASC
      `;
            connection_1.default.all(sql, [primaryId, primaryId], (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    const contacts = rows.map(row => ({
                        ...row,
                        createdAt: new Date(row.createdAt),
                        updatedAt: new Date(row.updatedAt),
                        deletedAt: row.deletedAt ? new Date(row.deletedAt) : null
                    }));
                    resolve(contacts);
                }
            });
        });
    }
    // Create a new contact
    createContact(email, phoneNumber, linkedId, linkPrecedence) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT INTO Contact (email, phoneNumber, linkedId, linkPrecedence, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
            connection_1.default.run(sql, [email, phoneNumber, linkedId, linkPrecedence], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(this.lastID);
                }
            });
        });
    }
    // Update contact to secondary
    updateContactToSecondary(contactId, linkedId) {
        return new Promise((resolve, reject) => {
            const sql = `
        UPDATE Contact 
        SET linkedId = ?, linkPrecedence = 'secondary', updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
            connection_1.default.run(sql, [linkedId, contactId], (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    // Update all linked contacts to point to new primary
    updateLinkedContacts(oldPrimaryId, newPrimaryId) {
        return new Promise((resolve, reject) => {
            const sql = `
        UPDATE Contact 
        SET linkedId = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE linkedId = ?
      `;
            connection_1.default.run(sql, [newPrimaryId, oldPrimaryId], (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    // Main identify method
    async identify(request) {
        const { email, phoneNumber } = request;
        // Find existing contacts
        const existingContacts = await this.findContactsByEmailOrPhone(email, phoneNumber);
        if (existingContacts.length === 0) {
            // No existing contacts - create new primary contact
            const newContactId = await this.createContact(email || null, phoneNumber || null, null, 'primary');
            return {
                contact: {
                    primaryContatctId: newContactId,
                    emails: email ? [email] : [],
                    phoneNumbers: phoneNumber ? [phoneNumber] : [],
                    secondaryContactIds: []
                }
            };
        }
        // Group contacts by their primary contact
        const contactGroups = new Map();
        for (const contact of existingContacts) {
            const primaryId = contact.linkedId || contact.id;
            if (!contactGroups.has(primaryId)) {
                contactGroups.set(primaryId, []);
            }
            contactGroups.get(primaryId).push(contact);
        }
        // If we have multiple groups, we need to merge them
        if (contactGroups.size > 1) {
            const primaryIds = Array.from(contactGroups.keys()).sort();
            const oldestPrimaryId = primaryIds[0];
            // Update all other primaries to be secondary to the oldest
            for (let i = 1; i < primaryIds.length; i++) {
                const primaryToUpdate = primaryIds[i];
                await this.updateContactToSecondary(primaryToUpdate, oldestPrimaryId);
                await this.updateLinkedContacts(primaryToUpdate, oldestPrimaryId);
            }
            // Get all linked contacts after merger
            const allLinkedContacts = await this.getAllLinkedContacts(oldestPrimaryId);
            // Check if we need to create a new secondary contact
            const hasExactMatch = allLinkedContacts.some(contact => contact.email === email && contact.phoneNumber === phoneNumber);
            if (!hasExactMatch && (email || phoneNumber)) {
                await this.createContact(email || null, phoneNumber || null, oldestPrimaryId, 'secondary');
            }
            // Get final state
            const finalContacts = await this.getAllLinkedContacts(oldestPrimaryId);
            return this.buildResponse(finalContacts);
        }
        // Single group - check if we need to add new information
        const primaryId = Array.from(contactGroups.keys())[0];
        const groupContacts = contactGroups.get(primaryId);
        // Check if this exact combination exists
        const hasExactMatch = groupContacts.some(contact => contact.email === email && contact.phoneNumber === phoneNumber);
        if (!hasExactMatch) {
            // Check if we have new information to add
            const existingEmails = new Set(groupContacts.map(c => c.email).filter(Boolean));
            const existingPhones = new Set(groupContacts.map(c => c.phoneNumber).filter(Boolean));
            const hasNewEmail = email && !existingEmails.has(email);
            const hasNewPhone = phoneNumber && !existingPhones.has(phoneNumber);
            if (hasNewEmail || hasNewPhone) {
                await this.createContact(email || null, phoneNumber || null, primaryId, 'secondary');
            }
        }
        // Get all linked contacts and return response
        const allLinkedContacts = await this.getAllLinkedContacts(primaryId);
        return this.buildResponse(allLinkedContacts);
    }
    buildResponse(contacts) {
        const primary = contacts.find(c => c.linkPrecedence === 'primary');
        const secondaries = contacts.filter(c => c.linkPrecedence === 'secondary');
        const emails = Array.from(new Set([
            primary.email,
            ...secondaries.map(c => c.email)
        ].filter(Boolean)));
        const phoneNumbers = Array.from(new Set([
            primary.phoneNumber,
            ...secondaries.map(c => c.phoneNumber)
        ].filter(Boolean)));
        return {
            contact: {
                primaryContatctId: primary.id,
                emails,
                phoneNumbers,
                secondaryContactIds: secondaries.map(c => c.id)
            }
        };
    }
}
exports.ContactService = ContactService;
//# sourceMappingURL=contactService.js.map