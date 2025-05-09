const { i18n } = require('./translations');

function getSchema(language) {
  const tableHeaders = Object.values(i18n[language].tableHeaders);

  return {
    type: 'object',
    properties: {
      language: { 
        type: 'string', 
        enum: Object.keys(i18n)
      },
      callData: {
        type: 'object',
        additionalProperties: false,
        properties: {
          logo: { 
            type: 'string', 
            pattern: '^data:image\\/(jpeg|png|gif);base64,[a-zA-Z0-9+/]+={0,2}$',
            maxLength: 1000000
          },
          date: { 
            type: 'string', 
            pattern: '^(0[1-9]|1[0-2])\\/\\d{4}$'
          },
          consultant: {
            type: 'object',
            properties: {
              name: { 
                type: 'string', 
                minLength: 1, 
                maxLength: 50
              },
              firstName: { 
                type: 'string', 
                minLength: 1, 
                maxLength: 50
              },
              email: { 
                type: 'string', 
                format: 'email', 
                pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
              },
              phone: { 
                type: 'string', 
                pattern: '^\\+\\d{1,4}\\d{6,15}$'
              },
              identifier: { 
                type: 'string', 
                minLength: 1, 
                maxLength: 20
              }
            },
            required: ['name', 'firstName', 'email']
          },
          client: { 
            type: 'string', 
            minLength: 1, 
            maxLength: 100
          },
          mission: { 
            type: 'string', 
            minLength: 1, 
            maxLength: 100
          },
          table: {
            type: 'object',
            properties: {
              mission: { 
                type: 'array', 
                items: { 
                  type: 'string', 
                  pattern: '^([1-9]|[12][0-9]|3[01]):(0|0\\.5|1)$' // Accepte 0, 0.5, 1
                }
              },
              leaves: { 
                type: 'array', 
                items: { 
                  type: 'string', 
                  pattern: '^([1-9]|[12][0-9]|3[01]):(0\\.5|1)$'
                }
              },
              sickLeave: { 
                type: 'array', 
                items: { 
                  type: 'string', 
                  pattern: '^([1-9]|[12][0-9]|3[01]):(0\\.5|1)$'
                }
              },
              others: { 
                type: 'array', 
                items: { 
                  type: 'string', 
                  pattern: '^([1-9]|[12][0-9]|3[01]):(0\\.5|1)$'
                }
              }
            },
            required: ['mission', 'leaves', 'sickLeave', 'others'] // Retirer 'mission'
          },
          comments: { 
            type: 'string', 
            maxLength: 1000
          },
          validations: {
            type: 'object',
            properties: {
              employee: {
                type: 'object',
                properties: {
                  name: { 
                    type: 'string', 
                    minLength: 1, 
                    maxLength: 100
                  },
                  validationDate: { 
                    type: 'string', 
                    format: 'date', 
                    pattern: '^\\d{4}-\\d{2}-\\d{2}$'
                  },
                  method: { 
                    type: 'string', 
                    enum: ['Email', 'SMS', 'Platform']
                  },
                  token: { 
                    type: 'string', 
                    minLength: 1, 
                    maxLength: 50
                  }
                },
                required: ['name', 'validationDate', 'method', 'token']
              },
              approver: {
                type: 'object',
                properties: {
                  name: { 
                    type: 'string', 
                    minLength: 1, 
                    maxLength: 100
                  },
                  validationDate: { 
                    type: 'string', 
                    format: 'date', 
                    pattern: '^\\d{4}-\\d{2}-\\d{2}$'
                  },
                  method: { 
                    type: 'string', 
                    enum: ['Email', 'SMS', 'Platform']
                  },
                  token: { 
                    type: 'string', 
                    minLength: 1, 
                    maxLength: 50
                  }
                },
                required: ['name', 'validationDate', 'method', 'token']
              }
            },
            required: ['employee', 'approver']
          }
        },
        required: ['consultant', 'client', 'table', 'date']
      }
    },
    required: ['language', 'callData']
  };
}

module.exports = getSchema;