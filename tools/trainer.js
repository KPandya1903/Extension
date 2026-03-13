/**
 * Naive Bayes Trainer for QuickFill
 * Trains on synthetic data and exports a JSON model.
 */

const fs = require('fs');
const path = require('path');

const DATA_MAP = {
  firstName: ['First Name', 'Given Name', 'Forename', 'What is your first name?', 'Given name(s)', 'Name (Given)'],
  lastName: ['Last Name', 'Family Name', 'Surname', 'What is your last name?', 'Family name(s)', 'Name (Family)'],
  middleName: ['Middle Name', 'Middle Initial', 'Other names', 'Any other names?', 'Middle name'],
  over18: ['Are you over 18?', '18 years of age or older?', 'Confirm legal age', 'At least 18?', 'Minimum age requirement met?', 'Age 18+', 'Are you of legal age to work?'],
  sponsorship: ['Do you require visa sponsorship?', 'Will you now or in the future require sponsorship?', 'Need sponsorship to work?', 'Require visa support?', 'Employment visa status', 'Work sponsorship required?'],
  authorized: ['Authorized to work in this country?', 'Legally authorized to work?', 'Eligible to work in the US?', 'Work authorization status', 'Valid work permit held?', 'Right to work'],
  officeWilling: ['Willing to work from office?', 'Office work 5 days a week', 'On-site requirement: 5 days', 'Accept 5-day office week', 'Work from hub', 'Regular office presence'],
  previousWork: ['Have you worked here before?', 'Former employee?', 'Previous employment with us?', 'Rehire eligibility', 'Ever worked at this company?', 'Past history with us'],
  gender: ['Gender', 'Gender identity', 'What is your gender?', 'Sex', 'Self-identify: Gender', 'Biological sex', 'How do you identify?'],
  ethnicity: ['Race', 'Ethnicity', 'What is your race?', 'Ethnic background', 'Hispanic/Latino?', 'Self-identify: Race', 'Demographic: Race'],
  veteranStatus: ['Veteran status', 'Are you a veteran?', 'Protected veteran status', 'Military service', 'Disabled veteran', 'Served in the armed forces?'],
  disabilityStatus: ['Disability status', 'Do you have a disability?', 'Self-identify disability', 'History of impairment', 'Voluntary disclosure disability'],
  nationality: ['Nationality', 'Main citizenship', 'Country of citizenship', 'Primary nationality'],
  yearsOfExperience: ['Years of experience', 'Total years of professional experience', 'Experience duration'],
  noticePeriod: ['Notice period', 'How soon can you start?', 'Availability to start'],
  salaryExpectation: ['Salary expectation', 'Expected compensation', 'Desired pay', 'Target salary']
};

function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);
}

function train() {
  const model = {
    categories: {},
    vocabSize: 0,
    totalDocs: 0
  };

  const vocabulary = new Set();
  const trainingData = [];

  // Generate synthetic data
  for (const [key, variants] of Object.entries(DATA_MAP)) {
    variants.forEach(text => {
      trainingData.push({ text: text.toLowerCase(), category: key });
      trainingData.push({ text: text.toLowerCase() + '?', category: key });
      trainingData.push({ text: 'please enter ' + text.toLowerCase(), category: key });
    });
  }

  // Train
  trainingData.forEach(({ text, category }) => {
    if (!model.categories[category]) {
      model.categories[category] = { docCount: 0, wordCounts: {}, totalWords: 0 };
    }
    
    const words = tokenize(text);
    model.categories[category].docCount++;
    model.totalDocs++;
    
    words.forEach(word => {
      vocabulary.add(word);
      model.categories[category].wordCounts[word] = (model.categories[category].wordCounts[word] || 0) + 1;
      model.categories[category].totalWords++;
    });
  });

  model.vocabSize = vocabulary.size;
  return model;
}

const finalModel = train();
const modelDir = path.join(__dirname, '../models');
if (!fs.existsSync(modelDir)) fs.mkdirSync(modelDir);
fs.writeFileSync(path.join(modelDir, 'smart_model.json'), JSON.stringify(finalModel, null, 2));

console.log('Model trained successfully! Saved to models/smart_model.json');
