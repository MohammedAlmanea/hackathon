import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as pdfjsLib from 'pdfjs-dist';
import fs from 'fs';
import { marked } from 'marked';

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');

app.use(express.static('public'));

dotenv.config();

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: './public/uploads', // directory for uploaded files
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname); // unique filename
  },
});

const upload = multer({ storage });

// Define routes
app.get('/', (req, res) => {
  res.render('index', { title: 'Home' });
});

// Route to handle file uploads
app.post('/upload', upload.single('file'), async (req, res) => {
  try {

  if (!req.file) {
    return res.send('Please upload a file');
  }
  const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
  const __dirname = path.dirname(__filename); // get the name of the directory
  
  const file = new Uint8Array(fs.readFileSync(path.join(__dirname,`/public/uploads/${req.file.filename}`)));
  const pdfDoc = await pdfjsLib.getDocument(file).promise;
  
  let pdfText ='';

  for (let i = 1; i<=pdfDoc.numPages;i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();
    content.items.forEach(item => {
      pdfText += item.str + " ";
    });
  }

  console.log(pdfText);
  

const openai = new OpenAI();

const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
        { role: "system", content: "You are a helpful Solution Analysit that is an expert at converting Buisiness Requirements Document(BRD) into System Requirements Document(SRD)." },
        {
            role: "user",
            content: `Please convert the following Business Requirements Document (BRD) into a System Requirements Document (SRD). For each business requirement, create corresponding system requirements that outline specific technical specifications, actions, or system functionalities needed to meet the business goals.

Additionally, identify and list any systems or subsystems impacted by these requirements, explaining how each system would be affected or involved in implementing these requirements. Clearly organize the SRD into sections for easy readability, and include the following:

Requirement Mapping: Align each business requirement with one or more system requirements, showing a clear traceability.
System Architecture Impact: Identify each impacted system, module, or component and describe the changes or integrations required.
Functional and Non-functional Requirements: Specify any performance, security, scalability, or usability requirements.
Assumptions and Constraints: List any known assumptions or constraints that will impact the design or implementation.
Make sure to use tables for listing.
Here is the BRD content for conversion: [${pdfText}].`,
        },
    ],
});

const response = marked(completion.choices[0].message.content)
console.log(`AFTER MARKED ->> \N\N${response}`);


res.render('srd', {content: response})
} catch (error) {
  console.log(error);
}
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
