import { supabase, CheckUser } from "./supabaseClient.js";
import { HideLoadingScreen } from "./utils.js";

const DECK_LSKEY = 'decks';
const SORT_OPTION_LSKEY = 'sortOption';
const CARDS_SUFFIX_LSKEY = '-flashcards';

export async function LoadDecks() {
    try {
        const user = await CheckUser();

        if (user) {
            const { data, error } = await supabase
                .from('decks')
                .select('id, name, timeAdded, lastAccessed')
                .eq('user_id', user.id);

            if (error) throw error;

            return data || [];
        }
        else {
            const data = localStorage.getItem(DECK_LSKEY);
            return data ? JSON.parse(data) : [];
        }
    }
    catch (error) {
        console.error("Error:", error);
        HideLoadingScreen();
        return null;
    }
}

export async function LoadCards(deckID_or_name) {
    try {
        const user = await CheckUser();

        if (user) {
            const { data, error } = await supabase
                .from('cards')
                .select('id, question, answer')
                .eq('deck_id', deckID_or_name)
                .eq('user_id', user.id);

            if (error) throw error;

            return data || [];
        }
        else {
            const data = localStorage.getItem(deckID_or_name + CARDS_SUFFIX_LSKEY);
            return data ? JSON.parse(data) : [];
        }
    }
    catch (error) {
        console.error("Error:", error);
        HideLoadingScreen();
        return null;
    }
}

export async function UpdateDeckName(deckID_or_oldName, newName, decks, updateIdx) {
    try {
        const decks_c = structuredClone(decks);
        decks_c[updateIdx].name = newName;

        const user = await CheckUser();

        if (user) {
            const { error } = await supabase
                .from('decks')
                .update({ name: newName })
                .eq('id', deckID_or_oldName)
                .eq('user_id', user.id);

            if (error) throw error;
        }
        else {
            const oldKey = deckID_or_oldName + CARDS_SUFFIX_LSKEY;
            const newKey = newName + CARDS_SUFFIX_LSKEY;

            const flashcards = localStorage.getItem(oldKey);
            if (flashcards) {
                localStorage.setItem(newKey, flashcards);
                localStorage.removeItem(oldKey);
            }

            localStorage.setItem(DECK_LSKEY, JSON.stringify(decks_c));
        }

        return decks_c;
    }
    catch (error) {
        console.error("Error:", error);
        HideLoadingScreen();
        return decks;
    }
}

export async function UpdateDeckLastAccessed(deckID_or_name, decks) {
    try {
        const decks_c = structuredClone(decks);

        const user = await CheckUser();

        if (user) {
            const findDeck = decks_c.find((deck) => String(deck.id) === deckID_or_name);

            const now = new Date().toISOString();
            findDeck ? findDeck.lastAccessed = now : null;

            const { error } = await supabase
                .from('decks')
                .update({ lastAccessed: now })
                .eq('id', deckID_or_name)
                .eq('user_id', user.id);

            if (error) throw error;
        }
        else {
            const findDeck = decks_c.find((deck) => deck.name === deckID_or_name);

            findDeck ? findDeck.lastAccessed = new Date().toISOString() : null;
            localStorage.setItem(DECK_LSKEY, JSON.stringify(decks_c));
        }

        return decks_c;
    }
    catch (error) {
        console.error("Error:", error);
        HideLoadingScreen();
        return decks;
    }
}

export async function AddDeckData(deckName, decks) {
    try {
        const decks_c = structuredClone(decks);

        const user = await CheckUser();

        if (user) {
            const { data, error } = await supabase
                .from('decks')
                .insert([
                    {
                        name: deckName,
                        user_id: user.id
                    }
                ])
                .select('id, name, timeAdded, lastAccessed');

            if (error) throw error;

            return [...decks, data[0]];
        }
        else {
            let newDeck = {
                name: deckName,
                timeAdded: new Date().toISOString(),
                lastAccessed: new Date().toISOString()
            }
            decks_c.push(newDeck);

            localStorage.setItem(DECK_LSKEY, JSON.stringify(decks_c));

            return decks_c;
        }
    }
    catch (error) {
        console.error("Error:", error);
        HideLoadingScreen();
        return decks;
    }
}

export async function DeleteDeckData(deckID_or_name, decks) {
    try {
        let decks_c = structuredClone(decks);

        const user = await CheckUser();

        if (user) {
            const { error } = await supabase
                .from('decks')
                .delete()
                .eq('id', deckID_or_name)
                .eq('user_id', user.id);

            if (error) throw error;

            decks_c = decks_c.filter(deck => deck.id != deckID_or_name);
        }
        else {
            const deleteKey = deckID_or_name + '-flashcards';
            localStorage.removeItem(deleteKey)

            decks_c = decks_c.filter(deck => deck.name != deckID_or_name);

            localStorage.setItem(DECK_LSKEY, JSON.stringify(decks_c));
        }

        return decks_c;
    }
    catch (error) {
        console.error("Error:", error);
        HideLoadingScreen();
        return decks;
    }
}

export async function AddCardData(deckID_or_name, question, answer, flashcards) {
    try {
        const flashcards_c = structuredClone(flashcards);

        const user = await CheckUser();

        if (user) {
            const { data, error } = await supabase
                .from('cards')
                .insert([
                    {
                        question: question,
                        answer: answer,
                        deck_id: deckID_or_name,
                        user_id: user.id
                    }
                ])
                .select('id, question, answer');

            if (error) throw error;

            return [...flashcards, data[0]];
        }
        else {
            flashcards_c.push({question, answer});
            const key = deckID_or_name + CARDS_SUFFIX_LSKEY;
            localStorage.setItem(key, JSON.stringify(flashcards_c));

            return flashcards_c;
        }
    }
    catch (error) {
        console.error("Error:", error);
        HideLoadingScreen();
        return flashcards;
    }
}

// db: (flashcardID, deckID, _, flashcards)
// ls: (_, deckName, ls_index, flashcards)
export async function DeleteCardData(flashcardID, deckID_or_name, ls_index, flashcards) {
    try {
        let flashcards_c = structuredClone(flashcards);

        const user = await CheckUser();

        if (user) {
            const { data, error } = await supabase
                .from('cards')
                .delete()
                .eq('id', flashcardID)
                .eq('deck_id', deckID_or_name)
                .eq('user_id', user.id)
                .select('id');

            if (error) throw error;

            flashcards_c = flashcards_c.filter(fc => fc.id != flashcardID);
        }
        else {
            flashcards_c.splice(ls_index, 1);
            const key = deckID_or_name + '-flashcards';
            localStorage.setItem(key, JSON.stringify(flashcards_c));
        }

        return flashcards_c;
    }
    catch (error) {
        console.error("Error:", error);
        HideLoadingScreen();
        return flashcards;
    }
}

export function LoadStringLocalStorage(key, defaultValue = "") {
    try {
        return localStorage.getItem(key) || defaultValue;
    }
    catch (error) {
        console.error("Error loading from local storage:", error);
        HideLoadingScreen();
        return "";
    }
}

export function SaveStringLocalStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    }
    catch (error) {
        console.error("Error saving to local storage:", error);
        HideLoadingScreen();
    }
}

function DeleteFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
    }
    catch (error) {
        console.error("Error deleting from local storage:", error);
        HideLoadingScreen();
    }
}

// For migrating data from localStorage to database
export async function InheritLocalStorageData() {
    await navigator.locks.request('lock', async (lock) => {
        const user = await CheckUser();
        if (!user) return;

        const decksRaw = localStorage.getItem(DECK_LSKEY);
        
        // Processed by another tab or empty deck
        if (!decksRaw || decksRaw === "[]") {
            console.log("Migration skipped: Empty localStorage or Already processed by another tab.");

            if (decksRaw === "[]") {
                localStorage.removeItem(DECK_LSKEY);
            }
            await supabase.auth.updateUser({ data: { shouldInherit: false } });
            return;
        }

        const decks = JSON.parse(decksRaw);

        try {
            const deckPayload = decks.map(d => ({ name: d.name, user_id: user.id })); 
            const { data: upsertedDecks, error: deckError } = await supabase
                .from('decks')
                .upsert(deckPayload, { onConflict: 'user_id, name' })
                .select('id, name');

            if (deckError) throw deckError;

            //console.log("decks inserted");

            for (const deck of upsertedDecks) {
                const cardKey = deck.name + CARDS_SUFFIX_LSKEY;
                const cardsRaw = localStorage.getItem(cardKey);

                if (cardsRaw) {
                    const cards = JSON.parse(cardsRaw);
                    const cardPayload = cards.map(c => ({
                        question: c.question,
                        answer: c.answer,
                        deck_id: deck.id,
                        user_id: user.id
                    }));

                    // Delete duplicates due to possible partial import
                    await supabase
                        .from('cards')
                        .delete()
                        .eq('deck_id', deck.id)
                        .eq('user_id', user.id);

                    const { error: cardError } = await supabase
                        .from('cards')
                        .insert(cardPayload);

                    if (cardError) throw cardError;

                    localStorage.removeItem(cardKey);
                    //console.log("cards inserted");
                }
            }

            localStorage.removeItem(DECK_LSKEY);
            await supabase.auth.updateUser({ data: { shouldInherit: false } });

        } catch (error) {
            console.error("Inherit error:", error);
            HideLoadingScreen();
        }
    });
}
