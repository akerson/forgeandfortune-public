// Settings Management
// Initial settings code for loading and saving is placed here, 
// place all individual settings code and management in the style.js file

const settings = {
    lang: 'en',
    toasts: 1,
    toastPosition: "top-right",
    toastDuration: 5000,
    toastSize: 1,
    dialogStatus: 0,
    db: 0,
    tpref: 1,
    opnotif: 0,
    leavesite: 0,
    animations: 1,
    gpuEffects: 1
}

function saveSettings() {
    localStorage.setItem("settings", JSON.stringify(settings));
}

function loadSettings() {
    const obj = JSON.parse(localStorage.getItem("settings"));
    for (let setting in obj) {
        settings[setting] = obj[setting];
    }
    portSettings();
    localStorage.setItem("settings", JSON.stringify(settings));
    if (settings.leavesite) {
        $(window).bind('beforeunload', function() {
            return 'Are you sure you want to leave?';
        });
    }
}

function clearSettings() {
    localStorage.removeItem("settings");
    location.reload();
}

loadSettings();

// Port Settings - Remove old settings, update to new setting values, etc.
function portSettings() {
    delete settings.expandedLogistics;
    delete settings.toggleTurnOrderBars;
    delete settings.battleLogLength;
    delete settings.expandedMaterials;
}

