export const statusCases = [
  { entity: 'Lead', field: 'status', values: ['New', 'Assigned', 'In Process', 'Recycled', 'Dead'] },
  { entity: 'Opportunity', field: 'stage', values: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] },
  { entity: 'Case', field: 'status', values: ['New', 'Assigned', 'Pending', 'Closed', 'Rejected', 'Duplicate'] },
  { entity: 'Task', field: 'status', values: ['Not Started', 'Started', 'Completed', 'Canceled', 'Deferred'] },
  { entity: 'Meeting', field: 'status', values: ['Planned', 'Held', 'Not Held'] },
  { entity: 'Call', field: 'status', values: ['Planned', 'Held', 'Not Held'] },
  { entity: 'Campaign', field: 'status', values: ['Planning', 'Active', 'Inactive', 'Complete'] },
  { entity: 'KnowledgeBaseArticle', field: 'status', values: ['Draft', 'In Review', 'Published', 'Archived'] },
];
