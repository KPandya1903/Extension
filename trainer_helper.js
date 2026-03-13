
  const DATA_MAP = {
  firstName: ['First Name', 'Given Name', 'Forename', 'What is your first name?', 'Given name(s)', 'Name (Given)'],
  lastName: ['Last Name', 'Family Name', 'Surname', 'What is your last name?', 'Family name(s)', 'Name (Family)'],
  middleName: ['Middle Name', 'Middle Initial', 'Other names', 'Any other names?', 'Middle name'],
  over18: [
    'Are you over 18?', 
    'Are you 18 years of age or older?', 
    'Confirm you are of legal age', 
    'Are you at least 18?', 
    'Age verification: 18+',
    'Do you meet the minimum age requirement?',
    'Are you 18 or older?'
  ],
  sponsorship: [
    'Do you require visa sponsorship?', 
    'Will you now or in the future require sponsorship?', 
    'Do you need sponsorship to work?', 
    'Visa sponsorship required?',
    'Do you need a work permit?',
    'Sponsorship status'
  ],
  authorized: [
    'Are you authorized to work in this country?', 
    'Legally authorized to work?', 
    'Can you provide proof of eligibility to work?', 
    'Are you eligible to work in the US?',
    'Work authorization status'
  ],
  officeWilling: [
    'Willing to work from office?', 
    'Can you work in the office 5 days a week?', 
    'On-site requirement: 5 days', 
    'Are you comfortable with office work?',
    'Office presence 100%',
    'Accept 5-day office week?'
  ],
  previousWork: [
    'Have you worked here before?', 
    'Former employee?', 
    'Previous employment with us?', 
    'Have you ever been employed by this company?',
    'Internal applicant status',
    'Rehire eligibility'
  ],
  gender: [
    'Gender', 
    'How do you identify?', 
    'Gender identity', 
    'What is your gender?',
    'Sex'
  ],
  ethnicity: [
    'Race', 
    'Ethnicity', 
    'What is your race?', 
    'Ethnic background',
    'Self-identification: Race'
  ],
  veteranStatus: [
    'Veteran status', 
    'Are you a veteran?', 
    'Protected veteran status', 
    'Military service',
    'Have you served in the armed forces?'
  ],
  disabilityStatus: [
    'Disability status', 
    'Do you have a disability?', 
    'Self-identify disability', 
    'Voluntary disclosure of disability'
  ],
  nationality: [
    'Nationality', 
    'Main citizenship', 
    'Country of citizenship', 
    'Primary nationality'
  ],
  yearsOfExperience: [
    'Years of experience', 
    'Total years of professional experience', 
    'How many years have you worked?', 
    'Experience duration'
  ],
  noticePeriod: [
    'Notice period', 
    'How soon can you start?', 
    'Availability to start', 
    'Notice duration required'
  ],
  salaryExpectation: [
    'Salary expectation', 
    'Expected compensation', 
    'Desired pay', 
    'What is your target salary?'
  ]
};
  function generate() {
    const trainingData = [];
    for (const [key, variants] of Object.entries(DATA_MAP)) {
      variants.forEach(text => {
        trainingData.push({ input: text.toLowerCase(), output: key });
        trainingData.push({ input: text.toLowerCase() + '?', output: key });
        trainingData.push({ input: text.toLowerCase() + ':', output: key });
      });
    }
    return trainingData;
  }
  module.exports = { generate };
