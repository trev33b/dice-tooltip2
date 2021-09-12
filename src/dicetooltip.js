//Attach a listener for cursor movement
Hooks.on('ready', function() {
  window.addEventListener('mousemove', setTooltipPosition);
});

//
function setTooltipPosition(ev) {
  mousePos = { x: ev.clientX, y: ev.clientY };

  var tooltip = $(".diceinfo-tooltip");
  if (tooltip.length == 0) return;

  tooltip.css('top', (ev.clientY - 24 - tooltip.height()/2) + 'px');
  tooltip.css('left', (ev.clientX + 1) + 'px');
}

//Support for Sky's Alt 5e Sheet
Hooks.on("renderedAlt5eSheet", (html) => {
  prepareDiceTooltipEvents(html);
});

//Support for Tidy5e Sheet
Hooks.on("renderedTidy5eSheet", (html) => {
  prepareDiceTooltipEvents(html);
});

// Hooks.on("renderTidy5eNPC", (html) => {
//   prepareDiceTooltipEvents(html);
// });

//Standard 5e Sheet & Tidy5eNPC
Hooks.on("renderActorSheet", (html) => {
  var el = $(html.element);
  // if (el.hasClass("tidy5e") || el.hasClass("alt5e")) return; //Prevent event doubling on supported sheet modules
  if (el.hasClass("alt5e")) return; //Prevent event doubling on supported sheet modules
  prepareDiceTooltipEvents(html);
});

function prepareDiceTooltipEvents(html) {
  var splits = html.id.split("-");
  var actor = null;
  for (var i=0;i<splits.length;i++) {
      actor = game.actors.get(splits[i]);
      if (actor != null) {
        break;
      }
  }

  var sheetID = "#" + html.id;

  if (actor == null) return;

  $(".item .rollable", sheetID).on({
    mouseenter: function () {
      checkItemTooltip(this, actor);
    },
    mouseleave:function () {
      removeTooltip();
    }
  });

  $(".ability-name.rollable", sheetID).on({
    mouseenter: function () {
      checkAbilityTooltip(this, actor);
    },
    mouseleave:function () {
      removeTooltip();
    }
  });

  $(".skill-name.rollable", sheetID).on({
    mouseenter: function () {
      checkSkillTooltip(this, actor);
    },
    mouseleave:function () {
      removeTooltip();
    }
  });

  $(".death-saves.rollable", sheetID).on({
    mouseenter: function () {
      checkDeathSaveTooltip();
    },
    mouseleave:function () {
      removeTooltip();
    }
  });


  $(".short-rest", sheetID).on({
    mouseenter: function () {
      checkShortRestTooltip(actor);
    },
    mouseleave:function () {
      removeTooltip();
    }
  });
}

function checkShortRestTooltip(actor) {
  var hitDice = [];
  for (var i=0;i<actor.data.items.length;i++) {
    if (actor.data.items[i].type == "class") {
      var hitDie = {die: actor.data.items[i].data.hitDice, amount: actor.data.items[i].data.levels};
      var sameDieTypeFound = false;
      for (var j=0;j<hitDice.length;j++) {
        if (hitDice[j].die == hitDie.die) {
          hitDice[j].amount += hitDie.amount;
          sameDieTypeFound = true;
          break;
        }
      }

      if (!sameDieTypeFound) hitDice.push(hitDie);
    }
  }

  var dieStr = "";
  for (var i=0;i<hitDice.length;i++) {
    if (i > 0) dieStr += " + ";
    dieStr += hitDice[i].amount + hitDice[i].die;
  }

  var tooltipStr = "<p><b>• Hit Dice:</b> " + dieStr + "</p>";
  showTooltip(tooltipStr);
}

function checkDeathSaveTooltip() {
  var tooltipStr = "<p><b>• Saving Throw:</b> 1d20</p>";
  showTooltip(tooltipStr);
}

function checkSkillTooltip(el, actor) {
  var dataItem = $(el).closest("li").get();
  var data = dataItem[0].dataset;
  var skill = data.skill;

  if (skill == undefined) return;

  var skillData = actor.data.data.skills[skill];
  var tooltipStr = "";

  tooltipStr += "<p><b>• Skill Check:</b> 1d20" + formatBonus(skillData.total) + "</p>";

  showTooltip(tooltipStr);
}

function checkAbilityTooltip(el, actor) {
  var dataItem = $(el).closest("li").get();
  var data = dataItem[0].dataset;
  var ability = data.ability;
  var abilityData = actor.data.data.abilities[ability];
  var tooltipStr = "";

  //Check
  tooltipStr += "<p><b>• Ability Check:</b> 1d20" + formatBonus(abilityData.mod) + "</p>";

  //Save
  tooltipStr += "<p><b>• Saving Throw:</b> 1d20" + formatBonus(abilityData.mod + abilityData.prof) + "</p>";

  showTooltip(tooltipStr);
}

function checkItemTooltip(el, actor) {
  var dataItem = $(el).closest("li").get();
  var data = dataItem[0].dataset;
  let item = actor.getOwnedItem(data.itemId);

  let tooltipStr = "";
  let createTooltip = false;

  if (item.hasAttack) {
    createTooltip = true;
    tooltipStr += "<p><b>• Attack: </b>" + formatDiceParts(rollFakeAttack(item)) + '</p>';
  }

  if (item.hasDamage) {
    createTooltip = true;
    const itemConfig = {
      // spellLevel: 1, ** need to find a cool solution for this **
      versatile: item.isVersatile
    };
    var dmgOrHealing = item.isHealing? "Healing" : "Damage";
    tooltipStr += "<p><b>• " + dmgOrHealing + ": </b>" + formatDiceParts(rollFakeDamage(item, itemConfig)) + " " + item.labels.damageTypes + "</p>";
  }

  if (item.hasSave) {
    createTooltip = true;
    tooltipStr += "<p><b>• Save: </b>" + item.labels.save + "</p>";
  }

  if (!createTooltip) return;
  showTooltip(tooltipStr);
}


function showTooltip(text) {
  var template = '<div class="diceinfo-tooltip"><span><div class="arrow-left"></div><div class="tooltiptext">' + text + '</div></span></div>';
  $("body").append(template);
}

//
function removeTooltip() {
  $(".diceinfo-tooltip").remove();
}

function formatBonus(bonus) {
  var evalNum = eval(bonus);
  var numberPlusMinus = evalNum >= 0? " + " : " - ";
  return numberPlusMinus + Math.abs(evalNum);
}

function formatDiceParts(rollData) {
  return rollData.formula;
  // var res = "";
  // var bonusStr = "";
  //
  // if (rollData.terms.length > 0) {
  //   for (var i=0;i<rollData.terms.length;i++) {
  //     if (typeof rollData.terms[i] == 'object') {
  //       if (i > 0) res += " + ";
  //       res += rollData.terms[i].formula;
  //     } else {
  //       bonusStr += rollData.terms[i];
  //     }
  //   }
  // } else {
  //   bonusStr = rollData.formula;
  // }
  //
  // try {
  //   var bonusVal = eval(bonusStr)
  //   if (res.length > 0) res += " + ";
  //   if (bonusVal != 0) res += bonusVal;
  // } catch (e) {
  //   if (res.length > 0) res += " + ";
  //   res += bonusStr;
  // }
  //
  // return res;
}

/* -------------------------------------------- */
/*  Copy pasted from the D&D5E System Code      */
/* -------------------------------------------- */

function rollFakeAttack(item) {
  const itemData = item.data.data;
  const actorData = item.actor.data.data;
  const flags = item.actor.data.flags.dnd5e || {};
  if ( !item.hasAttack ) {
    throw new Error("You may not place an Attack Roll with this Item.");
  }
  const rollData = item.getRollData();

  // Define Roll bonuses
  const parts = [`@mod`];
  if ( (item.data.type !== "weapon") || itemData.proficient ) {
    parts.push("@prof");
  }

  // Attack Bonus
  const actorBonus = actorData.bonuses[itemData.actionType] || {};
  if ( itemData.attackBonus || actorBonus.attack ) {
    parts.push("@atk");
    rollData["atk"] = [itemData.attackBonus, actorBonus.attack].filterJoin(" + ");
  }

  // Compose roll options
  const rollConfig = {
    parts: parts,
    actor: item.actor,
    data: rollData,
    title: `${item.name} - Attack Roll`
  };

  // Expanded weapon critical threshold
  if (( item.data.type === "weapon" ) && flags.weaponCriticalThreshold) {
    rollConfig.critical = parseInt(flags.weaponCriticalThreshold);
  }

  // Elven Accuracy
  if ( ["weapon", "spell"].includes(item.data.type) ) {
    if (flags.elvenAccuracy && ["dex", "int", "wis", "cha"].includes(item.abilityMod)) {
      rollConfig.elvenAccuracy = true;
    }
  }

  // Apply Halfling Lucky
  if ( flags.halflingLucky ) rollConfig.halflingLucky = true;

  // Invoke the d20 roll helper
  return d20RollFake(rollConfig);
}

  /* -------------------------------------------- */

function rollFakeDamage(item, {spellLevel=null, versatile=false}={}) {
  const itemData = item.data.data;
  const actorData = item.actor.data.data;
  if ( !item.hasDamage ) {
    throw new Error("You may not make a Damage Roll with this Item.");
  }
  const rollData = item.getRollData();
  if ( spellLevel ) rollData.item.level = spellLevel;

  // Define Roll parts
  const parts = itemData.damage.parts.map(d => d[0]);
  if ( versatile && itemData.damage.versatile ) parts[0] = itemData.damage.versatile;
  if ( (item.data.type === "spell") ) {
    if ( (itemData.scaling.mode === "cantrip") ) {
      const lvl = item.actor.data.type === "character" ? actorData.details.level : actorData.details.spellLevel;
      item._scaleCantripDamage(parts, lvl, itemData.scaling.formula );
    } else if ( spellLevel && (itemData.scaling.mode === "level") && itemData.scaling.formula ) {
      item._scaleSpellDamage(parts, itemData.level, spellLevel, itemData.scaling.formula );
    }
  }

  // Define Roll Data
  const actorBonus = actorData.bonuses[itemData.actionType] || {};
  if ( actorBonus.damage && parseInt(actorBonus.damage) !== 0 ) {
    parts.push("@dmg");
    rollData["dmg"] = actorBonus.damage;
  }

  // Call the roll helper utility
  const title = `${item.name} - Damage Roll`;
  const flavor = item.labels.damageTypes.length ? `${title} (${item.labels.damageTypes})` : title;
  return damageRollFake({
    parts: parts,
    actor: item.actor,
    data: rollData,
    title: title,
    flavor: flavor
  });
}

//Dice methods

function d20RollFake({parts=[], data={}, rollMode=null, title=null,
                      flavor=null, advantage=null, disadvantage=null, critical=20, fumble=1, targetValue=null,
                      elvenAccuracy=false, halflingLucky=false, reliableTalent=false}={}) {

  // Handle input arguments
  flavor = flavor || title;
  parts = parts.concat(["@bonus"]);
  rollMode = rollMode || game.settings.get("core", "rollMode");
  let rolled = false;

  // Define inner roll function
  const _roll = function(parts, adv, form=null) {

    // Determine the d20 roll and modifiers
    let nd = 1;
    let mods = halflingLucky ? "r=1" : "";

    // Handle advantage
    if ( adv === 1 ) {
      nd = elvenAccuracy ? 3 : 2;
      flavor += ` (${game.i18n.localize("DND5E.Advantage")})`;
      mods += "kh";
    }

    // Handle disadvantage
    else if ( adv === -1 ) {
      nd = 2;
      flavor += ` (${game.i18n.localize("DND5E.Disadvantage")})`;
      mods += "kl";
    }

    // Include the d20 roll
    // Prepend the d20 roll
    let formula = `${nd}d20${mods}`;
    if (reliableTalent) formula = `{${nd}d20${mods},10}kh`;
    parts.unshift(formula);

    // Optionally include a situational bonus
    if ( form !== null ) data['bonus'] = form.bonus.value;
    if ( !data["bonus"] ) parts.pop();

    // Optionally include an ability score selection (used for tool checks)
    const ability = form ? form.ability : null;
    if ( ability && ability.value ) {
      data.ability = ability.value;
      const abl = data.abilities[data.ability];
      if ( abl ) {
        data.mod = abl.mod;
        flavor += ` (${CONFIG.DND5E.abilities[data.ability]})`;
      }
    }

    // Execute the roll and flag critical thresholds on the d20
    let roll = new Roll(parts.join(" + "), data).roll();
    const d20 = roll.terms[0];
    d20.options.critical = critical;
    d20.options.fumble = fumble;
    if ( targetValue ) d20.options.target = targetValue;

    // If reliable talent was applied, add it to the flavor text
    if ( reliableTalent && roll.dice[0].total < 10 ) {
      flavor += ` (${game.i18n.localize("DND5E.FlagsReliableTalent")})`;
    }

    return roll;
  };

  if ( advantage) return _roll(parts, 1);
  else if ( disadvantage ) return _roll(parts, -1);
  else return _roll(parts, 0);
}

function damageRollFake({parts, actor, data, rollMode=null, template, title, flavor,
                          allowCritical=true, critical=false}) {

  // Handle input arguments
  flavor = flavor || title;
  rollMode = game.settings.get("core", "rollMode");
  let rolled = false;

  // Define inner roll function
  const _roll = function(parts, crit, form) {
    data['bonus'] = form ? form.bonus.value : 0;
    let roll = new Roll(parts.join("+"), data);

    // Modify the damage formula for critical hits
    if ( crit === true ) {
      let add = (actor && actor.getFlag("dnd5e", "savageAttacks")) ? 1 : 0;
      let mult = 2;
      roll = roll.alter(mult, add);
      flavor = `${flavor} (${game.i18n.localize("DND5E.Critical")})`;
    }

    return roll;
  };

  return _roll(parts, critical);
}
