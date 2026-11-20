/**
 * Relations for Drizzle's relational query API (`db.query.clients.findMany({ with: … })`). These
 * describe joins for TypeScript only; the foreign keys in the table files enforce integrity.
 * Polymorphic links (comments, document links, activity) are queried explicitly instead.
 */
import { relations } from "drizzle-orm";
import { authIdentities, authSessions, users } from "./auth";
import {
  disbursements,
  invoiceLines,
  invoices,
  paymentAllocations,
  payments,
} from "./billing";
import {
  clientContacts,
  clientCredentials,
  clientGroups,
  clientRegistrations,
  clients,
  clientTaxProfiles,
  clientUsers,
  contacts,
  dscCertificates,
} from "./clients";
import { messages, messageTemplates, notifications } from "./comms";
import {
  complianceForms,
  complianceObligations,
  filings,
  notices,
  statutoryDueDates,
} from "./compliance";
import {
  documentFolders,
  documentLinks,
  documentRequests,
  documents,
} from "./documents";
import {
  firmBranches,
  firmMembers,
  firms,
  roles,
  teamMembers,
  teams,
} from "./firms";
import { engagements, services } from "./services";
import { recurringTasks, tasks, taskTemplates, timeEntries } from "./work";

/* Identity */

export const usersRelations = relations(users, ({ many }) => ({
  identities: many(authIdentities),
  sessions: many(authSessions),
  memberships: many(firmMembers),
  clientAccess: many(clientUsers),
  notifications: many(notifications),
}));

export const authIdentitiesRelations = relations(authIdentities, ({ one }) => ({
  user: one(users, { fields: [authIdentities.userId], references: [users.id] }),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, { fields: [authSessions.userId], references: [users.id] }),
  identity: one(authIdentities, {
    fields: [authSessions.identityId],
    references: [authIdentities.id],
  }),
  activeFirm: one(firms, {
    fields: [authSessions.activeFirmId],
    references: [firms.id],
  }),
}));

/* Firm */

export const firmsRelations = relations(firms, ({ many }) => ({
  branches: many(firmBranches),
  roles: many(roles),
  members: many(firmMembers),
  teams: many(teams),
  clients: many(clients),
  services: many(services),
}));

export const firmBranchesRelations = relations(firmBranches, ({ one }) => ({
  firm: one(firms, { fields: [firmBranches.firmId], references: [firms.id] }),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  firm: one(firms, { fields: [roles.firmId], references: [firms.id] }),
  members: many(firmMembers),
}));

export const firmMembersRelations = relations(firmMembers, ({ one, many }) => ({
  firm: one(firms, { fields: [firmMembers.firmId], references: [firms.id] }),
  user: one(users, { fields: [firmMembers.userId], references: [users.id] }),
  role: one(roles, { fields: [firmMembers.roleId], references: [roles.id] }),
  branch: one(firmBranches, {
    fields: [firmMembers.branchId],
    references: [firmBranches.id],
  }),
  reportsTo: one(firmMembers, {
    fields: [firmMembers.reportsToMemberId],
    references: [firmMembers.id],
    relationName: "reports_to",
  }),
  directReports: many(firmMembers, { relationName: "reports_to" }),
  teams: many(teamMembers),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  firm: one(firms, { fields: [teams.firmId], references: [firms.id] }),
  lead: one(firmMembers, {
    fields: [teams.leadMemberId],
    references: [firmMembers.id],
  }),
  members: many(teamMembers),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
  member: one(firmMembers, {
    fields: [teamMembers.memberId],
    references: [firmMembers.id],
  }),
}));

/* Clients */

export const clientGroupsRelations = relations(
  clientGroups,
  ({ one, many }) => ({
    firm: one(firms, { fields: [clientGroups.firmId], references: [firms.id] }),
    clients: many(clients),
  }),
);

export const clientsRelations = relations(clients, ({ one, many }) => ({
  firm: one(firms, { fields: [clients.firmId], references: [firms.id] }),
  group: one(clientGroups, {
    fields: [clients.groupId],
    references: [clientGroups.id],
  }),
  branch: one(firmBranches, {
    fields: [clients.branchId],
    references: [firmBranches.id],
  }),
  partner: one(firmMembers, {
    fields: [clients.partnerMemberId],
    references: [firmMembers.id],
  }),
  manager: one(firmMembers, {
    fields: [clients.managerMemberId],
    references: [firmMembers.id],
  }),
  taxProfiles: many(clientTaxProfiles),
  contacts: many(clientContacts),
  registrations: many(clientRegistrations),
  portalUsers: many(clientUsers),
  credentials: many(clientCredentials),
  dscCertificates: many(dscCertificates),
  engagements: many(engagements),
  obligations: many(complianceObligations),
  filings: many(filings),
  notices: many(notices),
  tasks: many(tasks),
  documents: many(documents),
  documentRequests: many(documentRequests),
  invoices: many(invoices),
  payments: many(payments),
  messages: many(messages),
}));

export const clientTaxProfilesRelations = relations(
  clientTaxProfiles,
  ({ one }) => ({
    client: one(clients, {
      fields: [clientTaxProfiles.clientId],
      references: [clients.id],
    }),
  }),
);

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  firm: one(firms, { fields: [contacts.firmId], references: [firms.id] }),
  personalClient: one(clients, {
    fields: [contacts.personalClientId],
    references: [clients.id],
  }),
  clients: many(clientContacts),
  dscCertificates: many(dscCertificates),
}));

export const clientContactsRelations = relations(clientContacts, ({ one }) => ({
  client: one(clients, {
    fields: [clientContacts.clientId],
    references: [clients.id],
  }),
  contact: one(contacts, {
    fields: [clientContacts.contactId],
    references: [contacts.id],
  }),
}));

export const clientRegistrationsRelations = relations(
  clientRegistrations,
  ({ one, many }) => ({
    client: one(clients, {
      fields: [clientRegistrations.clientId],
      references: [clients.id],
    }),
    obligations: many(complianceObligations),
    filings: many(filings),
  }),
);

export const clientUsersRelations = relations(clientUsers, ({ one }) => ({
  client: one(clients, {
    fields: [clientUsers.clientId],
    references: [clients.id],
  }),
  user: one(users, { fields: [clientUsers.userId], references: [users.id] }),
  contact: one(contacts, {
    fields: [clientUsers.contactId],
    references: [contacts.id],
  }),
}));

export const clientCredentialsRelations = relations(
  clientCredentials,
  ({ one }) => ({
    client: one(clients, {
      fields: [clientCredentials.clientId],
      references: [clients.id],
    }),
    registration: one(clientRegistrations, {
      fields: [clientCredentials.registrationId],
      references: [clientRegistrations.id],
    }),
  }),
);

export const dscCertificatesRelations = relations(
  dscCertificates,
  ({ one }) => ({
    client: one(clients, {
      fields: [dscCertificates.clientId],
      references: [clients.id],
    }),
    contact: one(contacts, {
      fields: [dscCertificates.contactId],
      references: [contacts.id],
    }),
  }),
);

/* Services */

export const servicesRelations = relations(services, ({ one, many }) => ({
  firm: one(firms, { fields: [services.firmId], references: [firms.id] }),
  engagements: many(engagements),
}));

export const engagementsRelations = relations(engagements, ({ one, many }) => ({
  client: one(clients, {
    fields: [engagements.clientId],
    references: [clients.id],
  }),
  service: one(services, {
    fields: [engagements.serviceId],
    references: [services.id],
  }),
  partner: one(firmMembers, {
    fields: [engagements.partnerMemberId],
    references: [firmMembers.id],
  }),
  manager: one(firmMembers, {
    fields: [engagements.managerMemberId],
    references: [firmMembers.id],
  }),
  engagementLetter: one(documents, {
    fields: [engagements.engagementLetterDocumentId],
    references: [documents.id],
  }),
  obligations: many(complianceObligations),
}));

/* Compliance */

export const complianceFormsRelations = relations(
  complianceForms,
  ({ many }) => ({
    dueDates: many(statutoryDueDates),
    obligations: many(complianceObligations),
    filings: many(filings),
  }),
);

export const statutoryDueDatesRelations = relations(
  statutoryDueDates,
  ({ one, many }) => ({
    form: one(complianceForms, {
      fields: [statutoryDueDates.formId],
      references: [complianceForms.id],
    }),
    filings: many(filings),
  }),
);

export const complianceObligationsRelations = relations(
  complianceObligations,
  ({ one, many }) => ({
    client: one(clients, {
      fields: [complianceObligations.clientId],
      references: [clients.id],
    }),
    registration: one(clientRegistrations, {
      fields: [complianceObligations.registrationId],
      references: [clientRegistrations.id],
    }),
    form: one(complianceForms, {
      fields: [complianceObligations.formId],
      references: [complianceForms.id],
    }),
    engagement: one(engagements, {
      fields: [complianceObligations.engagementId],
      references: [engagements.id],
    }),
    defaultAssignee: one(firmMembers, {
      fields: [complianceObligations.defaultAssigneeMemberId],
      references: [firmMembers.id],
    }),
    defaultReviewer: one(firmMembers, {
      fields: [complianceObligations.defaultReviewerMemberId],
      references: [firmMembers.id],
    }),
    filings: many(filings),
  }),
);

export const filingsRelations = relations(filings, ({ one, many }) => ({
  client: one(clients, {
    fields: [filings.clientId],
    references: [clients.id],
  }),
  registration: one(clientRegistrations, {
    fields: [filings.registrationId],
    references: [clientRegistrations.id],
  }),
  obligation: one(complianceObligations, {
    fields: [filings.obligationId],
    references: [complianceObligations.id],
  }),
  form: one(complianceForms, {
    fields: [filings.formId],
    references: [complianceForms.id],
  }),
  engagement: one(engagements, {
    fields: [filings.engagementId],
    references: [engagements.id],
  }),
  statutoryDueDate: one(statutoryDueDates, {
    fields: [filings.statutoryDueDateId],
    references: [statutoryDueDates.id],
  }),
  assignee: one(firmMembers, {
    fields: [filings.assigneeMemberId],
    references: [firmMembers.id],
  }),
  reviewer: one(firmMembers, {
    fields: [filings.reviewerMemberId],
    references: [firmMembers.id],
  }),
  filedBy: one(firmMembers, {
    fields: [filings.filedByMemberId],
    references: [firmMembers.id],
  }),
  revises: one(filings, {
    fields: [filings.revisesFilingId],
    references: [filings.id],
    relationName: "revisions",
  }),
  revisions: many(filings, { relationName: "revisions" }),
  tasks: many(tasks),
  notices: many(notices),
}));

export const noticesRelations = relations(notices, ({ one, many }) => ({
  client: one(clients, {
    fields: [notices.clientId],
    references: [clients.id],
  }),
  registration: one(clientRegistrations, {
    fields: [notices.registrationId],
    references: [clientRegistrations.id],
  }),
  filing: one(filings, {
    fields: [notices.filingId],
    references: [filings.id],
  }),
  assignee: one(firmMembers, {
    fields: [notices.assigneeMemberId],
    references: [firmMembers.id],
  }),
  reviewer: one(firmMembers, {
    fields: [notices.reviewerMemberId],
    references: [firmMembers.id],
  }),
  tasks: many(tasks),
}));

/* Work */

export const taskTemplatesRelations = relations(taskTemplates, ({ one }) => ({
  form: one(complianceForms, {
    fields: [taskTemplates.formId],
    references: [complianceForms.id],
  }),
  service: one(services, {
    fields: [taskTemplates.serviceId],
    references: [services.id],
  }),
}));

export const recurringTasksRelations = relations(recurringTasks, ({ one }) => ({
  template: one(taskTemplates, {
    fields: [recurringTasks.templateId],
    references: [taskTemplates.id],
  }),
  client: one(clients, {
    fields: [recurringTasks.clientId],
    references: [clients.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  client: one(clients, { fields: [tasks.clientId], references: [clients.id] }),
  filing: one(filings, { fields: [tasks.filingId], references: [filings.id] }),
  notice: one(notices, { fields: [tasks.noticeId], references: [notices.id] }),
  engagement: one(engagements, {
    fields: [tasks.engagementId],
    references: [engagements.id],
  }),
  parent: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: "subtasks",
  }),
  subtasks: many(tasks, { relationName: "subtasks" }),
  template: one(taskTemplates, {
    fields: [tasks.templateId],
    references: [taskTemplates.id],
  }),
  assignee: one(firmMembers, {
    fields: [tasks.assigneeMemberId],
    references: [firmMembers.id],
  }),
  reviewer: one(firmMembers, {
    fields: [tasks.reviewerMemberId],
    references: [firmMembers.id],
  }),
  timeEntries: many(timeEntries),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  member: one(firmMembers, {
    fields: [timeEntries.memberId],
    references: [firmMembers.id],
  }),
  client: one(clients, {
    fields: [timeEntries.clientId],
    references: [clients.id],
  }),
  task: one(tasks, { fields: [timeEntries.taskId], references: [tasks.id] }),
  filing: one(filings, {
    fields: [timeEntries.filingId],
    references: [filings.id],
  }),
  invoice: one(invoices, {
    fields: [timeEntries.invoiceId],
    references: [invoices.id],
  }),
}));

/* Documents */

export const documentFoldersRelations = relations(
  documentFolders,
  ({ one, many }) => ({
    client: one(clients, {
      fields: [documentFolders.clientId],
      references: [clients.id],
    }),
    parent: one(documentFolders, {
      fields: [documentFolders.parentId],
      references: [documentFolders.id],
      relationName: "folder_tree",
    }),
    children: many(documentFolders, { relationName: "folder_tree" }),
    documents: many(documents),
  }),
);

export const documentsRelations = relations(documents, ({ one, many }) => ({
  client: one(clients, {
    fields: [documents.clientId],
    references: [clients.id],
  }),
  folder: one(documentFolders, {
    fields: [documents.folderId],
    references: [documentFolders.id],
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedByUserId],
    references: [users.id],
  }),
  message: one(messages, {
    fields: [documents.messageId],
    references: [messages.id],
  }),
  links: many(documentLinks),
}));

export const documentLinksRelations = relations(documentLinks, ({ one }) => ({
  document: one(documents, {
    fields: [documentLinks.documentId],
    references: [documents.id],
  }),
}));

export const documentRequestsRelations = relations(
  documentRequests,
  ({ one }) => ({
    client: one(clients, {
      fields: [documentRequests.clientId],
      references: [clients.id],
    }),
    filing: one(filings, {
      fields: [documentRequests.filingId],
      references: [filings.id],
    }),
    task: one(tasks, {
      fields: [documentRequests.taskId],
      references: [tasks.id],
    }),
  }),
);

/* Billing */

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  branch: one(firmBranches, {
    fields: [invoices.branchId],
    references: [firmBranches.id],
  }),
  original: one(invoices, {
    fields: [invoices.originalInvoiceId],
    references: [invoices.id],
    relationName: "adjustments",
  }),
  adjustments: many(invoices, { relationName: "adjustments" }),
  lines: many(invoiceLines),
  allocations: many(paymentAllocations),
}));

export const invoiceLinesRelations = relations(invoiceLines, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLines.invoiceId],
    references: [invoices.id],
  }),
  service: one(services, {
    fields: [invoiceLines.serviceId],
    references: [services.id],
  }),
  filing: one(filings, {
    fields: [invoiceLines.filingId],
    references: [filings.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  client: one(clients, {
    fields: [payments.clientId],
    references: [clients.id],
  }),
  allocations: many(paymentAllocations),
}));

export const paymentAllocationsRelations = relations(
  paymentAllocations,
  ({ one }) => ({
    payment: one(payments, {
      fields: [paymentAllocations.paymentId],
      references: [payments.id],
    }),
    invoice: one(invoices, {
      fields: [paymentAllocations.invoiceId],
      references: [invoices.id],
    }),
  }),
);

export const disbursementsRelations = relations(disbursements, ({ one }) => ({
  client: one(clients, {
    fields: [disbursements.clientId],
    references: [clients.id],
  }),
  invoiceLine: one(invoiceLines, {
    fields: [disbursements.invoiceLineId],
    references: [invoiceLines.id],
  }),
}));

/* Communication */

export const messagesRelations = relations(messages, ({ one }) => ({
  client: one(clients, {
    fields: [messages.clientId],
    references: [clients.id],
  }),
  contact: one(contacts, {
    fields: [messages.contactId],
    references: [contacts.id],
  }),
  template: one(messageTemplates, {
    fields: [messages.templateId],
    references: [messageTemplates.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
