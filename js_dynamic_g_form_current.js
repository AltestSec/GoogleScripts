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
 * 4. If cloud chosen: Show ONLY technologies from that specific tab.
 * 5. No other technologies visible from other tabs
 * 6. Single script execution - no separate parts
 */

// Configuration - Replace with your actual IDs
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1t-dfF2wKZedBwtK0sDj-UtaMvCJnmnVfGZTvD48YueM/edit?usp=sharing';
const FORM_ID = '12uJj0-OhGex6cWaHFfzgAK9-KjtKd4Jj1ZiFzJsVdH8';
//const email = response.getRespondentEmail();
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
    //const SubmitSection = createSubmitSelection(form, Submit);
    
    // Step 4: Create "no selection" end page
    //const noSelectionPage = createNoSelectionEndPage(form);
    
    // Step 5: Create final submission page
    const finalPage = createFinalSubmissionPage(form);
    
    // Step 6: Set up conditional navigation
    //setupConditionalNavigation(cloudQuestion, cloudSections, noSelectionPage, finalPage);
    setupConditionalNavigation(cloudQuestion, cloudSections, finalPage);
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
    //welcomeHeader.setTitle('Cloud Technology Skills Feedback');
    //welcomeHeader.setHelpText('This assessment will evaluate your experience with cloud technologies based on your selected cloud provider(s).');
    
    const nameQuestion = form.addTextItem();
    nameQuestion.setTitle('Full Name of a Padawan');
    nameQuestion.setHelpText('Enter full name');
    nameQuestion.setRequired(true);
    
    //console.log('Created welcome section');

    const nameQuestion1 = form.addTextItem();
    nameQuestion1.setTitle('Project Name');
    nameQuestion1.setHelpText('Enter the project name');
    nameQuestion1.setRequired(true);
    
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
    //cloudPageBreak.setHelpText('Select ONE cloud provider to assess your skills in. You will only see technologies for the provider you select.');
    
    // Create multiple choice question (single selection)
    const cloudQuestion = form.addMultipleChoiceItem();
    cloudQuestion.setTitle('Choose Your Cloud Provider');
    //cloudQuestion.setHelpText('Select the cloud provider you want to be assessed on:');
    cloudQuestion.setRequired(true);
    
    console.log(`Created cloud provider selection for: ${cloudProviders.join(', ')}`);
    return cloudQuestion;
    
  } catch (error) {
    console.error('Error creating cloud provider selection:', error);
    throw error;
  }
}

/**
 * Create Go to Submit sections for each cloud provider technology
 */
    // NEW: Add "Go to Submit" option to skip technology selection - added after kirov to have an additional option
    //choices.push(cloudQuestion.createChoice('Go to Submit', finalPage));

/* function createSubmitSelection(form, Submit) {
  try {
    // Add page break for cloud selection
    const cloudPageBreak = form.addPageBreakItem();
    cloudPageBreak.setTitle('Next step or finish');
    cloudPageBreak.setHelpText('Select to go to the submit page. You will only see the last page.');
    
    // Create multiple choice question (single selection)
    const cloudQuestion = form.addMultipleChoiceItem();
    cloudQuestion.setTitle('Choose Submit to finish');
    cloudQuestion.setHelpText('Select to finish or skip a technology:');
    cloudQuestion.setRequired(true);
    
    //console.log(`Select to finish: ${Submit.join(', ')}`);
    return cloudQuestion;
    
  } catch (error) {
    console.error('Error creating Submit section:', error);
    throw error;
  }
} */

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

      // NEW: "Next step" navigation question after technologies - added after kiro
      const nextQuestion = form.addMultipleChoiceItem();
      nextQuestion.setTitle('Next step');
      nextQuestion.setHelpText('Choose another cloud to evaluate, or submit the feedback.');
      nextQuestion.setRequired(true);
      
      // Store section reference
      //cloudSections[cloudProvider] = techPageBreak;
      //added after kiro
      cloudSections[cloudProvider] = {
        pageBreak: techPageBreak,
        nextQuestion: nextQuestion
      };
      
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
/* function createNoSelectionEndPage(form) {
  try {
    const noSelectionPage = form.addPageBreakItem();
    noSelectionPage.setTitle('Feedback is not fully completed');
    noSelectionPage.setHelpText('Please go back and select a cloud provider to continue with the feedback.');
    
    const backInstruction = form.addSectionHeaderItem();
    backInstruction.setTitle('No Cloud Provider Selected');
    backInstruction.setHelpText('You must select a cloud provider to proceed with the technology. Please use your browser\'s back button to return to the previous page and make a selection.');
    
    console.log('Created no selection end page');
    return noSelectionPage;
    
  } catch (error) {
    console.error('Error creating no selection page:', error);
    return null;
  }
} */

/**
 * Create final submission page
 */
function createFinalSubmissionPage(form) {
  try {
    const finalPage = form.addPageBreakItem();
    finalPage.setTitle('Feedback Complete');
    finalPage.setHelpText('Thank you for completing the Padawan cloud technology skills questionnaire!');
    
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
//function setupConditionalNavigation(cloudQuestion, cloudSections, noSelectionPage, finalPage) {
function setupConditionalNavigation(cloudQuestion, cloudSections, finalPage) {
  try {
/*     const choices = [];
    
    // Create navigation choices for each cloud provider
    Object.keys(cloudSections).forEach(cloudProvider => {
      const choice = cloudQuestion.createChoice(cloudProvider, cloudSections[cloudProvider]);
      choices.push(choice);
    });
    

    // NEW: Add "Go to Submit" option to skip technology selection - added after kirov to have an additional option
    choices.push(cloudQuestion.createChoice('Go to Submit', finalPage));

    // Set all choices on the cloud question
    cloudQuestion.setChoices(choices);
    
    console.log(`Set up conditional navigation for ${choices.length} cloud providers`); */
    //added after kiro
    const providers = Object.keys(cloudSections);

    // 1) Initial question routing: Choose cloud -> go to that cloud section
    const startChoices = providers.map(p =>
      cloudQuestion.createChoice(p, cloudSections[p].pageBreak)
    );
    startChoices.push(cloudQuestion.createChoice('Go to Submit', finalPage));
    cloudQuestion.setChoices(startChoices);

    // 2) Per-cloud "Next step" routing (forward-only)
    providers.forEach((p, idx) => {
      const nextQ = cloudSections[p].nextQuestion;
      const nextChoices = [];

      // allow only later clouds to avoid "chosen before"
      for (let j = idx + 1; j < providers.length; j++) {
        const nextProvider = providers[j];
        nextChoices.push(nextQ.createChoice(nextProvider, cloudSections[nextProvider].pageBreak));
      }

      nextChoices.push(nextQ.createChoice('Go to Submit', finalPage));
      nextQ.setChoices(nextChoices);
    });

    console.log(`Set up conditional navigation for ${providers.length} cloud providers (+ submit)`);    
   //finish added after kiro 
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
    
/*     const submissionData = {
      timestamp: new Date(),
      name: '',
      selectedCloudProvider: '',
      technologies: [],
      comments: ''
    }; */
    const submissionData = {
      timestamp: new Date(),
      name: '',
      projectName: '',
      selectedCloudProvider: [],
      technologies: {},
      comments: '',
      email: ''
    };
    
    submissionData.email = response.getRespondentEmail ? (response.getRespondentEmail() || '') : '';
    // Process each response
    itemResponses.forEach(itemResponse => {
      const questionTitle = itemResponse.getItem().getTitle();
      const answer = itemResponse.getResponse();
      
      if (questionTitle === 'Full Name of a Padawan') {
        submissionData.name = answer || '';
      } else if (questionTitle === 'Project Name') {
        submissionData.projectName = answer || '';
/*       } else if (questionTitle === 'Choose Your Cloud Provider') {
        submissionData.selectedCloudProvider = answer || ''; */
      } else if (questionTitle === 'Choose Your Cloud Provider') {
        if (answer) submissionData.selectedCloudProvider.push(String(answer));
      } else if (questionTitle === 'Next step') {
    // user navigates to next cloud or submit
        if (answer && answer !== 'Go to Submit') submissionData.selectedCloudProvider.push(String(answer));
    //end new added after kiro
      } else if (questionTitle.includes('Technology Experience')) {
      //  submissionData.technologies = Array.isArray(answer) ? answer : [];
      // Title looks like: "AWS Technology Experience"
        const cloud = questionTitle.replace(' Technology Experience', '').trim();
        submissionData.technologies[cloud] = Array.isArray(answer) ? answer : [];
      //end added after kiro
      } else if (questionTitle.includes('Additional Comments')) {
        submissionData.comments = answer || '';
      }
    });
    
    console.log('Submission processed:', {
      name: submissionData.name,
      project: submissionData.projectName,
      cloudProvider: submissionData.selectedCloudProvider,
      technologiesCount: submissionData.technologies.length
    });
    
    //begin added after kiro
    // NEW: Build output fields
    submissionData.selectedCloudProvider = [...new Set(submissionData.selectedCloudProvider)]; // dedupe, keep order mostly

    const techParts = [];
    let techCount = 0;
    Object.keys(submissionData.technologies).forEach(cloud => {
      const list = submissionData.technologies[cloud] || [];
      techCount += list.length;
      if (list.length) techParts.push(`${cloud}: ${list.join(', ')}`);
    });

    submissionData.technologiesCount = techCount;
    submissionData.technologiesSummary = techParts.join(' | ');
    //end added after kiro

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
/*       // Add headers
      responsesSheet.getRange(1, 1, 1, 6).setValues([
        ['Timestamp', 'Name', 'Cloud Provider', 'Technologies Count', 'Technologies', 'Comments']
      ]); */
    //begin added after kiro
    // Add headers
      //responsesSheet.getRange(1, 1, 1, 8).setValues([
        //['Timestamp', 'Name', 'Project Name', 'Cloud Provider', 'Technologies Count', 'Technologies', 'Comments']
      //  ['Timestamp', 'Name', 'Project Name', 'Cloud Provider', 'Technologies Count', 'Technologies', 'Comments', 'TechLeadEmail']
      //]);
      const headers = [
        'Timestamp',
        'Name',
        'Project Name',
        'Clouds',
        'Technologies Count',
        'Technologies',
        'Comments',
        'TechLeadEmail'
       ];
    responsesSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    //end added after kiro
    }
    
    // Add response row
/*     const row = [
      submissionData.timestamp,
      submissionData.name,
      submissionData.selectedCloudProvider,
      submissionData.technologies.length,
      submissionData.technologies.join(', '),
      submissionData.comments
    ]; */
    //added after kiro var2 each cloud - new line
/*     const row = [
       submissionData.timestamp,
       submissionData.name,
       submissionData.projectName,
       submissionData.selectedCloudProvider.join(', '),
       submissionData.technologiesCount || 0,
       submissionData.technologiesSummary || '',
       submissionData.comments
    ]; */
    
    //responsesSheet.appendRow(row); //added after kiro var2 each cloud - new line
    // Write one row per cloud
    const clouds = submissionData.selectedCloudProvider || [];
    const techByCloud = submissionData.technologies || {};
    
    if (clouds.length === 0) {
      // Fallback: still write a row even if no cloud was captured
      responsesSheet.appendRow([
        submissionData.timestamp,
        submissionData.name,
        submissionData.projectName,
        '',
        0,
        '',
        submissionData.comments,
        submissionData.email || ''
      ]);
    //submissionData.comments
      return;
    }
    
    clouds.forEach(cloud => {
      const techList = techByCloud[cloud] || [];
      responsesSheet.appendRow([
        submissionData.timestamp,
        submissionData.name,
        submissionData.projectName,
        cloud,
        techList.length,
        techList.join(', '),
        submissionData.comments,
        submissionData.email || ''
      ]);
    });

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
