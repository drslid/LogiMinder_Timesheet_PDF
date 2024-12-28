const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const PdfPrinter = require('pdfmake');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { i18n } = require('./translations');
const getSchema = require('./schema');

// Constantes pour éviter la répétition et faciliter la maintenance
const CONSTANTS = {
  COLORS: {
    HEADER: '#E6F3FF',
    WEEKEND: '#F5F5F5',
    BORDER: '#4FB0C6',
    TOTAL_BG: '#c5e8c5',
    FOOTER: '#CCCCCC'
  },
  FONT_SIZES: {
    DEFAULT: 7,
    HEADER: 14,
    SUBHEADER: 10,
    INFO: 9,
    COMMENTS: 8
  },
  COLUMN_WIDTHS: {
    INFO: 45,
    DAY: 19.5,
    TOTAL: 32
  }
};

// Configuration des polices
const fonts = {
  Roboto: {
    normal: path.join(__dirname, 'fonts', 'Roboto-Regular.ttf'),
    bold: path.join(__dirname, 'fonts', 'Roboto-Medium.ttf'),
    italics: path.join(__dirname, 'fonts', 'Roboto-Italic.ttf'),
    bolditalics: path.join(__dirname, 'fonts', 'Roboto-MediumItalic.ttf')
  }
};

const printer = new PdfPrinter(fonts);
const app = express();

// Middleware
app.use(bodyParser.json({ limit: '10mb' })); // Limite la taille des requêtes
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).send({ error: 'Invalid JSON' });
  }
  next();
});

// Ajv pour valider le JSON
const ajv = new Ajv();
addFormats(ajv);

// Helpers
const isWeekend = (dayAbbrev) => /(Sat|Sun|sam|dim)/i.test(dayAbbrev);

const createTableCell = (text, options = {}) => ({
  text,
  alignment: 'center',
  fontSize: CONSTANTS.FONT_SIZES.DEFAULT,
  ...options
});

const createInfoRow = (label, value, fontSize = CONSTANTS.FONT_SIZES.INFO) => ([
  { text: `${label}:`, fontSize },
  { text: value || '', fontSize }
]);

// PDF Generation Functions
function buildConsultantInfo(callData, t) {
  return [
    createInfoRow(t.consultant.name, callData.consultant?.name),
    createInfoRow(t.consultant.firstName, callData.consultant?.firstName),
    createInfoRow(t.consultant.email, callData.consultant?.email),
    createInfoRow(t.consultant.phone, callData.consultant?.phone),
    createInfoRow(t.consultant.identifier, callData.consultant?.identifier)
  ];
}

function buildClientInfo(callData, t) {
  return [
    createInfoRow(t.client, callData.client),
    createInfoRow(t.mission, callData.mission)
  ];
}

function buildTableRow(rowData, label, options = {}) {
  const row = (rowData || []).map(txt => createTableCell(txt, options));
  if (label) {
    row.unshift(createTableCell(label, options)); // Ajoute le libellé au début de la ligne
  }
  return row;
}

function buildTableContent(callData, t) {
  const { table = {}, totals = {} } = callData;
  if (!table.header?.length) {
    throw new Error('Invalid table data: missing header');
  }

  const createTotalCell = (value, options = {}) => createTableCell(value || '-', {
    fillColor: CONSTANTS.COLORS.TOTAL_BG,
    ...options
  });

  // Construction des lignes
  const joursHeader = [
    createTableCell('', { bold: true }), // Cellule vide pour l'en-tête
    ...buildTableRow(table.header, null, { bold: true }), // En-têtes des jours
    createTableCell(totals.header || 'TOTAL', { bold: true }) // Cellule "Total"
  ];

  const numerosJours = [
    createTableCell(t.tableHeaders.dates, { bold: true }), // Libellé "Dates"
    ...buildTableRow(table.dates), // Données des dates
    createTableCell('-') // Ignore la première valeur de totals
  ];

  const missionRow = [
    createTableCell(t.tableHeaders.mission, { bold: true }), // Libellé "Mission"
    ...buildTableRow(table.mission), // Données de la mission
    createTotalCell(totals.values?.[0], { bold: true }) // Total de la mission
  ];

  const holidaysRow = [
    createTableCell(t.tableHeaders.holidays, { bold: true }), // Libellé "Fériés"
    ...buildTableRow(table.holidays), // Données des fériés
    createTotalCell(totals.values?.[1]) // Total des fériés
  ];

  const leavesRow = [
    createTableCell(t.tableHeaders.leaves, { bold: true }), // Libellé "Congés"
    ...buildTableRow(table.leaves), // Données des congés
    createTotalCell(totals.values?.[2]) // Total des congés
  ];

  const sickRow = [
    createTableCell(t.tableHeaders.sickLeave, { bold: true }), // Libellé "Maladie"
    ...buildTableRow(table.sickLeave), // Données de la maladie
    createTotalCell(totals.values?.[3]) // Total de la maladie
  ];

  const othersRow = [
    createTableCell(t.tableHeaders.others, { bold: true }), // Libellé "Autres"
    ...buildTableRow(table.others), // Données des autres
    createTotalCell(totals.values?.[4]) // Total des autres
  ];

  const totalRow = [
    createTableCell(t.tableHeaders.total, { bold: true }), // Libellé "Total"
    ...buildTableRow(table.total, null, { bold: true }), // Données du total
    createTotalCell(totals.values?.[5], { bold: true }) // Total général
  ];

  return [
    joursHeader,
    numerosJours,
    missionRow,
    holidaysRow,
    leavesRow,
    sickRow,
    othersRow,
    totalRow
  ];
}

function buildDocDefinition(callData, lang) {
  const t = i18n[lang] || i18n.en;

  const defaultStyle = {
    fontSize: CONSTANTS.FONT_SIZES.DEFAULT,
    ...(lang === 'ar' && {
      direction: 'rtl',
      alignment: 'right'
    })
  };

  return {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [5, 10, 5, 10],
    defaultStyle,

    content: [
      {
        columns: [
          {
            width: 80,
            image: callData.logo,
            fit: [60, 60]
          },
          {
            text: `${t.mainTitle} - ${callData.month || ''} ${callData.year || ''}`,
            style: 'header',
            alignment: 'center'
          },
          { width: 80, text: '' }
        ],
        margin: [0, 0, 0, 10]
      },
      {
        columns: [
          {
            width: 'auto',
            table: {
              widths: ['auto', 'auto'],
              body: buildConsultantInfo(callData, t)
            },
            layout: 'noBorders'
          },
          { width: '*', text: '' },
          {
            width: 'auto',
            table: {
              widths: ['auto', '*'],
              body: buildClientInfo(callData, t)
            },
            layout: 'noBorders'
          }
        ],
        margin: [0, 0, 0, 10]
      },
      {
        table: {
          headerRows: 2,
          widths: [
            CONSTANTS.COLUMN_WIDTHS.INFO,
            ...Array(31).fill(CONSTANTS.COLUMN_WIDTHS.DAY),
            CONSTANTS.COLUMN_WIDTHS.TOTAL
          ],
          body: buildTableContent(callData, t)
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => CONSTANTS.COLORS.BORDER,
          vLineColor: () => CONSTANTS.COLORS.BORDER,
          fillColor: (rowIndex, node, columnIndex) => {
            if (rowIndex < 2) return CONSTANTS.COLORS.HEADER;
            if (columnIndex > 0 && columnIndex <= 31) {
              const dayAbbrev = callData.table?.header?.[columnIndex] || '';
              if (isWeekend(dayAbbrev)) return CONSTANTS.COLORS.WEEKEND;
            }
            return null;
          },
          paddingLeft: () => 2,
          paddingRight: () => 2,
          paddingTop: () => 2,
          paddingBottom: () => 2
        }
      },
      {
        margin: [0, 15, 0, 15],
        table: {
          widths: ['*'],
          body: [
            [{
              text: t.commentsLabel,
              style: 'commentHeader',
              fillColor: CONSTANTS.COLORS.HEADER
            }],
            [{
              text: callData.comments || '',
              fontSize: CONSTANTS.FONT_SIZES.COMMENTS,
              margin: [0, 30]
            }]
          ]
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => CONSTANTS.COLORS.BORDER,
          vLineColor: () => CONSTANTS.COLORS.BORDER
        }
      },
      buildValidationSection(callData, t)
    ],

    styles: {
      header: {
        fontSize: CONSTANTS.FONT_SIZES.HEADER,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      validationHeader: {
        fontSize: CONSTANTS.FONT_SIZES.SUBHEADER,
        bold: true,
        margin: [0, 2, 0, 2]
      },
      commentHeader: {
        fontSize: CONSTANTS.FONT_SIZES.SUBHEADER,
        bold: true,
        margin: [0, 2, 0, 2]
      }
    },

    footer: {
      text: t.footer,
      alignment: 'center',
      fontSize: CONSTANTS.FONT_SIZES.COMMENTS,
      color: CONSTANTS.COLORS.FOOTER
    }
  };
}

function buildValidationSection(callData, t) {
  const buildValidationText = (type) => ([
    { text: t.validation[type] + " : ", bold: true },
    { text: callData.validations?.[type]?.name + "\n\n" || '' },
    { text: t.validation.validationDate + " : ", bold: true },
    { text: callData.validations?.[type]?.validationDate + "\n" || '' },
    { text: t.validation.method + " : ", bold: true },
    { text: callData.validations?.[type]?.method + "\n" || '' },
    { text: t.validation.token + " : ", bold: true },
    { text: callData.validations?.[type]?.token || '' }
  ]);

  return {
    table: {
      widths: ['*', '*'],
      body: [
        [{
          text: t.validationTitle,
          style: 'validationHeader',
          colSpan: 2,
          fillColor: CONSTANTS.COLORS.HEADER
        }, {}],
        [{
          text: buildValidationText('employee'),
          fontSize: CONSTANTS.FONT_SIZES.COMMENTS
        }, {
          text: buildValidationText('approver'),
          fontSize: CONSTANTS.FONT_SIZES.COMMENTS
        }]
      ]
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => CONSTANTS.COLORS.BORDER,
      vLineColor: () => CONSTANTS.COLORS.BORDER
    }
  };
}

// Endpoint
app.post('/generate-pdf', async (req, res) => {
  try {
    const { language = 'en', callData } = req.body;

    // Valider les données avec le schéma dynamique
    const schema = getSchema(language);
    const validate = ajv.compile(schema);
    if (!validate(req.body)) {
      return res.status(400).json({ error: 'Invalid JSON schema', details: validate.errors });
    }

    const docDefinition = buildDocDefinition(callData, language);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    const chunks = [];
    pdfDoc.on('data', chunk => chunks.push(chunk));
    pdfDoc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res
        .set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="timesheet.pdf"',
          'Cache-Control': 'no-cache'
        })
        .send(pdfBuffer);
    });

    pdfDoc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Timesheet API running on port ${PORT}`);
});