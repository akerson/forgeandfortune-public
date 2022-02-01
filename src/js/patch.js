"use strict";

const PatchManager = {
    patchList: [],
    current : 0,
    time : 0,
    addPatch(patchNote,firstLoad) {
        this.patchList.push(patchNote);
        if (firstLoad) this.current = Math.max(this.current,patchNote.patchCount);
    },
    lastPatch() {
        const patchCount = this.patchList.map(p=>p.patchCount);
        const highest = Math.max(...patchCount);
        return this.patchList.find(p => p.patchCount === highest);
    },
    lastVersion() {
        return this.lastPatch().version;
    },
    lastPatchCount() {
        return this.lastPatch().patchCount;
    },
    updateNeeded() {
        return this.current < this.lastPatchCount();
    },
    patchTimer(elapsed) {
        this.time += elapsed;
        if (this.time > 300000) {
            this.patchList = [];
            $.ajax({
                url: "json/patchNotes.json",
            }).done((data) => {
                $.each(data, function(i,props){
                    const patch = new PatchNote(props);
                    PatchManager.addPatch(patch,false);
                });
                refreshPatchNotes();
            });
            this.time = 0;
        }
    }
}

class PatchNote {
    constructor(props) {
        Object.assign(this, props);
    }
}

function refreshPatchNotes() {
    if (PatchManager.updateNeeded()) $("#versionNum").addClass("hasEvent");
}

function showPatchNotes() {
    $("#patchList").empty();
    PatchManager.patchList.forEach(patch => {
        const d = $("<div/>").addClass("patchNote");
            $("<div/>").addClass("patchNoteVersion").html(patch.version).appendTo(d);
            $("<div/>").addClass("patchNoteDate").html(`Updated ${patch.date}`).appendTo(d);
            $("<div/>").addClass("patchNoteBody").html(patch.body).appendTo(d);
        $("#patchList").prepend(d);
    });
    if (PatchManager.updateNeeded()) $("#updateTrigger").show();
    else $("#updateTrigger").hide();
}

$(document).on("click","#updateRefresh", (e) => {
    location.reload();
});