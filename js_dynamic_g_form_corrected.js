/**
 * Dynamic Google Form Script
 * Creates dynamic sections based on cloud provider selections (AWS, Azure, GCP)
 * Fills sections with technologies from corresponding Google Sheets tabs
 */

// Configuration - Replace with your actual IDs
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit?usp=sharing';
const FORM_ID = '<FORM_ID>';
const CLOUD_QUESTION_TITLE = 'Cloud Providers'; // The multiple checkbox question for cloud selection

/**
 * Main function to sync form with sheet data
 * Call this function to update the form structure
 */
function syncFormFromSheets() {
  try {
    const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    const form = FormApp.openById(FORM_ID);
    
    // Define cloud providers and their corresponding sheet tabs
    const providers = [
      { key: 'AWS', sheet: 'AWS', sectionTitle: 'skillset_AWS' },
      { key: 'Azure', sheet: 'Azure', sectionTitle: 'skillset_Azure' },
      { key: 'GCP', sheet: 'GCP', sectionTitle: 'skillset_GCP' }
    ];

    // Filter providers that have corresponding sheets
    const activeProviders = providers.filter(provider => {
      const sheet = ss.getSheetByName(provider.sheet);
      return sheet !== null;
    });

    console.log(`Found ${activeProviders.length} active providers with sheets`);

    // Setup the main cloud selection question
    setupCloudSelectionQuestion(form, activeProviders);

    // Create or update skillset sections for each provider
    activeProviders.forEach(provider => {
      const technologies = readTechnologiesFromSheet(ss, provider.sheet);
      createOrUpdateSkillsetSection(form, provider, technologies);
    });

    console.log('Form sync completed successfully');
    
  } catch (error) {
    console.error('Error syncing form:', error);
    throw error;
  }
}

/**
 * Setup the main cloud providers selection question
 */
function setupCloudSelectionQuestion(form, providers) {
  try {
    // Find existing cloud selection question or create it
    let cloudItem = form.getItems(FormApp.ItemType.CHECKBOX)
      .find(item => item.getTitle() === CLOUD_QUESTION_TITLE);

    if (!cloudItem) {
      cloudItem = form.addCheckboxItem();
      cloudItem.setTitle(CLOUD_QUESTION_TITLE);
      cloudItem.setHelpText('Select the cloud providers you have experience with');
    }

    const cloudQuestion = cloudItem.asCheckboxItem();
    
    // Set choices for available providers
    const choices = providers.map(provider => provider.key);
    cloudQuestion.setChoiceValues(choices);
    cloudQuestion.setRequired(false);

    console.log(`Cloud selection question updated with choices: ${choices.join(', ')}`);
    
  } catch (error) {
    console.error('Error setting up cloud selection question:', error);
    throw error;
  }
}

/**
 * Create or update a skillset section for a specific cloud provider
 */
function createOrUpdateSkillsetSection(form, provider, technologies) {
  try {
    if (!technologies || technologies.length === 0) {
      console.log(`No technologies found for ${provider.key}, skipping section creation`);
      return;
    }

    // Remove existing section if it exists
    removeExistingSection(form, provider.sectionTitle);

    // Create new section (page break)
    const section = form.addPageBreakItem();
    section.setTitle(provider.sectionTitle);
    section.setHelpText(`Select the ${provider.key} technologies you have experience with`);

    // Add checkbox question for technologies
    const techQuestion = form.addCheckboxItem();
    techQuestion.setTitle(`${provider.key} Technologies`);
    techQuestion.setHelpText(`Choose all ${provider.key} services/technologies you have used`);
    techQuestion.setChoiceValues(technologies);
    techQuestion.setRequired(false);

    console.log(`Created section ${provider.sectionTitle} with ${technologies.length} technologies`);
    
  } catch (error) {
    console.error(`Error creating section for ${provider.key}:`, error);
    throw error;
  }
}

/**
 * Remove existing section and its questions
 */
function removeExistingSection(form, sectionTitle) {
  try {
    const items = form.getItems();
    const itemsToRemove = [];
    let inTargetSection = false;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.getType() === FormApp.ItemType.PAGE_BREAK) {
        if (item.getTitle() === sectionTitle) {
          inTargetSection = true;
          itemsToRemove.push(item);
        } else if (inTargetSection) {
          // We've reached the next section, stop collecting items
          break;
        }
      } else if (inTargetSection) {
        // This item belongs to our target section
        itemsToRemove.push(item);
      }
    }

    // Remove items in reverse order to maintain indices
    itemsToRemove.reverse().forEach(item => {
      form.deleteItem(item);
    });

    if (itemsToRemove.length > 0) {
      console.log(`Removed existing section: ${sectionTitle} (${itemsToRemove.length} items)`);
    }
    
  } catch (error) {
    console.error(`Error removing section ${sectionTitle}:`, error);
    // Don't throw here, as this is cleanup - continue with creation
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

    console.log(`Read ${technologies.length} technologies from ${sheetName}: ${technologies.slice(0, 3).join(', ')}${technologies.length > 3 ? '...' : ''}`);
    return technologies;
    
  } catch (error) {
    console.error(`Error reading from sheet ${sheetName}:`, error);
    return [];
  }
}

/**
 * IMPORTANT: Google Forms limitation - dynamic sections don't work in real-time
 * This approach creates ALL possible sections upfront with conditional logic
 */

/**
 * Create form with ALL cloud sections visible upfront
 * Users will see all sections but with clear instructions
 */
function createStaticFormWithAllSections() {
  try {
    const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    const form = FormApp.openById(FORM_ID);
    
    console.log('Creating static form with all cloud sections...');
    
    // Define all providers
    const providers = [
      { key: 'AWS', sheet: 'AWS', sectionTitle: 'AWS Technologies' },
      { key: 'Azure', sheet: 'Azure', sectionTitle: 'Azure Technologies' },
      { key: 'GCP', sheet: 'GCP', sectionTitle: 'GCP Technologies' }
    ];

    // Setup main cloud selection question
    setupCloudSelectionQuestion(form, providers);
    
    // Add instruction text
    const instruction = form.addSectionHeaderItem();
    instruction.setTitle('Technology Sections');
    instruction.setHelpText('⚠️ IMPORTANT: Only fill out the technology sections for the cloud providers you selected above. Leave other sections blank.');

    // Create ALL sections upfront (they'll always be visible)
    providers.forEach(provider => {
      const technologies = readTechnologiesFromSheet(ss, provider.sheet);
      if (technologies.length > 0) {
        createStaticSkillsetSection(form, provider, technologies);
      }
    });

    console.log('Static form creation completed');
    
  } catch (error) {
    console.error('Error creating static form:', error);
    throw error;
  }
}

/**
 * Create a static skillset section (always visible)
 */
function createStaticSkillsetSection(form, provider, technologies) {
  try {
    // Add section header
    const sectionHeader = form.addSectionHeaderItem();
    sectionHeader.setTitle(`${provider.key} Technologies`);
    sectionHeader.setHelpText(`Select ${provider.key} technologies you have experience with. ⚠️ Only fill this if you selected ${provider.key} above.`);

    // Add checkbox question for technologies
    const techQuestion = form.addCheckboxItem();
    techQuestion.setTitle(`${provider.key} Skills`);
    techQuestion.setHelpText(`Choose all ${provider.key} services/technologies you have used`);
    techQuestion.setChoiceValues(technologies);
    techQuestion.setRequired(false);

    console.log(`Created static section for ${provider.key} with ${technologies.length} technologies`);
    
  } catch (error) {
    console.error(`Error creating static section for ${provider.key}:`, error);
    throw error;
  }
}

/**
 * Handle form responses - validate that users only filled relevant sections
 */
function onFormSubmit(e) {
  try {
    const response = e.response;
    const itemResponses = response.getItemResponses();
    
    // Get selected clouds
    let selectedClouds = [];
    const cloudTechResponses = {};
    
    for (const itemResponse of itemResponses) {
      const title = itemResponse.getItem().getTitle();
      
      if (title === CLOUD_QUESTION_TITLE) {
        selectedClouds = itemResponse.getResponse() || [];
      } else if (title.includes('Skills')) {
        // Extract cloud provider from question title
        const cloudProvider = title.split(' ')[0]; // "AWS Skills" -> "AWS"
        cloudTechResponses[cloudProvider] = itemResponse.getResponse() || [];
      }
    }

    console.log(`Form submitted - Selected clouds: ${selectedClouds.join(', ')}`);
    
    // Validate responses (optional - log warnings for inconsistencies)
    validateFormResponse(selectedClouds, cloudTechResponses);
    
  } catch (error) {
    console.error('Error handling form submit:', error);
  }
}

/**
 * Validate that user responses are consistent
 */
function validateFormResponse(selectedClouds, cloudTechResponses) {
  try {
    const warnings = [];
    
    // Check if user filled sections for clouds they didn't select
    Object.keys(cloudTechResponses).forEach(cloud => {
      const hasResponses = cloudTechResponses[cloud].length > 0;
      const selectedCloud = selectedClouds.includes(cloud);
      
      if (hasResponses && !selectedCloud) {
        warnings.push(`User filled ${cloud} technologies but didn't select ${cloud} as a cloud provider`);
      }
      
      if (!hasResponses && selectedCloud) {
        warnings.push(`User selected ${cloud} but didn't fill any ${cloud} technologies`);
      }
    });
    
    if (warnings.length > 0) {
      console.log('Response validation warnings:', warnings);
      // You could send an email or log to a sheet here
    } else {
      console.log('Response validation passed');
    }
    
  } catch (error) {
    console.error('Error validating response:', error);
  }
}

/**
 * Update form sections based on selected cloud providers
 */
function updateFormSections(form, selectedClouds) {
  try {
    const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    const allProviders = ['AWS', 'Azure', 'GCP'];
    
    allProviders.forEach(provider => {
      const sectionTitle = `skillset_${provider}`;
      
      if (selectedClouds.includes(provider)) {
        // Create/update section for selected provider
        const technologies = readTechnologiesFromSheet(ss, provider);
        if (technologies.length > 0) {
          const providerConfig = { key: provider, sheet: provider, sectionTitle: sectionTitle };
          createOrUpdateSkillsetSection(form, providerConfig, technologies);
        }
      } else {
        // Remove section for unselected provider
        removeExistingSection(form, sectionTitle);
      }
    });
    
  } catch (error) {
    console.error('Error updating form sections:', error);
  }
}

/**
 * Alternative approach: Create separate forms for each cloud combination
 * This creates multiple forms and redirects users based on their selection
 */
function createMultipleFormsApproach() {
  try {
    const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    
    // Create main selection form
    const mainForm = FormApp.create('Cloud Provider Selection');
    setupCloudSelectionQuestion(mainForm, [
      { key: 'AWS', sheet: 'AWS' },
      { key: 'Azure', sheet: 'Azure' },
      { key: 'GCP', sheet: 'GCP' }
    ]);
    
    // Add instruction
    const instruction = mainForm.addParagraphTextItem();
    instruction.setTitle('Next Steps');
    instruction.setHelpText('After submitting this form, you will receive a link to the appropriate technology assessment form based on your selections.');
    
    console.log(`Main form created: ${mainForm.getEditUrl()}`);
    
    // Create individual forms for each cloud provider
    const providers = ['AWS', 'Azure', 'GCP'];
    const formUrls = {};
    
    providers.forEach(provider => {
      const technologies = readTechnologiesFromSheet(ss, provider);
      if (technologies.length > 0) {
        const cloudForm = FormApp.create(`${provider} Technology Assessment`);
        
        // Add technology question
        const techQuestion = cloudForm.addCheckboxItem();
        techQuestion.setTitle(`${provider} Technologies`);
        techQuestion.setHelpText(`Select all ${provider} technologies you have experience with:`);
        techQuestion.setChoiceValues(technologies);
        techQuestion.setRequired(true);
        
        formUrls[provider] = cloudForm.getPublishedUrl();
        console.log(`${provider} form created: ${cloudForm.getEditUrl()}`);
      }
    });
    
    return { mainForm: mainForm.getPublishedUrl(), cloudForms: formUrls };
    
  } catch (error) {
    console.error('Error creating multiple forms:', error);
    throw error;
  }
}

/**
 * RECOMMENDED: Initialize form with all sections visible
 * This is the most practical approach for Google Forms
 */
function initializeFormRecommended() {
  try {
    console.log('Initializing form with recommended approach...');
    
    // Clear existing form content (except the first question)
    clearFormExceptFirstQuestion();
    
    // Create static form with all sections
    createStaticFormWithAllSections();
    
    console.log('Recommended form initialization completed');
    console.log('Users will see all cloud sections and should only fill relevant ones');
    
  } catch (error) {
    console.error('Error in recommended initialization:', error);
    throw error;
  }
}

/**
 * Clear form content except the first question
 */
function clearFormExceptFirstQuestion() {
  try {
    const form = FormApp.openById(FORM_ID);
    const items = form.getItems();
    
    // Keep only the first item (cloud selection question)
    for (let i = items.length - 1; i > 0; i--) {
      form.deleteItem(items[i]);
    }
    
    console.log('Form cleared except first question');
    
  } catch (error) {
    console.error('Error clearing form:', error);
  }
}

/**
 * Enhanced sync that checks for changes and updates accordingly
 */
function smartSyncFormFromSheets() {
  try {
    const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    const form = FormApp.openById(FORM_ID);
    
    console.log('Starting smart sync...');
    
    // Get current data from sheets
    const providers = [
      { key: 'AWS', sheet: 'AWS', sectionTitle: 'skillset_AWS' },
      { key: 'Azure', sheet: 'Azure', sectionTitle: 'skillset_Azure' },
      { key: 'GCP', sheet: 'GCP', sectionTitle: 'skillset_GCP' }
    ];

    let hasChanges = false;
    
    providers.forEach(provider => {
      const currentTechnologies = readTechnologiesFromSheet(ss, provider.sheet);
      const existingTechnologies = getExistingTechnologies(form, provider.sectionTitle);
      
      // Compare arrays to see if there are changes
      if (!arraysEqual(currentTechnologies, existingTechnologies)) {
        console.log(`Changes detected in ${provider.key}: ${currentTechnologies.length} vs ${existingTechnologies.length} technologies`);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      console.log('Changes detected, updating form...');
      syncFormFromSheets();
    } else {
      console.log('No changes detected, form is up to date');
    }
    
  } catch (error) {
    console.error('Error in smart sync:', error);
    // Fallback to regular sync
    syncFormFromSheets();
  }
}

/**
 * Get existing technologies from a form section
 */
function getExistingTechnologies(form, sectionTitle) {
  try {
    const items = form.getItems();
    let inTargetSection = false;
    
    for (const item of items) {
      if (item.getType() === FormApp.ItemType.PAGE_BREAK) {
        inTargetSection = (item.getTitle() === sectionTitle);
        continue;
      }
      
      if (inTargetSection && item.getType() === FormApp.ItemType.CHECKBOX) {
        const checkboxItem = item.asCheckboxItem();
        return checkboxItem.getChoices().map(choice => choice.getValue());
      }
    }
    
    return []; // Section doesn't exist or has no checkbox
  } catch (error) {
    console.error(`Error getting existing technologies for ${sectionTitle}:`, error);
    return [];
  }
}

/**
 * Compare two arrays for equality
 */
function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();
  
  return sorted1.every((val, index) => val === sorted2[index]);
}

/**
 * Auto-sync function that can be triggered periodically
 */
function autoSync() {
  try {
    console.log('Auto-sync triggered...');
    smartSyncFormFromSheets();
  } catch (error) {
    console.error('Auto-sync failed:', error);
  }
}

/**
 * Force refresh all form data from sheets (ignores change detection)
 */
function forceRefreshForm() {
  try {
    console.log('Force refreshing form from sheets...');
    syncFormFromSheets();
    console.log('Force refresh completed');
  } catch (error) {
    console.error('Force refresh failed:', error);
    throw error;
  }
}

/**
 * Utility function to test the script
 */
function testScript() {
  try {
    console.log('Testing script...');
    
    // Test spreadsheet connection
    const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    console.log(`Connected to spreadsheet: ${ss.getName()}`);
    
    // Test form connection
    const form = FormApp.openById(FORM_ID);
    console.log(`Connected to form: ${form.getTitle()}`);
    
    // Test reading from sheets
    const providers = ['AWS', 'Azure', 'GCP'];
    providers.forEach(provider => {
      const technologies = readTechnologiesFromSheet(ss, provider);
      console.log(`${provider}: ${technologies.length} technologies found`);
    });
    
    console.log('Script test completed successfully');
    
  } catch (error) {
    console.error('Script test failed:', error);
    throw error;
  }
}