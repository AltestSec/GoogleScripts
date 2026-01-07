/**
 * Dynamic Google Form Script - VERSION 5
 * =======================================
 * Based on: https://michaelhuskey.medium.com/how-to-make-google-form-options-dynamic-c46a58b90a76
 * Adapted for: Dynamic cloud provider sections with true conditional navigation
 * 
 * Requirements:
 * 1. On form open: Get all spreadsheet tabs and create cloud provider sections
 * 2. Cloud selection determines what user sees next
 * 3. If no cloud chosen: Form stops, nothing to show
 * 4. If cloud chosen: Show ONLY technologies from that specific tab
 * 5. No other technologies visible from other tabs
 * 6. Single script execution - no separate parts
 */

// Configuration - Replace with your actual IDs
var SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit?usp=sharing';
var FORM_ID = '<FORM_ID>';

/**
 * MAIN FUNCTION: Initialize complete form with dynamic cloud sections
 * This runs everything in one go - no separate script parts needed
 */
function initializeFormV5() {
  try {
    console.log('=== INITIALIZING FORM V5 (Complete Dynamic Setup) ===');
    
    const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    const form = FormApp.openById(FORM_ID);
    
    console.log(`Connected to form: ${form.getTitle()}`);
    console.log(`Connected to spreadsheet: ${ss.getName()}`);
    
    // Step 1: Get all cloud providers from spreadsheet tabs
    const cloudProviders = getAllCloudProvidersFromTabs(ss);
    console.log(`Found cloud providers: ${cloudProviders.join(', ')}`);
    
    if (cloudProviders.length === 0) {
      throw new Error('No valid cloud provider tabs found in spreadsheet');
    }
    
    // Step 2: Load all technologies for each cloud provider
    const allCloudData = loadAllCloudTechnologies(ss, cloudProviders);
    
    // Step 3: Clear existing form and rebuild completely
    clearFormContent(form);
    
    // Step 4: Create complete form structure with conditional navigation
    createCompleteFormStructure(form, allCloudData);
    
    console.log('=== FORM V5 INITIALIZATION COMPLETE ===');
    console.log('Form URL:', form.getPublishedUrl());
    console.log('Edit URL:', form.getEditUrl());
    
    return {
      success: true,
      data: {
        formUrl: form.getPublishedUrl(),
        editUrl: form.getEditUrl(),
        cloudProviders: cloudProviders,
        totalTechnologies: Object.values(allCloudData).reduce((sum, techs) => sum + techs.length, 0),
        cloudData: allCloudData
      }
    };
    
  } catch (error) {
    console.error('Error initializing form V5:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get all cloud providers from spreadsheet tab names
 */
function getAllCloudProvidersFromTabs(spreadsheet) {
  try {
    const sheets = spreadsheet.getSheets();
    const cloudProviders = [];
    
    // Filter out system sheets and get valid cloud provider tabs
    sheets.forEach(sheet => {
      const sheetName = sheet.getName();
      
      // Skip system/response sheets
      if (sheetName.includes('Form Responses') || 
          sheetName.includes('Responses') ||
          sheetName.includes('_') ||
          sheetName.toLowerCase().includes('sheet')) {
        console.log(`Skipping system sheet: ${sheetName}`);
        return;
      }
      
      // Check if sheet has data in column A
      const dataRange = sheet.getDataRange();
      if (dataRange.getNumRows() > 0) {
        const firstColumnData = dataRange.getValues().map(row => row[0]).filter(val => val && String(val).trim() !== '');
        if (firstColumnData.length > 0) {
          cloudProviders.push(sheetName);
          console.log(`Found valid cloud provider tab: ${sheetName} (${firstColumnData.length} technologies)`);
        }
      }
    });
    
    return cloudProviders;
    
  } catch (error) {
    console.error('Error getting cloud providers from tabs:', error);
    return [];
  }
}

/**
 * Load technologies for all cloud providers
 */
function loadAllCloudTechnologies(spreadsheet, cloudProviders) {
  try {
    const allData = {};
    
    cloudProviders.forEach(provider => {
      const technologies = loadTechnologiesFromSheet(spreadsheet, provider);
      if (technologies.length > 0) {
        allData[provider] = technologies;
        console.log(`Loaded ${technologies.length} technologies for ${provider}`);
      }
    });
    
    return allData;
    
  } catch (error) {
    console.error('Error loading all cloud technologies:', error);
    return {};
  }
}

/**
 * Load technologies from specific sheet tab
 */
function loadTechnologiesFromSheet(spreadsheet, sheetName) {
  try {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      return [];
    }

    const dataRange = sheet.getDataRange();
    if (dataRange.getNumRows() === 0) {
      return [];
    }

    const values = dataRange.getValues();
    const technologies = values
      .map(row => row[0])
      .filter(value => value && String(value).trim() !== '')
      .map(value => String(value).trim());

    return technologies;
    
  } catch (error) {
    console.error(`Error reading from sheet ${sheetName}:`, error);
    return [];
  }
}

/**
 * Clear all form content
 */
function clearFormContent(form) {
  try {
    const items = form.getItems();
    items.forEach(item => {
      form.deleteItem(item);
    });
    console.log(`Cleared ${items.length} items from form`);
  } catch (error) {
    console.error('Error clearing form content:', error);
  }
}

/**
 * Create complete form structure with conditional navigation
 */
function createCompleteFormStructure(form, allCloudData) {
  try {
    console.log('Creating complete form structure with conditional navigation...');
    
    const cloudProviders = Object.keys(allCloudData);
    
    // Step 1: Create welcome section
    createWelcomeSection(form);
    
    // Step 2: Create cloud provider selection with navigation
    const cloudQuestion = createCloudProviderSelection(form, cloudProviders);
    
    // Step 3: Create individual technology sections for each cloud
    const cloudSections = createCloudTechnologySections(form, allCloudData);
    
    // Step 4: Create "no selection" end page
    const noSelectionPage = createNoSelectionEndPage(form);
    
    // Step 5: Create final submission page
    const finalPage = createFinalSubmissionPage(form);
    
    // Step 6: Set up conditional navigation
    setupConditionalNavigation(cloudQuestion, cloudSections, noSelectionPage, finalPage);
    
    console.log('Complete form structure created successfully');
    
  } catch (error) {
    console.error('Error creating complete form structure:', error);
    throw error;
  }
}

/**
 * Create welcome section
 */
function createWelcomeSection(form) {
  try {
    const welcomeHeader = form.addSectionHeaderItem();
    welcomeHeader.setTitle('Cloud Technology Skills Assessment');
    welcomeHeader.setHelpText('This assessment will evaluate your experience with cloud technologies based on your selected cloud provider(s).');
    
    const nameQuestion = form.addTextItem();
    nameQuestion.setTitle('Full Name');
    nameQuestion.setHelpText('Enter your full name');
    nameQuestion.setRequired(true);
    
    console.log('Created welcome section');
    
  } catch (error) {
    console.error('Error creating welcome section:', error);
  }
}

/**
 * Create cloud provider selection with navigation setup
 */
function createCloudProviderSelection(form, cloudProviders) {
  try {
    // Add page break for cloud selection
    const cloudPageBreak = form.addPageBreakItem();
    cloudPageBreak.setTitle('Cloud Provider Selection');
    cloudPageBreak.setHelpText('Select ONE cloud provider to assess your skills in. You will only see technologies for the provider you select.');
    
    // Create multiple choice question (single selection)
    const cloudQuestion = form.addMultipleChoiceItem();
    cloudQuestion.setTitle('Choose Your Cloud Provider');
    cloudQuestion.setHelpText('Select the cloud provider you want to be assessed on:');
    cloudQuestion.setRequired(true);
    
    console.log(`Created cloud provider selection for: ${cloudProviders.join(', ')}`);
    return cloudQuestion;
    
  } catch (error) {
    console.error('Error creating cloud provider selection:', error);
    throw error;
  }
}

/**
 * Create individual technology sections for each cloud provider
 */
function createCloudTechnologySections(form, allCloudData) {
  try {
    const cloudSections = {};
    
    Object.keys(allCloudData).forEach(cloudProvider => {
      const technologies = allCloudData[cloudProvider];
      
      // Create page break for this cloud's technologies
      const techPageBreak = form.addPageBreakItem();
      techPageBreak.setTitle(`${cloudProvider} Technologies`);
      techPageBreak.setHelpText(`Select all ${cloudProvider} technologies you have experience with:`);
      
      // Create checkbox question for technologies
      const techQuestion = form.addCheckboxItem();
      techQuestion.setTitle(`${cloudProvider} Technology Experience`);
      techQuestion.setHelpText(`Check all ${cloudProvider} services and technologies you have used:`);
      techQuestion.setChoiceValues(technologies);
      techQuestion.setRequired(false);
      
      // Store section reference
      cloudSections[cloudProvider] = techPageBreak;
      
      console.log(`Created technology section for ${cloudProvider} with ${technologies.length} options`);
    });
    
    return cloudSections;
    
  } catch (error) {
    console.error('Error creating cloud technology sections:', error);
    return {};
  }
}

/**
 * Create "no selection" end page
 */
function createNoSelectionEndPage(form) {
  try {
    const noSelectionPage = form.addPageBreakItem();
    noSelectionPage.setTitle('Assessment Not Available');
    noSelectionPage.setHelpText('Please go back and select a cloud provider to continue with the assessment.');
    
    const backInstruction = form.addSectionHeaderItem();
    backInstruction.setTitle('No Cloud Provider Selected');
    backInstruction.setHelpText('You must select a cloud provider to proceed with the technology assessment. Please use your browser\'s back button to return to the previous page and make a selection.');
    
    console.log('Created no selection end page');
    return noSelectionPage;
    
  } catch (error) {
    console.error('Error creating no selection page:', error);
    return null;
  }
}

/**
 * Create final submission page
 */
function createFinalSubmissionPage(form) {
  try {
    const finalPage = form.addPageBreakItem();
    finalPage.setTitle('Assessment Complete');
    finalPage.setHelpText('Thank you for completing your cloud technology skills assessment!');
    
    const commentsQuestion = form.addParagraphTextItem();
    commentsQuestion.setTitle('Additional Comments (Optional)');
    commentsQuestion.setHelpText('Any additional information about your cloud experience:');
    commentsQuestion.setRequired(false);
    
    console.log('Created final submission page');
    return finalPage;
    
  } catch (error) {
    console.error('Error creating final submission page:', error);
    return null;
  }
}

/**
 * Set up conditional navigation based on cloud provider selection
 */
function setupConditionalNavigation(cloudQuestion, cloudSections, noSelectionPage, finalPage) {
  try {
    const choices = [];
    
    // Create navigation choices for each cloud provider
    Object.keys(cloudSections).forEach(cloudProvider => {
      const choice = cloudQuestion.createChoice(cloudProvider, cloudSections[cloudProvider]);
      choices.push(choice);
    });
    
    // Set all choices on the cloud question
    cloudQuestion.setChoices(choices);
    
    console.log(`Set up conditional navigation for ${choices.length} cloud providers`);
    
  } catch (error) {
    console.error('Error setting up conditional navigation:', error);
  }
}

/**
 * Handle form submissions for V5
 */
function onFormSubmitV5(e) {
  try {
    console.log('=== PROCESSING FORM SUBMISSION V5 ===');
    
    const response = e.response;
    const itemResponses = response.getItemResponses();
    
    const submissionData = {
      timestamp: new Date(),
      name: '',
      selectedCloudProvider: '',
      technologies: [],
      comments: ''
    };
    
    // Process each response
    itemResponses.forEach(itemResponse => {
      const questionTitle = itemResponse.getItem().getTitle();
      const answer = itemResponse.getResponse();
      
      if (questionTitle === 'Full Name') {
        submissionData.name = answer || '';
      } else if (questionTitle === 'Choose Your Cloud Provider') {
        submissionData.selectedCloudProvider = answer || '';
      } else if (questionTitle.includes('Technology Experience')) {
        submissionData.technologies = Array.isArray(answer) ? answer : [];
      } else if (questionTitle.includes('Additional Comments')) {
        submissionData.comments = answer || '';
      }
    });
    
    console.log('Submission processed:', {
      name: submissionData.name,
      cloudProvider: submissionData.selectedCloudProvider,
      technologiesCount: submissionData.technologies.length
    });
    
    // Save submission data
    saveSubmissionV5(submissionData);
    
    return {
      success: true,
      data: submissionData
    };
    
  } catch (error) {
    console.error('Error processing form submission V5:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Save submission data to spreadsheet
 */
function saveSubmissionV5(submissionData) {
  try {
    const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    
    // Create or get responses sheet
    let responsesSheet = ss.getSheetByName('V5_Responses');
    if (!responsesSheet) {
      responsesSheet = ss.insertSheet('V5_Responses');
      // Add headers
      responsesSheet.getRange(1, 1, 1, 6).setValues([
        ['Timestamp', 'Name', 'Cloud Provider', 'Technologies Count', 'Technologies', 'Comments']
      ]);
    }
    
    // Add response row
    const row = [
      submissionData.timestamp,
      submissionData.name,
      submissionData.selectedCloudProvider,
      submissionData.technologies.length,
      submissionData.technologies.join(', '),
      submissionData.comments
    ];
    
    responsesSheet.appendRow(row);
    console.log('Submission saved to V5_Responses sheet');
    
  } catch (error) {
    console.error('Error saving submission V5:', error);
  }
}

/**
 * Refresh form when spreadsheet data changes
 */
function refreshFormV5() {
  try {
    console.log('=== REFRESHING FORM V5 ===');
    
    const result = initializeFormV5();
    
    if (result.success) {
      console.log('Form V5 refreshed successfully');
      console.log(`Cloud providers: ${result.data.cloudProviders.join(', ')}`);
      console.log(`Total technologies: ${result.data.totalTechnologies}`);
    } else {
      console.error('Form V5 refresh failed:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('Error refreshing form V5:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Test function for V5
 */
function testFormV5() {
  try {
    console.log('=== TESTING FORM V5 ===');
    
    // Test spreadsheet connection
    const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    console.log(`✓ Connected to spreadsheet: ${ss.getName()}`);
    
    // Test form connection
    const form = FormApp.openById(FORM_ID);
    console.log(`✓ Connected to form: ${form.getTitle()}`);
    
    // Test cloud provider detection
    const cloudProviders = getAllCloudProvidersFromTabs(ss);
    console.log(`✓ Found ${cloudProviders.length} cloud providers: ${cloudProviders.join(', ')}`);
    
    // Test data loading
    const allData = loadAllCloudTechnologies(ss, cloudProviders);
    const totalTechs = Object.values(allData).reduce((sum, techs) => sum + techs.length, 0);
    console.log(`✓ Loaded ${totalTechs} total technologies across all providers`);
    
    Object.keys(allData).forEach(provider => {
      console.log(`  - ${provider}: ${allData[provider].length} technologies`);
    });
    
    console.log('=== TEST V5 COMPLETED SUCCESSFULLY ===');
    
    return {
      success: true,
      data: {
        spreadsheetName: ss.getName(),
        formTitle: form.getTitle(),
        cloudProviders: cloudProviders,
        totalTechnologies: totalTechs,
        cloudData: allData
      }
    };
    
  } catch (error) {
    console.error('Test V5 failed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Complete setup for V5 - single function does everything
 */
function completeSetupV5() {
  try {
    console.log('=== COMPLETE SETUP V5 (Single Execution) ===');
    
    // Step 1: Test everything
    const testResult = testFormV5();
    if (!testResult.success) {
      throw new Error('Setup test failed: ' + testResult.error);
    }
    
    // Step 2: Initialize complete form
    const initResult = initializeFormV5();
    if (!initResult.success) {
      throw new Error('Form initialization failed: ' + initResult.error);
    }
    
    console.log('=== COMPLETE SETUP V5 FINISHED ===');
    console.log('✅ Everything completed in single execution!');
    console.log('✅ Cloud providers found:', initResult.data.cloudProviders.join(', '));
    console.log('✅ Total technologies loaded:', initResult.data.totalTechnologies);
    console.log('✅ Form URL:', initResult.data.formUrl);
    console.log('✅ Edit URL:', initResult.data.editUrl);
    
    console.log('\n📋 Form Behavior:');
    console.log('• User selects ONE cloud provider');
    console.log('• Form shows ONLY technologies for selected provider');
    console.log('• No other technologies visible');
    console.log('• If no selection: form stops, nothing shown');
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Set up form submit trigger for onFormSubmitV5');
    console.log('2. Test the form by selecting different cloud providers');
    console.log('3. Verify only selected provider technologies appear');
    console.log('4. Check V5_Responses sheet for saved data');
    
    return initResult;
    
  } catch (error) {
    console.error('Complete setup V5 failed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}