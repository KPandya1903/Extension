/**
 * DataGenPro.js - High-Volume Synthetic Data Generator
 * Generates 100,000+ variations of job portal form scenarios.
 */

const fs = require('fs');
const path = require('path');

const CATEGORIES = {
  firstName: ['First Name', 'Given Name', 'Forename', 'Given name(s)', 'Name (Given)', 'What is your name?'],
  lastName: ['Last Name', 'Family Name', 'Surname', 'Name (Family)', 'Family name(s)'],
  over18: ['Are you over 18?', '18 years of age or older?', 'Confirm legal age', 'Age 18+', 'Are you of legal age to work?'],
  sponsorship: ['Do you require visa sponsorship?', 'Will you now or in the future require sponsorship?', 'Need sponsorship to work?'],
  authorized: ['Authorized to work in this country?', 'Legally authorized to work?', 'Eligible to work in the US?'],
  officeWilling: ['Willing to work from office?', 'Office work 5 days a week', 'On-site requirement: 5 days'],
  gender: ['Gender', 'Gender identity', 'What is your gender?', 'Sex', 'Self-identify: Gender'],
  ethnicity: ['Race', 'Ethnicity', 'What is your race?', 'Ethnic background', 'Self-identify: Race'],
  veteranStatus: ['Veteran status', 'Are you a veteran?', 'Protected veteran status', 'Military service'],
  disabilityStatus: ['Disability status', 'Do you have a disability?', 'Self-identify disability'],
  salaryExpectation: ['Salary expectation', 'Expected compensation', 'Target salary', 'Desired pay'],
  noticePeriod: ['Notice period', 'How soon can you start?', 'Availability to start'],
  yearsOfExperience: ['Years of experience', 'Total years of professional experience', 'Years of work']
};

const NOISE_PREFIXES = [
  'Please enter your ', 'Select your ', 'What is your ', 'Confirm your ', 'Provide ', 'Input ', '', ' ', '*', '(*) ', 'Required: '
];

const NOISE_SUFFIXES = [
  '?', ':', '', ' ', ' (Required)', ' *', ' (Self-ID)', ' - please specify', '.', '!'
];

function generate() {
  const data = [];
  const keys = Object.keys(CATEGORIES);

  // Target 100,000 samples
  for (let i = 0; i < 100000; i++) {
    const category = keys[Math.floor(Math.random() * keys.length)];
    const baseText = CATEGORIES[category][Math.floor(Math.random() * CATEGORIES[category].length)];
    const prefix = NOISE_PREFIXES[Math.floor(Math.random() * NOISE_PREFIXES.length)];
    const suffix = NOISE_SUFFIXES[Math.floor(Math.random() * NOISE_SUFFIXES.length)];
    
    let text = prefix + baseText + suffix;

    // Inject typos/random variations 5% of the time
    if (Math.random() < 0.05) {
      const idx = Math.floor(Math.random() * text.length);
      text = text.slice(0, idx) + String.fromCharCode(97 + Math.floor(Math.random() * 26)) + text.slice(idx + 1);
    }

    data.push({ i: text.toLowerCase(), o: category });
  }

  return data;
}

const samples = generate();
const outputPath = path.join(__dirname, 'data/training_data.json');
fs.writeFileSync(outputPath, JSON.stringify(samples));
console.log(`Generated ${samples.length} samples at ${outputPath}`);
