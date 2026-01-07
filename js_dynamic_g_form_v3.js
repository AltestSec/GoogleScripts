/**
 * Dynamic Google Form Script - VERSION 3
 * =====================================
 * NEW APPROACH: Loads all data from spreadsheet on form open
 * Hides sections until cloud providers are selected
 * Uses Google Forms conditional logic and page breaks for true dynamic behavior
 */

// Configuration - Replace with your actual IDs
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit?usp=sharing';
const FORM_ID = '<FORM_ID>';
const CLOUD_QUESTION_TITLE = 'Cloud Providers';

/**
 * MAIN FUNCTION: Initialize form with all data loaded but sections hidden
 * Call this when form opens or when you want to refresh all data
 */
function initializeFormV3() {
  try {
    console.log('=== INITIALIZING FORM V3 ===');
    
    const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    const form = FormApp.openById(FORM_ID);
    
    console.log(`Connected to form: ${form.getTitle()}`);
    console.log(`Connected to spreadsheet: ${ss.getName()}`);
    
    // Step 1: Load all current data from spreadsheet
    const allCloudData = loadAllCloudDataFromSheets(ss);
    console.log('Loaded data for clouds:', Object.keys(allCloudData));
    
    // Step 2: Clear existing form structure (except title/description)
    clearFormContent(form);
    
    // Step 3: Create cloud selection question with navigation
    const cloudQuestion = createCloudSelectionWithNavigation(form, Object.keys(allCloudData));
    
    // Step 4: Create hidden sections for each cloud with all technologies
    createHiddenCloudSections(form, allCloudData, cloudQuestion);
    
    // Step 5: Add final submission page
    createFinalSubmissionPage(form);
    
    console.log('=== FORM V3 INITIALIZATION COMPLETE ===');
    console.log('Form URL:', form.getPublishedUrl());
    
    return {
      success: true,
      data: {
        formUrl: form.getPublishedUrl(),
        editUrl: form.getEditUrl(),
        cloudsLoaded: Object.keys(allCloudData),
        totalTechnologies: Object.values(allCloudData).reduce((sum, techs) => sum + techs.length, 0)
      }
    };
    
  } catch (error) {
    console.error('Error initializing form V3:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Load all cloud technology data from spreadsheet
 */
function loadAllCloudDataFromSheets(spreadsheet) {
  try {
    const cloudProviders = ['AWS', 'Azure', 'GCP'];
    const allData = {};
    
    cloudProviders.forEach(provider => {
      const technologies = readTechnologiesFromSheet(spreadsheet, provider);
      if (technologies.length > 0) {
        allData[provider] = technologies;
        console.log(`Loaded ${technologies.length} technologies for ${provider}`);
      } else {
        console.log(`No technologies found for ${provider} - skipping`);
      }
    });
    
    return allData;
    
  } catch (error) {
    console.error('Error loading cloud data:', error);
    throw error;
  }
}

/**
 * Read technologies from a specific sheet tab (column A)
 */
function readTechnologiesFromSheet(spreadsheet, sheetName) {
  try {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      console.log(`Sheet ${sheetName} not found`);
      return [];
    }

    const dataRange = sheet.getDataRange();
    if (dataRange.getNumRows() === 0) {
      console.log(`Sheet ${sheetName} is empty`);
      return [];
    }

    const values = dataRange.getValues();
    const technologies = values
      .map(row => row[0]) // Get first column
      .filter(value => value && String(value).trim() !== '') // Remove empty values
      .map(value => String(value).trim()); // Convert to string and trim

    return technologies;
    
  } catch (error) {
    console.error(`Error reading from sheet ${sheetName}:`, error);
    return [];
  }
}

/**
 * Clear form content but keep title and description
 */
function clearFormContent(form) {
  try {
    const items = form.getItems();
    
    // Remove all items
    items.forEach(item => {
      form.deleteItem(item);
    });
    
    console.log(`Cleared ${items.length} items from form`);
    
  } catch (error) {
    console.error('Error clearing form content:', error);
  }
}

/**
 * Create cloud selection question with conditional navigation
 */
function createCloudSelectionWithNavigation(form, availableClouds) {
  try {
    // Add instruction section
    const instruction = form.addSectionHeaderItem();
    instruction.setTitle('Cloud Provider Experience');
    instruction.setHelpText('Select the cloud providers you have experience with. You will then see technology sections for your selected providers.');
    
    // Create multiple choice question for cloud selection
    const cloudQuestion = form.addMultipleChoiceItem();
    cloudQuestion.setTitle(CLOUD_QUESTION_TITLE);
    cloudQuestion.setHelpText('Choose the cloud providers you want to assess your skills in:');
    cloudQuestion.setRequired(true);
    
    // We'll set up navigation after creating the sections
    return cloudQuestion;
    
  } catch (error) {
    console.error('Error creating cloud selection:', error);
    throw error;
  }
}

/**
 * Create hidden sections for each cloud provider
 */
function createHiddenCloudSections(form, allCloudData, cloudQuestion) {
  try {
    const choices = [];
    const sections = {};
    
    // Create a section for each cloud provider
    Object.keys(allCloudData).forEach(cloudProvider => {
      const technologies = allCloudData[cloudProvider];
      
      // Create page break (section) for this cloud
      const section = form.addPageBreakItem();
      section.setTitle(`${cloudProvider} Technologies`);
      section.setHelpText(`Select all ${cloudProvider} technologies and services you have experience with:`);
      
      // Add checkbox question for technologies
      const techQuestion = form.addCheckboxItem();
      techQuestion.setTitle(`${cloudProvider} Skills Assessment`);
      techQuestion.setHelpText(`Check all ${cloudProvider} technologies you have used:`);
      techQuestion.setChoiceValues(technologies);
      techQuestion.setRequired(false);
      
      // Add "Continue" button to next section or final page
      const continueItem = form.addMultipleChoiceItem();
      continueItem.setTitle('Continue');
      continueItem.setHelpText('Click Continue to proceed to the next section or submit your assessment.');
      
      // Store section reference
      sections[cloudProvider] = section;
      
      console.log(`Created section for ${cloudProvider} with ${technologies.length} technologies`);
    });
    
    // Create choices for cloud selection with navigation
    Object.keys(sections).forEach(cloudProvider => {
      const choice = cloudQuestion.createChoice(cloudProvider, sections[cloudProvider]);
      choices.push(choice);
    });
    
    // Set choices on the cloud question
    cloudQuestion.setChoices(choices);
    
    console.log(`Created navigation for ${choices.length} cloud providers`);
    
  } catch (error) {
    console.error('Error creating hidden sections:', error);
    throw error;
  }
}

/**
 * Create final submission page
 */
function createFinalSubmissionPage(form) {
  try {
    const finalSection = form.addPageBreakItem();
    finalSection.setTitle('Assessment Complete');
    finalSection.setHelpText('Thank you for completing your cloud technology skills assessment!');
    
    // Add optional feedback question
    const feedbackQuestion = form.addParagraphTextItem();
    feedbackQuestion.setTitle('Additional Comments (Optional)');
    feedbackQuestion.setHelpText('Any additional information about your cloud experience or specific projects:');
    feedbackQuestion.setRequired(false);
    
    console.log('Created final submission page');
    
  } catch (error) {
    console.error('Error creating final page:', error);
  }
}

/**
 * Handle form responses - process and validate submissions
 */
function onFormSubmitV3(e) {
  try {
    console.log('=== PROCESSING FORM SUBMISSION V3 ===');
    
    const response = e.response;
    const itemResponses = response.getItemResponses();
    const submissionData = {
      timestamp: new Date(),
      selectedClouds: [],
      cloudSkills: {},
      additionalComments: ''
    };
    
    // Process each response
    itemResponses.forEach(itemResponse => {
      const questionTitle = itemResponse.getItem().getTitle();
      const answer = itemResponse.getResponse();
      
      if (questionTitle === CLOUD_QUESTION_TITLE) {
        submissionData.selectedClouds = Array.isArray(answer) ? answer : [answer];
      } else if (questionTitle.includes('Skills Assessment')) {
        const cloudProvider = questionTitle.split(' ')[0]; // Extract cloud name
        submissionData.cloudSkills[cloudProvider] = Array.isArray(answer) ? answer : [];
      } else if (questionTitle.includes('Additional Comments')) {
        submissionData.additionalComments = answer || '';
      }
    });
    
    console.log('Submission processed:', {
      clouds: submissionData.selectedClouds,
      skillCounts: Object.keys(submissionData.cloudSkills).map(cloud => 
        `${cloud}: ${submissionData.cloudSkills[cloud].length} skills`
      )
    });
    
    // Optional: Save to spreadsheet or send notification
    saveSubmissionData(submissionData);
    
    return {
      success: true,
      data: submissionData
    };
    
  } catch (error) {
    console.error('Error processing form submission:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Save submission data to spreadsheet (optional)
 */
function saveSubmissionData(submissionData) {
  try {
    const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    
    // Create or get submissions sheet
    let submissionsSheet = ss.getSheetByName('Submissions');
    if (!submissionsSheet) {
      submissionsSheet = ss.insertSheet('Submissions');
      // Add headers
      submissionsSheet.getRange(1, 1, 1, 5).setValues([
        ['Timestamp', 'Selected Clouds', 'AWS Skills', 'Azure Skills', 'GCP Skills']
      ]);
    }
    
    // Add submission row
    const row = [
      submissionData.timestamp,
      submissionData.selectedClouds.join(', '),
      (submissionData.cloudSkills.AWS || []).join(', '),
      (submissionData.cloudSkills.Azure || []).join(', '),
      (submissionData.cloudSkills.GCP || []).join(', ')
    ];
    
    submissionsSheet.appendRow(row);
    console.log('Submission saved to spreadsheet');
    
  } catch (error) {
    console.error('Error saving submission:', error);
  }
}

/**
 * Refresh form data from spreadsheet (call when spreadsheet is updated)
 */
function refreshFormDataV3() {
  try {
    console.log('=== REFRESHING FORM DATA V3 ===');
    
    // Simply reinitialize the form with fresh data
    const result = initializeFormV3();
    
    if (result.success) {
      console.log('Form data refreshed successfully');
      console.log(`Updated with ${result.data.totalTechnologies} total technologies`);
    } else {
      console.error('Form refresh failed:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('Error refreshing form data:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Test function to verify everything works
 */
function testFormV3() {
  try {
    console.log('=== TESTING FORM V3 ===');
    
    // Test spreadsheet connection
    const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    console.log(`✓ Connected to spreadsheet: ${ss.getName()}`);
    
    // Test form connection
    const form = FormApp.openById(FORM_ID);
    console.log(`✓ Connected to form: ${form.getTitle()}`);
    
    // Test data loading
    const allData = loadAllCloudDataFromSheets(ss);
    console.log(`✓ Loaded data for ${Object.keys(allData).length} cloud providers`);
    
    Object.keys(allData).forEach(cloud => {
      console.log(`  - ${cloud}: ${allData[cloud].length} technologies`);
    });
    
    console.log('=== TEST COMPLETED SUCCESSFULLY ===');
    
    return {
      success: true,
      data: {
        spreadsheetName: ss.getName(),
        formTitle: form.getTitle(),
        cloudsFound: Object.keys(allData),
        totalTechnologies: Object.values(allData).reduce((sum, techs) => sum + techs.length, 0)
      }
    };
    
  } catch (error) {
    console.error('Test failed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Quick setup function - run this first
 */
function quickSetupV3() {
  try {
    console.log('=== QUICK SETUP V3 ===');
    
    // Step 1: Test connections
    const testResult = testFormV3();
    if (!testResult.success) {
      throw new Error('Connection test failed: ' + testResult.error);
    }
    
    // Step 2: Initialize form
    const initResult = initializeFormV3();
    if (!initResult.success) {
      throw new Error('Form initialization failed: ' + initResult.error);
    }
    
    console.log('=== QUICK SETUP COMPLETE ===');
    console.log('Your form is ready!');
    console.log('Form URL:', initResult.data.formUrl);
    console.log('Edit URL:', initResult.data.editUrl);
    
    return initResult;
    
  } catch (error) {
    console.error('Quick setup failed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}