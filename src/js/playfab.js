PlayFab.settings.titleId = "D765";

let sessionID = null;
let saveFile = 0;

$(document).on("click", "#cloudSave", (e) => {
    //clicked on the "Cloud Save" button
    if (!sessionID) {
        $("#pfLoginRegister").show();
        $("#pfImportExport").hide();
        $("#loadSure").hide();
    } else {
        $("#pfLoginRegister").hide();
        $("#pfImportExport").show();
        $("#loadSure").hide();
        getSaveFromCloud();
    }
})

$(document).on("click", "#register", (e) => {
    e.preventDefault();
    registerAcct();
})

$(document).on("click", "#login", (e) => {
    e.preventDefault();
    loginAcct();
})

$(document).on("click", "#reset", (e) => {
    resetPassword();
})


$(document).on("click", "#pfSave", (e) => {
    e.preventDefault();
    saveToCloud();
})

$(document).on("click", "#pfLoad", (e) => {
    e.preventDefault();
    $("#loadSure").show();
    $("#pfImportExport").hide();
})

$(document).on("click", "#pfloadYes", (e) => {
    loadFromCloud();
})

$(document).on("click", "#pfloadNo", (e) => {
    $("#pfLoginRegister").hide();
    $("#pfImportExport").show();
    $("#loadSure").hide();
})

const validateCallback = function (result, error) {
    if (error !== null) {
        $("#pfLoginRegister").show();
        $("#pfImportExport").hide();
    }
    else {
        $("#pfLoginRegister").hide();
        $("#pfImportExport").show();
    }
}

function resetPassword() {
    const resetRequest = {
        TitleId: PlayFab.settings.titleId,
        Email : $("#email").val()
    };
    PlayFabClientSDK.SendAccountRecoveryEmail(resetRequest, resetCallback);
}

const resetCallback = (result, error) => {
    if (result !== null) {
        $("#pfStatus").html("Password reset email sent to your email address.");
        setTimeout(() => {setDialogClose()}, 1500)
    } else if (error !== null) {
        $("#pfStatus").html(PlayFab.GenerateErrorReport(error));
        setTimeout(() => {$("#pfStatus").empty()}, 3500);
    }
}

function registerAcct(){
    const registerRequest = {
        TitleId: PlayFab.settings.titleId,
        Email : $("#email").val(),
        Password : $("#password").val(),
        RequireBothUsernameAndEmail : false,
    };
    PlayFabClientSDK.RegisterPlayFabUser(registerRequest, registerCallback);
}

const registerCallback = function (result, error) {
    if (result !== null) {
        loginAcct();
    } else if (error !== null) {
        $("#pfStatus").html(PlayFab.GenerateErrorReport(error));
        setTimeout(() => {$("#pfStatus").empty()}, 3500);
    }
}

function loginAcct(){
    const loginRequest = {
        TitleId: PlayFab.settings.titleId,
        Email : $("#email").val(),
        Password : $("#password").val(),
    };
    PlayFabClientSDK.LoginWithEmailAddress(loginRequest, LoginCallback);
}

const LoginCallback = function (result, error) {
    if (result !== null) {
        sessionID = result.data.SessionTicket;
        $("#pfLoginRegister").hide();
        $("#pfImportExport").show();
        getSaveFromCloud();
    } else if (error !== null) {
        $("#pfLoginRegister").show();
        $("#pfImportExport").hide();
        $("#pfStatus").html(PlayFab.GenerateErrorReport(error));
        setTimeout(() => {$("#pfStatus").empty()}, 3500);
    }
}

function saveToCloud() {
    $("#pfStatusSave").html("Saving...");
    forceSave();
    const requestData = {
        TitleId : PlayFab.settings.titleId,
        Data : {
            "savestring" : createSaveExport(),
        }
    }
    PlayFab.ClientApi.UpdateUserData(requestData,saveCallback);
};

function saveCallback(result,error) {
    if (result !== null) {
        getSaveFromCloud();
    }
    if (error !== null) {
        $("#pfStatusSave").html(PlayFab.GenerateErrorReport(error));
    }
}

function loadFromCloud() {
    getSaveFromCloud();
    if (saveFile) {
        localStorage.setItem('ffgs1', JSON.stringify(saveFile));
        location.reload();
    }
}

function getSaveFromCloud() {
    const requestData = {
        Keys : ["savestring"],
    }
    PlayFab.ClientApi.GetUserData(requestData,loadCallback);
};

function loadCallback(result,error) {
    if (error !== null) {
        $("#pfStatusSave").html(PlayFab.GenerateErrorReport(error));        
    }
    if (result) {
        if (result.data.Data !== null) {
            saveFile = JSON.parse(JSON.parse(pako.ungzip(atob(result.data.Data.savestring.Value),{ to: 'string' })));
            const date = saveFile["saveTime"];
            const dateString = new Date(date).toString();
            $("#pfStatusSave").html("Last save:</br>"+dateString);
        }
        else {
            saveFile = null;
            $("#pfStatusSave").text("No save uploaded.");
        }
    }
}