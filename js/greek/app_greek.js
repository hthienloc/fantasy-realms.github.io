// Fantasy Realms: Greek Legends application script
// Integrates with original layout, Handlebars & responsive sidebar

let appState = {
  mode: 'hand', // 'hand' or 'afterlife' (which destination when clicking from deck)
  hand: [],      // array of card IDs in hand
  afterlife: [], // array of card IDs in afterlife
  choices: {},   // player choices for interactive cards
  filterQuery: ''// search filter text
};

const STORAGE_GREEK_KEY = 'fr_greek_state';

// Load initial state
function loadState() {
  // 1. Try URL search params
  const urlParams = new URLSearchParams(window.location.search);
  const handParam = urlParams.get('hand');
  const afterlifeParam = urlParams.get('afterlife');

  if (handParam || afterlifeParam) {
    if (handParam) {
      appState.hand = handParam.split(',').filter(id => CARDS.some(c => c.id === id));
    }
    if (afterlifeParam) {
      appState.afterlife = afterlifeParam.split(',').filter(id => CARDS.some(c => c.id === id));
    }
    return;
  }

  // 2. Try localStorage
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_GREEK_KEY));
    if (saved) {
      if (Array.isArray(saved.hand)) appState.hand = saved.hand.filter(id => CARDS.some(c => c.id === id));
      if (Array.isArray(saved.afterlife)) appState.afterlife = saved.afterlife.filter(id => CARDS.some(c => c.id === id));
      if (saved.choices && typeof saved.choices === 'object') appState.choices = saved.choices;
    }
  } catch (e) {
    console.error('Failed to load state', e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_GREEK_KEY, JSON.stringify({
      hand: appState.hand,
      afterlife: appState.afterlife,
      choices: appState.choices
    }));
  } catch (e) {}

  // Update URL params
  const params = [];
  if (appState.hand.length > 0) {
    params.push('hand=' + appState.hand.join(','));
  }
  if (appState.afterlife.length > 0) {
    params.push('afterlife=' + appState.afterlife.join(','));
  }
  const newUrl = params.length > 0 ? (window.location.pathname + '?' + params.join('&')) : window.location.pathname;
  window.history.replaceState(null, null, newUrl);
}

function getCardName(id) {
  return I18N.en.cards[id] ? I18N.en.cards[id].name : id;
}

function getCardText(id) {
  return I18N.en.cards[id] ? I18N.en.cards[id].text : '';
}

function getSuitName(suit) {
  return I18N.en.suits[suit] || suit;
}

function getTagName(tag) {
  return I18N.en.tags[tag] || tag;
}

// Render cards sidebar accordion
function renderDeckAccordion() {
  const query = appState.filterQuery.trim().toLowerCase();
  const suitsList = ['gods', 'heroes', 'items', 'locations', 'monsters', 'quests'];

  const suitsData = {};
  suitsList.forEach(suit => {
    let cards = CARDS.filter(c => c.suit === suit);
    if (query) {
      cards = cards.filter(c => {
        const name = getCardName(c.id).toLowerCase();
        const text = getCardText(c.id).toLowerCase();
        const tags = (c.tags || []).join(' ').toLowerCase();
        return name.includes(query) || text.includes(query) || tags.includes(query) || suit.includes(query);
      });
    }
    suitsData[suit] = cards;
  });

  const template = Handlebars.compile($('#cards-template').html());
  const html = template({
    suits: suitsData,
    queryActive: Boolean(query)
  });
  $('#cards').html(html);

  // If searching, keep panels expanded
  if (query) {
    $('#cards .collapse').addClass('show');
  }
}

// Check if card is selected anywhere
function isCardSelected(id) {
  return appState.hand.includes(id) || appState.afterlife.includes(id);
}

// Add/Remove card click handler from sidebar
function handleDeckCardClick(id) {
  if (appState.hand.includes(id)) {
    removeFromHand(id);
    return;
  }
  if (appState.afterlife.includes(id)) {
    removeFromAfterlife(id);
    return;
  }

  // Adding new card
  if (appState.mode === 'afterlife') {
    appState.afterlife.push(id);
  } else {
    if (appState.hand.length >= 7) {
      // If hand is full, alert or notify
      alert('Your hand already has 7 cards! You can add cards to the Afterlife or move existing cards.');
      return;
    }
    appState.hand.push(id);
  }
  saveState();
  updateView();
}

// Moving & deleting cards
function removeFromHand(id) {
  appState.hand = appState.hand.filter(c => c !== id);
  delete appState.choices[id];
  saveState();
  updateView();
}

function removeFromAfterlife(id) {
  appState.afterlife = appState.afterlife.filter(c => c !== id);
  delete appState.choices[id];
  saveState();
  updateView();
}

function moveHandToAfterlife(id) {
  appState.hand = appState.hand.filter(c => c !== id);
  appState.afterlife.push(id);
  saveState();
  updateView();
}

function moveAfterlifeToHand(id) {
  if (appState.hand.length >= 7) {
    alert('Cannot move to Hand: hand already has 7 cards.');
    return;
  }
  appState.afterlife = appState.afterlife.filter(c => c !== id);
  appState.hand.push(id);
  saveState();
  updateView();
}

function clearAll() {
  if (confirm('Clear all cards in Hand and Afterlife?')) {
    appState.hand = [];
    appState.afterlife = [];
    appState.choices = {};
    saveState();
    updateView();
  }
}

function setSelectionMode(mode) {
  appState.mode = mode;
  $('.mode-btn').removeClass('active');
  $(`.mode-btn[data-mode="${mode}"]`).addClass('active');
}

function handleChoiceChange(cardId, key, value) {
  if (!appState.choices[cardId]) appState.choices[cardId] = {};
  if (value === 'auto') {
    delete appState.choices[cardId][key];
  } else {
    appState.choices[cardId][key] = (value === '' ? null : value);
  }
  saveState();
  updateView();
}

// Choice label helper
function getChoiceOptionLabel(slot, val) {
  if (val === null || val === undefined) return 'None';
  if (Array.isArray(CHOICE_TYPES[slot.type])) {
    return getTagName(val);
  }
  return getCardName(val);
}

// Main scoring & view render
function updateView() {
  // Best choices calculation
  const resolved = bestChoices(appState.hand, appState.afterlife, appState.choices);
  const result = scoreHand(appState.hand, appState.afterlife, resolved);
  const slots = choiceSlots(appState.hand, appState.afterlife);

  // Format cards for view
  const handCardsFormatted = [];
  const afterlifeCardsFormatted = [];

  let totalBase = 0;
  let totalBonus = 0;
  let totalPenalty = 0;

  result.cards.forEach(scoredCard => {
    const inst = scoredCard.inst;
    const card = inst.card;
    const id = card.id;

    totalBase += scoredCard.base;
    totalBonus += scoredCard.bonus;
    totalPenalty += scoredCard.penalty;

    const cardSlots = slots.filter(s => s.cardId === id).map(s => {
      const fixed = appState.choices[id]?.[s.key];
      const isFixed = s.values.includes(fixed);
      const autoVal = resolved[id]?.[s.key];
      const autoLabel = getChoiceOptionLabel(s, autoVal);

      const options = [
        { value: 'auto', label: `Auto (${autoLabel})`, selected: !isFixed },
        ...s.values.map(val => ({
          value: val ?? '',
          label: getChoiceOptionLabel(s, val),
          selected: isFixed && val === fixed
        }))
      ];
      return {
        cardId: id,
        key: s.key,
        label: I18N.en.choice[s.key] || s.key,
        options: options
      };
    });

    const isCardMasked = isMasked(inst);
    const itemData = {
      id: id,
      name: getCardName(id),
      text: getCardText(id),
      suit: card.suit,
      suitName: getSuitName(card.suit),
      strength: card.strength,
      tags: (card.tags || []).map(t => ({ tag: t, label: getTagName(t) })),
      addedTags: (inst.addedTags || []).map(t => ({ tag: t, label: getTagName(t) })),
      base: scoredCard.base,
      bonus: scoredCard.bonus,
      penalty: scoredCard.penalty,
      total: scoredCard.total,
      isMasked: isCardMasked,
      isPenaltyCleared: inst.cleared.penalty,
      sentBy: inst.sentBy ? getCardName(inst.sentBy.card.id) : null,
      toAfterlifeAvailable: Boolean(card.toAfterlife),
      slots: cardSlots,
      inHand: inst.zone === 'hand'
    };

    if (inst.zone === 'hand') {
      handCardsFormatted.push(itemData);
    } else {
      afterlifeCardsFormatted.push(itemData);
    }
  });

  // Render right panel template
  const handTemplate = Handlebars.compile($('#main-view-template').html());
  const mainHtml = handTemplate({
    handCards: handCardsFormatted,
    afterlifeCards: afterlifeCardsFormatted,
    handCount: appState.hand.length,
    afterlifeCount: appState.afterlife.length,
    afterlifePenalty: result.afterlifeScore,
    totalBase: totalBase,
    totalBonus: totalBonus,
    totalPenalty: totalPenalty,
    grandTotal: result.total
  });
  $('#hand').html(mainHtml);

  // Update topbar score and counter
  $('#cardCount').text(appState.hand.length);
  $('#cardLimit').text('7');
  const scoreVal = result.total;
  if (scoreVal >= 0) {
    $('#points').text(('000' + scoreVal).slice(-3));
  } else {
    $('#points').text('-' + ('000' + Math.abs(scoreVal)).slice(-3));
  }

  // Highlight selected cards in sidebar
  $('#cards li.list-group-item').each(function () {
    const cardId = $(this).attr('data-id');
    $(this).removeClass('selected-in-hand selected-in-afterlife');
    if (appState.hand.includes(cardId)) {
      $(this).addClass('selected-in-hand');
    } else if (appState.afterlife.includes(cardId)) {
      $(this).addClass('selected-in-afterlife');
    }
  });
}

$(document).ready(function () {
  loadState();

  // Search input handler
  $('#card-search-input').on('input', function () {
    appState.filterQuery = $(this).val();
    renderDeckAccordion();
    updateView();
  });

  // Render initial sidebar
  renderDeckAccordion();
  setSelectionMode('hand');
  updateView();
});
