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
    TOTAL_BG: '#E6F3FF', 
    TOTAL_GRAND_BG: '#cae4fc',
    MISSION_BG: '#82c29e',
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
  },
  Amiri: {
    normal: path.join(__dirname, 'fonts', 'Amiri-Regular.ttf'),
    bold: path.join(__dirname, 'fonts', 'Amiri-Bold.ttf'),
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
const isWeekend = (dayAbbrev, lang = 'en') => {
  const days = i18n[lang]?.days || i18n.en.days;
  const isMatch = dayAbbrev.toLowerCase() === days.Sat.toLowerCase() || 
                  dayAbbrev.toLowerCase() === days.Sun.toLowerCase();
  return isMatch;
};

const createTableCell = (text, options = {}, lang = 'en') => ({
  text,
  alignment: lang === 'ar' ? 'right' : 'center',
  fontSize: CONSTANTS.FONT_SIZES.DEFAULT,
  ...options
});


function createInfoRow(label, value, fontSize = CONSTANTS.FONT_SIZES.INFO, lang = 'en') {
  return [
    createTableCell(`${label}:`, { fontSize }, lang),
    createTableCell(value || '', { fontSize }, lang)
  ];
}

// PDF Generation Functions
function buildConsultantInfo(callData, t, lang) {
  return [
    createInfoRow(t.consultant.name, callData.consultant?.name, CONSTANTS.FONT_SIZES.INFO, lang),
    createInfoRow(t.consultant.firstName, callData.consultant?.firstName, CONSTANTS.FONT_SIZES.INFO, lang),
    createInfoRow(t.consultant.email, callData.consultant?.email, CONSTANTS.FONT_SIZES.INFO, lang),
    createInfoRow(t.consultant.phone, callData.consultant?.phone, CONSTANTS.FONT_SIZES.INFO, lang),
    createInfoRow(t.consultant.identifier, callData.consultant?.identifier, CONSTANTS.FONT_SIZES.INFO, lang)
  ];
}

function buildClientInfo(callData, t, lang) {
  return [
    createInfoRow(t.client, callData.client, CONSTANTS.FONT_SIZES.INFO, lang),
    createInfoRow(t.mission, callData.mission, CONSTANTS.FONT_SIZES.INFO, lang)
  ];
}

function buildTableRow(rowData, label, options = {}, lang = 'en') {
  const row = (rowData || []).map(txt => createTableCell(txt, options, lang));
  if (label) {
    row.unshift(createTableCell(label, options, lang));
  }
  return row;
}

// Fonction pour convertir les pointeurs de jours en tableau complet
const parseDayPointers = (pointers, daysInMonth) => {
  const result = Array(daysInMonth).fill('0');
  if (pointers) {
    pointers.forEach(pointer => {
      const [day, value] = pointer.split(':');
      const index = parseInt(day) - 1; // Jour commence à 1, index à 0
      if (index >= 0 && index < daysInMonth) {
        result[index] = value;
      }
    });
  }
  return result;
};

// Fonction pour calculer mission, total, et totals
const calculateTotals = (table, daysInMonth, t, lang) => {
  // Convertir les pointeurs en tableaux complets
  const leaves = parseDayPointers(table.leaves, daysInMonth);
  const sickLeave = parseDayPointers(table.sickLeave, daysInMonth);
  const others = parseDayPointers(table.others, daysInMonth);

  // Initialiser mission : 1 pour les jours ouvrés, 0 pour samedi/dimanche par défaut
  const mission = Array(daysInMonth).fill('0');
  for (let i = 0; i < daysInMonth; i++) {
    const dayAbbrev = table.header?.[i] || '';
    const isWeekendDay = isWeekend(dayAbbrev, lang);
    mission[i] = isWeekendDay ? '0' : '1';
  }

  // Appliquer les valeurs de table.mission pour surcharger les jours spécifiés
  if (table.mission) {
    table.mission.forEach(pointer => {
      const [day, value] = pointer.split(':');
      const index = parseInt(day) - 1; // Jour commence à 1, index à 0
      if (index >= 0 && index < daysInMonth) {
        mission[index] = value;
      }
    });
  }

  // Si leaves, sickLeave, ou others est non nul, mission = 0 pour ce jour
  for (let i = 0; i < daysInMonth; i++) {
    if (
      parseFloat(leaves[i]) > 0 ||
      parseFloat(sickLeave[i]) > 0 ||
      parseFloat(others[i]) > 0
    ) {
      mission[i] = '0';
    }
  }

  // Calculer total (somme par jour)
  const total = Array(daysInMonth).fill('0');
  for (let i = 0; i < daysInMonth; i++) {
    const sum = (
      parseFloat(mission[i] || '0') +
      parseFloat(leaves[i] || '0') +
      parseFloat(sickLeave[i] || '0') +
      parseFloat(others[i] || '0')
    ).toFixed(1);
    total[i] = sum === '0.0' ? '0' : sum;
  }

  // Calculer totals.values (somme par catégorie)
  const sumArray = (arr) => arr.reduce((sum, val) => sum + parseFloat(val || '0'), 0).toFixed(1);
  const totals = {
    header: t.tableHeaders.total.toUpperCase(),
    values: [
      sumArray(mission),
      sumArray(leaves),
      sumArray(sickLeave),
      sumArray(others),
      sumArray(total)
    ].map(val => val === '0.0' ? '0' : val)
  };

  return { mission, leaves, sickLeave, others, total, totals };
};

function buildTableContent(callData, t, lang) {
  const { table = {} } = callData;
  const daysInMonth = table.header?.length || 31;

  // Calculer mission, total, et totals
  const { mission, leaves, sickLeave, others, total, totals } = calculateTotals(table, daysInMonth, t, lang);

  const createTotalCell = (value, options = {}) => createTableCell(value || '-', {
    fillColor: CONSTANTS.COLORS.TOTAL_BG,
    ...options
  }, lang);

  const normalizedTable = {
    header: table.header || [],
    dates: table.dates || Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString()),
    mission,
    leaves,
    sickLeave,
    others,
    total
  };

  const joursHeader = [
    createTableCell('', { bold: true }, lang),
    ...buildTableRow(normalizedTable.header, null, { bold: true }, lang),
    createTableCell(totals.header, { bold: true }, lang)
  ];

  const numerosJours = [
    createTableCell(t.tableHeaders.dates, { bold: true }, lang),
    ...buildTableRow(normalizedTable.dates, null, {}, lang),
    createTableCell('-', {}, lang)
  ];

  const missionRow = [
    createTableCell(t.tableHeaders.mission, { bold: true }, lang),
    ...buildTableRow(normalizedTable.mission, null, {}, lang),
    createTotalCell(totals.values[0], { bold: true, fillColor: CONSTANTS.COLORS.MISSION_BG },)
  ];

  const leavesRow = [
    createTableCell(t.tableHeaders.leaves, { bold: true }, lang),
    ...buildTableRow(normalizedTable.leaves, null, {}, lang),
    createTotalCell(totals.values[1])
  ];

  const sickRow = [
    createTableCell(t.tableHeaders.sickLeave, { bold: true }, lang),
    ...buildTableRow(normalizedTable.sickLeave, null, {}, lang),
    createTotalCell(totals.values[2])
  ];

  const othersRow = [
    createTableCell(t.tableHeaders.others, { bold: true }, lang),
    ...buildTableRow(normalizedTable.others, null, {}, lang),
    createTotalCell(totals.values[3])
  ];

  const totalRow = [
    createTableCell(t.tableHeaders.total, { bold: true }, lang),
    ...buildTableRow(normalizedTable.total, null, { bold: true }, lang),
    createTableCell(totals.values[4], { bold: true, fillColor: CONSTANTS.COLORS.TOTAL_GRAND_BG }, lang) 
  ];

  return [
    joursHeader,
    numerosJours,
    missionRow,
    leavesRow,
    sickRow,
    othersRow,
    totalRow
  ];
}

// Ajouter une fonction pour générer header et dates
const generateMonthData = (date, lang) => {
  const [month, year] = date.split('/').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate(); // Nombre de jours dans le mois
  const t = i18n[lang] || i18n.en;

  // Générer les numéros des jours
  const dates = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());

  // Générer les jours de la semaine (header)
  const header = [];
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0 = Dim, 1 = Lun, ..., 6 = Sam
  // Ordre des jours aligné avec getDay(): Dim, Lun, Mar, Mer, Jeu, Ven, Sam
  const dayKeys = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 0; i < daysInMonth; i++) {
    const dayIndex = (firstDay + i) % 7; // Calcule l'index du jour
    header.push(t.days[dayKeys[dayIndex]]); // Ajoute l'abréviation traduite
  }

  return { header, dates };
};

function buildDocDefinition(callData, lang) {
  const t = i18n[lang] || i18n.en;

  // Parser la date MM/YYYY
  let monthName = '';
  let year = '';
  if (callData.date) {
    const [month, yearStr] = callData.date.split('/');
    monthName = t.months[month] || '';
    year = yearStr;
  }

  // Initialiser callData.table si undefined
  callData.table = callData.table || {};

  // Générer header et dates
  const { header, dates } = generateMonthData(callData.date, lang);
  callData.table.header = header;
  callData.table.dates = dates;

  // Normaliser les abréviations des jours dans table.header (si nécessaire)
  if (callData.table?.header) {
    callData.table.header = callData.table.header.map((dayAbbrev) => {
      const frToTarget = {
        Lun: t.days.Mon,
        Mar: t.days.Tue,
        Mer: t.days.Wed,
        Jeu: t.days.Thu,
        Ven: t.days.Fri,
        Sam: t.days.Sat,
        Dim: t.days.Sun
      };
      return frToTarget[dayAbbrev] || dayAbbrev;
    });
  }

  const daysInMonth = callData.table.header.length;

  const defaultStyle = {
    font: lang === 'ar' ? 'Amiri' : 'Roboto',
    fontSize: CONSTANTS.FONT_SIZES.DEFAULT,
    ...(lang === 'ar' && {
      direction: 'rtl',
      alignment: 'right'
    })
  };

  // Construire le contenu du document
  const content = [
    {
      columns: [
        {
          width: 80,
          image: callData.logo,
          fit: [60, 60]
        },
        {
          text: `${t.mainTitle} - ${monthName} ${year}`,
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
            body: buildConsultantInfo(callData, t, lang)
          },
          layout: 'noBorders'
        },
        { width: '*', text: '' },
        {
          width: 'auto',
          table: {
            widths: ['auto', '*'],
            body: buildClientInfo(callData, t, lang)
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
          ...Array(daysInMonth).fill(CONSTANTS.COLUMN_WIDTHS.DAY),
          CONSTANTS.COLUMN_WIDTHS.TOTAL
        ],
        body: buildTableContent(callData, t, lang)
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => CONSTANTS.COLORS.BORDER,
        vLineColor: () => CONSTANTS.COLORS.BORDER,
        fillColor: (rowIndex, node, columnIndex) => {
          if (rowIndex < 2) return CONSTANTS.COLORS.HEADER;
          if (columnIndex > 0 && columnIndex <= daysInMonth) {
            const dayAbbrev = callData.table?.header?.[columnIndex - 1] || '';
            if (isWeekend(dayAbbrev, lang)) return CONSTANTS.COLORS.WEEKEND;
          }
          return null;
        },
        paddingLeft: () => 2,
        paddingRight: () => 2,
        paddingTop: () => 2,
        paddingBottom: () => 2
      }
    }
  ];

  // Ajouter le bloc des commentaires uniquement si callData.comments est non vide
  if (callData.comments?.trim()) {
    content.push({
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
            text: callData.comments,
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
    });
  }

  // Ajouter la section de validation
  content.push({
    margin: [0, callData.comments?.trim() ? 0 : 15, 0, 0],
    ...buildValidationSection(callData, t)
  });


  return {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [5, 10, 5, 10],
    defaultStyle,
    content,
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
  console.log(`LogiMinder Timesheet API running on port ${PORT}`);
});