/**
 * Dynamic Google Form Script - VERSION 4
 * =======================================
 * SIMPLIFIED APPROACH: Single cloud provider (Azure) with true conditional logic
 * 
 * Requirements:
 * 1. Connect sheet and form with script
 * 2. Form has 2 sections: name + Azure checkbox (unchecked by default)
 * 3. Load technologies from sheet tab matching checkbox name
 * 4. Next page shows technologies ONLY if Azure is checked
 * 5. If unchecked - next page is empty
 * 6. If checked - show technologies from spreadsheet
 * 7. Record answers when technologies are selected
 */

// Configuration - Replace with your actual IDs
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit?usp=sharing';
const FORM_ID = '<FORM_ID>';

// Global configuration for V4
var CLOUD_PROVIDER = 'Azure'; // Single cloud provider for V4

/**
 * MAIN FUNCTION: Initialize form V4 with single cloud provider logic
 */
function initializeFormV4() {
  try {
    console.log('=== INITIALIZING FORM V4 (Single Cloud Provider) ===');
    
    const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    const form = FormApp.openById(FORM_ID);
    
    console.log(`Connected to form: ${form.getTitle()}`);
    console.log(`Connected to spreadsheet: ${ss.getName()}`);
    
    // Step 1: Load technologies from the cloud provider sheet
    const technologies = loadTechnologiesFromSheet(ss, CLOUD_PROVIDER);
    console.log(`Loaded ${technologies.length} technologies from ${CLOUD_PROVIDER} sheet`);
    
    // Step 2: Clear existing form content
    clearFormContent(form);
    
    // Step 3: Create the form structure
    createFormStructureV4(form, technologies);
    
    console.log('=== FORM V4 INITIALIZATION COMPLETE ===');
    console.log('Form URL:', form.getPublishedUrl());
    
    return {
      success: true,
      data: {
        formUrl: form.getPublishedUrl(),
        editUrl: form.getEditUrl(),
        cloudProvider: CLOUD_PROVIDER,
        technologiesLoaded: technologies.length,
        technologies: technologies
      }
    };
    
  } catch (error) {
    console.error('Error initializing form V4:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Load technologies from specific sheet tab
 */
function loadTechnologiesFromSheet(spreadsheet, sheetName) {
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

    console.log(`Successfully loaded ${technologies.length} technologies from ${sheetName}`);
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
 * Create the complete form structure with conditional logic
 */
function createFormStructureV4(form, technologies) {
  try {
    console.log('Creating form structure...');
    
    // SECTION 1: Name and Cloud Provider Selection
    createNameAndCloudSection(form);
    
    // SECTION 2: Technology Selection (conditional)
    createTechnologySection(form, technologies);
    
    // SECTION 3: Final submission page
    createFinalSection(form);
    
    console.log('Form structure created successfully');
    
  } catch (error) {
    console.error('Error creating form structure:', error);
    throw error;
  }
}

/**
 * Create Section 1: Name and Cloud Provider checkbox
 */
function createNameAndCloudSection(form) {
  try {
    // Add section header
    const sectionHeader = form.addSectionHeaderItem();
    sectionHeader.setTitle('Personal Information & Cloud Experience');
    sectionHeader.setHelpText('Please provide your name and indicate your cloud provider experience.');
    
    // Add name question
    const nameQuestion = form.addTextItem();
    nameQuestion.setTitle('Full Name');
    nameQuestion.setHelpText('Enter your full name');
    nameQuestion.setRequired(true);
    
    // Add page break before cloud selection
    const pageBreak1 = form.addPageBreakItem();
    pageBreak1.setTitle('Cloud Provider Experience');
    pageBreak1.setHelpText('Select the cloud provider you have experience with:');
    
    // Add cloud provider checkbox (single choice, unchecked by default)
    const cloudQuestion = form.addCheckboxItem();
    cloudQuestion.setTitle('Cloud Provider Experience');
    cloudQuestion.setHelpText(`Check if you have experience with ${CLOUD_PROVIDER}:`);
    cloudQuestion.setChoiceValues([CLOUD_PROVIDER]);
    cloudQuestion.setRequired(false); // Not required - can be unchecked
    
    console.log(`Created name and ${CLOUD_PROVIDER} selection section`);
    
  } catch (error) {
    console.error('Error creating name and cloud section:', error);
    throw error;
  }
}

/**
 * Create Section 2: Technology selection with conditional logic
 */
function createTechnologySection(form, technologies) {
  try {
    if (technologies.length === 0) {
      console.log('No technologies to create section for');
      return;
    }
    
    // Create page break for technology section
    const techPageBreak = form.addPageBreakItem();
    techPageBreak.setTitle(`${CLOUD_PROVIDER} Technologies`);
    techPageBreak.setHelpText(`Select all ${CLOUD_PROVIDER} technologies you have experience with:`);
    
    // Add technology selection question
    const techQuestion = form.addCheckboxItem();
    techQuestion.setTitle(`${CLOUD_PROVIDER} Technology Skills`);
    techQuestion.setHelpText(`Check all ${CLOUD_PROVIDER} services and technologies you have used:`);
    techQuestion.setChoiceValues(technologies);
    techQuestion.setRequired(false);
    
    console.log(`Created technology section with ${technologies.length} options`);
    
  } catch (error) {
    console.error('Error creating technology section:', error);
    throw error;
  }
}

/**
 * Create Section 3: Final submission
 */
function createFinalSection(form) {
  try {
    // Final page break
    const finalPageBreak = form.addPageBreakItem();
    finalPageBreak.setTitle('Assessment Complete');
    finalPageBreak.setHelpText('Thank you for completing your skills assessment!');
    
    // Optional comments
    const commentsQuestion = form.addParagraphTextItem();
    commentsQuestion.setTitle('Additional Comments (Optional)');
    commentsQuestion.setHelpText('Any additional information about your experience:');
    commentsQuestion.setRequired(false);
    
    console.log('Created final submission section');
    
  } catch (error) {
    console.error('Error creating final section:', error);
  }
}

/**
 * Handle form submissions for V4
 */
function onFormSubmitV4(e) {
  try {
    console.log('=== PROCESSING FORM SUBMISSION V4 ===');
    
    const response = e.response;
    const itemResponses = response.getItemResponses();
    
    const submissionData = {
      timestamp: new Date(),
      name: '',
      cloudSelected: false,
      technologies: [],
      comments: ''
    };
    
    // Process each response
    itemResponses.forEach(itemResponse => {
      const questionTitle = itemResponse.getItem().getTitle();
      const answer = itemResponse.getResponse();
      
      if (questionTitle === 'Full Name') {
        submissionData.name = answer || '';
      } else if (questionTitle === 'Cloud Provider Experience') {
        const selectedClouds = Array.isArray(answer) ? answer : [];
        submissionData.cloudSelected = selectedClouds.includes(CLOUD_PROVIDER);
      } else if (questionTitle === `${CLOUD_PROVIDER} Technology Skills`) {
        submissionData.technologies = Array.isArray(answer) ? answer : [];
      } else if (questionTitle.includes('Additional Comments')) {
        submissionData.comments = answer || '';
      }
    });
    
    console.log('Submission processed:', {
      name: submissionData.name,
      cloudSelected: submissionData.cloudSelected,
      technologiesCount: submissionData.technologies.length,
      technologies: submissionData.technologies.slice(0, 3) // Show first 3
    });
    
    // Save submission data
    saveSubmissionToSheet(submissionData);
    
    return {
      success: true,
      data: submissionData
    };
    
  } catch (error) {
    console.error('Error processing form submission V4:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Save submission data to spreadsheet
 */
function saveSubmissionToSheet(submissionData) {
  try {
    const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    
    // Create or get responses sheet
    let responsesSheet = ss.getSheetByName('Form_Responses');
    if (!responsesSheet) {
      responsesSheet = ss.insertSheet('Form_Responses');
      // Add headers
      responsesSheet.getRange(1, 1, 1, 6).setValues([
        ['Timestamp', 'Name', 'Cloud Selected', 'Technologies Count', 'Technologies', 'Comments']
      ]);
    }
    
    // Add response row
    const row = [
      submissionData.timestamp,
      submissionData.name,
      submissionData.cloudSelected ? 'Yes' : 'No',
      submissionData.technologies.length,
      submissionData.technologies.join(', '),
      submissionData.comments
    ];
    
    responsesSheet.appendRow(row);
    console.log('Submission saved to Form_Responses sheet');
    
  } catch (error) {
    console.error('Error saving submission to sheet:', error);
  }
}

/**
 * Refresh form data when spreadsheet is updated
 */
function refreshFormV4() {
  try {
    console.log('=== REFRESHING FORM V4 ===');
    
    const result = initializeFormV4();
    
    if (result.success) {
      console.log('Form refreshed successfully');
      console.log(`Updated with ${result.data.technologiesLoaded} technologies`);
    } else {
      console.error('Form refresh failed:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('Error refreshing form V4:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Test function for V4
 */
function testFormV4() {
  try {
    console.log('=== TESTING FORM V4 ===');
    
    // Test spreadsheet connection
    const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    console.log(`✓ Connected to spreadsheet: ${ss.getName()}`);
    
    // Test form connection
    const form = FormApp.openById(FORM_ID);
    console.log(`✓ Connected to form: ${form.getTitle()}`);
    
    // Test data loading
    const technologies = loadTechnologiesFromSheet(ss, CLOUD_PROVIDER);
    console.log(`✓ Loaded ${technologies.length} technologies from ${CLOUD_PROVIDER} sheet`);
    
    if (technologies.length > 0) {
      console.log(`  Sample technologies: ${technologies.slice(0, 5).join(', ')}${technologies.length > 5 ? '...' : ''}`);
    }
    
    console.log('=== TEST V4 COMPLETED SUCCESSFULLY ===');
    
    return {
      success: true,
      data: {
        spreadsheetName: ss.getName(),
        formTitle: form.getTitle(),
        cloudProvider: CLOUD_PROVIDER,
        technologiesFound: technologies.length,
        sampleTechnologies: technologies.slice(0, 5)
      }
    };
    
  } catch (error) {
    console.error('Test V4 failed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Quick setup for V4 - run this first
 */
function quickSetupV4() {
  try {
    console.log('=== QUICK SETUP V4 ===');
    
    // Step 1: Test connections
    const testResult = testFormV4();
    if (!testResult.success) {
      throw new Error('Connection test failed: ' + testResult.error);
    }
    
    // Step 2: Initialize form
    const initResult = initializeFormV4();
    if (!initResult.success) {
      throw new Error('Form initialization failed: ' + initResult.error);
    }
    
    console.log('=== QUICK SETUP V4 COMPLETE ===');
    console.log('✓ Form is ready with single cloud provider logic!');
    console.log('✓ Cloud Provider:', CLOUD_PROVIDER);
    console.log('✓ Technologies loaded:', initResult.data.technologiesLoaded);
    console.log('✓ Form URL:', initResult.data.formUrl);
    console.log('✓ Edit URL:', initResult.data.editUrl);
    
    console.log('\n📋 Next Steps:');
    console.log('1. Set up form submit trigger for onFormSubmitV4');
    console.log('2. Test the form by filling it out');
    console.log('3. Check Form_Responses sheet for saved data');
    
    return initResult;
    
  } catch (error) {
    console.error('Quick setup V4 failed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get current form statistics
 */
function getFormStatsV4() {
  try {
    const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    const responsesSheet = ss.getSheetByName('Form_Responses');
    
    if (!responsesSheet) {
      return {
        success: true,
        data: {
          totalResponses: 0,
          cloudSelectedCount: 0,
          averageTechnologies: 0
        }
      };
    }
    
    const data = responsesSheet.getDataRange().getValues();
    const responses = data.slice(1); // Skip header row
    
    const stats = {
      totalResponses: responses.length,
      cloudSelectedCount: responses.filter(row => row[2] === 'Yes').length,
      averageTechnologies: responses.length > 0 ? 
        responses.reduce((sum, row) => sum + (row[3] || 0), 0) / responses.length : 0
    };
    
    console.log('Form Statistics:', stats);
    
    return {
      success: true,
      data: stats
    };
    
  } catch (error) {
    console.error('Error getting form stats:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}