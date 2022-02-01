class Tooltip {
  constructor(props) {
    Object.assign(this, props);
  }
  tooltipValue(id,prop) {
    if (this.type === "value") return id;
    else if (this.type === "buff") return BuffManager.findBuff(id)[prop];
    else if (this.type === "dungeon") return DungeonManager.dungeonByID(id)[prop];
    else if (this.type === "guild") return GuildManager.idToGuild(id)[prop];
    else if (this.type === "hero") return HeroManager.idToHero(id)[prop];
    else if (this.type === "material") return ResourceManager.idToMaterial(id)[prop];
    else if (this.type === "mob") return MobManager.idToMob(id)[prop];
    else if (this.type === "perk") return Shop.idToPerk(id)[prop];
    else if (this.type === "recipe") return recipeList.idToItem(id)[prop];
    else if (this.type === "skill") return SkillManager.idToSkill(id)[prop];
    else if (this.type === "playbook") return PlaybookManager.idToPlaybook(id)[prop];
    else if (this.type === "worker") return WorkerManager.workerByID(id)[prop];
    else if (this.type === "expedition") return ExpeditionManager.idToExpedition(parseInt(id))[prop];
    else if (this.type === "trophy") return DungeonManager.idToTrophy(id)[prop];
    else if (this.type === "synth") return SynthManager[prop];
  }
  generateIcon(id) {
    if (!this.icon) return null;
    return hashtagReplace(this, id, this.icon);
  }
  isFont(id) {
    const iconText = this.generateIcon(id);
    return iconText ? iconText.substring(0,2) === "<i" : false;
  }
}

const TooltipManager = {
  tooltips: [],
  addTooltip(tooltip) {
    this.tooltips.push(tooltip)
  },
  findTooltip(id) {
    return this.tooltips.find(tooltip => tooltip.id === id)
  },
}

function generateTooltip(e) {
  const tooltipsContainer = $("#tooltips");
  const tooltipID = $(e.currentTarget).attr("data-tooltip");
  const tooltipEV = $(e.currentTarget).attr("data-tooltip-value");
  const tooltip = TooltipManager.findTooltip(tooltipID);
  const props = e.currentTarget.getBoundingClientRect();
  
  if (tooltip === undefined) return;
  const generatedTooltip = $("<div/>").addClass("tooltip-container").appendTo(tooltipsContainer);
  // If icon is image, render image
  if (tooltip.icon && !tooltip.isFont(tooltipEV)) $("<div/>").addClass("tooltip-icon").css({backgroundImage: `url(${tooltip.generateIcon(tooltipEV)})`}).appendTo(generatedTooltip);
  // If icon is font, render font icon
  if (tooltip.icon && tooltip.isFont(tooltipEV)) $("<div/>").addClass("tooltip-icon").html(tooltip.generateIcon(tooltipEV)).appendTo(generatedTooltip);

  const tooltipDetails = $("<div/>").addClass("tooltip-details").appendTo(generatedTooltip);
  
  if (tooltip.title) {
    const titleText = tooltipEV ? hashtagReplace(tooltip,tooltipEV,tooltip.title) : tooltip.title;
    $("<div/>").addClass("tooltip-title").html(titleText).appendTo(tooltipDetails);
  }
  if (tooltip.description) {
    const descText = tooltipEV ? hashtagReplace(tooltip,tooltipEV,tooltip.description) : tooltip.description;
    $("<div/>").addClass("tooltip-description").html(descText).appendTo(tooltipDetails);
  }

  let positionBottom = ( window.innerHeight - props.top ) + 10;
  if (props.top < 100) positionBottom = ( window.innerHeight - props.top ) - ( $(".tooltip-container").height() + props.height + 25 );
  let positionLeft = props.left + (props.width / 2) - 175;
  if (positionLeft < 0) positionLeft = 5;
  while (positionLeft > window.innerWidth - 350) positionLeft -= 5;

  const defaultStyles = {
    position: "absolute",
    bottom: positionBottom,
    left: positionLeft
  }
  
  generatedTooltip.css(defaultStyles);
  return generatedTooltip;
}

function destroyTooltip(e) {
  $(".tooltip-container").addClass("destroyingTooltip");
  setTimeout(() => {
    $(".tooltip-container.destroyingTooltip").remove();
  }, 200)
}

$(document).on("mouseenter", ".tooltip", (e) => {
  e.stopPropagation();
  destroyTooltip(); // Ensures removal of any "stuck" tooltips before generating new tooltip
  if (settings.tpref === 1) generateTooltip(e);
});

$(document).on("mouseleave", ".tooltip", (e) => {
  destroyTooltip(e);
});

$(document).on("mouseenter", ".tooltip-container", (e) => {
  destroyTooltip(e);
});

function hashtagReplace(tooltip, id, html) {
  if (!html.includes("#")) return html;
  const start = html.indexOf("#");
  const end = html.indexOf("#",start+1);
  const prop = html.substring(start+1,end);
  return hashtagReplace(tooltip,id,html.substring(0,start)+tooltip.tooltipValue(id,prop)+html.substring(end+1));
}