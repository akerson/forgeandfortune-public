class idAmt {
    constructor (id,amt) {
        this.id = id;
        this.amt = amt;
    }
    createSave() {
        const save = {};
        save.id = this.id;
        save.amt = this.amt;
        return save;
    }
    loadSave() {
        return;
    }
}

function formatToUnits(number, precision) {
    const abbrev = ['', 'k', 'M', 'B', 'T', 'Q'];
    const unrangifiedOrder = Math.floor(Math.log10(Math.abs(number)) / 3)
    const order = Math.max(0, Math.min(unrangifiedOrder, abbrev.length -1 ))
    const suffix = abbrev[order];
    return parseFloat((number / Math.pow(10, order * 3)).toFixedDown(precision)) + suffix;
}

Number.prototype.toFixedDown = function(digits) {
    var re = new RegExp("(\\d+\\.\\d{" + digits + "})(\\d)"),
        m = this.toString().match(re);
    return m ? parseFloat(m[1]) : this.valueOf();
};

function formatWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function msToTime(s,showHours) {
    const ms = s % 1000;
    s = (s - ms) / 1000;
    let secs = s % 60;
    s = (s - secs) / 60;
    let mins = s % 60;
    s = (s - mins) / 60;
    let hours = s % 60;
    mins = showHours ? mins : mins + 60*hours;
    if (secs < 10) secs = "0" + secs
    if (mins < 10) mins = "0" + mins
    if (showHours && hours > 0) return hours + ":" + mins + ":" + secs;
    return mins + ':' + secs;
}

function rollDice(number, sides) {
    let total = 0;
    while(number-- > 0) total += Math.floor(Math.random() * sides) + 1;
    return total;
}

function rollDiceSeed(gid, number, sides) {
    let total = 0;
    while(number-- > 0) total += Math.floor(GuildSeedManager.fauxRand(gid) * sides) + 1;
    return total;
}

function bellCurve(min,max) {
    const total = rollDice(3,6);
    const percent = (total-6)/30;
    return Math.round(percent*(max-min)+min);
}

function bellCurveSeed(gid,min,max) {
    const total = rollDiceSeed(gid, 6,6);
    const percent = (total-6)/30;
    return Math.round(percent*(max-min)+min);
}

function round(number, precision) {
    var shift = function (number, precision) {
      var numArray = ("" + number).split("e");
      return +(numArray[0] + "e" + (numArray[1] ? (+numArray[1] + precision) : precision));
    };
    return shift(Math.round(shift(number, +precision)), -precision).toFixed(precision);
}

function timeSince(startTime,endTime) {
    endTime = endTime || Date.now()
    let s = "";
    let diff = Math.round((endTime-startTime)/1000);
    const d = Math.floor(diff/(24*60*60))
    diff = diff-d*24*60*60
    if (d === 1) s += d + " day, ";
    else s += d + " days, ";
    const h = Math.floor(diff/(60*60));
    diff = diff-h*60*60;
    if (h === 1) s += h + " hour, ";
    else s += h + " hours, ";
    const m = Math.floor(diff/60);
    diff = diff-m*60;
    if (m === 1) s += m + " minute, ";
    else s += m + " minutes, ";
    if (diff === 1) s += diff + " second, ";
    else s += diff + " seconds, ";
    return s.slice(0, -2);
}

const miscIcons = Object.freeze({
    hp : '<i class="fas fa-heart statHP"></i>',
    pow : '<i class="fad fa-sword statPOW"></i>',
    ap : '<img src="assets/images/DungeonIcons/ap.png">',
    gold : '<img src="assets/images/resources/M001.png">',
    star : '<i class="fas fa-star statSTAR"></i>',
    skull : '<i class="fas fa-skull"></i>',
    trophy : `<img src='assets/images/resources/M002.png' alt='Monster Trophy'>`,
    arrow : '<i class="fas fa-arrow-right"></i>',
    dead : '<i class="fas fa-skull-crossbones"></i>',
    takeDamage : '<i class="fas fa-shield-cross"></i>',
    guildRep : '<i class="fas fa-grin-alt"></i>',
    rarity : '<i class="fad fa-diamond"></i>',
    emptySlot : `<i class="fas fa-question-circle"></i>`,
    question : `<i class="fas fa-question-circle"></i>`,
    cancelSlot : `<i class="fas fa-times"></i>`,
    autoSell : `<i class="fas fa-dollar-sign"></i>`,
    time : `<i class="fas fa-clock"></i>`,
    alert : `<i class="fas fa-exclamation-circle"></i>`,
    checkmark : `<i class="fas fa-check"></i>`,
    commandTime : `<i class="fas fa-stopwatch"></i>`,
    commandProgress : `<i class="fas fa-spinner"></i>`,
    toggleOn : `<i class="fas fa-toggle-on"></i>`,
    toggleOff : `<i class="fas fa-toggle-off"></i>`,
    quest : `<i class="fas fa-map-signs"></i>`,
    locked : `<i class="fas fa-lock-alt"></i>`,
    enhancement : `<i class="fas fa-plus-circle"></i>`,
    merchantOrder : `<i class="fas fa-scroll"></i>`,
    mastery : `<img src="assets/svg/stars-stack.svg">`,
    COG : '<i class="fas fa-cog"></i>',
    JEWEL : '<i class="fas fa-gem"></i>',
    ARMOR : '<img src="assets/svg/brutal-helm.svg">',
    WEAPON : '<img src="assets/svg/broadsword.svg">',
    manualSubmit : '<i class="fas fa-box"></i>',
    info: '<i class="fas fa-info-circle"></i>',
    essence: `<img src="assets/svg/blackball.svg">`,
});

const heroStat = Object.freeze({
    hp : 'hp',
    pow : 'pow',
})

function msToSec(ms) {
    return round(ms/1000,1) + "s"
}

const miscLoadedValues = {};

function inventorySort(a, b) {
    const ai = a.item;
    const bi = b.item;
    const aj = ItemType.indexOf(ai.type);
    const bj = ItemType.indexOf(bi.type);
    if (ai.recipeType === "normal" && bi.recipeType !== "normal") return -1;
    if (ai.recipeType !== "normal" && bi.recipeType === "normal") return 1;
    if (ai.recipeType !== "normal" && bi.recipeType !== "normal") {
        if (ai.name !== bi.name) {
            if (ai.id > bi.id) return -1;
            return 1;
        }
        if (a.scale > b.scale) return -1;
        return 1;
    }
    if (ai.lvl > bi.lvl) return -1;
    if (ai.lvl < bi.lvl) return 1;
    if (aj > bj) return -1;
    if (aj < bj) return 1;
    if (a.rarity > b.rarity) return -1;
    if (a.rarity < b.rarity) return 1;
    if (a.sharp > b.sharp) return -1;
    if (b.sharp < a.sharp) return 1;
    return 0;
}

function interlace(a1,a2) {
    //returns a new array mixed between two
    const length = Math.max(a1.length,a2.length);
    const result = [];
    for (let i=0;i<length;i++) {
        if (a1.length > i) result.push(a1[i]);
        if (a2.length > i) result.push(a2[i]);
    }
    return result;
}

function flattenArray(a) {
    return [].concat.apply([], a);
}

function groupArray(i) {
    return i.reduce((a, c) => (a[c] = (a[c] || 0) + 1, a), Object.create(null));
}

var a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
var b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];

function inWords(num) {
    if (num === 0) return "Zero";
    if ((num = num.toString()).length > 9) return 'overflow';
    n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return; var str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'billion ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'million ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str;
}

function normalDistribution(min, max, skew) {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );

    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) num = randn_bm(min, max, skew); // resample between 0 and 1 if out of range
    num = Math.pow(num, skew); // Skew
    num *= max - min; // Stretch to fill range
    num += min; // offset to min
    return num;
}

function createArray(length) {
    var arr = new Array(length || 0), i = length;
    arr.fill(false);
    if (arguments.length > 1) {
        const args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }
    return arr;
}

function displayText(id) {
    const lang = settings.lang || "en";
    const sanitizedID = id.toLowerCase().toString();
    const string = globalTexts.find(text => text.tid === sanitizedID);
    // Return ID you attempted to pull, useful for finding missing or incorrect strings.
    if (!string || !string[lang]) return `[${id}]`;
    // Return string if ID is found.
    return string[lang];
}

function generateProgressBar(options) {
    const {prefix, tooltip, text, textID, icon, width, fill} = options;
    const progressBarContainer = $("<div/>").addClass(`progressBarContainer ${prefix}BarContainer`);
    if (tooltip) progressBarContainer.addClass("tooltip").attr({"data-tooltip": tooltip});

    const progressBarText = $("<div/>").addClass("progressBarText");
    if (text) progressBarText.html(text).appendTo(progressBarContainer)
    if (textID) progressBarText.attr({"id": textID});

    const progressBarContent = $("<div/>").addClass("progressBarContent");
    if (icon) $("<div/>").addClass("progressBarIcon").html(icon).appendTo(progressBarContent);
    if (icon && text) progressBarText.addClass("containsIcon");

    const progressBar = $("<div/>").addClass("progressBar").appendTo(progressBarContent);
    const progressBarFill = $("<div/>").addClass("progressBarFill").css("width", width).appendTo(progressBar);
    if (fill) progressBarFill.attr({"id": fill});

    progressBarContainer.append(progressBarContent)
    return progressBarContainer;
}
