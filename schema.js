const { i18n } = require('./translations');

function getSchema(language) {
  const tableHeaders = Object.values(i18n[language].tableHeaders); // Récupère les en-têtes de tableau dynamiquement

  return {
    type: 'object',
    properties: {
      language: { 
        type: 'string', 
        enum: Object.keys(i18n) // Validation pour les langues supportées
      },
      callData: {
        type: 'object',
        additionalProperties: false, // Interdit les champs non définis dans callData
        properties: {
          logo: { 
            type: 'string', 
            pattern: '^data:image\\/(jpeg|png|gif);base64,[a-zA-Z0-9+/]+={0,2}$' // Validation pour le format base64
          },
          month: { 
            type: 'string', 
            minLength: 1 // Validation pour s'assurer que le mois n'est pas vide
          },
          year: { 
            type: 'string', 
            pattern: '^\\d{4}$' // Validation pour une année à 4 chiffres
          },
          consultant: {
            type: 'object',
            properties: {
              name: { 
                type: 'string', 
                minLength: 1, 
                maxLength: 50 // Limite la longueur du nom
              },
              firstName: { 
                type: 'string', 
                minLength: 1, 
                maxLength: 50 // Limite la longueur du prénom
              },
              email: { 
                type: 'string', 
                format: 'email', 
                pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' // Validation robuste pour l'email
              },
              phone: { 
                type: 'string', 
                pattern: '^\\d{10}$' // Validation pour un numéro de téléphone à 10 chiffres
              },
              identifier: { 
                type: 'string', 
                minLength: 1, 
                maxLength: 20 // Limite la longueur de l'identifiant
              }
            },
            required: ['name', 'firstName', 'email']
          },
          client: { 
            type: 'string', 
            minLength: 1, 
            maxLength: 100 // Limite la longueur du nom du client
          },
          mission: { 
            type: 'string', 
            minLength: 1, 
            maxLength: 100 // Limite la longueur de la mission
          },
          table: {
            type: 'object',
            properties: {
              header: { 
                type: 'array', 
                items: { type: 'string' }, 
                minItems: 1 // Validation pour s'assurer que le tableau n'est pas vide
              },
              dates: { 
                type: 'array', 
                items: { 
                  type: 'string', 
                  pattern: '^(|([1-9]|[12][0-9]|3[01]))$' // Validation pour "" ou "1" à "31"
                }, 
                minItems: 1 // Validation pour s'assurer que le tableau n'est pas vide
              },
              mission: { 
                type: 'array', 
                items: { 
                  type: 'string', 
                  pattern: '^(0|0\\.5|1)$' // Validation pour "0", "0.5" ou "1"
                }, 
                minItems: 1 // Validation pour s'assurer que le tableau n'est pas vide
              },
              holidays: { 
                type: 'array', 
                items: { 
                  type: 'string', 
                  pattern: '^(0|0\\.5|1)$' // Validation pour "0", "0.5" ou "1"
                }, 
                minItems: 1 // Validation pour s'assurer que le tableau n'est pas vide
              },
              leaves: { 
                type: 'array', 
                items: { 
                  type: 'string', 
                  pattern: '^(0|0\\.5|1)$' // Validation pour "0", "0.5" ou "1"
                }, 
                minItems: 1 // Validation pour s'assurer que le tableau n'est pas vide
              },
              sickLeave: { 
                type: 'array', 
                items: { 
                  type: 'string', 
                  pattern: '^(0|0\\.5|1)$' // Validation pour "0", "0.5" ou "1"
                }, 
                minItems: 1 // Validation pour s'assurer que le tableau n'est pas vide
              },
              others: { 
                type: 'array', 
                items: { 
                  type: 'string', 
                  pattern: '^(0|0\\.5|1)$' // Validation pour "0", "0.5" ou "1"
                }, 
                minItems: 1 // Validation pour s'assurer que le tableau n'est pas vide
              },
              total: { 
                type: 'array', 
                items: { 
                  type: 'string', 
                  pattern: '^(0|0\\.5|1)$' // Validation pour "0", "0.5" ou "1"
                }, 
                minItems: 1 // Validation pour s'assurer que le tableau n'est pas vide
              }
            },
            required: ['header', 'dates', 'mission', 'holidays', 'leaves', 'sickLeave', 'others', 'total'] // Validation des propriétés requises
          },
          totals: {
            type: 'object',
            properties: {
              header: { 
                type: 'string', 
                minLength: 1, 
                maxLength: 50 // Limite la longueur de l'en-tête
              },
              values: { 
                type: 'array', 
                items: { 
                  type: 'string'
                }, 
                minItems: 1 // Validation pour s'assurer que le tableau n'est pas vide
              }
            },
            required: ['header', 'values']
          },
          comments: { 
            type: 'string', 
            maxLength: 1000 // Limite la longueur du commentaire
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
                    maxLength: 100 // Limite la longueur du nom
                  },
                  validationDate: { 
                    type: 'string', 
                    format: 'date', 
                    pattern: '^\\d{4}-\\d{2}-\\d{2}$' // Validation pour le format YYYY-MM-DD
                  },
                  method: { 
                    type: 'string', 
                    enum: ['Email', 'SMS', 'Other'] // Liste des méthodes autorisées
                  },
                  token: { 
                    type: 'string', 
                    minLength: 1, 
                    maxLength: 50 // Limite la longueur du token
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
                    maxLength: 100 // Limite la longueur du nom
                  },
                  validationDate: { 
                    type: 'string', 
                    format: 'date', 
                    pattern: '^\\d{4}-\\d{2}-\\d{2}$' // Validation pour le format YYYY-MM-DD
                  },
                  method: { 
                    type: 'string', 
                    enum: ['Email', 'SMS', 'Other'] // Liste des méthodes autorisées
                  },
                  token: { 
                    type: 'string', 
                    minLength: 1, 
                    maxLength: 50 // Limite la longueur du token
                  }
                },
                required: ['name', 'validationDate', 'method', 'token']
              }
            },
            required: ['employee', 'approver']
          }
        },
        required: ['consultant', 'client', 'table']
      }
    },
    required: ['language', 'callData']
  };
}

module.exports = getSchema;