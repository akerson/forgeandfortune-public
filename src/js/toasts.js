// Toasts

const $toastsWrapper = $("#toastsWrapper");

class Toast {
    constructor(props) {
        Object.assign(this, props);
    }
}

const ToastManager = {
    toasts: [],
    maxQueue: 3,
    toastLocation: settings.toastPosition,
    toastDuration: settings.toastDuration,
    addToast(toast) {
        this.toasts.push(toast);
    },
    idToToast(id) {
        return this.toasts.find(toast => toast.id === id);
    },
    toastPosition() {
        let position;
        if (this.toastLocation === 'top-left')           position = {'flex-direction': 'column-reverse', 'justify-content': 'flex-end', 'align-items': 'flex-start'};
        else if (this.toastLocation === 'top-center')    position = {'flex-direction': 'column-reverse', 'justify-content': 'flex-end', 'align-items': 'center'};
        else if (this.toastLocation === 'top-right')     position = {'flex-direction': 'column-reverse', 'justify-content': 'flex-end', 'align-items': 'flex-end'};
        else if (this.toastLocation === 'bottom-left')   position = {'flex-direction': 'column', 'justify-content': 'flex-end', 'align-items': 'flex-start'};
        else if (this.toastLocation === 'bottom-center') position = {'flex-direction': 'column', 'justify-content': 'flex-end', 'align-items': 'center'};
        else if (this.toastLocation === 'bottom-right')  position = {'flex-direction': 'column', 'justify-content': 'flex-end', 'align-items': 'flex-end'};
        $("#toastsWrapper").css(position);
    },
    renderToast(id, a, b, c) {
        // Check if toasts are enabled, if not, do not render toast
        if (!settings.toasts) return;
        // Find Toast
        const toast = this.idToToast(id);
        if (!toast) return console.error(`Could not render toast, invalid ID passed or toast does not exist. \n Toast ID passed: ${id}`);
        // Check if too many toasts are present, if so, remove toasts
        const $toastsCount = $("#toastsWrapper").children().length;
        if ($toastsCount >= this.maxQueue) {
            let element = $("#toastsWrapper").children().first();
            this.destroyToast(element, true)
        }
        // Trigger Toast Render
        this.toastPosition();
        toastTemplate(toast, a, b, c);
    },
    destroyToast(element, skipAnimation) {
        $(element).addClass('isClosing');
        skipAnimation ? element.remove() :
        setTimeout(() => { 
            $(element).removeClass('isClosing');
            element.remove();
        }, 300);
    }
}

function toastTemplate(toast, a, b, c) {
    let {type, customClass, icon, title, description, actionText} = toast;
    // Update custom properties
    title = toast.title.replace('{0}', a).replace('{1}', b).replace('{2}', c);
    description = toast.description.replace('{0}', a).replace('{1}', b).replace('{2}', c);
    // Toast Boilerplate
    const toastContainer = $("<div/>").addClass(`toastPopupContainer ${customClass}`).appendTo($toastsWrapper);
    // Toast icon if comfortable size enabled, compact class if disabled
    if (settings.toastSize) {
        const toastIcon = $("<div/>").addClass("toastPopupIcon").html(icon).appendTo(toastContainer);
        if (type === 'craft') toastIcon.addClass(customClass);
    } else toastContainer.addClass("toastCompact");
    // Toast details
    $("<div/>").addClass("toastPopupClose").html(miscIcons.cancelSlot).appendTo(toastContainer);
    const toastDetails = $("<div/>").addClass("toastDetails").appendTo(toastContainer);
        $("<div/>").addClass("toastPopupTitle").html(title).appendTo(toastDetails);
        $("<div/>").addClass("toastPopupDesc").html(description).appendTo(toastDetails);
    // Call to action on toast
    if (actionText) {
        const toastAction = $("<div/>").addClass("toastPopupAction").data('actionType', type).html('<i class="fas fa-arrow-right"></i>').appendTo(toastContainer);
        $("<div/>").addClass("toastPopupActionText").html(actionText).appendTo(toastAction);
    }
    // Remove toasts after set amount of time
    if (toastContainer) setTimeout(() => { ToastManager.destroyToast(toastContainer) }, ToastManager.toastDuration);
}

$(document).on('click', '.toastPopupAction', (e) => {
    e.preventDefault();
    const action = $(e.currentTarget).data("actionType");
    // Exceptional Craft Toast Action
    if (action === 'craft') tabClick(e, "inventoryTab");
    // Fortune Expired Toast Action
    else if (action === 'fortune') {
        tabClick(e, "townsTab");
        triggerBuilding(null, "fortune");
        $("#fortuneBldg").addClass("selected");
        $("#fortuneBldg").removeClass("hasEvent");
    }
    // Fusion Completed Toast Action
    else if (action === 'fusion') {
        tabClick(e, "townsTab");
        triggerBuilding(null, "fusion");
        $("#fusionBldg").addClass("selected");
        $("#fusionBldg").removeClass("hasEvent");
    }
});

$(document).on('click', '.toastPopupClose', (e) => {
    e.preventDefault();
    ToastManager.destroyToast(e.currentTarget.parentNode);
});
