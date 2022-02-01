class Dialog {
  constructor(props) {
    Object.assign(this, props);
  }
}

const DialogManager = {
  dialogs: [],
  addDialog(dialog) {
    this.dialogs.push(dialog);
  },
  findDialog(id) {
    return this.dialogs.find((dialog) => id === dialog.id);
  }
}

// Run on initial load to reset status of dialog if user refreshed while dialog was open.
setDialogClose();

// Renders lower content of dialog (this usually contains some sort of action)
function renderDialogActions(id) {
  const dialogActions = $("<div/>").addClass('dialogActionsContainer');
  // Clear Save Dialog
  if (id === 'clear_save') {
    const clearSaveActions = $("<div/>").addClass('clearSaveActions').appendTo(dialogActions);
      $("<button/>").attr({id: "deleteSaveButton", tabindex: 2}).addClass('deleteSaveButton actionButton').html('Delete Game Data').appendTo(clearSaveActions);
      $("<button/>").attr({id: "declineSaveButton", tabindex: 3}).addClass('declineSaveButton actionButton').html('Keep Game Data').appendTo(clearSaveActions);
    return dialogActions;
  }
  // Export Save Dialog
  if (id === 'export_save') {
    $("<input/>").attr({id: "exportSaveText", type: "text", tabindex: 2}).addClass('exportSaveText').appendTo(dialogActions);
    const exportSaveActions = $("<div/>").addClass('exportSaveActions').appendTo(dialogActions);
      $("<button/>").attr({id: "exportSaveLocal", tabindex: 3}).addClass('exportSaveLocal actionButton').html('Download as File').appendTo(exportSaveActions);
      $("<button/>").attr({id: "exportSaveCopy", tabindex: 4}).addClass('exportSaveCopy actionButton').html('Copy to Clipboard').appendTo(exportSaveActions);
      $("<div/>").attr({id: "exportStatus"}).addClass("exportStatus").appendTo(exportSaveActions);
    return dialogActions;
  }
  // Import Save Dialog
  if (id === 'import_save') {
    $("<input/>").attr({id: "importSaveText", tabindex: 2, type: "text", placeholder: "Enter an export string..."}).addClass('importSaveText').appendTo(dialogActions);
    const importSaveActions = $("<div/>").addClass('importSaveActions').appendTo(dialogActions);
      $("<button/>").attr({id: "importSaveButton", tabindex: 3}).addClass('importSaveButton actionButton').html('Import Save').appendTo(importSaveActions);
    return dialogActions;
  }
  // Cloud Save (Playfab) Dialog
  if (id === 'playfab') {
    const accountContainer = $("<div/>").attr({id: "cloudSaveDialog"}).addClass('cloudSaveDialog').appendTo(dialogActions);
      $("<div/>").addClass("cloudSaveLogo").prependTo(dialogActions);
    // Login or Registration Form
    const accountForm = $("<form/>").attr({id: "pfLoginRegister", autocomplete: "on"}).addClass('pfAccountForm').appendTo(accountContainer);
    const accountEmail = $("<div/>").attr({id: "pfEmail"}).addClass('pfEmailContainer').appendTo(accountForm);
      $("<div/>").addClass('pfHeader').html('Email Address').appendTo(accountEmail);
      $("<input/>").attr({id: "email", tabindex: 2, type: "email", name: "email", autocomplete: "email", placeholder: "Enter your email address..."}).addClass('pfText').appendTo(accountEmail);
    const accountPassword = $("<div/>").attr({id: "pfPassword"}).addClass('pfPasswordContainer').appendTo(accountForm);
      $("<div/>").addClass('pfHeader').html('Password').appendTo(accountPassword);
      $("<input/>").attr({id: "password", tabindex: 3, type: "password", name: "password", autocomplete: "current-password", placeholder: "Enter your password..."}).addClass('pfText').appendTo(accountPassword);
    const accountActions = $("<div/>").attr({id: "pfButtons"}).addClass('pfButtonsContainer').appendTo(accountForm);
      $("<input/>").attr({id: "login", tabindex: 4, type: "submit", name: "login", value: "Log into Account"}).addClass("actionButton").appendTo(accountActions);
      $("<input/>").attr({id: "register", tabindex: 5, type: "button", name: "register", value: "Register an Account"}).addClass("actionButton").appendTo(accountActions);
      $("<input/>").attr({id: "reset", tabindex: 6, type: "button", name: "reset", value: "Reset Password"}).addClass("actionButton").appendTo(accountActions);
    const statusMessage = $("<div/>").attr({id: "pfStatusSection"}).addClass('pfStatusContainer').appendTo(accountForm);
      $("<div/>").attr({id: "pfStatus"}).addClass("pfStatus").appendTo(statusMessage);
    // Importing or exporting from Cloud
    const accountImportExport = $("<div/>").attr({id: "pfImportExport"}).addClass('pfImportExportContainer').appendTo(accountContainer).hide();
      $("<input/>").attr({id: "pfSave", tabindex: 2, type: "button", name: "Save to Cloud", value: "Save to Cloud"}).addClass("actionButton").appendTo(accountImportExport);
      $("<input/>").attr({id: "pfLoad", tabindex: 3, type: "button", name: "Load from Cloud", value: "Load from Cloud"}).addClass("actionButton").appendTo(accountImportExport);
      $("<div/>").attr({id: "pfStatusSave"}).addClass("pfStatusSave").appendTo(accountImportExport);
    // Confirmation screen for loading from Cloud
    const loadFromCloud = $("<div/>").attr({id: "loadSure"}).addClass("loadSure").appendTo(accountContainer).hide();
      $("<div/>").addClass("loadSureDescription").html("Are you sure you would like to load this cloud save data? This action is irreversible!").appendTo(loadFromCloud);
      const loadFromCloudActions = $("<div/>").attr({id: "pfLoadButtons"}).addClass("pfLoadButtons").appendTo(loadFromCloud);
        $("<input/>").attr({id: "pfloadYes", tabindex: 2, type: "button", name: "loadYes", value: "Yes"}).addClass("actionButton").appendTo(loadFromCloudActions);
        $("<input/>").attr({id: "pfloadNo", tabindex: 3, type: "button", name: "loadNo", value: "No"}).addClass("actionButton").appendTo(loadFromCloudActions);
    return dialogActions;
  }
  // Commendation Dialog
  if (id === 'end_commendation') {
    const actionsContainer = $("<div/>").addClass('actionsContainer').appendTo(dialogActions);
      $("<a/>").attr({
        href: "http://www.discord.gg/qGBAVNR",
        target: "_blank",
        rel: "noopener"
      }).addClass("actionButton").html("Join us on Discord").appendTo(actionsContainer);
      $("<a/>").attr({
        href: "https://www.patreon.com/forgeandfortune",
        target: "_blank",
        rel: "noopener"
      }).addClass("actionButton").html("Support us on Patreon").appendTo(actionsContainer);
    return dialogActions;
  }
  // Settings Dialog
  if (id === 'settings') {
    const settingsTabsContainer = $("<div/>").addClass("settingsTabContainer").appendTo(dialogActions);;
      $("<div/>").addClass("settingsTab selected").attr({"id":"settingTabGeneral"}).html("General").appendTo(settingsTabsContainer);
      $("<div/>").addClass("settingsTab").attr({"id":"settingTabNotifications"}).html("Notifications").appendTo(settingsTabsContainer);
      $("<div/>").addClass("settingsTab").attr({"id":"settingTabHotkeys"}).html("Hotkeys").appendTo(settingsTabsContainer);
    const tabGeneral = $("<div/>").addClass("settingTabContent selected settings-grid").attr({"id":"settingContentGeneral"}).appendTo(dialogActions);
    const tabNotifications = $("<div/>").addClass("settingTabContent settings-grid").attr({"id":"settingContentNotifcations"}).appendTo(dialogActions);
    const tabHotkeys = $("<div/>").addClass("settingTabContent settings-grid").attr({"id":"settingContentHotkeys"}).appendTo(dialogActions);

    // Settings: Hotkeys
    const hotkeyPref = $("<div/>").attr({id: "settings_hotkeyPref"}).addClass("setting-container").appendTo(tabHotkeys);
    const hotkeyPref_details = {
      title: "Hotkeys",
      description: "Choose whether hotkeys are triggered."
    }
    settingsBoilerplate(hotkeyPref_details, true).appendTo(hotkeyPref);

    const hotkeyPrefGrid = $("<div/>").addClass("selections-grid").appendTo(hotkeyPref);
    const hotkeyPrefOptions = [0, 1];
    hotkeyPrefOptions.forEach((option, i) => {
      const label = $("<label/>").addClass("selection-container hotkeyPrefSelection").html(option === 1 ? "Enabled" : "Disabled");
        $("<input/>").attr({type: "radio", name: "hotkeyPref", value: option, checked: HotKeys.enabled === option ? "checked" : null}).appendTo(label);
        $("<span/>").addClass("selection").appendTo(label);
      label.appendTo(hotkeyPrefGrid);
    });

    $("<div/>").addClass("hotkeyAllDefault actionButton").attr({"id":"hotkeyAllDefault"}).appendTo(tabHotkeys);
    $("<div/>").addClass("hotkeyList").attr({"id":"hotkeyList"}).appendTo(tabHotkeys);

    // Settings: Notifications
    const notificationPref = $("<div/>").attr({id: "settings_notificationPref"}).addClass("setting-container").appendTo(tabNotifications);
    const notificationPref_details = {
      title: "Notifications",
      description: "Choose whether notifications are rendered."
    }
    settingsBoilerplate(notificationPref_details).appendTo(notificationPref);

    const notificationPrefGrid = $("<div/>").addClass("selections-grid").appendTo(notificationPref);
    const notificationPrefOptions = [0, 1];
    notificationPrefOptions.forEach((option, i) => {
      const label = $("<label/>").addClass("selection-container toastPrefSelection").html(option === 1 ? "Enabled" : "Disabled");
        $("<input/>").attr({type: "radio", name: "notificationPref", value: option, checked: settings.toasts === option ? "checked" : null}).appendTo(label);
        $("<span/>").addClass("selection").appendTo(label);
      label.appendTo(notificationPrefGrid);
    });

     // Setting: Notification Size
     const notificationSize = $("<div/>").attr({id: "settings_notificationSize"}).addClass("setting-container").appendTo(tabNotifications);
     const notificationSize_details = {
       title: "Notification Size",
       description: "Choose between a spacious sizing for notifications or a more compact sizing."
     }
     settingsBoilerplate(notificationSize_details).appendTo(notificationSize);
 
     const notificationSizeGrid = $("<div/>").addClass("selections-grid").appendTo(notificationSize);
     const sizes = [0, 1];
     sizes.forEach((size, i) => {
       const label = $("<label/>").addClass("selection-container toastSizeSelection").html(size === 1 ? "Comfortable" : "Compact");
         $("<input/>").attr({type: "radio", name: "toastSize", value: size, checked: size === settings.toastSize ? "checked" : null}).appendTo(label);
         $("<span/>").addClass("selection").appendTo(label);
       label.appendTo(notificationSizeGrid);
     });

    // Setting: Notification Duration
    const notificationDuration = $("<div/>").attr({id: "settings_notificationDuration"}).addClass("setting-container").appendTo(tabNotifications);
    const notificationDuration_details = {
      title: "Notification Duration",
      description: "Designates the duration a notification will remain present on the screen."
    }
    settingsBoilerplate(notificationDuration_details).appendTo(notificationDuration);

    const notificationDurationGrid = $("<div/>").addClass("selections-grid").appendTo(notificationDuration);
    const durations = [5000, 10000, 15000];
    durations.forEach((duration, i) => {
      const label = $("<label/>").addClass("selection-container toastDurationSelection").html(`${duration / 1000} seconds`);
        $("<input/>").attr({type: "radio", name: "toastDuration", value: duration, checked: duration === settings.toastDuration ? "checked" : null}).appendTo(label);
        $("<span/>").addClass("selection").appendTo(label);
      label.appendTo(notificationDurationGrid);
    });

    // Setting: Notification Location
    const notificationLocation = $("<div/>").attr({id: "settings_notificationLocation"}).addClass("setting-container").appendTo(tabNotifications);
    const notificationLocation_details = {
      title: "Notification Location",
      description: "Designates where the notifications for various events (such as exceptional crafts) will appear."
    }
    settingsBoilerplate(notificationLocation_details).appendTo(notificationLocation);

    const selectionsGrid = $("<div/>").addClass("selections-grid").appendTo(notificationLocation);
    const locations = ["Top-Left", "Top-Center", "Top-Right", "Bottom-Left", "Bottom-Center", "Bottom-Right"];
    locations.forEach((location, i) => {
      const label = $("<label/>").addClass("selection-container toastPositionSelection").html(location);
        $("<input/>").attr({type: "radio", name: "toast", value: location.toLowerCase(), checked: location.toLowerCase() === settings.toastPosition ? "checked" : null}).appendTo(label);
        $("<span/>").addClass("selection").appendTo(label);
      label.appendTo(selectionsGrid);
    });

    // Settings: Tooltips
    const tooltipPref = $("<div/>").attr({id: "settings_tooltipPref"}).addClass("setting-container").appendTo(tabGeneral);
    const tooltipPref_details = {
      title: "Tooltips",
      description: "Choose whether tooltips are rendered when hovering over tooltip-enabled content."
    }
    settingsBoilerplate(tooltipPref_details).appendTo(tooltipPref);

    const tooltipPrefGrid = $("<div/>").addClass("selections-grid").appendTo(tooltipPref);
    const options = [0, 1];
    options.forEach((option, i) => {
      const label = $("<label/>").addClass("selection-container tooltipPrefSelection").html(option === 1 ? "Enabled" : "Disabled");
        $("<input/>").attr({type: "radio", name: "tooltipPref", value: option, checked: settings.tpref === option ? "checked" : null}).appendTo(label);
        $("<span/>").addClass("selection").appendTo(label);
      label.appendTo(tooltipPrefGrid);
    });

    // Settings: Leave Site
    const leaveSite = $("<div/>").attr({id: "settings_leaveSite"}).addClass("setting-container").appendTo(tabGeneral);
    const leaveSite_details = {
      title: "End Session Confirmation",
      description: "Will prompt you with a confirmation before closing the window or tab. Changes will take affect on next session."
    }
    settingsBoilerplate(leaveSite_details).appendTo(leaveSite);

    const leaveSiteGrid = $("<div/>").addClass("selections-grid").appendTo(leaveSite);
    const leaveSiteOptions = [0, 1];
    leaveSiteOptions.forEach((option, i) => {
      const label = $("<label/>").addClass("selection-container leaveSiteSelection").html(option === 1 ? "Enabled" : "Disabled");
        $("<input/>").attr({type: "radio", name: "leaveSite", value: option, checked: settings.leavesite === option ? "checked" : null}).appendTo(label);
        $("<span/>").addClass("selection").appendTo(label);
      label.appendTo(leaveSiteGrid);
    });

    // Settings: Animations
    const animPref = $("<div/>").attr({id: "settings_animPref"}).addClass("setting-container").appendTo(tabGeneral);
    const animPref_details = {
      title: "Animations",
      description: "Choose whether animations are played when navigating through content."
    }
    settingsBoilerplate(animPref_details).appendTo(animPref);

    const animPrefGrid = $("<div/>").addClass("selections-grid").appendTo(animPref);
    const anims = [0, 1];
    anims.forEach((anim, i) => {
      const label = $("<label/>").addClass("selection-container animPrefSelection").html(anim === 1 ? "Enabled" : "Disabled");
        $("<input/>").attr({type: "radio", name: "animPref", value: anim, checked: settings.animations === anim ? "checked" : null}).appendTo(label);
        $("<span/>").addClass("selection").appendTo(label);
      label.appendTo(animPrefGrid);
    });

    // Settings: GPU Effects
    const gpuEffectsPref = $("<div/>").attr({id: "settings_gpuEffectsPref"}).addClass("setting-container").appendTo(tabGeneral);
    const gpuEffectsPref_details = {
      title: "GPU Effects",
      description: "Choose whether some GPU-intensive effects like background blurs are utilized."
    }
    settingsBoilerplate(gpuEffectsPref_details).appendTo(gpuEffectsPref);

    const gpuEffectsPrefGrid = $("<div/>").addClass("selections-grid").appendTo(gpuEffectsPref);
    const gpuEffects = [0, 1];
    gpuEffects.forEach((effect, i) => {
      const label = $("<label/>").addClass("selection-container gpuEffectsPrefSelection").html(effect === 1 ? "Enabled" : "Disabled");
        $("<input/>").attr({type: "radio", name: "gpuEffectsPref", value: effect, checked: settings.gpuEffects === effect ? "checked" : null}).appendTo(label);
        $("<span/>").addClass("selection").appendTo(label);
      label.appendTo(gpuEffectsPrefGrid);
    });

    // Setting: Reset Settings
    const clearSettings = $("<div/>").attr({id: "settings_clearSettings"}).addClass("setting-container").appendTo(tabGeneral);
    const clearSettings_details = {
      title: "Reset All Settings",
      description: "Reset your settings to default values for this browser only. This will reload the game but your progress will not be reset."
    }
    settingsBoilerplate(clearSettings_details).appendTo(clearSettings);

    $("<button/>").attr({id: "clearSettings"}).addClass("actionButton").html("Reset All Settings").appendTo(clearSettings);
    // Return Value
    return dialogActions;
  }
  // Patch Notes Dialog
  if (id === 'patch_notes') {
    const patchListContainer = $("<div/>").attr({id: "patchList"}).addClass('patchListContainer').appendTo(dialogActions);
      $("<div/>").attr({id: "descPatch", tabindex: 1}).addClass('descPatch').html("You are running the latest version of Forge & Fortune.").appendTo(patchListContainer)
    const patchListFooter = $("<div/>").attr({id: "patchListFooter"}).addClass('patchListFooter').appendTo(dialogActions);
      const updateTrigger = $("<div/>").attr({id: "updateTrigger"}).addClass('updateTriggerContainer').appendTo(patchListFooter);
        $("<div/>").addClass('updateNotice').html(displayText("update_notice_desc")).appendTo(updateTrigger);
        const updateActions = $("<div/>").addClass('updateActions').appendTo(updateTrigger);
          $("<div/>").attr({id: "updateDownloadSave"}).addClass('actionButton').html(displayText("update_notice_download")).appendTo(updateActions);
          $("<div/>").attr({id: "updateRefresh"}).addClass('actionButton').html(displayText("update_notice_update")).appendTo(updateActions);
    return dialogActions;
  }
  // Offline Stats Dialog
  if (id === 'offline_stats') {
    const timeSince = $("<div/>").addClass('offlineStatContainer').appendTo(dialogActions);
      $("<div/>").html(displayText('offline_dialog_time_since_header')).addClass('offlineStatHeader').appendTo(timeSince);
      const timeDiv = $("<div/>").html(offlineStat.time).addClass('offlineStatBox').appendTo(timeSince);
      if (offlineStat.time === "3 days, 0 hours, 0 minutes, 0 seconds") timeDiv.html(offlineStat.time + " (max)");
    const goldEarned = $("<div/>").addClass('offlineStatContainer').appendTo(dialogActions);
      $("<div/>").html(displayText('offline_dialog_gold_earned_header')).addClass('offlineStatHeader').appendTo(goldEarned);
      $("<div/>").html(formatToUnits(offlineStat.gold,2)).addClass('offlineStatBox').appendTo(goldEarned);
    return dialogActions;
  }
}

function settingsBoilerplate(settingDetails, isBeta) {
  const detailsContainer = $("<div/>").addClass("settings-details");
    const title = $("<div/>").addClass("settings-title").html(settingDetails.title).appendTo(detailsContainer);
    if (isBeta) $("<span/>").addClass("beta-tag tooltip").attr({"data-tooltip":"beta_feature"}).html("Beta").appendTo(title);
    $("<div/>").addClass("settings-description").html(settingDetails.description).appendTo(detailsContainer);
  return detailsContainer;
}

// Sets the dialog status to open and renders the dialog
function setDialogOpen(props) {
  // Dialog Parent Containers
  const dialogContainer = $("<div/>").attr({id: 'dialogContainer'}).addClass('dialogContainer').appendTo(document.body);
  const dialogBoxContainer = $("<div/>").addClass('dialogContent dialogOpening').appendTo(dialogContainer);
  if (props.id === 'settings') $(dialogBoxContainer).addClass('isSettingsDialog');
  if (props.id === 'patch_notes') $(dialogBoxContainer).addClass('isPatchDialog');
  // Dialog Upper Content
  const dialogClose = $("<div/>").attr({role: "button", tabindex: 1, 'aria-label': "Close Dialog"}).addClass('dialogClose').html('<i class="fas fa-times"></i>').appendTo(dialogBoxContainer);
  const dialogTitle = $("<div/>").addClass('dialogTitle').appendTo(dialogBoxContainer);
    $("<div/>").addClass('dialogTitleIcon').html(props.icon).appendTo(dialogTitle);
    $("<div/>").addClass('dialogTitleText').html(props.title).appendTo(dialogTitle);
  const dialogContentContainer = $("<div/>").addClass('dialogContentContainer').appendTo(dialogBoxContainer);
  if (props.description) $("<div/>").addClass('dialogDescription').html(props.description).appendTo(dialogContentContainer);
  const dialogActions = renderDialogActions(props.id);
  dialogActions.appendTo(dialogContentContainer);
  if (props.id === 'patch_notes') showPatchNotes();
  // Settings update
  settings.dialogStatus = 1;
  saveSettings();
}

// Sets the dialog to closed and removes dialog from DOM
function setDialogClose() {
  settings.dialogStatus = 0;
  saveSettings();
  $('#dialogContainer').addClass('dialogInactive');
  $('.dialogContent').removeClass('dialogOpening').addClass('dialogClosing');
}

$(document).on('transitionend', '.dialogContent', (e) => {
  if (e.target === e.currentTarget) $('#dialogContainer').remove();
});

// Event Listeners / Triggers
$(document).on('click', '.isDialog', (e) => {
  const id = $(e.currentTarget).attr("data-dialog-id");
  if (settings.dialogStatus === 0 && id) setDialogOpen(DialogManager.findDialog(id));
});

$(document).on('click ', '.dialogClose', (e) => {
  setDialogClose();
  HotKeys.assigning = null;
});

$(document).on('keyup', (e) => {
  if (e.keyCode === 27) {
    setDialogClose();
    HotKeys.assigning = null;
  }
});

$(document).on('click', '.dialogContainer', (e) => {
  if (e.target === e.currentTarget) {
    setDialogClose();
    HotKeys.assigning = null;
  }
});

$(document).on('click', '#settingTabNotifications', (e) => {
  $(".settingsTab").removeClass("selected");
  $(e.currentTarget).addClass("selected");
  $("#settingContentGeneral").removeClass("selected");
  $("#settingContentHotkeys").removeClass("selected");
  $("#settingContentNotifcations").addClass("selected");
});


$(document).on('click', '#settingTabHotkeys', (e) => {
  $(".settingsTab").removeClass("selected");
  $(e.currentTarget).addClass("selected");
  $("#settingContentGeneral").removeClass("selected");
  $("#settingContentNotifcations").removeClass("selected");
  $("#settingContentHotkeys").addClass("selected");
  showHotkey();
});

$(document).on('click', '#settingTabGeneral', (e) => {
  $(".settingsTab").removeClass("selected");
  $(e.currentTarget).addClass("selected");
  $("#settingContentNotifcations").removeClass("selected");
  $("#settingContentHotkeys").removeClass("selected");
  $("#settingContentGeneral").addClass("selected");
});