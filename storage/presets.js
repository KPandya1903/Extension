window.QF = window.QF || {};
QF.STORAGE_KEY = 'quick_copy_presets';
QF.PROFILE_KEY = 'quick_copy_profile';

QF.DEFAULT_PROFILE = {
  firstName: '',
  lastName: '',
  middleName: '',
  preferredName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  zip: '',
  company: '',
  linkedin: '',
  github: '',
  portfolio: '',
  summary: '',
  noticePeriod: '',
  salaryExpectation: '',
  yearsOfExperience: '',
  gender: 'Decline to self-identify',
  ethnicity: 'Decline to self-identify',
  veteranStatus: 'No',
  disabilityStatus: 'No',
  sponsorship: 'No',
  authorized: 'Yes',
  nationality: '',
  dualCitizenship: 'No',
  over18: 'Yes',
  officeWilling: 'Yes',
  previousWork: 'No',
  currentEmployee: 'No'
};

QF.DEFAULT_PRESETS = [
  { id: 'def-1', label: 'First Name', type: 'text', content: '[First Name]' },
  { id: 'def-2', label: 'Last Name', type: 'text', content: '[Last Name]' },
  { id: 'def-3', label: 'Email', type: 'text', content: '[email@example.com]' },
  { id: 'def-4', label: 'Phone', type: 'text', content: '[Phone Number]' },
  { id: 'def-5', label: 'Address', type: 'text', content: '[Full Address]' }
];

QF.Storage = {
  getProfile: function() {
    return new Promise((resolve) => {
      chrome.storage.local.get(QF.PROFILE_KEY, (result) => {
        resolve(result[QF.PROFILE_KEY] || { ...QF.DEFAULT_PROFILE });
      });
    });
  },
  saveProfile: function(profile) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [QF.PROFILE_KEY]: profile }, resolve);
    });
  },
  getPresets: function() {
    return new Promise((resolve) => {
      chrome.storage.local.get(QF.STORAGE_KEY, (result) => {
        const stored = result[QF.STORAGE_KEY];
        if (!stored || stored.length === 0) {
          resolve(QF.DEFAULT_PRESETS);
        } else {
          resolve(stored);
        }
      });
    });
  },
  savePresets: function(presets) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [QF.STORAGE_KEY]: presets }, resolve);
    });
  },
  addChangeListener: function(callback) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && (changes[QF.STORAGE_KEY] || changes[QF.PROFILE_KEY])) {
        if (changes[QF.STORAGE_KEY]) callback(changes[QF.STORAGE_KEY].newValue || [], 'presets');
        if (changes[QF.PROFILE_KEY]) callback(changes[QF.PROFILE_KEY].newValue || QF.DEFAULT_PROFILE, 'profile');
      }
    });
  }
};
