import { IdentifyRequest, ContactResponse } from '../types/database';
export declare class ContactService {
    private findContactsByEmailOrPhone;
    private getAllLinkedContacts;
    private createContact;
    private updateContactToSecondary;
    private updateLinkedContacts;
    identify(request: IdentifyRequest): Promise<ContactResponse>;
    private buildResponse;
}
//# sourceMappingURL=contactService.d.ts.map