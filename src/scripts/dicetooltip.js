//Attach a listener for cursor movement
Hooks.on('ready', function() {
  window.addEventListener('mousemove', setTooltipPosition);
});

//
function setTooltipPosition(ev) {
  let mousePos = { x: ev.clientX, y: ev.clientY };

  // noinspection JSUnresolvedFunction
  let tooltip = $(".diceinfo-tooltip");
  if (tooltip.length === 0) return;

  tooltip.css('top', (mousePos.y - 4 - tooltip.height()/2) + 'px');
  tooltip.css('left', (mousePos.x + 1) + 'px');
}

//Standard 5e Sheet, Tidy5eNPC, & Sky's Alt 5e Sheets
Hooks.on("renderActorSheet", (html) => {
  prepareDiceTooltipEvents(html);
});

function prepareDiceTooltipEvents(html) {
  let splits = html.id.split("-");
  let actor = null;
  for (let i=0;i<splits.length;i++) {
      actor = game.actors.get(splits[i]);
      if (actor != null) {
        break;
      }
  }

  let sheetID = "#" + html.id;

  if (actor == null) return;

  // noinspection JSUnresolvedFunction
  $(".item .rollable", sheetID).on({
    mouseenter: function () {
      checkItemTooltip(this, actor);
    },
    mouseleave:function () {
      removeTooltip();
    }
  });

  //todo: add tooltip for initiaive: .attribute-name.rollable
  //todo: add tooltip for .ability-mod.rollable
  //todo: add tooltip for .ability-save.rollable
  //todo: test this on tidy5e favorite items list
  // noinspection JSUnresolvedFunction
  $(".item-name.rollable", sheetID).on({
    mouseenter: function () {
      checkItemTooltip(this, actor);
    },
    mouseleave:function () {
      removeTooltip();
    }
  });

  // noinspection JSUnresolvedFunction
  $(".ability-name.rollable", sheetID).on({
    mouseenter: function () {
      checkAbilityTooltip(this, actor);
    },
    mouseleave:function () {
      removeTooltip();
    }
  });

  // noinspection JSUnresolvedFunction
  $(".skill-name.rollable", sheetID).on({
    mouseenter: function () {
      checkSkillTooltip(this, actor);
    },
    mouseleave:function () {
      removeTooltip();
    }
  });

  // noinspection JSUnresolvedFunction
  $(".death-saves.rollable", sheetID).on({
    mouseenter: function () {
      checkDeathSaveTooltip();
    },
    mouseleave:function () {
      removeTooltip();
    }
  });


  // noinspection JSUnresolvedFunction
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
  let hitDice = [];

  for (const classesKey in actor.data.data.classes) {
    const clazz = actor.data.data.classes[classesKey];
    let hitDieCount = hitDice[clazz.hitDice];
    if (!hitDieCount) {
      hitDieCount = 0;
    }
    hitDieCount += clazz.levels - clazz.hitDiceUsed;
    hitDice[clazz.hitDice] = hitDieCount;
  }

  let dieStr = "";
  for (const hitDiceKey in hitDice) {
    if (!hitDice.hasOwnProperty(hitDiceKey)) {
      continue;
    }

    const amount = hitDice[hitDiceKey];

    if (dieStr) {
      dieStr += " + ";
    }
    dieStr += amount + hitDiceKey;
  }

  let tooltipStr = createToolTipText("DiceToolTip.HitDice",dieStr);
  showTooltip(tooltipStr);
}

function checkDeathSaveTooltip() {
  let tooltipStr = createToolTipText("DiceToolTip.SavingThrow","1d20");
  showTooltip(tooltipStr);
}

function checkSkillTooltip(el, actor) {
  // noinspection JSUnresolvedFunction
  let dataItem = $(el).closest("li").get();
  let data = dataItem[0].dataset;
  let skill = data.skill;

  if (!skill) {
    return;
  }

  let skillData = actor.data.data.skills[skill];
  let tooltipStr = "";

  tooltipStr += createToolTipText("DiceToolTip.SkillCheck","1d20" + formatBonus(skillData.total));

  showTooltip(tooltipStr);
}

function checkAbilityTooltip(el, actor) {
  // noinspection JSUnresolvedFunction
  let dataItem = $(el).closest("li").get();
  let data = dataItem[0].dataset;
  let ability = data.ability;
  let abilityData = actor.data.data.abilities[ability];
  let tooltipStr = "";

  //Check
  tooltipStr += createToolTipText("DiceToolTip.AbilityCheck","1d20" + formatBonus(abilityData.mod));

  //Save
  tooltipStr += createToolTipText("DiceToolTip.SavingThrow","1d20" + formatBonus(abilityData.mod + abilityData.prof));

  showTooltip(tooltipStr);
}

function checkItemTooltip(el, actor) {
  // noinspection JSUnresolvedFunction
  let dataItem = $(el).closest("li").get();
  let data = dataItem[0].dataset;
  let item = actor.items.get(data.itemId);

  let tooltipStr = "";

  if (item.hasAttack) {
    tooltipStr += createToolTipText("DiceToolTip.Attack",formatDiceParts(rollFakeAttack(item)));
  }

  if (item.hasDamage) {
    const itemConfig = {
      // spellLevel: 1, ** need to find a cool solution for this **
      versatile: item.isVersatile
    };
    let dmgOrHealing = item.isHealing? "DiceToolTip.Healing" : "DiceToolTip.Damage";
    tooltipStr += createToolTipText(dmgOrHealing,formatDiceParts(rollFakeDamage(item, itemConfig)) + " " + item.labels.damageTypes);
  }

  if (item.hasSave) {
    tooltipStr += createToolTipText("DiceToolTip.Save",item.labels.save);
  }

  if (!tooltipStr) return;
  showTooltip(tooltipStr);
}

// Create normalized & localized tooltip text
function createToolTipText(titleKey, body) {
  let title = game.i18n.localize(titleKey);

  return "<p><b>• " + title + ":</b> " + body  + "</p>";
}

function showTooltip(text) {
  let template = '<div class="diceinfo-tooltip"><span><div class="arrow-left"></div><div class="tooltiptext">' + text + '</div></span></div>';
  // noinspection JSUnresolvedFunction
  $("body").append(template);
}

//
function removeTooltip() {
  // noinspection JSUnresolvedFunction
  $(".diceinfo-tooltip").remove();
}

function formatBonus(bonus) {
  let evalNum = eval(bonus);
  let numberPlusMinus = evalNum >= 0? " + " : " - ";
  return numberPlusMinus + Math.abs(evalNum);
}

function formatDiceParts(rollData) {
  return rollData.formula;

  // Below is the original code for this method.  It's not clear to me (Trevor)
  // how this is meant to differ from the rollData.formula and the formula seems
  // to produce better results (no extra +'s in the output).  I'm guessing that
  // formula may now be better due to improvements in the 0.8 Dice API.

  // let res = "";
  // let bonusStr = "";
  //
  // if (rollData.terms.length > 0) {
  //   for (let i=0;i<rollData.terms.length;i++) {
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
  //   let bonusVal = eval(bonusStr)
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
    throw new Error(game.i18n.localize("DiceToolTip.ErrorItemWithoutAttack"));
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
    throw new Error(game.i18n.localize("DiceToolTip.ErrorItemWithoutDamage"));
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
      item._scaleSpellDamage(parts, itemData.level, spellLevel, itemData.scaling.formula, {});
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

function d20RollFake({parts=[], data={}, title=null,
                      flavor=null, advantage=null, disadvantage=null, critical=20, fumble=1, targetValue=null,
                      elvenAccuracy=false, halflingLucky=false, reliableTalent=false}={}) {

  // Handle input arguments
  flavor = flavor || title;
  parts = parts.concat(["@bonus"]);

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
    let roll = new Roll(parts.join(" + "), data).roll({async:false});
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

function damageRollFake({parts, actor, data, title, flavor, critical=false}) {

  // Handle input arguments
  flavor = flavor || title;

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
