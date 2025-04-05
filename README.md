<a name="top"></a>

<p align="center">
    <a href="https://github.com/drslid/LogiMinder_Timesheet_PDF/graphs/contributors">
        <img src="https://img.shields.io/github/contributors/drslid/LogiMinder_Timesheet_PDF.svg?style=for-the-badge" alt="Contributors">
    </a>
    <a href="https://github.com/drslid/EvPortal/stargazers">
        <img src="https://img.shields.io/github/stars/drslid/LogiMinder_Timesheet_PDF.svg?style=for-the-badge" alt="Stargazers">
    </a>
    <a href="https://github.com/drslid/EvPortal/network/members">
        <img src="https://img.shields.io/github/forks/drslid/LogiMinder_Timesheet_PDF.svg?style=for-the-badge" alt="Forks">
    </a>
    <a href="https://github.com/drslid/EvPortal/issues">
        <img src="https://img.shields.io/github/issues/drslid/LogiMinder_Timesheet_PDF.svg?style=for-the-badge" alt="Issues">
    </a>
</p>

<h1 align="center">📑 LogiMinder Timesheet PDF 🗓️  </h1>

<p align="center">
  <b>LogiMinder Timesheet PDF</b> is a lightweight and powerful API for generating professional timesheet documents in PDF format from structured JSON data. It supports multiple languages, strict validation, and advanced customization options.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js">
  <img src="https://img.shields.io/badge/PDFKit-0277BD?style=for-the-badge&logo=adobeacrobatreader&logoColor=white" alt="PDFKit">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
</p>

<p align="center">
  <img src="example.jpg" alt="Sample Timesheet PDF" width="500">
</p>



## 📖 Table of Contents  
- [✨ Key Features](#-key-features)  
- [📋 How to Use](#-how-to-use)  
  - [🧰 Prerequisites](#prerequisites)  
  - [📥 Clone the Repository](#clone-the-repository)  
  - [📡 API Overview](#api-overview)  
  - [📬 API Usage](#api-usage)  
  - [🧾 Field Notes](#field-notes)  
  - [✅ JSON Validation](#json-validation)  
  - [🧠 Notes](#notes)  
- [🚀 Deployment](#-deployment)  
  - [🟢 Run with Node.js](#run-with-nodejs)  
  - [🐳 Run with Docker](#run-with-docker)  
  - [🧩 Run with Docker Compose](#run-with-docker-compose)  
- [🤝 Contributing](#-contributing)  
- [👥 Contributors](#-contributors)  


## ✨ Key Features

- 📄 **PDF Generation** – Automatically creates polished timesheet documents with logo, mission, client, consultant, and detailed tables.
- 🧪 **Strict JSON Validation** – Ensures complete and consistent data input.
- 🌍 **Multilingual Support** – Supports several languages (EN, FR, ES, DE, IT, PT, AR).
- 🧩 **Customization** – Supports logos (base64), custom headers, comments, summaries, and more.
- 📊 **Time Summary** – Includes daily and total summaries for work, holidays, absences, etc.

## 📋 **How to Use**


### Prerequisites
You can run the project either locally with Node.js or in a container with Docker:
- Node.js (v16 or newer) — if running locally
- Docker — if running in a container (alternative to Node.js)

### Clone the Repository
```bash
git clone https://github.com/drslid/LogiMinder_Timesheet_PDF.git
cd LogiMinder_Timesheet_PDF
```

### API Overview

- **Endpoint**: `POST /generate-pdf`
- **Content-Type**: `application/json`
- **Response**: Binary PDF file (`application/pdf`)

The API expects a structured JSON payload containing metadata (language, month, year), consultant/client information, a table structure, and optional comments.

### API Usage
#### Example request for PDF generation, using `curl` :
```bash
curl -X POST http://localhost:3000/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "language": "fr",
    "callData": {
      "logo": "data:image/jpeg;base64,****",
      "month": "Décembre",
      "year": "2023",
      "consultant": {
        "name": "Dupont",
        "firstName": "Jean",
        "email": "jean.dupont@example.com",
        "phone": "0123456789",
        "identifier": "12345"
      },
      "client": "Client XYZ",
      "mission": "Projet ABC",
      "table": {
        "header": ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim", "Lun", "Mar", "Mer"],
        "dates": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"],
        "mission": ["1", "0.5", "1", "0.5", "1", "0", "0", "1", "0.5", "1", "0.5", "1", "0", "0", "1", "0.5", "1", "0.5", "1", "0", "0", "1", "0.5", "1", "0.5", "1", "0", "0", "1", "0.5", "1"],
        "holidays": ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
        "leaves": ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
        "sickLeave": ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
        "others": ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
        "total": ["1", "0.5", "1", "0.5", "1", "0", "0", "1", "0.5", "1", "0.5", "1", "0", "0", "1", "0.5", "1", "0.5", "1", "0", "0", "1", "0.5", "1", "0.5", "1", "0", "0", "1", "0.5", "1"]
      },
      "totals": {
        "header": "Total",
        "values": ["15.5", "0", "0", "0", "0", "15.5"]
      },
      "comments": "Aucun commentaire.",
      "validations": {
        "employee": {
          "name": "Jean Dupont",
          "validationDate": "2023-12-31",
          "method": "Email",
          "token": "123456"
        },
        "approver": {
          "name": "Manager XYZ",
          "validationDate": "2023-12-31",
          "method": "Email",
          "token": "654321"
        }
      }
    }
  }'
```
### Field Notes

- **`language`**: Document language. Must be one of the supported codes:
  - `fr`: French  
  - `en`: English  
  - `es`: Spanish  
  - `pt`: Portuguese  
  - `de`: German  
  - `it`: Italian  
  - `ar`: Arabic  
- **`logo`**: Logo image in base64 format. Use a tool like [Base64-Image](https://www.base64-image.de/) to convert your files.
- **`month` and `year`**: Month and year of the report (e.g., "December", "2023").
- **`consultant`**: Consultant information (name, first name, email, phone, and identifier).
- **`client`**: Client name.
- **`mission`**: Project or mission name.
- **`table`**: Tabular data (headers, dates, values per day).
- **`totals`**: Summary of totals.
- **`comments`**: Additional comments.
- **`validations`**: Information about validations made by the consultant and the approver.

### JSON Validation

All incoming data is validated against a well-defined schema (`schema.js`). If the structure is invalid, the API will return an error with details. This ensures consistent and predictable PDF output.

### Notes

- The logo must be provided as a **base64-encoded** image (PNG or JPEG).
- The API returns the PDF directly in the response body.
- You can fully customize the layout by editing the EJS template (`template.ejs`).

## 🚀 Deployment

### Run with Node.js  ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)

#### 1. Install the dependencies :
   ```bash
   npm install
   ```
#### 2. Start the server :
   ```bash
   node server.js
   ```
#### 3. Access the API at `http://localhost:3000`.

### Run with Docker ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

#### 1. Build the Docker image :
   ```bash
   docker build -t logiminder-timesheet .
   ```
#### 2. Run the container :
   ```bash
   docker run -p 3000:3000 logiminder-timesheet
   ```
#### 3. Access the API at `http://localhost:3000`.


### Run with Docker Compose ![Docker Compose](https://img.shields.io/badge/Docker--Compose-blue?style=flat-square&logo=docker&logoColor=white)
#### 1. Start the application with :
   ```bash
   docker build -t logiminder-timesheet .
   ```
#### 2. Access the API at `http://localhost:3000`.

## 🤝 Contributing

I appreciate and encourage community contributions! If you'd like to help improve this project, here’s how you can get involved. 

### 🚀 How You Can Contribute

- 🐛 **Report Issues:** Found a bug or an issue? Open a new issue in our GitHub repository.  
- 💡 **Suggest Features:** Have an idea for improvement? Share it by opening an issue.  
- 🛠️ **Contribute Code:** Fork the repository, make changes, and submit a pull request to help enhance the project.  

### 📌 Contribution Guide

1. **Fork** the repository.  
2. **Create a new branch** for your feature or bug fix :  
   ```bash
   git checkout -b my-feature-branch
   ```
2. **Make changes** and commit them with a clear message :  
   ```bash
   git commit -am "Add my new feature"
   ```
2. **Push your branch** to your forked repository :  
   ```bash
   git push origin my-feature-branch
   ```
5. **Open a pull request** to the main repository, describing your changes and why they should be merged.

## 👥 **Contributors**

<a href="https://github.com/drslid/EvPortal/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=drslid/EvPortal" alt="EvPortal Contributors"/>
</a>
<p align="right"><a href="#top">⬆️ Back to top</a></p>

---
Build to automate timesheets. Generate clean, multilingual reports. 📄🌍🚀
