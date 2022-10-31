//Attach a listener for cursor movement
Hooks.on('ready', function() {
  window.addEventListener('mousemove', setTooltipPosition);
});

//
function setTooltipPosition(ev) {
  let mousePos = { x: ev.clientX, y: ev.clientY };

  // noinspection JSUnresolvedFunction
  let tooltip = $(".dtt2");
  if (tooltip.length === 0) return;

  tooltip.css('top', (mousePos.y - 4 - tooltip.height()/2) + 'px');
  tooltip.css('left', (mousePos.x + 1) + 'px');
}

//Standard 5e Sheet, Tidy5e, & Sky's Alt 5e Sheets
Hooks.on("renderActorSheet", (html) => {
  prepareDiceTooltipEvents(html);
});

function prepareDiceTooltipEvents(html) {
  const sheetID = "#" + html.id;
  const actor = getActor(html);

  if (actor == null) {
    return;
  }

  registerEventListeners(sheetID, actor);
  registerFavoritesMutationObserver(sheetID, actor);
}

function getActor(html) {
  const splits = html.id.split("-");
  for (let i = 0; i < splits.length; i++) {
    let actor = game.actors.get(splits[i]);
    if (actor) {
      return actor;
    }
  }

  return null;
}

/**
 *  The Favorites section of Tidy5e is created on the fly after
 *  the sheet is rendered and recreated every time a favorite is
 *  added/removed.  This function detects changes to the favorites DOM
 *  and sets up event listeners as needed.
 *
 * @param sheetID
 * @param actor
 */
function registerFavoritesMutationObserver(sheetID, actor) {
  //noinspection JSUnresolvedFunction
  const jFavorites = $(".favorites-target", sheetID);
  if (jFavorites) {
    const favorites = jFavorites.toArray();
    const favoritesObserver = new MutationObserver(favoritesChanged(actor))

    for (const favorite of favorites) {
      favoritesObserver.observe(favorite, {attributes: false, childList: true, subtree: true});
    }
  }
}

function favoritesChanged(actor) {
  return (mutationsList) => {
    mutationsList.forEach((mutation) => {
      mutation.addedNodes.forEach((addedNode) => {
        registerEventListeners(addedNode, actor);
      })
    })
  };
}

function registerEventListeners(rootElement, actor) {
  // noinspection JSUnresolvedFunction
  $(".item .rollable", rootElement).on({
    mouseenter: function () {
      checkItemTooltip(this, actor);
    },
    mouseleave: function () {
      removeTooltip();
    }
  });

  //todo: add tooltip for initiative: .attribute-name.rollable
  //todo: add tooltip for .ability-mod.rollable
  //todo: add tooltip for .ability-save.rollable

  // noinspection JSUnresolvedFunction
  $(".item-name.rollable", rootElement).on({
    mouseenter: function () {
      checkItemTooltip(this, actor);
    },
    mouseleave: function () {
      removeTooltip();
    }
  });

  // noinspection JSUnresolvedFunction
  $(".ability-name.rollable", rootElement).on({
    mouseenter: function () {
      checkAbilityTooltip(this, actor);
    },
    mouseleave: function () {
      removeTooltip();
    }
  });

  // noinspection JSUnresolvedFunction
  $(".skill-name.rollable", rootElement).on({
    mouseenter: function () {
      checkSkillTooltip(this, actor);
    },
    mouseleave: function () {
      removeTooltip();
    }
  });

  // noinspection JSUnresolvedFunction
  $(".death-saves.rollable", rootElement).on({
    mouseenter: function () {
      checkDeathSaveTooltip();
    },
    mouseleave: function () {
      removeTooltip();
    }
  });


  // noinspection JSUnresolvedFunction
  $(".short-rest", rootElement).on({
    mouseenter: function () {
      checkShortRestTooltip(actor);
    },
    mouseleave: function () {
      removeTooltip();
    }
  });
}

function checkShortRestTooltip(actor) {
  let hitDice = [];

  for (const classesKey in actor.classes) {
    const clazz = actor.classes[classesKey];
    let hitDieCount = hitDice[clazz.hitDice];
    if (!hitDieCount) {
      hitDieCount = 0;
    }
    hitDieCount += clazz.system.levels - clazz.system.hitDiceUsed;
    hitDice[clazz.system.hitDice] = hitDieCount;
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

  let skillData = actor.system.skills[skill];
  let tooltipStr = "";

  tooltipStr += createToolTipText("DiceToolTip.SkillCheck","1d20" + formatBonus(skillData.total));

  showTooltip(tooltipStr);
}

function checkAbilityTooltip(el, actor) {
  // noinspection JSUnresolvedFunction
  let dataItem = $(el).closest("li").get();
  let data = dataItem[0].dataset;
  let ability = data.ability;
  let abilityData = actor.system.abilities[ability];
  let tooltipStr = "";

  //Check
  tooltipStr += createToolTipText("DiceToolTip.AbilityCheck","1d20" + formatBonus(abilityData.mod));

  //Save
  tooltipStr += createToolTipText("DiceToolTip.SavingThrow","1d20" + formatBonus(abilityData.save));

  showTooltip(tooltipStr);
}

function checkItemTooltip(el, actor) {
  // noinspection JSUnresolvedFunction
  let dataItem = $(el).closest("li").get();
  let data = dataItem[0].dataset;
  let item = actor.items.get(data.itemId);

  if (!item) {
    return;
  }

  let tooltipStr = "";

  if (item.hasAttack) {
    tooltipStr += createToolTipText("DiceToolTip.Attack",formatDiceParts(rollFakeAttack(item)));
  }

  if (item.hasDamage) {
    let dmgOrHealing = item.isHealing? "DiceToolTip.Healing" : "DiceToolTip.Damage";

    tooltipStr += createToolTipText(dmgOrHealing,formatDiceParts(rollFakeDamage(item)) + " " + item.labels.damageTypes);
    if (item.isVersatile) {
      // Get versatile version of the damage
      tooltipStr += createToolTipText("DiceToolTip.VersatileDamage",formatDiceParts(rollFakeDamage(item, true)) + " " + item.labels.damageTypes);
    }
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
  let template = '<div class="dtt2"><span><div class="dtt2-arrow-left"></div><div class="dtt2-text">' + text + '</div></span></div>';
  // noinspection JSUnresolvedFunction
  $("body").append(template);
}

//
function removeTooltip() {
  // noinspection JSUnresolvedFunction
  $(".dtt2").remove();
}

function formatBonus(bonus) {
  let evalNum = eval(bonus);
  let numberPlusMinus = evalNum >= 0? " + " : " - ";
  return numberPlusMinus + Math.abs(evalNum);
}

function formatDiceParts(rollData) {
  rollData.terms = simplifyTerms(rollData.terms);
  return rollData.formula;
}

/* -------------------------------------------- */
/*  Copy pasted from the D&D5E System Code      */
/* -------------------------------------------- */

function rollFakeAttack(item) {
  const itemData = item.system;
  const actorData = item.actor.system;
  const flags = item.actor.flags.dnd5e || {};
  if ( !item.hasAttack ) {
    throw new Error(game.i18n.localize("DiceToolTip.ErrorItemWithoutAttack"));
  }
  const rollData = item.getRollData();

  // Define Roll bonuses
  const parts = [`@mod`];
  if ( (item.type !== "weapon") || itemData.proficient ) {
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
  if (( item.type === "weapon" ) && flags.weaponCriticalThreshold) {
    rollConfig.critical = parseInt(flags.weaponCriticalThreshold);
  }

  // Elven Accuracy
  if ( ["weapon", "spell"].includes(item.type) ) {
    if (flags.elvenAccuracy && ["dex", "int", "wis", "cha"].includes(item.system.ability)) {
      rollConfig.elvenAccuracy = true;
    }
  }

  // Apply Halfling Lucky
  if ( flags.halflingLucky ) rollConfig.halflingLucky = true;

  // Invoke the d20 roll helper
  return d20RollFake(rollConfig);
}

  /* -------------------------------------------- */

function rollFakeDamage(item, versatile=false) {
  const spellLevel = null; //todo: figure out how to incorporate spell level upgrades
  const itemData = item.system;
  const actorData = item.actor.system;
  if ( !item.hasDamage ) {
    throw new Error(game.i18n.localize("DiceToolTip.ErrorItemWithoutDamage"));
  }
  const rollData = item.getRollData();
  if ( spellLevel ) rollData.item.level = spellLevel;

  // Define Roll parts
  const damageType = /\[.*]/g;
  const parts = itemData.damage.parts.map(d => d[0].replaceAll(damageType,""));
  if ( versatile && itemData.damage.versatile ) {
    parts[0] = itemData.damage.versatile.replaceAll(damageType,"");
  }
  if ( (item.type === "spell") ) {
    if ( (itemData.scaling.mode === "cantrip") ) {
      let level;
      if ( item.actor.type === "character" ) level = actorData.details.level;
      else if ( itemData.preparation.mode === "innate" ) level = Math.ceil(actorData.details.cr);
      else level = actorData.details.spellLevel;
      item._scaleCantripDamage(parts, itemData.scaling.formula, level, rollData);
    }
    else if ( spellLevel && (itemData.scaling.mode === "level") && itemData.scaling.formula ) {
      const scaling = itemData.scaling.formula;
      item._scaleSpellDamage(parts, itemData.level, spellLevel, scaling, rollData);
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

/**
 * Remove redundant adjacent +/- operator terms
 *
 * @returns {(function(*, *=): (*))|*}
 */
function removeRedundantOperators() {
  return (newTerms, term) => {
    const prior = newTerms[newTerms.length - 1];

    if (prior instanceof OperatorTerm && term instanceof OperatorTerm) {
      if (prior.operator === "+" && term.operator === "+") {
        // Skip the redundant +
        return newTerms;
      }

      if (prior.operator === "-" && term.operator === "-") {
        // Convert prior's term to + and skip adding the newer term
        newTerms[newTerms.length - 1] = new OperatorTerm({operator: "+", options: prior.options});
        return newTerms;
      }

      if (prior.operator === "+" && term.operator === "-") {
        // Convert prior's term to - and skip adding the newer term
        newTerms[newTerms.length - 1] = new OperatorTerm({operator: "-", options: prior.options});
        return newTerms;
      }

      if (prior.operator === "-" && term.operator === "+") {
        // Skip the redundant +
        return newTerms;
      }
    }

    // Otherwise keep the term as is
    newTerms.push(term);
    return newTerms;
  };
}

/**
 * The following implements a poor-man's version of constant folding.
 * It won't handle complex cases, such as using parenthesis or
 * some of the more complicated order of precedence cases.
 * What it does do is identify strings of terms that only
 * include NumberTerms and OperatorTerms where the operator
 * terms are + and - and attempts to merge those terms together
 * to make the final result a little easier to read.
 *
 * To perform the folding, we look for the following pattern:
 *    ... Op1 Num1 Op2 Num2 Op3 ...
 *
 * Where the Operators can only be + or -.   In such a case,
 * we can combine Num1 Op2 Num2 into a single Num term.
 *
 * There are three addition special cases we can also handle:
 *     Num1 Op2 Num2 Op3 ...  (i.e. pattern appears at the beginning)
 *     ... Op1 Num1 Op2 Num2  (i.e. pattern appears at the end)
 *     Num1 Op2 Num2          (i.e. pattern only has 3 terms)
 *
 * As before, we can safely combine Num1 Op2 Num2.
 *
 * To do this more completely we would require using tree of parse terms
 * where the tree provides the precedence.  Foundry doesn't provide that
 * out of the box with its Dice API nor does it make sense to implement
 * such a scheme just for this simple module.  I do have a very rich
 * dice parser that I've implemented, but it's not really ready for
 * general usage. If I ever complete that and make it generally
 * available, I may consider using it here.
 *
 * @returns {(function(*, *=, *, *): (*))|*}
 */
function foldConstantsReducer() {
  return (newTerms, term) => {
    // Always add the new term first, we'll cut out specific terms we want to fold later
    newTerms.push(term);

    // Do we have enough terms?  If not, continue to next term
    if (newTerms.length < 5) {
      return newTerms;
    }

    let firstIndex = newTerms.length - 5;
    let testTerms = [];
    for (let i=0; i < 5; i++) {
      testTerms.push(newTerms[firstIndex + i]);
    }

    // Check for Op Num Op Num Op pattern
    if (isPlusMinusOperator(testTerms[0]) &&
        testTerms[1] instanceof NumericTerm &&
        isPlusMinusOperator(testTerms[2]) &&
        testTerms[3] instanceof NumericTerm &&
        isPlusMinusOperator(testTerms[4])) {
      // We have a valid pattern that we can reduce

      let negative = testTerms[0].operator === "-";
      let num1 = testTerms[1].number;
      let op = testTerms[2].operator;
      let num2 = testTerms[3].number;

      if (negative) {
        num1 *= -1;
      }

      let value;
      switch (op) {
        case '+': value = num1 + num2; break;
        case '-': value = num1 - num2; break;
      }

      if (value === 0) {
        // We can safely remove the entire set of terms resulted in 0
        newTerms.splice(firstIndex, 4);
      } else {
        let newOp = new OperatorTerm({operator: value < 0 ? "-" : "+", options: testTerms[0].option});
        value = value > 0 ? value : value * -1;
        let newNum = new NumericTerm({number: value, options: testTerms[1].options});

        // Now replace the num1, op, and num2 terms within newTerms
        newTerms.splice(firstIndex, 4, newOp, newNum);
      }
    } else if (isPlusMinusOperator(testTerms[0]) &&
        testTerms[1] instanceof NumericTerm && testTerms[1].number === 0 &&
        isPlusMinusOperator(testTerms[2])) {
      // Remove the leading +/- 0 terms
      newTerms.splice(firstIndex, 2);
    } else if (isPlusMinusOperator(testTerms[2]) &&
        testTerms[3] instanceof NumericTerm && testTerms[3].number === 0 &&
        isPlusMinusOperator(testTerms[4])) {
      // Remove the trailing +/- 0 terms
      newTerms.splice(firstIndex+2, 2);
    }

    return newTerms;
  };
}

function isPlusMinusOperator(term) {
  return term instanceof OperatorTerm && (term.operator === "+" || term.operator === "-");
}

function foldConstants(simplified) {
  // To assist with constant folding we temporarily add a + operator to the
  // beginning and end of teh simplified expression.  This makes it
  // simpler to handle the corner cases when there's fewer than 5 terms
  // and when a NumberTerm is at the beginning or the end.
  let fakeOperation = new OperatorTerm({operator: "+"});
  simplified.unshift(fakeOperation);
  simplified.push(fakeOperation);

  // Do the constant folding
  simplified = simplified.reduce(foldConstantsReducer(), []);

  // Remove the fake operations
  if (simplified[0].operator === "+") {
    // If the sign of the first fake operator did not change, then remove it
    simplified.shift();
  }
  simplified.pop();

  return simplified;
}

function simplifyTerms(terms) {
  let simplified = terms.reduce(removeRedundantOperators(), []);
  simplified = foldConstants(simplified);

  return simplified;
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
      let multiply = 2;
      roll = roll.alter(multiply, add);
      flavor = `${flavor} (${game.i18n.localize("DND5E.Critical")})`;
    }

    return roll;
  };

  return _roll(parts, critical);
}
