"use strict";

class ProgressBar {
    constructor (id, currentRef, maxRef, text, icon, tooltip, classes) {
        this.id = id;
        this.currentRef = currentRef;
        this.maxRef = maxRef;
        this.text = text;
        this.classes = classes;
        this.icon = icon;
        this.tooltip = tooltip;
        this.filldiv = null;
        this.container = this.constructBar();
    }
    constructBar() {
        const width = (this.currentRef/this.maxRef*100).toFixed(1)+"%";
        const progressBarContainer = $("<div/>").addClass("progressBarContainer");
        if (this.classes) progressBarContainer.addClass(this.classes);
        if (this.tooltip) progressBarContainer.addClass("tooltip").attr({"data-tooltip": tooltip});
            if (this.text) {
                this.textDiv = $("<div/>").addClass("progressBarText").attr("id","pbtext"+this.id).html(text).appendTo(progressBarContainer);
                if (this.icon) textDiv.addClass("containsIcon");
            }
            const progressBarContent = $("<div/>").addClass("progressBarContent").appendTo(progressBarContainer);
                if (this.icon) $("<div/>").addClass("progressBarIcon").html(this.icon).appendTo(progressBarContent);
                const progressBar = $("<div/>").addClass("progressBar").appendTo(progressBarContent);
                    this.filldiv = $("<div/>").addClass("progressBarFill").attr("id","pbfill"+this.id).css("width", width).appendTo(progressBar);

        return progressBarContainer;
    }
    refreshContent(value,max) {
        this.currentRef = value;
        this.maxRef = max;
        const width = (value/max*100).toFixed(1)+"%";
        this.filldiv.css("width",width);
    }
    setText(text) {
        this.text = text;
        this.textDiv.html(text);
    }
}