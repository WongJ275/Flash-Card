const DECK_LSKEY = 'decks';
const CARDS_SUFFIX_LSKEY = '-flashcards';

export function GetStorageUsage() {
    let total = 0;

    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += ((localStorage[key].length + key.length) * 2);
        }
    }

    // Return in MB
    return (total / 1024 / 1024).toFixed(2);
}

// Add ID to localStorage decks
export function AddIDToDecks() {
    const data = localStorage.getItem(DECK_LSKEY);
    if (!data) return;
    
    let decks = JSON.parse(data);

    const migrated = decks.map(deck => {
        if (!deck.id) {
            return { ...deck, id: crypto.randomUUID() };
        }
        return deck;
    });

    localStorage.setItem(DECK_LSKEY, JSON.stringify(migrated));
}

// Add ID to localStorage cards
export function AddIDToCards(decks) {
    decks.forEach(deck => {
        const key = deck.name + CARDS_SUFFIX_LSKEY;
        const data = localStorage.getItem(key);
        if (!data) return;

        let cards = JSON.parse(data);

        const migrated = cards.map(card => {
            if (!card.id) {
                return { ...card, id: crypto.randomUUID() };
            }
            return card;
        });

        localStorage.setItem(key, JSON.stringify(migrated));
    });
}

// Clean localStorage cards by removing the text formatting
export function CleanLocalStorageData() {
    const decks = localStorage.getItem(DECK_LSKEY);
    if (!decks) return;

    const parsedDecks = JSON.parse(decks);

    parsedDecks.forEach(deck => {
        const deckName = deck.name;

        const cardKey = deckName + '-flashcards';
        const cards = localStorage.getItem(cardKey);
        if (!cards) return;

        const parsedCards = JSON.parse(cards);

        const cleanedCards = parsedCards.map(card => ({
            question: ReverseFormatText(card.question),
            answer: ReverseFormatText(card.answer)
        }));

        localStorage.setItem(cardKey, JSON.stringify(cleanedCards));
    })
}

function ReverseFormatText(text) {
    return text
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&emsp;/g, '\t')
        .replace(/\\n/g, '\n');
}

export function FormatTextSave(text) {
    return text.replace(/(?:\r\n|\r|\n)/g, '\\n')
        .replace(/ {4}/g, '\\t')
        .replace(/\\t/g, '&emsp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export function FormatTextRender(text) {
    return text.replace(/(?:\r\n|\r|\n|\\n)/g, '<br>')
        .replace(/\\t/g, '&emsp;');
}

export function ShowLoadingScreen() {
    const loadingScreen = document.querySelector(".loadingScreen");
    loadingScreen.classList.remove("hidden");
}

export function HideLoadingScreen() {
    const loadingScreen = document.querySelector(".loadingScreen");
    loadingScreen.classList.add("hidden");
}

export function ScrollToTopInstant() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}